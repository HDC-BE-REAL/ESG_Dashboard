"""Pydantic schemas for user authentication."""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_name: str = Field(..., min_length=2)
    nickname: str | None = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    company_name: str
    nickname: str
    classification: str | None = None
    bio: str | None = None
    profile_image_url: str | None = None
    role: str = "user"
    is_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileUpdateRequest(BaseModel):
    nickname: str | None = None
    company_name: str | None = None
    classification: str | None = None
    bio: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)


class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    current_password: str = Field(..., min_length=8)


class AccountDeleteRequest(BaseModel):
    current_password: str = Field(..., min_length=8)


class MessageResponse(BaseModel):
    detail: str
