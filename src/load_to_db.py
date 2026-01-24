"""
Load structured JSON data into MySQL Database.
Supports full pipeline artifacts including Docling tables, OCR verification, and Figure captions.

Usage:
    python src/load_to_db.py --doc-name "2023_현대건설" [--init-db]
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import pymysql
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "esg_data")
DB_PORT = int(os.getenv("DB_PORT", 3306))

DEFAULT_INPUT_DIR = Path("data/pages_structured")


def get_connection():
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )
        return conn
    except pymysql.MySQLError as e:
        print(f"Error connecting to MySQL: {e}")
        print("Please check your .env file and ensure MySQL is properly configured.")
        sys.exit(1)


def init_database(conn):
    """Create tables if they don't exist."""
    print("Initializing database schema...")
    with conn.cursor() as cursor:
        # 1. Documents
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 2. Pages
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doc_id INT NOT NULL,
                page_no INT NOT NULL,
                visual_density FLOAT DEFAULT 0.0,
                needs_review BOOLEAN DEFAULT FALSE,
                summary TEXT,
                full_markdown LONGTEXT,
                FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE,
                UNIQUE KEY unique_page (doc_id, page_no)
            )
        """)

        # 3. Tables (Updated with OCR/Diff verification columns)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS doc_tables (
                id INT AUTO_INCREMENT PRIMARY KEY,
                page_id INT NOT NULL,
                table_seq_id VARCHAR(50), 
                title VARCHAR(500),
                bbox_json JSON,
                ocr_data JSON, 
                diff_data JSON,
                FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
                UNIQUE KEY unique_table (page_id, table_seq_id)
            )
        """)

        # 4. Cells
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS table_cells (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                table_id INT NOT NULL,
                row_idx INT NOT NULL,
                col_idx INT NOT NULL,
                content TEXT,
                row_span INT DEFAULT 1,
                col_span INT DEFAULT 1,
                is_header BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (table_id) REFERENCES doc_tables(id) ON DELETE CASCADE,
                INDEX idx_table_row_col (table_id, row_idx, col_idx)
            )
        """)
        
        # 5. Figures (New)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS doc_figures (
                id INT AUTO_INCREMENT PRIMARY KEY,
                page_id INT NOT NULL,
                figure_seq_id VARCHAR(50),
                bbox_json JSON,
                caption TEXT,
                description TEXT,
                image_path VARCHAR(255),
                FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
                UNIQUE KEY unique_figure (page_id, figure_seq_id)
            )
        """)
    conn.commit()
    print("Schema initialized successfully.")


def insert_document(conn, filename: str) -> int:
    with conn.cursor() as cursor:
        cursor.execute("SELECT id FROM documents WHERE filename = %s", (filename,))
        row = cursor.fetchone()
        if row:
            return row["id"]
        
        cursor.execute("INSERT INTO documents (filename) VALUES (%s)", (filename,))
        conn.commit()
        return cursor.lastrowid


def load_file_content(path: Path) -> Optional[str]:
    if path and path.exists():
        return path.read_text(encoding="utf-8")
    return None


def load_json_file(path: Path) -> Any:
    if path and path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def load_page(conn, doc_id: int, page_dir: Path):
    page_json_path = page_dir / "page.json"
    if not page_json_path.exists():
        return

    data = load_json_file(page_json_path)
    page_no = data.get("page_number")
    markdown = data.get("markdown", "")
    visual_density = data.get("visual_density", 0.0)
    needs_review = data.get("needs_visual_review", False)
    
    # Load Summary
    summary_path = page_dir / "summary.md"
    summary_text = load_file_content(summary_path)

    with conn.cursor() as cursor:
        # Upsert Page
        sql = """
            INSERT INTO pages (doc_id, page_no, visual_density, needs_review, summary, full_markdown)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                visual_density = VALUES(visual_density),
                needs_review = VALUES(needs_review),
                summary = VALUES(summary),
                full_markdown = VALUES(full_markdown)
        """
        cursor.execute(sql, (doc_id, page_no, visual_density, needs_review, summary_text, markdown))
        
        cursor.execute("SELECT id FROM pages WHERE doc_id=%s AND page_no=%s", (doc_id, page_no))
        page_id = cursor.fetchone()["id"]

        # Process Tables
        tables_list = data.get("tables", [])
        for tbl_meta in tables_list:
            load_table(conn, page_id, page_dir, tbl_meta)
            
        # Process Figures
        figures_list = data.get("figures", [])
        for fig_meta in figures_list:
            load_figure(conn, page_id, page_dir, fig_meta)
    
    conn.commit()
    print(f"Loaded Page {page_no} (ID: {page_id})")


def load_table(conn, page_id: int, page_dir: Path, tbl_meta: Dict[str, Any]):
    table_id_str = tbl_meta.get("id") # table_001
    title = tbl_meta.get("title")
    bbox = tbl_meta.get("bbox")
    
    # Resolve Paths
    tables_dir = page_dir / "tables"
    json_path = tables_dir / f"{table_id_str}.json"
    ocr_path = tables_dir / f"{table_id_str}.ocr.json"
    diff_path = tables_dir / f"{table_id_str}.diff.json"

    # Load Data
    table_data = load_json_file(json_path)
    if not table_data:
        print(f"  Warning: Missing core table JSON {json_path}")
        return

    ocr_data = load_json_file(ocr_path)
    diff_data = load_json_file(diff_path)
    ocr_json_str = json.dumps(ocr_data) if ocr_data else None
    diff_json_str = json.dumps(diff_data) if diff_data else None

    cells = table_data.get("cells", [])

    with conn.cursor() as cursor:
        # Upsert Table Meta
        cursor.execute("""
            INSERT INTO doc_tables (page_id, table_seq_id, title, bbox_json, ocr_data, diff_data)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                bbox_json = VALUES(bbox_json),
                ocr_data = VALUES(ocr_data),
                diff_data = VALUES(diff_data)
        """, (page_id, table_id_str, title, json.dumps(bbox), ocr_json_str, diff_json_str))
        
        # Get Table ID (Need to fetch again cause lastrowid is unreliable on update)
        cursor.execute("SELECT id FROM doc_tables WHERE page_id=%s AND table_seq_id=%s", (page_id, table_id_str))
        db_table_id = cursor.fetchone()["id"]

        # Re-insert Cells (Delete all old cells first to be clean)
        cursor.execute("DELETE FROM table_cells WHERE table_id = %s", (db_table_id,))
        
        if not cells:
            return
            
        insert_data = []
        for row_list in cells:
            for cell in row_list:
                insert_data.append((
                    db_table_id,
                    cell.get("row"),
                    cell.get("col"),
                    cell.get("text"),
                    cell.get("row_span", 1),
                    cell.get("col_span", 1),
                    cell.get("column_header", False) or cell.get("row_header", False)
                ))

        if insert_data:
            cursor.executemany("""
                INSERT INTO table_cells 
                (table_id, row_idx, col_idx, content, row_span, col_span, is_header)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, insert_data)


def load_figure(conn, page_id: int, page_dir: Path, fig_meta: Dict[str, Any]):
    figure_id_str = fig_meta.get("id") # figure_001
    caption = fig_meta.get("caption")
    bbox = fig_meta.get("bbox")
    image_rel_path = fig_meta.get("image_path") # relative to output root
    
    # Check for description
    figures_dir = page_dir / "figures"
    desc_path = figures_dir / f"{figure_id_str}.desc.md"
    description = load_file_content(desc_path)
    
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO doc_figures (page_id, figure_seq_id, bbox_json, caption, description, image_path)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                caption = VALUES(caption),
                description = VALUES(description),
                image_path = VALUES(image_path)
        """, (page_id, figure_id_str, json.dumps(bbox), caption, description, image_rel_path))


def main():
    parser = argparse.ArgumentParser(description="Load extracted JSON data into MySQL")
    parser.add_argument("--doc-name", type=str, required=True, help="Unique name for the document")
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT_DIR, help="Directory containing page_XXXX folders")
    parser.add_argument("--init-db", action="store_true", help="Initialize database schema (create tables)")
    
    args = parser.parse_args()

    if not args.input_dir.exists():
        print(f"Input directory not found: {args.input_dir}")
        return

    conn = get_connection()
    try:
        if args.init_db:
            init_database(conn)

        doc_id = insert_document(conn, args.doc_name)
        print(f"Processing Document: {args.doc_name} (ID: {doc_id})")

        page_dirs = sorted([d for d in args.input_dir.iterdir() if d.is_dir() and d.name.startswith("page_")])
        if not page_dirs:
            print("No page directories found. Run structured_extract.py first.")
            return

        for page_dir in page_dirs:
            load_page(conn, doc_id, page_dir)

        print("\nSuccess! Data loaded into database.")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
