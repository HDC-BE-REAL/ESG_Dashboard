"""
Build Vector Database from MySQL Data (Phase 1: Page Chunking).
Fetches 'full_markdown' from DB, chunks it, and stores embeddings in ChromaDB.

Usage:
    python src/build_vector_db.py [--reset]
"""

import argparse
import os
import sys
from datetime import datetime
from typing import List, Dict, Any

import chromadb
from chromadb.config import Settings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import pymysql

# Import get_connection from load_to_db to share logic
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from load_to_db import get_connection

# Configuration
VECTOR_DB_DIR = "vector_db"
COLLECTION_NAME = "esg_documents"
EMBEDDING_MODEL_NAME = "BAAI/bge-m3"
CHUNK_SIZE = 512
CHUNK_OVERLAP = 50

def fetch_documents_from_db(conn) -> List[Dict[str, Any]]:
    """Fetch all pages with their document metadata."""
    sql = """
        SELECT 
            d.id as doc_id, 
            d.filename, 
            d.company_name, 
            d.report_year,
            p.id as page_id,
            p.page_no,
            p.full_markdown
        FROM pages p
        JOIN documents d ON p.doc_id = d.id
        WHERE p.full_markdown IS NOT NULL AND p.full_markdown != ''
        ORDER BY d.id, p.page_no
    """
    with conn.cursor() as cursor:
        cursor.execute(sql)
        return cursor.fetchall()


def fetch_figures_from_db(conn) -> List[Dict[str, Any]]:
    """Fetch figures with description length > 100."""
    sql = """
        SELECT 
            f.id as figure_id,
            f.doc_id,
            f.page_id,
            p.page_no,
            f.figure_type,
            f.caption,
            f.description,
            f.image_path,
            d.company_name,
            d.report_year,
            d.filename
        FROM doc_figures f
        JOIN documents d ON f.doc_id = d.id
        JOIN pages p ON f.page_id = p.id
        WHERE f.description IS NOT NULL AND CHAR_LENGTH(f.description) > 100
    """
    with conn.cursor() as cursor:
        cursor.execute(sql)
        return cursor.fetchall()


def build_vector_db(reset: bool = False):
    print(f"🚀 Starting Vector DB Builder (Model: {EMBEDDING_MODEL_NAME})")
    
    # 1. Initialize ChromaDB
    abs_path = os.path.abspath(VECTOR_DB_DIR)
    print(f"📂 Vector DB Path: {abs_path}")
    client = chromadb.PersistentClient(path=abs_path)
    
    if reset:
        print(f"⚠️ Resetting collection '{COLLECTION_NAME}'...")
        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass # Collection might not exist
            
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    
    # Check if we need to load model (only if adding data)
    # But for now, we just load it.
    print("📦 Loading Embedding Model (this may take a while)...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    
    # 2. Setup Text Splitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " "]
    )
    
    # 3. Fetch Data from MySQL
    conn = get_connection()
    try:
        # Phase 1: Pages
        page_results = fetch_documents_from_db(conn)
        print(f"📥 Fetched {len(page_results)} pages from MySQL.")
        
        # Phase 2: Figures
        figure_results = fetch_figures_from_db(conn)
        print(f"📥 Fetched {len(figure_results)} figures from MySQL (len > 100).")
        
    finally:
        conn.close()
        
    if not page_results and not figure_results:
        print("No data found in MySQL. Please run load_to_db.py first.")
        return

    # 4. Process and Vectorize
    ids = []
    documents = []
    metadatas = []
    
    # --- Process Pages ---
    print("⚡ Processing Page chunks...")
    for row in page_results:
        text = row["full_markdown"]
        chunks = splitter.split_text(text)
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"doc_{row['doc_id']}_page_{row['page_id']}_chunk_{i}"
            ids.append(chunk_id)
            documents.append(chunk)
            
            meta = {
                "source_type": "page_chunk",
                "doc_id": row["doc_id"],
                "page_id": row["page_id"],
                "page_no": row["page_no"],
                "chunk_index": i,
                "company_name": row["company_name"] or "Unknown",
                "report_year": row["report_year"] or 0,
                "filename": row["filename"],
                "created_at": datetime.now().isoformat()
            }
            metadatas.append(meta)

    # --- Process Figures ---
    print("⚡ Processing Figures...")
    for row in figure_results:
        # Construct Figure Text
        figure_text = f"""
그림 종류: {row['figure_type'] or 'unknown'}
캡션: {row['caption'] or ''}

상세 설명:
{row['description']}

위치: {row['company_name']} {row['report_year']}년 보고서 {row['page_no']}페이지
""".strip()
        
        fig_id_str = f"figure_{row['figure_id']}"
        ids.append(fig_id_str)
        documents.append(figure_text)
        
        meta = {
            "source_type": "figure",
            "doc_id": row["doc_id"],
            "page_id": row["page_id"],
            "page_no": row["page_no"],
            "figure_id": row["figure_id"],
            "image_path": row["image_path"] or "",
            "company_name": row["company_name"] or "Unknown",
            "report_year": row["report_year"] or 0,
            "filename": row["filename"],
            "created_at": datetime.now().isoformat()
        }
        metadatas.append(meta)

    # Encode in batches to avoid OOM
    BATCH_SIZE = 32
    print(f"   Total Vectors to process: {len(ids)}")
    
    for i in range(0, len(ids), BATCH_SIZE):
        batch_ids = ids[i:i+BATCH_SIZE]
        batch_docs = documents[i:i+BATCH_SIZE]
        batch_metas = metadatas[i:i+BATCH_SIZE]
        
        # Embed
        batch_embeddings = model.encode(batch_docs).tolist()
        
        # Upsert to Chroma
        collection.upsert(
            ids=batch_ids,
            documents=batch_docs,
            embeddings=batch_embeddings,
            metadatas=batch_metas
        )
        print(f"   Saved batch {i} - {i+len(batch_ids)} / {len(ids)}")
        
    print(f"\n✅ Vector DB Build Completed! Total Vectors: {collection.count()}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Reset (delete) existing vector DB before building")
    args = parser.parse_args()
    
    build_vector_db(reset=args.reset)

