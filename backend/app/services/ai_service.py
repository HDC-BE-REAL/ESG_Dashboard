import random
from datetime import datetime
import os
from pathlib import Path
from typing import List, Optional
import openai
from ..config import settings

# RAG Libraries (Try import)
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    HAS_RAG_LIBS = True
except ImportError:
    HAS_RAG_LIBS = False

class AIService:
    def __init__(self):
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
        
        self.chroma_client = None
        self.collection = None
        self.embedding_model = None
        
        if HAS_RAG_LIBS:
            self._init_vector_db()

    def _init_vector_db(self):
        try:
            # Absolute path to Vector DB
            # Assuming standard project structure: /home/dmin/ESG_Wep/PDF_Extraction/vector_db
            base_dir = Path(__file__).resolve().parent.parent.parent.parent
            db_path = base_dir / "PDF_Extraction" / "vector_db"
            
            if not db_path.exists():
                print(f"⚠️ Vector DB path not found: {db_path}")
                return

            self.chroma_client = chromadb.PersistentClient(path=str(db_path))
            
            # Try to get the collection (using 'esg_documents' as found in inspection)
            try:
                self.collection = self.chroma_client.get_collection("esg_documents")
                print("✅ [RAG] Connected to collection: esg_documents")
            except Exception as e:
                print(f"⚠️ [RAG] Collection 'esg_documents' not found: {e}")
                # Fallback to other names if needed, but for now stick to what we found
                return

            # Initialize Embedding Model
            # This might take a moment on first load
            print("⏳ [RAG] Loading embedding model BAAI/bge-m3...")
            self.embedding_model = SentenceTransformer("BAAI/bge-m3")
            print("✅ [RAG] Embedding model loaded.")

        except Exception as e:
            print(f"❌ [RAG Error] Failed to initialize Vector DB: {e}")

    async def generate_strategy(self, company_id: int, market: str, current_price: float):
        """
        탄소 배출권 매수 전략 생성 (Mock Data)
        """
        is_high_volatility = random.choice([True, False])
        
        tranches = []
        months = ["26.02", "26.03", "26.04", "26.05", "26.06", "26.07", "26.08", "26.09"]
        selected_months = random.sample(months, 3)
        selected_months.sort()

        if is_high_volatility:
            strategy_text = f"⚠️ [고변동성 감지] {market} 시장의 변동성이 높습니다. 리스크 분산을 위해 3회에 걸친 분할 매수 전략을 추천합니다."
            percentages = [30, 40, 30]
        else:
            strategy_text = f"✅ [안정적 추세] {market} 시장이 안정적인 흐름을 보이고 있습니다. 저점 확보를 위한 공격적 매수 전략이 유효합니다."
            percentages = [50, 30, 20]

        for i, month in enumerate(selected_months):
            forecast_price = current_price * (1 + random.uniform(-0.05, 0.05))
            tranches.append({
                "id": int(datetime.now().timestamp() * 1000) + i,
                "market": market,
                "price": round(forecast_price, 2) if market == "EU-ETS" else int(forecast_price),
                "month": month,
                "isFuture": True,
                "percentage": percentages[i]
            })

        return {
            "strategy_text": strategy_text,
            "tranches": tranches,
            "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M")
        }

    async def get_chat_response(self, message: str):
        """
        RAG 기반 AI 답변 생성 (Vector DB + OpenAI)
        """
        # 1. 특정 키워드 처리 (Fast Path)
        if "시뮬레이터" in message:
            return "상단의 '시뮬레이터' 탭을 누르시면 탄소 비용 예측 대시보드를 보실 수 있습니다."

        # 2. RAG 검색
        context = ""
        source_info = []
        
        if self.collection and self.embedding_model:
            try:
                print(f"🔎 [RAG] Searching for: {message}")
                # Embed query
                query_vec = self.embedding_model.encode([message]).tolist()
                
                # Query DB
                results = self.collection.query(
                    query_embeddings=query_vec,
                    n_results=3,
                    include=["documents", "metadatas", "distances"]
                )
                
                if results and results['documents']:
                    docs = results['documents'][0]
                    metas = results['metadatas'][0]
                    
                    for doc, meta in zip(docs, metas):
                        company = meta.get('company_name', 'Unknown')
                        year = meta.get('report_year', '????')
                        page = meta.get('page_no', '?')
                        
                        source_line = f"- {company} {year} Report (p.{page})"
                        if source_line not in source_info:
                            source_info.append(source_line)
                            
                        texts_part = f"[{company} {year} Report p.{page}]: {doc}"
                        context += texts_part + "\n\n"
                    
                    print(f"✅ [RAG] Found {len(docs)} contexts.")
                else:
                    print("⚠️ [RAG] No results found.")
            except Exception as e:
                print(f"❌ [RAG Search Error] {e}")

        # 3. LLM 호출
        if not settings.OPENAI_API_KEY:
            return "⚠️ OpenAI API Key가 설정되지 않았습니다. .env 파일을 확인해주세요."

        try:
            system_prompt = (
                "You are an expert ESG consultant. "
                "Answer the user's question based on the provided Context if available. "
                "If the context provides specific data, cite the company and year. "
                "If the context is empty or irrelevant, answer using your general knowledge but mention that this is general advice. "
                "Speak in polite and professional Korean."
            )

            user_prompt = f"Question: {message}\n\n"
            if context:
                user_prompt += f"Context:\n{context}\n\n"
                user_prompt += "Based on the context above, answer the question."
            else:
                user_prompt += "Answer based on your general knowledge."

            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o",  # or gpt-3.5-turbo
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=600
            )
            
            answer = response.choices[0].message.content
            
            # 출처 추가
            if source_info:
                answer += "\n\n📚 **참고 문헌:**\n" + "\n".join(source_info)

            return answer

        except Exception as e:
            print(f"LLM Error: {e}")
            return "죄송합니다. 답변 생성 중 오류가 발생했습니다. (OpenAI API 연결 실패)"

    async def text_to_sql(self, question: str, db_schema: str = None):
        """
        자연어를 SQL 쿼리로 변환 (Mock)
        """
        return f"SELECT * FROM documents WHERE content LIKE '%{question}%' LIMIT 5;"

ai_service = AIService()
