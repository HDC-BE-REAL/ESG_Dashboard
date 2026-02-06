import random
from datetime import datetime
from pathlib import Path
from typing import Generator, List, Optional, Tuple, Union

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

    @staticmethod
    def _content_to_text(content: Union[str, List, None]) -> str:
        if content is None:
            return ""
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            texts: List[str] = []
            for part in content:
                if isinstance(part, dict):
                    texts.append(part.get("text", ""))
                else:
                    text_value = getattr(part, "text", "")
                    texts.append(text_value)
            return "".join(texts)
        return str(content)

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

    def _fast_path_response(self, message: str) -> Optional[str]:
        if "시뮬레이터" in message:
            return "상단의 '시뮬레이터' 탭을 누르시면 탄소 비용 예측 대시보드를 보실 수 있습니다."
        return None

    def _retrieve_context(self, message: str) -> Tuple[str, List[str]]:
        context = ""
        source_info: List[str] = []

        if self.collection and self.embedding_model:
            try:
                print(f"🔎 [RAG] Searching for: {message}")
                query_vec = self.embedding_model.encode([message]).tolist()
                results = self.collection.query(
                    query_embeddings=query_vec,
                    n_results=3,
                    include=["documents", "metadatas", "distances"]
                )

                if results and results.get('documents'):
                    docs = results['documents'][0]
                    metas = results['metadatas'][0]

                    for doc, meta in zip(docs, metas):
                        company = meta.get('company_name', 'Unknown')
                        year = meta.get('report_year', '????')
                        page = meta.get('page_no', '?')

                        source_line = f"- {company} {year} Report (p.{page})"
                        if source_line not in source_info:
                            source_info.append(source_line)

                        context += f"[{company} {year} Report p.{page}]: {doc}\n\n"

                    print(f"✅ [RAG] Found {len(docs)} contexts.")
                else:
                    print("⚠️ [RAG] No results found.")
            except Exception as e:
                print(f"❌ [RAG Search Error] {e}")

        return context, source_info

    def _build_prompts(self, message: str, context: str) -> Tuple[str, str]:
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

        return system_prompt, user_prompt

    async def get_chat_response(self, message: str):
        """
        RAG 기반 AI 답변 생성 (Vector DB + OpenAI)
        """
        fast_response = self._fast_path_response(message)
        if fast_response:
            return fast_response

        context, source_info = self._retrieve_context(message)

        if not settings.OPENAI_API_KEY:
            return "⚠️ OpenAI API Key가 설정되지 않았습니다. .env 파일을 확인해주세요."

        system_prompt, user_prompt = self._build_prompts(message, context)

        try:
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

            answer = self._content_to_text(response.choices[0].message.content)

            if source_info:
                answer += "\n\n📚 **참고 문헌:**\n" + "\n".join(source_info)

            return answer

        except Exception as e:
            print(f"LLM Error: {e}")
            return "죄송합니다. 답변 생성 중 오류가 발생했습니다. (OpenAI API 연결 실패)"

    def stream_chat_response(self, message: str) -> Generator[str, None, None]:
        fast_response = self._fast_path_response(message)
        if fast_response:
            yield fast_response
            return

        context, source_info = self._retrieve_context(message)

        if not settings.OPENAI_API_KEY:
            yield "⚠️ OpenAI API Key가 설정되지 않았습니다. .env 파일을 확인해주세요."
            return

        system_prompt, user_prompt = self._build_prompts(message, context)

        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            stream = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=600,
                stream=True
            )

            for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if not delta:
                    continue
                content = self._content_to_text(getattr(delta, "content", None))
                if content:
                    yield content

            if source_info:
                yield "\n\n📚 **참고 문헌:**\n" + "\n".join(source_info)

        except Exception as e:
            print(f"LLM Stream Error: {e}")
            yield "죄송합니다. 답변 생성 중 오류가 발생했습니다. (OpenAI API 연결 실패)"

    async def text_to_sql(self, question: str, db_schema: str = None):
        """
        자연어를 SQL 쿼리로 변환 (Mock)
        """
        return f"SELECT * FROM documents WHERE content LIKE '%{question}%' LIMIT 5;"

ai_service = AIService()
