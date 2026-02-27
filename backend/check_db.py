import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "esg")

from urllib.parse import quote_plus
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
from app.models import DashboardEmission

samsung_data = db.query(DashboardEmission).filter(DashboardEmission.company_name.like('%삼성전자%')).order_by(DashboardEmission.year).all()

for row in samsung_data:
    print(f"Company: {row.company_name} | Year: {row.year}, S1: {row.scope1}, S2: {row.scope2}, S3: {row.scope3}, S1 Dom: {getattr(row, 's1_domestic', 'N/A')}")
