from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    KRX_API_KEY: str
    ALPHA_VANTAGE_API_KEY: str
    OIL_PRICE_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
