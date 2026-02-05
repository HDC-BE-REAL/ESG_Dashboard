"""GPT-4o-mini를 이용해 그림/도형 이미지를 텍스트화하는 스크립트."""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
from pathlib import Path
from typing import Iterable, List

from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image, ImageStat
from rapidocr import RapidOCR


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_STRUCTURED_DIR = REPO_ROOT / "data" / "pages_structured"
DEFAULT_MODEL = "gpt-4o-mini"
MIN_AREA_RATIO = 0.01
HEADER_RATIO = 0.12
FIGURE_TEXT_MIN_TOKENS = 1
TEXT_TOKEN_PATTERN = re.compile(r"[0-9A-Za-z가-힣]")

load_dotenv()


def load_api_key(explicit: str | None = None) -> str:
    key = explicit or os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY가 필요합니다.")
    return key


def find_pages(structured_dir: Path) -> list[int]:
    pages: list[int] = []
    for child in structured_dir.iterdir():
        if child.is_dir() and child.name.startswith("page_") and (child / "page.json").exists():
            try:
                pages.append(int(child.name.split("_")[-1]))
            except ValueError:
                continue
    return sorted(pages)


def parse_pages_arg(expr: str, available: Iterable[int]) -> list[int]:
    avail = set(available)
    selected: set[int] = set()
    for raw in expr.split(","):
        part = raw.strip()
        if not part:
            continue
        if "-" in part:
            start, end = part.split("-", 1)
            a = int(start)
            b = int(end)
            if a > b:
                a, b = b, a
            selected.update(range(a, b + 1))
        else:
            selected.add(int(part))
    final = sorted(page for page in selected if page in avail)
    if not final:
        raise ValueError("요청한 페이지가 존재하지 않습니다.")
    return final


def encode_image_base64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("utf-8")


def estimate_page_dims(page_data: dict) -> tuple[float | None, float | None]:
    dims = page_data.get("page_dimensions") or {}
    width = dims.get("width")
    height = dims.get("height")
    if width and height:
        return float(width), float(height)

    max_right = 0.0
    max_top = 0.0
    for bucket in (page_data.get("tables", []), page_data.get("figures", [])):
        for item in bucket:
            bbox = item.get("bbox") or {}
            max_right = max(max_right, float(bbox.get("right", 0.0)))
            max_top = max(max_top, float(bbox.get("top", 0.0)))
    return (max_right or None, max_top or None)


def describe_figure(client: OpenAI, model: str, image_path: Path, prompt: str) -> str:
    image_b64 = encode_image_base64(image_path)
    image_url = f"data:image/png;base64,{image_b64}"

    completion = client.chat.completions.create(
        model=model,
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": "당신은 ESG 보고서 그림을 해석하는 분석가입니다.",
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            },
        ],
    )
    choices = getattr(completion, "choices", [])
    if not choices:
        return ""
    message = choices[0].message
    content = message.content
    if isinstance(content, str):
        return content.strip()
    chunks: list[str] = []
    for part in content:
        text_val = part.get("text") if isinstance(part, dict) else None
        if text_val:
            chunks.append(text_val)
    return "".join(chunks).strip()


def is_photo_like(image_path: Path) -> bool:
    try:
        img = Image.open(image_path).convert("RGB")
    except OSError:
        return False
    small = img.resize((64, 64))
    colors = small.getcolors(maxcolors=4096) or []
    color_ratio = len(colors) / (64 * 64)
    hsv = img.convert("HSV")
    stat = ImageStat.Stat(hsv)
    sat_mean = stat.mean[1]
    return color_ratio > 0.28 and sat_mean > 55


def update_page_metadata(page_json_path: Path, figure_id: str, desc_rel_path: str) -> None:
    data = json.loads(page_json_path.read_text(encoding="utf-8"))
    changed = False
    for figure in data.get("figures", []):
        if figure.get("id") == figure_id:
            figure["description_path"] = desc_rel_path
            changed = True
            break
    if changed:
        page_json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="GPT-4o-mini로 figure 이미지를 설명 텍스트로 변환한다.",
    )
    parser.add_argument(
        "--structured-dir",
        type=Path,
        default=DEFAULT_STRUCTURED_DIR,
        help="structured_extract.py가 생성한 폴더.",
    )
    parser.add_argument(
        "--pages",
        type=str,
        default=None,
        help="처리할 페이지 목록/범위. 생략하면 전체.",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=DEFAULT_MODEL,
        help="이미지 해석에 사용할 GPT 모델 ID.",
    )
    parser.add_argument(
        "--api-key",
        type=str,
        default=None,
        help="OpenAI API 키. 생략하면 환경변수를 사용.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="기존 설명 파일이 있어도 다시 생성.",
    )
    parser.add_argument(
        "--skip-textless",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="텍스트/숫자가 감지되지 않는 사진은 설명하지 않는다 (--skip-textless로 켜기, 기본 off).",
    )
    return parser


def main(argv: List[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    structured_dir = args.structured_dir.resolve()
    if not structured_dir.exists():
        parser.error(f"구조화 폴더를 찾을 수 없습니다: {structured_dir}")

    available = find_pages(structured_dir)
    if not available:
        parser.error("처리할 페이지가 없습니다. 먼저 structured_extract.py를 실행하세요.")

    if args.pages:
        target_pages = parse_pages_arg(args.pages, available)
    else:
        target_pages = available

    api_key = load_api_key(args.api_key)
    client = OpenAI(api_key=api_key)
    text_detector: RapidOCR | None = RapidOCR() if args.skip_textless else None
    for page_no in target_pages:
        page_dir = structured_dir / f"page_{page_no:04d}"
        figures_dir = page_dir / "figures"
        if not figures_dir.exists():
            continue
        page_json_path = page_dir / "page.json"
        if not page_json_path.exists():
            continue

        page_data = json.loads(page_json_path.read_text(encoding="utf-8"))
        page_width, page_height = estimate_page_dims(page_data)
        header_cutoff = page_height * (1 - HEADER_RATIO) if page_height else None

        page_md_path = page_dir / "page.md"
        context_text = page_md_path.read_text(encoding="utf-8")[:2000] if page_md_path.exists() else ""

        for figure in page_data.get("figures", []):
            figure_id = figure.get("id")
            if not figure_id:
                continue
            image_path = figures_dir / f"{figure_id}.png"
            if not image_path.exists():
                continue

            bbox = figure.get("bbox") or {}
            skip = False
            if page_width and page_height:
                width = max(0.0, bbox.get("right", 0) - bbox.get("left", 0))
                height = max(0.0, bbox.get("top", 0) - bbox.get("bottom", 0))
                area_ratio = (width * height) / (page_width * page_height)
                if area_ratio < MIN_AREA_RATIO:
                    print(f"[SKIP ICON] {image_path} (area ratio={area_ratio:.4f})")
                    skip = True
                elif header_cutoff and bbox.get("bottom", 0) >= header_cutoff:
                    print(f"[SKIP HEADER] {image_path} (within header zone)")
                    skip = True
            if skip:
                continue

            if args.skip_textless and text_detector is not None:
                detected = text_detector(str(image_path))
                texts = [txt for txt in (detected.txts or []) if txt and TEXT_TOKEN_PATTERN.search(txt)]
                if len(texts) < FIGURE_TEXT_MIN_TOKENS and is_photo_like(image_path):
                    print(f"[SKIP PHOTO] {image_path} (textless photo)")
                    continue

            desc_path = image_path.with_suffix(".desc.md")
            if desc_path.exists() and not args.overwrite:
                print(f"[SKIP] {desc_path} (이미 존재)")
                continue

            prompt = (
                "다음은 해당 페이지 본문 일부입니다. 이 문맥을 참고하여 그림이 전달하는 인사이트를 설명하세요.\n"
                f"[본문]\n{context_text}\n"
                "\n"
                "- 그림 안의 모든 텍스트를 반드시 언급하고, 특히 숫자들은 정확하게 언급하세요 .\n"
                "- 축/범례/강조 영역은 실제로 보일 때만 언급하고, 없으면 언급하지 마세요."
            )

            description = describe_figure(client, args.model, image_path, prompt)
            if not description:
                description = "(GPT 응답이 비었습니다.)"
            desc_path.write_text(description, encoding="utf-8")
            rel_path = desc_path.relative_to(structured_dir)
            update_page_metadata(page_json_path, figure_id, str(rel_path))
            print(f"설명 생성: {image_path} -> {desc_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
