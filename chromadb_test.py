#[chromadb test 코드]
import chromadb

#1. 원격 서버 연결 (서버IP와 포트 8000번 확인)
#예: "http://123.456.78.90:8000"
remote_db = chromadb.HttpClient(host="118.36.173.89", port=3214)

#2. 컬렉션 생성 (이미 생성되어 있다면 get_collection 사용)
#거리 계산 방식을 'cosine'으로 설정합니다.
collection = remote_db.get_or_create_collection(
    name="my_bge_m3_collection",
    metadata={"hnsw:space": "cosine"} # 거리 계산 방식 설정
    )

#3. 데이터 추가 (Client-side Embedding 방식)
#BGE-M3 모델로 생성한 1024차원의 리스트를 넣습니다.
sample_vector = [0.1] * 1024  # 실제로는 모델이 생성한 벡터값이 들어갑니다.

collection.add(
    embeddings=[sample_vector],
    documents=["이것은 원격 서버에 저장되는 문서입니다."],
    ids=["doc_1"]
)

print("데이터 저장이 완료되었습니다.")