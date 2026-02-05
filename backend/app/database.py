from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 로컬 SQLite 데이터베이스 (필요 시 PostgreSQL 등으로 변경 가능)
SQLALCHEMY_DATABASE_URL = "sqlite:///./esg_data.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
