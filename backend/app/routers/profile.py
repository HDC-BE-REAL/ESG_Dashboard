"""Profile management endpoints."""
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import (
    UserResponse,
    ProfileUpdateRequest,
    PasswordChangeRequest,
    EmailChangeRequest,
    AccountDeleteRequest,
    MessageResponse,
)
from .auth import get_current_user, hash_password, verify_password

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "static" / "profile"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/profile", tags=["profile"])


def update_user_fields(user: User, payload: ProfileUpdateRequest):
    if payload.nickname is not None:
        user.nickname = payload.nickname.strip()
    if payload.company_name is not None:
        user.company_name = payload.company_name.strip()
    if payload.classification is not None:
        user.classification = payload.classification
    if payload.bio is not None:
        user.bio = payload.bio.strip()


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_user_fields(current_user, payload)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/password", response_model=MessageResponse)
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="새 비밀번호가 기존 비밀번호와 동일합니다.")

    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    return MessageResponse(detail="비밀번호가 변경되었습니다.")


@router.post("/me/email", response_model=UserResponse)
def change_email(
    payload: EmailChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")

    new_email = payload.new_email.lower().strip()
    if new_email == current_user.email:
        raise HTTPException(status_code=400, detail="새 이메일이 기존 이메일과 같습니다.")

    existing = db.query(User).filter(User.email == new_email).first()
    if existing:
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")

    current_user.email = new_email
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/delete", response_model=MessageResponse)
def delete_account(
    payload: AccountDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")

    db.delete(current_user)
    db.commit()
    return MessageResponse(detail="계정이 영구적으로 삭제되었습니다.")


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드할 수 있습니다.")

    extension = Path(file.filename or "avatar").suffix or ".png"
    avatar_path = UPLOAD_DIR / f"user_{current_user.id}{extension}"

    with avatar_path.open("wb") as buffer:
        buffer.write(await file.read())

    current_user.profile_image_url = f"/static/profile/{avatar_path.name}"
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
