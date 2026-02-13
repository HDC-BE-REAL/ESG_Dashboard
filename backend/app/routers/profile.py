"""Profile management endpoints."""
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserResponse, ProfileUpdateRequest
from .auth import get_current_user

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
