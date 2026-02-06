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

    model_config = SettingsConfigDict(env_file=_locate_env_file(), extra="ignore")

settings = Settings()
