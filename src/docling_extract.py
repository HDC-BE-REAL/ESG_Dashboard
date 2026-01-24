"""Docling을 이용해 레이아웃 기반 텍스트를 추출하는 도구.

Docling은 자체적으로 텍스트 블록을 재배치해 읽기 순서를 맞춰주기 때문에,
단순 텍스트 레이어 추출보다 ESG 보고서 본문을 자연스럽게 받을 수 있다.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

from docling.datamodel.base_models import ConversionStatus
from docling.document_converter import DocumentConverter
import pypdfium2 as pdfium


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT_DIR = REPO_ROOT / "data" / "input"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "data" / "pages_docling"


def infer_default_pdf() -> Path:
    """data/input 안의 첫 번째 PDF를 기본 값으로 사용한다."""

    candidates = sorted(DEFAULT_INPUT_DIR.glob("*.pdf"))
    if not candidates:
        raise FileNotFoundError(
            f"{DEFAULT_INPUT_DIR} 폴더에서 PDF를 찾지 못했어요. --pdf 옵션으로 직접 지정하세요."
        )
    return candidates[0]


def parse_page_selection(selection: str, total_pages: int) -> list[int]:
    """쉼표로 구분된 페이지/범위를 정수 리스트로 변환한다."""

    pages: set[int] = set()
    for raw in selection.split(","):
        part = raw.strip()
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

    normalized = sorted(p for p in pages if 1 <= p <= total_pages)
    if not normalized:
        raise ValueError("요청한 페이지가 문서 범위에 없습니다.")
    return normalized


def pages_from_count(total_pages: int, count: int) -> list[int]:
    if count <= 0:
        raise ValueError("--count 값은 양수여야 합니다.")
    upper = min(total_pages, count)
    return list(range(1, upper + 1))


def get_pdf_page_count(pdf_path: Path) -> int:
    doc = pdfium.PdfDocument(str(pdf_path))
    try:
        return len(doc)
    finally:
        doc.close()


def chunk_consecutive(pages: Iterable[int]) -> list[tuple[int, int]]:
    """연속된 페이지를 묶어 Docling 변환 횟수를 줄인다."""

    sorted_pages = sorted(pages)
    if not sorted_pages:
        return []

    groups: list[tuple[int, int]] = []
    start = prev = sorted_pages[0]
    for page in sorted_pages[1:]:
        if page == prev + 1:
            prev = page
            continue
        groups.append((start, prev))
        start = prev = page
    groups.append((start, prev))
    return groups


def export_page_markdown(doc, page_no: int) -> str:
    """Docling 문서에서 지정한 페이지만 Markdown 텍스트로 변환한다."""

    text = doc.export_to_markdown(
        page_no=page_no,
        page_break_placeholder=None,
        image_placeholder="[IMAGE]",
        include_annotations=False,
        strict_text=False,
    ).strip()
    return text or "[EMPTY PAGE OR NON-TEXT CONTENT]"


def save_text(output_dir: Path, page_number: int, text: str) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f"page_{page_number:04d}.txt"
    target.write_text(text, encoding="utf-8")
    return target


def convert_with_docling(
    pdf_path: Path,
    output_dir: Path,
    pages: Iterable[int],
) -> None:
    target_pages = sorted(set(pages))
    if not target_pages:
        raise ValueError("추출할 페이지가 없습니다.")

    converter = DocumentConverter()
    for start, end in chunk_consecutive(target_pages):
        result = converter.convert(pdf_path, page_range=(start, end))
        if result.status not in {ConversionStatus.SUCCESS, ConversionStatus.PARTIAL_SUCCESS}:
            errors = ", ".join(err.error_message for err in result.errors)
            raise RuntimeError(f"Docling 변환 실패 ({start}-{end}): {result.status}. {errors}")
        if result.document is None:
            raise RuntimeError("Docling이 문서를 반환하지 않았습니다.")

        doc = result.document
        for page_no in range(start, end + 1):
            if page_no not in target_pages:
                continue
            text = export_page_markdown(doc, page_no)
            save_path = save_text(output_dir, page_no, text)
            print(f"Docling 저장 완료: 페이지 {page_no} -> {save_path}")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Docling을 사용해 현대건설 보고서의 페이지별 텍스트를 추출한다.",
    )
    parser.add_argument(
        "--pdf",
        type=Path,
        default=None,
        help="분석할 PDF 경로. 기본은 data/input 안 첫 번째 파일.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="결과 텍스트 파일을 저장할 폴더.",
    )
    parser.add_argument(
        "--pages",
        type=str,
        default=None,
        help="추출할 페이지 목록(예: 25,26,27 혹은 10-15).",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=3,
        help="--pages를 생략하면 앞쪽에서 몇 페이지를 Docling으로 추출할지 지정.",
    )
    return parser


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()

    if args.pdf is None:
        pdf_path = infer_default_pdf()
        print(f"기본 PDF 사용: {pdf_path}")
    else:
        pdf_path = args.pdf.expanduser().resolve()
        if not pdf_path.exists():
            parser.error(f"PDF를 찾을 수 없습니다: {pdf_path}")

    total_pages = get_pdf_page_count(pdf_path)
    if args.pages:
        pages = parse_page_selection(args.pages, total_pages)
    else:
        pages = pages_from_count(total_pages, args.count)

    convert_with_docling(pdf_path, args.output_dir, pages)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
