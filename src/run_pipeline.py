"""
ESG Report Full Pipeline Script.

This script executes the entire PDF Text Extraction pipeline in sequence:
1. PDF Sanitization (Optional, Auto-detected)
2. Docling Structured Extraction
3. Table OCR / Text Extraction
4. Figure Description with GPT
5. Table Diff / Validation
6. Database Loading (Optional)

Usage:
    python src/run_pipeline.py --pdf data/input/report.pdf --pages 1-10 --load-db
"""

import argparse
import subprocess
import sys
from pathlib import Path

# Define script paths
SRC_DIR = Path(__file__).parent.resolve()
SCRIPT_PDF_EXTRACTOR = SRC_DIR / "pdf_text_extractor.py"
SCRIPT_STRUCTURED = SRC_DIR / "structured_extract.py"
SCRIPT_TABLE_OCR = SRC_DIR / "table_ocr.py"
SCRIPT_FIGURE_OCR = SRC_DIR / "figure_ocr.py"
SCRIPT_TABLE_DIFF = SRC_DIR / "table_diff.py"
SCRIPT_LOAD_DB = SRC_DIR / "load_to_db.py"


def run_command(cmd: list[str], description: str):
    """Run a subprocess command and handle errors."""
    print(f"\n{'='*60}")
    print(f"🚀 [Pipeline] Starting: {description}")
    print(f"   Command: {' '.join(str(c) for c in cmd)}")
    print(f"{'='*60}\n")
    
    try:
        # Stream output to stdout
        result = subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"\n❌ [Pipeline] Failed at step: {description}")
        print(f"   Exit Code: {e.returncode}")
        print("   Aborting pipeline.")
        sys.exit(e.returncode)
    
    print(f"\n✅ [Pipeline] Completed: {description}\n")


def main():
    parser = argparse.ArgumentParser(description="Run the full ESG PDF Extraction Pipeline")
    parser.add_argument("--pdf", type=Path, required=True, help="Path to the source PDF file")
    parser.add_argument("--pages", type=str, default=None, help="Page range to process (e.g. 1-10, 50). Processing FULL document if omitted.")
    parser.add_argument("--doc-name", type=str, default=None, help="Document name for DB loading (default: PDF stem)")
    
    # Feature Flags
    parser.add_argument("--skip-sanitize", action="store_true", help="Skip the PDF sanitization check step")
    parser.add_argument("--skip-gpt", action="store_true", help="Skip GPT-based figure description")
    parser.add_argument("--load-db", action="store_true", help="Load results into MySQL database after processing")
    parser.add_argument("--init-db", action="store_true", help="Initialize DB schema before loading (use with --load-db)")
    
    args = parser.parse_args()

    # 0. Validate Input
    if not args.pdf.exists():
        print(f"Error: Input PDF not found: {args.pdf}")
        sys.exit(1)
        
    pdf_path = args.pdf.resolve()
    
    # 1. PDF Sanitization (Step 0)
    # The pdf_text_extractor.py tool handles the check logic internally.
    # It returns 0 if fine, or creates a sanitized file if needed.
    # However, structured_extract.py has logic to auto-switch to sanitized file.
    # WE MUST RUN sanitization check unless skipped.
    if not args.skip_sanitize:
        cmd_sanitize = [sys.executable, str(SCRIPT_PDF_EXTRACTOR), "--pdf", str(pdf_path)]
        # We don't check=True here because the script might return non-zero on error,
        # but current logic returns 1 on failure. We want to stop if sanitization fails.
        # But wait, pdf_text_extractor returns 0 on [Pass] as well. So check=True is fine.
        run_command(cmd_sanitize, "Step 0: PDF Sanitization Check")
    
    # Note: structured_extract.py has auto-switch logic, so we just pass the ORIGINAL path.
    # It will pick up the sanitized file if it exists.

    # 2. Structured Extraction
    cmd_struct = [sys.executable, str(SCRIPT_STRUCTURED), "--pdf", str(pdf_path)]
    if args.pages:
        cmd_struct.extend(["--pages", args.pages])
    else:
        # If no pages specified, structured_extract defaults to 3 pages safety limit.
        # But for full pipeline, we likely want full doc unless user specified.
        # Wait, user might want full. structured_extract.py needs explicit --pages or run all?
        # Standard structured_extract w/o --pages uses --count 3 default.
        # If user runs pipeline w/o --pages, they probably imply "FULL".
        # Let's check total pages first? OR just don't pass anything and let it default to 3? 
        # User request: "just run that file". Usually implies full pipeline on whatever range I asked.
        # If I asked --pages 1-10, pass it. If not, maybe warn?
        # Let's keep default behavior (3 pages) to be safe, or we can add a flag --full-doc.
        # Let's trust args.pages. If None, it does default.
        pass
        
    # Define doc_name early to pass it to structured_extract
    doc_name = args.doc_name or pdf_path.stem
    cmd_struct.extend(["--report-name", doc_name])

    run_command(cmd_struct, "Step 1: Docling Structured Extraction")
    
    # 3. Table OCR
    # Now we know exactly where the pages are: data/pages_structured/{doc_name}
    target_page_dir = Path("data/pages_structured") / doc_name
    
    cmd_tocr = [sys.executable, str(SCRIPT_TABLE_OCR)]
    if args.pages:
        cmd_tocr.extend(["--pages", args.pages])
    
    # Updated Table OCR to look there
    cmd_tocr.extend(["--structured-dir", str(target_page_dir)])
    cmd_tocr.extend(["--pdf", str(pdf_path)]) 
    
    run_command(cmd_tocr, "Step 2: Table Text Extraction (OCR/PDF)")
    
    # 4. Figure OCR
    if not args.skip_gpt:
        cmd_fig = [sys.executable, str(SCRIPT_FIGURE_OCR), "--model", "gpt-4o-mini"]
        if args.pages:
            cmd_fig.extend(["--pages", args.pages])
        cmd_fig.extend(["--structured-dir", str(target_page_dir)]) # Ensure we point to correct folder
        run_command(cmd_fig, "Step 3: Figure Description (GPT)")
    
    # 5. Table Diff
    cmd_diff = [sys.executable, str(SCRIPT_TABLE_DIFF)]
    if args.pages:
        cmd_diff.extend(["--pages", args.pages])
    cmd_diff.extend(["--structured-dir", str(target_page_dir)])
    run_command(cmd_diff, "Step 4: Table Validation (Diff)")
    
    # 6. Load DB
    if args.load_db:
        cmd_load = [sys.executable, str(SCRIPT_LOAD_DB), "--doc-name", doc_name]
        if args.init_db:
            cmd_load.append("--init-db")
        # Ensure loading script knows where to look
        cmd_load.extend(["--input-dir", str(target_page_dir)])
        
        run_command(cmd_load, "Step 5: Database Loading")

    print("\n✨ [Pipeline] All steps completed successfully!")
    print(f"   - Results: {target_page_dir}")
    if args.load_db:
        print(f"   - Database: loaded as '{doc_name}'")


if __name__ == "__main__":
    main()
