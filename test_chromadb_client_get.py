"""Utility to inspect and optionally health-check remote Chroma collections.

Examples
--------
기본적으로 페이지(`esg_pages`)와 청크(`esg_chunks`) 컬렉션을 확인합니다::

    python3 test_chromadb_client_get.py

다른 컬렉션을 확인하려면 `--collections` 옵션을 사용하세요::

    python3 test_chromadb_client_get.py --collections my_bge_m3_collection

임시 문서를 추가로 써 보고 삭제하는 헬스체크를 수행하려면 `--healthcheck`
플래그를 켜면 됩니다.
"""
from __future__ import annotations

import argparse
import uuid
from datetime import UTC, datetime
from typing import Iterable

import chromadb

DEFAULT_COLLECTIONS = ["esg_pages", "esg_chunks"]
VECTOR_DIMENSION = 1024  # build_vector_db.py에서 사용하는 임베딩 차원과 동일해야 합니다.


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inspect remote Chroma collections")
    parser.add_argument("--host", default="118.36.173.89", help="ChromaDB 서버 주소")
    parser.add_argument("--port", type=int, default=3214, help="ChromaDB 서버 포트")
    parser.add_argument(
        "--collections",
        nargs="+",
        default=DEFAULT_COLLECTIONS,
        help="확인할 컬렉션 이름 목록",
    )
    parser.add_argument(
        "--sample-limit",
        type=int,
        default=3,
        help="peek()로 확인할 샘플 개수",
    )
    parser.add_argument(
        "--healthcheck",
        action="store_true",
        help="임시 문서를 추가/조회/삭제하여 헬스체크 수행",
    )
    return parser.parse_args()


def connect_client(host: str, port: int) -> chromadb.HttpClient:
    print(f"🌐 원격 Chroma 서버에 연결 중: {host}:{port}")
    return chromadb.HttpClient(host=host, port=port)


def summarize_collection(collection: chromadb.Collection, name: str, sample_limit: int) -> None:
    count = collection.count()
    print(f"\n📦 컬렉션 '{name}' — 총 벡터 수: {count}")
    if count == 0:
        print("⚠️ 데이터가 없습니다.")
        return

    limit = min(sample_limit, count)
    if limit <= 0:
        return
    peek = collection.peek(limit=limit)
    print(f"🔍 상위 {limit}개 문서 미리보기:")
    for i in range(limit):
        doc_id = peek["ids"][i]
        document = peek["documents"][i]
        metadata = peek["metadatas"][i]
        print(f"--- [ID: {doc_id}] ---")
        print(f"내용: {document[:200]}{'...' if len(document) > 200 else ''}")
        print(f"메타데이터: {metadata}")


def run_health_check(collection: chromadb.Collection, name: str) -> None:
    timestamp = datetime.now(UTC).isoformat()
    temp_id = f"healthcheck_{uuid.uuid4().hex}"
    temp_text = f"헬스체크 문서 ({name}, {timestamp})"
    temp_embedding = [0.1] * VECTOR_DIMENSION
    temp_metadata = {"type": "healthcheck", "created_at": timestamp}

    collection.add(
        ids=[temp_id],
        documents=[temp_text],
        embeddings=[temp_embedding],
        metadatas=[temp_metadata],
    )
    print(f"📝 '{name}'에 임시 데이터(ID: {temp_id}) 저장 완료")

    result = collection.get(ids=[temp_id], include=["documents", "metadatas"])
    if not result["documents"] or result["documents"][0] != temp_text:
        raise RuntimeError(f"'{name}' 컬렉션에서 저장한 데이터를 다시 찾지 못했습니다.")

    print("📥 조회 성공 — 메타데이터:", result["metadatas"][0])

    collection.delete(ids=[temp_id])
    print("🧹 임시 데이터 삭제 완료")


def main() -> None:
    args = parse_args()
    client = connect_client(args.host, args.port)

    for name in args.collections:
        print("\n==============================")
        print(f"🔸 컬렉션 확인: {name}")
        try:
            collection = client.get_collection(name=name)
        except Exception as exc:  # pragma: no cover - depends on remote state
            print(f"❌ 컬렉션 '{name}'을(를) 찾지 못했습니다: {exc}")
            continue

        summarize_collection(collection, name, args.sample_limit)

        if args.healthcheck:
            run_health_check(collection, name)

        print("==============================")


if __name__ == "__main__":
    main()
