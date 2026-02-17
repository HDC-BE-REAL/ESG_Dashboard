from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


def _locate_env_file() -> Optional[str]:
    """Search upwards from backend/app for a .env file and return its path."""
    current = Path(__file__).resolve().parent
    for path in (current,) + tuple(current.parents):
        env_path = path / ".env"
        if env_path.exists():
            return str(env_path)
    return None

class Settings(BaseSettings):
    KRX_API_KEY: Optional[str] = None
    ALPHA_VANTAGE_API_KEY: Optional[str] = None
    OIL_PRICE_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    HF_TOKEN: Optional[str] = None
    VECTOR_DB_PATH: Optional[str] = None
    CHROMA_HOST: Optional[str] = None
    CHROMA_PORT: Optional[int] = None
    JWT_SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # API 호출 제한을 피하기 위한 Mock 데이터 모드 설정
    USE_MOCK_DATA: bool = True  # 실제 API는 정상 작동 확인 완료

    model_config = SettingsConfigDict(env_file=_locate_env_file(), extra="ignore")

settings = Settings()
