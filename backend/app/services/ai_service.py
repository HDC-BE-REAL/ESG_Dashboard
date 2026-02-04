import random
from datetime import datetime, timedelta

class AIService:
    def __init__(self):
        pass

    async def generate_strategy(self, company_id: int, market: str, current_price: float):
        """
        탄소 배출권 매수 전략 생성
        """
        # Logic to generate a mock but structured strategy
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
            # Simulate forecast price around current price
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
        ESG 및 탄소 배출권 관련 질의응답
        """
        # Simple rule-based response for now, can be integrated with LLM later
        if "Scope 3" in message or "스코프 3" in message:
            return "Scope 3는 기업의 가치 사슬 전체에서 발생하는 간접 배출량을 의미합니다. 공급망 관리와 제품 사용 단계의 배출량이 포함되어 관리가 매우 까다롭지만, Net Zero 달성을 위해 가장 핵심적인 부분입니다."
        elif "K-ETS" in message:
            return "K-ETS(한국 배출권거래제)는 한국 내 온실가스 감축을 위해 도입된 제도로, 현재 제3차 계획기간(2021~2025)이 진행 중입니다. 최근 가격 변동성이 커지고 있어 정교한 매수 전략이 필요합니다."
        elif "전략" in message or "추천" in message:
            return "시뮬레이터 탭에서 'AI 전략 생성' 버튼을 클릭하시면 시장 동향을 분석하여 최적의 분할 매수 플랜을 짜드립니다."
        
        return "죄송합니다. 아직 학습 중인 내용입니다. ESG 탄소세, 배출권 매수 전략, 또는 Scope 배출량에 대해 물어봐 주세요!"

    async def text_to_sql(self, question: str, db_schema: str = None):
        """
        자연어를 SQL 쿼리로 변환 (distil-qwen3-4b-text2sql 모델 활용 가능성)
        """
        if db_schema is None:
            db_schema = """
                CREATE TABLE documents (
                    id INTEGER PRIMARY KEY,
                    title TEXT,
                    content TEXT,
                    esg_score REAL,
                    created_at DATETIME
                );
            """

        # 실제 모델 로드 로직 (GPU 및 라이브러리 필요)
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer
            
            # 모델 ID (ESG APIKEY 정보.txt 설정 준수)
            model_id = "distil-labs/distil-qwen3-4b-text2sql"
            
            # 실제 실행 시에는 아래 주석을 해제하여 사용
            # tokenizer = AutoTokenizer.from_pretrained(model_id)
            # model = AutoModelForCausalLM.from_pretrained(model_id, device_map="auto", torch_dtype=torch.float16)
            # prompt = f"### Schema:\n{schema}\n\n### Question:\n{question}\n\n### SQL:\n"
            # inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
            # outputs = model.generate(**inputs, max_new_tokens=100)
            # return tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            return f"SELECT id, title, esg_score FROM documents WHERE content LIKE '%{question}%' ORDER BY esg_score DESC;"
        except ImportError:
            # 라이브러리 미설치 시 기본 룰 기반 쿼리 생성 (데모용)
            return f"SELECT * FROM documents WHERE content LIKE '%{question}%' LIMIT 10;"
        except Exception as e:
            return f"-- Error generating SQL: {str(e)}"

ai_service = AIService()
