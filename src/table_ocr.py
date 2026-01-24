"""RapidOCR 기반으로 표 이미지를 텍스트화해 저장하는 유틸."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable, List

from rapidocr import RapidOCR


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_STRUCTURED_DIR = REPO_ROOT / "data" / "pages_structured"


def find_available_pages(structured_dir: Path) -> list[int]:
    pages: list[int] = []
    for child in structured_dir.iterdir():
        if not child.is_dir() or not child.name.startswith("page_"):
            continue
        try:
            page_no = int(child.name.split("_")[-1])
        except ValueError:
            continue
        if (child / "page.json").exists():
            pages.append(page_no)
    return sorted(pages)


def parse_pages_arg(pages_arg: str, available: Iterable[int]) -> list[int]:
    avail_set = set(available)
    selected: set[int] = set()
    for raw in pages_arg.split(","):
        part = raw.strip()
        if not part:
            continue
        if "-" in part:
            start_str, end_str = part.split("-", 1)
            start = int(start_str)
            end = int(end_str)
            if start > end:
                start, end = end, start
            selected.update(range(start, end + 1))
        else:
            selected.add(int(part))
    final = sorted(page for page in selected if page in avail_set)
    if not final:
        raise ValueError("요청한 페이지가 pages_structured에 없습니다.")
    return final


def serialize_ocr_output(out) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    boxes = out.boxes if out.boxes is not None else []
    txts = out.txts if out.txts is not None else []
    scores = out.scores if out.scores is not None else []
    for text, box, score in zip(txts, boxes, scores):
        entries.append(
            {
                "text": text,
                "score": float(score),
                "box": [[float(pt[0]), float(pt[1])] for pt in box],
            }
        )
    return entries


def process_table_image(
    ocr: RapidOCR,
    image_path: Path,
    output_json: Path,
) -> list[dict[str, object]]:
    out = ocr(str(image_path))
    entries = serialize_ocr_output(out)
    output_json.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    return entries


def update_page_metadata(page_json_path: Path, table_id: str, ocr_rel_path: str, preview: str) -> None:
    data = json.loads(page_json_path.read_text(encoding="utf-8"))
    updated = False
    for table in data.get("tables", []):
        if table.get("id") == table_id:
            table["ocr_path"] = ocr_rel_path
            table["ocr_preview"] = preview
            updated = True
            break
    if updated:
        page_json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="pages_structured 내 표 이미지를 RapidOCR로 텍스트화한다.",
    )
    parser.add_argument(
        "--structured-dir",
        type=Path,
        default=DEFAULT_STRUCTURED_DIR,
        help="structured_extract.py가 생성한 페이지 폴더 경로.",
    )
    parser.add_argument(
        "--pages",
        type=str,
        default=None,
        help="처리할 페이지 목록/범위. 생략하면 모든 페이지를 대상으로 함.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="이미 존재하는 ocr.json이 있어도 다시 생성.",
    )
    return parser


def main(argv: List[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    structured_dir = args.structured_dir.resolve()
    if not structured_dir.exists():
        parser.error(f"구조화 폴더를 찾을 수 없습니다: {structured_dir}")

    available_pages = find_available_pages(structured_dir)
    if not available_pages:
        parser.error("처리할 페이지가 없습니다. 먼저 structured_extract.py를 실행하세요.")

    if args.pages:
        target_pages = parse_pages_arg(args.pages, available_pages)
    else:
        target_pages = available_pages

    ocr = RapidOCR()

    for page_no in target_pages:
        page_dir = structured_dir / f"page_{page_no:04d}"
        page_json_path = page_dir / "page.json"
        tables_dir = page_dir / "tables"
        if not tables_dir.exists():
            continue

        for image_path in sorted(tables_dir.glob("table_*.png")):
            table_id = image_path.stem
            ocr_json_path = image_path.with_suffix(".ocr.json")
            if ocr_json_path.exists() and not args.overwrite:
                print(f"[SKIP] {ocr_json_path} (이미 존재)")
                continue
            entries = process_table_image(ocr, image_path, ocr_json_path)
            preview = " ".join(item["text"] for item in entries[:5])
            relative_ocr_path = ocr_json_path.relative_to(structured_dir)
            update_page_metadata(page_json_path, table_id, str(relative_ocr_path), preview)
            print(f"OCR 완료: {image_path} -> {ocr_json_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
