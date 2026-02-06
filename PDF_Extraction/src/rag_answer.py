"""
RAG 답변 생성기 (Qwen2-VL 최적화 적용)
기능: 벡터 DB 검색 -> 페이지 이미지 로드 -> Qwen2-VL 모델 답변 생성
"""

import argparse
import sys
import os
import time
from pathlib import Path
from typing import List, Dict, Optional

from dotenv import load_dotenv
import torch
from transformers import AutoProcessor, Qwen2VLForConditionalGeneration
from PIL import Image
from qwen_vl_utils import process_vision_info

# 환경 변수 로드
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

# 검색 모듈 경로 추가
sys.path.append(str(Path(__file__).parent))
try:
    from search_vector_db import search_vector_db, release_gpu
except ImportError:
    from search_vector_db import search_vector_db
    def release_gpu(): pass

DEFAULT_IMAGE_MAX_LONG_SIDE = 1024

def resize_image_if_needed(img: Image.Image, max_long_side: int) -> Image.Image:
    """이미지 장변 크기 조절 (LANCZOS)"""
    w, h = img.size
    if max_long_side <= 0 or max(w, h) <= max_long_side:
        return img
    scale = max_long_side / max(w, h)
    return img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

def get_page_image_path(metadata: Dict, page_no: Optional[int]) -> Optional[Path]:
    """메타데이터 기반 페이지 이미지 경로 추론"""
    if page_no is None:
        return None

    base_dir = Path("data/pages_structured")
    if not base_dir.exists():
        return None

    company = metadata.get('company_name') or metadata.get('company') or ''
    report_year = metadata.get('report_year') or metadata.get('year') or ''
    filename = metadata.get('filename') or ''
    
    # 후보 폴더명 생성
    direct_report_dir = metadata.get('report_dir') or metadata.get('doc_dir')
    candidate_dirs = []
    if direct_report_dir: candidate_dirs.append(str(direct_report_dir).strip())
    
    if filename:
        stem = Path(filename).stem
        candidate_dirs.extend([stem, stem.replace(" ", "_"), stem.replace("-", "_")])
    
    if company and report_year:
        combos = [f"{report_year}_{company}_Report", f"{company}_{report_year}_Report"]
        for c in combos:
            candidate_dirs.extend([c, c.replace(" ", "_")])

    # 후보 경로 탐색
    page_dir = f"page_{page_no:04d}"
    
    # 1. 후보 폴더 직접 확인
    for cand in candidate_dirs:
        path = base_dir / cand / page_dir / "page.png"
        if path.exists(): return path

    # 2. 회사/연도 포함 폴더 검색
    for folder in base_dir.iterdir():
        if folder.is_dir() and company.upper() in folder.name.upper() and str(report_year) in folder.name:
            path = folder / page_dir / "page.png"
            if path.exists(): return path

    return None

def main():
    parser = argparse.ArgumentParser(description="RAG 답변 생성 (Qwen2-VL)")
    parser.add_argument("query", type=str, help="질문 내용")
    parser.add_argument("--model", type=str, default="Qwen/Qwen2-VL-2B-Instruct", help="사용 모델 ID") 
    parser.add_argument("--top-k", type=int, default=3, help="참조할 페이지 수")
    parser.add_argument("--max-tokens", type=int, default=512, help="최대 생성 토큰 수")
    parser.add_argument("--image-max-size", type=int, default=DEFAULT_IMAGE_MAX_LONG_SIDE, help="이미지 최대 크기")
    parser.add_argument("--company", type=str, default=None, help="회사 필터")
    parser.add_argument("--year", type=int, default=None, help="연도 필터")
    
    args = parser.parse_args()
    
    # [1] 벡터 DB 검색
    print(f"🔎 검색: '{args.query}' (필터: {args.company or 'All'}, {args.year or 'All'})")
    t_start = time.time()
    results = search_vector_db(args.query, top_k=args.top_k, filter_company=args.company, filter_year=args.year)
    print(f"⏱️ 검색 소요: {time.time() - t_start:.4f}초")
    release_gpu()

    if not results:
        print("결과 없음.")
        return

    # [2] 페이지 데이터 구성 (이미지/텍스트 병합)
    t_load_s = time.time()
    unique_pages = {}
    
    for res in results:
        meta = res.get('metadata', {})
        page_no = meta.get('page_no')
        if page_no is None: continue
        
        # 고유 키 생성
        key = f"{meta.get('company_name')}_{meta.get('report_year')}_{page_no}"
        
        if key not in unique_pages:
            img_path = get_page_image_path(meta, page_no)
            unique_pages[key] = {
                "image_path": img_path,
                "texts": [],
                "info": f"{meta.get('company_name')} {meta.get('report_year')} (p.{page_no})"
            }
        if res.get('content'):
            unique_pages[key]["texts"].append(res['content'])
            
    print(f"⏱️ 데이터 로드: {time.time() - t_load_s:.4f}초")

    # [3] 모델 및 프로세서 로드
    print(f"📦 모델 로드: {args.model} (bfloat16)")
    t_model_s = time.time()
    try:
        import gc; gc.collect(); torch.cuda.empty_cache()
        
        model = Qwen2VLForConditionalGeneration.from_pretrained(
            args.model,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            trust_remote_code=True
        ).eval()
        
        processor = AutoProcessor.from_pretrained(
            args.model,
            min_pixels=256*28*28,
            max_pixels=1280*28*28,
            trust_remote_code=True
        )
    except Exception as e:
        print(f"❌ 모델 로드 실패: {e}")
        return
    print(f"⏱️ 모델 로딩: {time.time() - t_model_s:.2f}초")

    # [4] 프롬프트 구성
    system_msg = "You are an ESG analyst. Cite evidence explicitly. Use provided context only."
    user_content = []
    
    # Top-K 페이지만 참조
    for _, data in list(unique_pages.items())[:args.top_k]:
        if data["image_path"]:
            img = resize_image_if_needed(Image.open(data["image_path"]), args.image_max_size)
            user_content.append({"type": "image", "image": img})
            user_content.append({"type": "text", "text": f"\n[Image: {data['info']}]\n"})
        
        text_dump = "\n".join(data["texts"])
        user_content.append({"type": "text", "text": f"\n[Text: {data['info']}]\n{text_dump}\n"})

    user_content.append({"type": "text", "text": f"{system_msg}\n\nQuestion: {args.query}"})
    messages = [{"role": "user", "content": user_content}]

    # [5] 답변 생성
    print("🤖 답변 생성 중...")
    t_gen_s = time.time()
    
    text_prompt = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    image_inputs, video_inputs = process_vision_info(messages)
    
    inputs = processor(
        text=[text_prompt],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt"
    ).to(model.device)

    with torch.no_grad():
        output_ids = model.generate(**inputs, max_new_tokens=args.max_tokens, do_sample=False)
    
    # 입력 토큰 제외하고 디코딩
    generated_ids = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, output_ids)]
    answer = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

    t_gen_e = time.time()
    gen_time = t_gen_e - t_gen_s
    num_tokens = output_ids.shape[1] - inputs.input_ids.shape[1]

    print("\n" + "="*40)
    print("📝 답변:")
    print("="*40)
    print(answer)
    print("="*40)
    print(f"⏱️ 생성 시간: {gen_time:.2f}초 ({num_tokens} 토큰, {num_tokens/gen_time:.1f} t/s)")
    print(f"⏱️ 전체 소요: {t_gen_e - t_start:.2f}초")

if __name__ == "__main__":
    main()
