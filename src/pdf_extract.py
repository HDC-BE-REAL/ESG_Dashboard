"""현대건설 ESG 보고서에서 샘플 텍스트를 추출하는 간단한 도구.

현재 단계에서는 PyMuPDF가 텍스트 레이어를 얼마나 깨끗하게 가져오는지
확인하는 것이 목적이므로, 일부 페이지만 뽑아서 UTF-8 텍스트 파일로
저장하는 기능에 집중한다.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable, List

import fitz  # PyMuPDF


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT_DIR = REPO_ROOT / "data" / "input"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "data" / "pages_text"


def infer_default_pdf() -> Path:
    """data/input에 있는 첫 번째 PDF를 기본 대상으로 선택한다."""

    pdf_candidates = sorted(DEFAULT_INPUT_DIR.glob("*.pdf"))
    if not pdf_candidates:
        raise FileNotFoundError(
            f"No PDF files found in {DEFAULT_INPUT_DIR}. Use --pdf to specify a file."
        )
    return pdf_candidates[0]


def parse_page_selection(selection: str, total_pages: int) -> List[int]:
    """쉼표로 구분된 페이지/구간 지정(1-based)을 정렬된 리스트로 변환한다."""

    pages: set[int] = set()
    for raw_part in selection.split(","):
        part = raw_part.strip()
        if not part:
            continue
        if "-" in part:
            start_str, end_str = part.split("-", 1)
            start = int(start_str)
            end = int(end_str)
            if start > end:
                start, end = end, start
            pages.update(range(start, end + 1))
        else:
            pages.add(int(part))

    filtered = sorted(page for page in pages if 1 <= page <= total_pages)
    if not filtered:
        raise ValueError("No valid page numbers after parsing selection.")
    return filtered


def pages_from_count(total_pages: int, count: int) -> List[int]:
    if count <= 0:
        raise ValueError("--count must be positive")
    return list(range(1, min(total_pages, count) + 1))


def save_page_text(output_dir: Path, page_number: int, text: str) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    target_path = output_dir / f"page_{page_number:04d}.txt"
    target_path.write_text(text, encoding="utf-8")
    return target_path


def extract_pages(document: fitz.Document, output_dir: Path, pages: Iterable[int]) -> None:
    output_dir = output_dir.resolve()

    total_pages = document.page_count
    normalized_pages = sorted({p for p in pages if 1 <= p <= total_pages})
    if not normalized_pages:
        raise ValueError(
            "No valid page numbers to extract. Check the PDF length or page selection."
        )

    for page_number in normalized_pages:
        page = document.load_page(page_number - 1)
        text = page.get_text("text").strip()
        if not text:
            text = "[EMPTY PAGE OR IMAGE-ONLY CONTENT]"
        save_path = save_page_text(output_dir, page_number, text)
        print(f"Saved page {page_number} -> {save_path}")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "PyMuPDF로 현대건설 지속가능경영보고서의 일부 페이지를 추출해 "
            "텍스트 품질을 살펴본다."
        )
    )
    parser.add_argument(
        "--pdf",
        type=Path,
        default=None,
        help="대상 PDF 경로. 지정하지 않으면 data/input의 첫 번째 파일을 사용.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="페이지별 텍스트 파일을 저장할 디렉터리.",
    )
    parser.add_argument(
        "--pages",
        type=str,
        default=None,
        help="1-based 페이지 번호/범위를 쉼표로 지정. 예: 1,5-7,12",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=3,
        help="--pages를 생략했을 때 앞쪽에서 몇 페이지를 추출할지 지정.",
    )
    return parser


def main(argv: List[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    pdf_path: Path
    if args.pdf is None:
        pdf_path = infer_default_pdf()
        print(f"Using default PDF: {pdf_path}")
    else:
        pdf_path = args.pdf.expanduser().resolve()
        if not pdf_path.exists():
            parser.error(f"PDF file not found: {pdf_path}")

    with fitz.open(pdf_path) as doc:
        total_pages = doc.page_count

        if args.pages:
            pages = parse_page_selection(args.pages, total_pages)
        else:
            pages = pages_from_count(total_pages, args.count)

        extract_pages(doc, args.output_dir, pages)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
