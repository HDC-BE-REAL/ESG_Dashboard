from fastapi import APIRouter, HTTPException, Form

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    """
    로그인 엔드포인트
    - admin/0000 계정은 유효성 검증 없이 통과
    - 다른 계정은 향후 구현 예정
    """
    # 관리자 계정 특별 처리
    if username == "admin" and password == "0000":
        return {
            "access_token": "admin_token_" + username,
            "token_type": "bearer"
        }
    
    # 일반 계정 (향후 구현)
    raise HTTPException(
        status_code=401,
        detail="이메일 또는 비밀번호가 올바르지 않습니다."
    )

@router.post("/signup")
async def signup():
    """회원가입 엔드포인트 (임시)"""
    return {"message": "회원가입 성공", "token": "dummy_token"}

@router.options("/login")
async def login_options():
    """CORS preflight를 위한 OPTIONS 핸들러"""
    return {"message": "확인"}

@router.options("/signup")
async def signup_options():
    """CORS preflight를 위한 OPTIONS 핸들러"""
    return {"message": "확인"}
