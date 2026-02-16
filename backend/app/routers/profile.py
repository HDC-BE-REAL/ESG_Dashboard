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
        raise HTTPException(status_code=400, detail="?꾩옱 鍮꾨?踰덊샇媛 ?щ컮瑜댁? ?딆뒿?덈떎.")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="??鍮꾨?踰덊샇媛 湲곗〈 鍮꾨?踰덊샇? ?숈씪?⑸땲??")

    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    return MessageResponse(detail="鍮꾨?踰덊샇媛 蹂寃쎈릺?덉뒿?덈떎.")


@router.post("/me/email", response_model=UserResponse)
def change_email(
    payload: EmailChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="?꾩옱 鍮꾨?踰덊샇媛 ?щ컮瑜댁? ?딆뒿?덈떎.")

    new_email = payload.new_email.lower().strip()
    if new_email == current_user.email:
        raise HTTPException(status_code=400, detail="???대찓?쇱씠 湲곗〈 ?대찓?쇨낵 媛숈뒿?덈떎.")

    existing = db.query(User).filter(User.email == new_email).first()
    if existing:
        raise HTTPException(status_code=409, detail="?대? ?ъ슜 以묒씤 ?대찓?쇱엯?덈떎.")

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
        raise HTTPException(status_code=400, detail="?꾩옱 鍮꾨?踰덊샇媛 ?щ컮瑜댁? ?딆뒿?덈떎.")

    db.delete(current_user)
    db.commit()
    return MessageResponse(detail="怨꾩젙???곴뎄?곸쑝濡???젣?섏뿀?듬땲??")


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="?대?吏 ?뚯씪留??낅줈?쒗븷 ???덉뒿?덈떎.")

    extension = Path(file.filename or "avatar").suffix or ".png"
    avatar_path = UPLOAD_DIR / f"user_{current_user.id}{extension}"

    with avatar_path.open("wb") as buffer:
        buffer.write(await file.read())

    current_user.profile_image_url = f"/static/profile/{avatar_path.name}"
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
