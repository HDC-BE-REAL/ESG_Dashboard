"""
LLM 모델 비교 평가 스크립트 (Hugging Face Transformers 버전)
Hugging Face 모델을 자동으로 테스트하고 결과를 비교합니다.

사용법:
    python evaluation/evaluate_models.py [--models MODEL1,MODEL2,...]
"""

import json
import time
import argparse
import os
import sys
import gc
import torch
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables from .env file
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Set HF_TOKEN for Hugging Face authentication
if os.getenv("HF_TOKEN"):
    os.environ["HUGGING_FACE_HUB_TOKEN"] = os.getenv("HF_TOKEN")
    print(f"✅ HF_TOKEN 로드됨")

import chromadb
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# Configuration
VECTOR_DB_DIR = str(Path(__file__).parent.parent / "PDF_Extraction" / "vector_db")
COLLECTION_NAME = "esg_documents"
EMBEDDING_MODEL_NAME = "BAAI/bge-m3"
TESTSET_PATH = Path(__file__).parent / "testset.json"
RESULTS_DIR = Path(__file__).parent / "results"

# Default models to test (Hugging Face model names)
DEFAULT_MODELS = [
    "google/gemma-3-4b-it",
    "Qwen/Qwen3-4B-Instruct-2507",
]

# Model configurations (for special cases)
MODEL_CONFIGS = {
    "google/gemma-3n-E2B-it-litert-lm": {"trust_remote_code": True},
    "google/gemma-3n-E4B-it-litert-lm": {"trust_remote_code": True},
    "google/gemma-3-4b-it": {"trust_remote_code": True},
    "Qwen/Qwen3-VL-8B-Instruct": {"trust_remote_code": True},
    "Qwen/Qwen3-4B-Instruct-2507": {"trust_remote_code": True},
}


def load_testset():
    """Load test questions from JSON file"""
    with open(TESTSET_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def search_vector_db(query: str, top_k: int = 3):
    """Search Vector DB for relevant documents"""
    client = chromadb.PersistentClient(path=VECTOR_DB_DIR)
    collection = client.get_collection(COLLECTION_NAME)
    
    # Use CPU for embedding to save GPU for LLM
    model = SentenceTransformer(EMBEDDING_MODEL_NAME, device='cpu')
    query_vec = model.encode([query]).tolist()
    
    results = collection.query(
        query_embeddings=query_vec,
        n_results=top_k
    )
    
    # Clean up embedding model
    del model
    gc.collect()
    
    return results


def load_model(model_name: str):
    """Load Hugging Face model and tokenizer"""
    print(f"   📥 모델 로딩 중: {model_name}")
    
    config = MODEL_CONFIGS.get(model_name, {})
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(
            model_name, 
            trust_remote_code=config.get("trust_remote_code", False)
        )
        
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=config.get("trust_remote_code", False),
            low_cpu_mem_usage=True,
        )
        
        return tokenizer, model
        
    except Exception as e:
        print(f"   ❌ 모델 로딩 실패: {e}")
        return None, None


def unload_model(model, tokenizer):
    """Unload model to free GPU memory"""
    del model
    del tokenizer
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


def generate_response(model, tokenizer, query: str, context: str) -> tuple[str, float]:
    """Generate response using Hugging Face model"""
    
    system_prompt = """당신은 ESG(환경, 사회, 거버넌스) 전문가 AI 어시스턴트입니다.
주어진 문서 내용을 바탕으로 사용자의 질문에 정확하고 친절하게 답변해주세요.
답변할 때 반드시 문서의 내용을 참고하고, 확실하지 않은 정보는 추측하지 마세요.
한국어로 답변해주세요."""

    user_prompt = f"""다음 ESG 보고서 문서들을 참고하여 질문에 답변해주세요.

=== 참고 문서 ===
{context}

=== 질문 ===
{query}

=== 답변 ==="""

    # Prepare messages for chat models
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    start_time = time.time()
    
    try:
        # Try chat template first
        if hasattr(tokenizer, 'apply_chat_template'):
            input_text = tokenizer.apply_chat_template(
                messages, 
                tokenize=False, 
                add_generation_prompt=True
            )
        else:
            input_text = f"{system_prompt}\n\n{user_prompt}"
        
        inputs = tokenizer(input_text, return_tensors="pt").to(model.device)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
            )
        
        # Decode only the new tokens
        response = tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:], 
            skip_special_tokens=True
        )
        
        elapsed_time = time.time() - start_time
        return response.strip(), elapsed_time
        
    except Exception as e:
        elapsed_time = time.time() - start_time
        return f"Error: {str(e)}", elapsed_time


def calculate_keyword_score(answer: str, expected_keywords: list) -> tuple[int, int, list]:
    """Calculate how many expected keywords are in the answer"""
    answer_lower = answer.lower()
    found = []
    
    for keyword in expected_keywords:
        if keyword.lower() in answer_lower:
            found.append(keyword)
    
    return len(found), len(expected_keywords), found


def evaluate_model(model_name: str, testset: dict, verbose: bool = True) -> dict:
    """Evaluate a single model on the testset"""
    results = {
        "model": model_name,
        "timestamp": datetime.now().isoformat(),
        "questions": [],
        "summary": {}
    }
    
    print(f"\n{'='*60}")
    print(f"🤖 모델 평가 중: {model_name}")
    print(f"{'='*60}")
    
    # Load model
    tokenizer, model = load_model(model_name)
    
    if model is None:
        print(f"❌ 모델 로딩 실패, 건너뜀")
        return None
    
    total_time = 0
    total_keyword_score = 0
    total_keywords = 0
    
    for q in testset["questions"]:
        print(f"\n📝 질문 {q['id']}: {q['question']}")
        
        # Search for context
        search_results = search_vector_db(q["question"])
        context_parts = []
        if search_results['documents'] and search_results['documents'][0]:
            for idx, doc in enumerate(search_results['documents'][0]):
                meta = search_results['metadatas'][0][idx]
                context_parts.append(f"[문서 {idx+1}] {meta.get('company_name', '')} {meta.get('report_year', '')}년:\n{doc[:500]}")
        context = "\n\n".join(context_parts)
        
        # Get model response
        answer, response_time = generate_response(model, tokenizer, q["question"], context)
        
        # Calculate keyword score
        found_count, total_count, found_keywords = calculate_keyword_score(
            answer, q["expected_keywords"]
        )
        
        # Store result
        q_result = {
            "id": q["id"],
            "question": q["question"],
            "category": q["category"],
            "answer": answer,
            "response_time": round(response_time, 2),
            "keyword_score": f"{found_count}/{total_count}",
            "found_keywords": found_keywords,
            "answer_length": len(answer)
        }
        results["questions"].append(q_result)
        
        total_time += response_time
        total_keyword_score += found_count
        total_keywords += total_count
        
        if verbose:
            print(f"   ⏱️ 응답 시간: {response_time:.2f}s")
            print(f"   🎯 키워드 점수: {found_count}/{total_count} ({found_keywords})")
            print(f"   📝 답변 길이: {len(answer)}자")
            print(f"   💬 답변 미리보기: {answer[:150]}...")
    
    # Unload model
    unload_model(model, tokenizer)
    
    # Calculate summary
    avg_time = total_time / len(testset["questions"])
    accuracy = (total_keyword_score / total_keywords) * 100 if total_keywords > 0 else 0
    
    results["summary"] = {
        "total_questions": len(testset["questions"]),
        "avg_response_time": round(avg_time, 2),
        "keyword_accuracy": round(accuracy, 1),
        "total_keywords_found": total_keyword_score,
        "total_keywords_expected": total_keywords
    }
    
    print(f"\n{'='*60}")
    print(f"📊 {model_name} 평가 요약")
    print(f"{'='*60}")
    print(f"   평균 응답 시간: {avg_time:.2f}s")
    print(f"   키워드 정확도: {accuracy:.1f}%")
    print(f"   키워드 점수: {total_keyword_score}/{total_keywords}")
    
    return results


def compare_models(all_results: list):
    """Print comparison table of all models"""
    print(f"\n{'='*70}")
    print(f"📊 모델 비교 결과")
    print(f"{'='*70}")
    
    # Header
    print(f"{'모델':40} | {'응답시간':10} | {'정확도':10} | {'등급':10}")
    print("-" * 80)
    
    # Sort by accuracy
    sorted_results = sorted(
        all_results, 
        key=lambda x: x["summary"]["keyword_accuracy"], 
        reverse=True
    )
    
    for r in sorted_results:
        model = r["model"]
        # Shorten model name for display
        short_name = model.split("/")[-1][:38]
        avg_time = r["summary"]["avg_response_time"]
        accuracy = r["summary"]["keyword_accuracy"]
        
        # Calculate grade
        if accuracy >= 80:
            grade = "⭐⭐⭐⭐⭐"
        elif accuracy >= 60:
            grade = "⭐⭐⭐⭐"
        elif accuracy >= 40:
            grade = "⭐⭐⭐"
        elif accuracy >= 20:
            grade = "⭐⭐"
        else:
            grade = "⭐"
        
        print(f"{short_name:40} | {avg_time:>8.2f}s | {accuracy:>8.1f}% | {grade}")
    
    print("-" * 80)
    
    # Recommend best model
    best = sorted_results[0]
    print(f"\n🏆 추천 모델: {best['model']} (정확도 {best['summary']['keyword_accuracy']}%)")


def save_results(all_results: list):
    """Save results to JSON file"""
    RESULTS_DIR.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = RESULTS_DIR / f"evaluation_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 결과 저장됨: {filename}")
    return filename


def main():
    parser = argparse.ArgumentParser(description="LLM 모델 평가 스크립트 (Hugging Face)")
    parser.add_argument(
        "--models", 
        type=str, 
        default=",".join(DEFAULT_MODELS),
        help="테스트할 모델 목록 (쉼표로 구분)"
    )
    parser.add_argument(
        "--verbose", 
        action="store_true", 
        default=True,
        help="상세 출력"
    )
    args = parser.parse_args()
    
    models = [m.strip() for m in args.models.split(",")]
    
    print(f"\n🚀 LLM 모델 평가 시작 (Hugging Face Transformers)")
    print(f"📋 테스트할 모델: {models}")
    print(f"🖥️ GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU only'}")
    if torch.cuda.is_available():
        print(f"💾 GPU 메모리: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    
    # Load testset
    testset = load_testset()
    print(f"📝 테스트 질문 수: {len(testset['questions'])}개")
    
    # Evaluate each model
    all_results = []
    for model in models:
        try:
            result = evaluate_model(model, testset, verbose=args.verbose)
            if result:
                all_results.append(result)
        except Exception as e:
            print(f"❌ {model} 평가 실패: {e}")
    
    # Compare and save
    if len(all_results) > 0:
        compare_models(all_results)
        save_results(all_results)
    
    print("\n✅ 평가 완료!")


if __name__ == "__main__":
    main()
