"""Docling 표 JSON과 RapidOCR 결과를 비교해 숫자 차이를 기록하는 스크립트."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Iterable, List


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_STRUCTURED_DIR = REPO_ROOT / "data" / "pages_structured"
NUMBER_PATTERN = re.compile(r"[-+]?\d+(?:,\d{3})*(?:\.\d+)?%?")


def load_numbers_from_doc_table(table_json_path: Path) -> list[str]:
    data = json.loads(table_json_path.read_text(encoding="utf-8"))
    numbers: list[str] = []
    for row in data.get("cells", []):
        for cell in row:
            text = cell.get("text") or ""
            numbers.extend(NUMBER_PATTERN.findall(text))
    return numbers


def load_numbers_from_ocr(ocr_json_path: Path) -> list[str]:
    entries = json.loads(ocr_json_path.read_text(encoding="utf-8"))
    numbers: list[str] = []
    for entry in entries:
        text = entry.get("text") or ""
        numbers.extend(NUMBER_PATTERN.findall(text))
    return numbers


def normalize_number(token: str) -> str:
    # remove thousand separators but keep % sign if present
    token = token.replace(",", "")
    return token


def compare_numbers(doc_numbers: list[str], ocr_numbers: list[str]) -> dict[str, list[str]]:
    doc_set = {normalize_number(n) for n in doc_numbers if n}
    ocr_set = {normalize_number(n) for n in ocr_numbers if n}
    return {
        "only_in_doc": sorted(doc_set - ocr_set),
        "only_in_ocr": sorted(ocr_set - doc_set),
    }


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
            a, b = raw.split("-", 1)
            start, end = int(a), int(b)
            if start > end:
                start, end = end, start
            selected.update(range(start, end + 1))
        else:
            selected.add(int(part))
    final = sorted(page for page in selected if page in avail)
    if not final:
        raise ValueError("요청한 페이지가 존재하지 않습니다.")
    return final


def update_page_metadata(page_json_path: Path, table_id: str, diff_rel_path: str, diff_summary: dict) -> None:
    data = json.loads(page_json_path.read_text(encoding="utf-8"))
    changed = False
    for table in data.get("tables", []):
        if table.get("id") == table_id:
            table["diff_path"] = diff_rel_path
            table["diff_summary"] = diff_summary
            changed = True
            break
    if changed:
        page_json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Docling 표 JSON과 RapidOCR 결과의 숫자 차이를 저장.",
    )
    parser.add_argument(
        "--structured-dir",
        type=Path,
        default=DEFAULT_STRUCTURED_DIR,
        help="structured_extract.py 산출물 경로.",
    )
    parser.add_argument(
        "--pages",
        type=str,
        default=None,
        help="비교할 페이지 목록/범위. 생략하면 전체.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="기존 diff.json이 있어도 재계산.",
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
        parser.error("처리할 페이지가 없습니다.")

    if args.pages:
        target_pages = parse_pages_arg(args.pages, available)
    else:
        target_pages = available

    for page_no in target_pages:
        page_dir = structured_dir / f"page_{page_no:04d}"
        page_json_path = page_dir / "page.json"
        tables_dir = page_dir / "tables"
        if not tables_dir.exists():
            continue

        page_data = json.loads(page_json_path.read_text(encoding="utf-8"))
        for table in page_data.get("tables", []):
            json_rel = table.get("json_path")
            ocr_rel = table.get("ocr_path")
            if not json_rel or not ocr_rel:
                continue
            table_json_path = structured_dir / json_rel
            ocr_json_path = structured_dir / ocr_rel
            diff_path = table_json_path.with_suffix(".diff.json")
            if diff_path.exists() and not args.overwrite:
                print(f"[SKIP] {diff_path} (이미 존재)")
                continue
            doc_nums = load_numbers_from_doc_table(table_json_path)
            ocr_nums = load_numbers_from_ocr(ocr_json_path)
            diff = compare_numbers(doc_nums, ocr_nums)
            diff_path.write_text(json.dumps(diff, ensure_ascii=False, indent=2), encoding="utf-8")
            rel_diff_path = diff_path.relative_to(structured_dir)
            update_page_metadata(page_json_path, table["id"], str(rel_diff_path), diff)
            print(f"숫자 비교 완료: {table_json_path.name} -> {diff_path.name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
