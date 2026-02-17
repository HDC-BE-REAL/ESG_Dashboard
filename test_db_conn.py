
import os
import sqlalchemy
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "esg")

print(f"Connecting to {DB_HOST}:{DB_PORT} as {DB_USER}...")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'connect_timeout': 5})

try:
    with engine.connect() as conn:
        print("--- dashboard_emissions rows ---")
        rows = conn.execute(text("SELECT id, company_name, year, scope1, scope2, base_emissions FROM dashboard_emissions")).fetchall()
        for row in rows:
            print(row)
        print(f"Total: {len(rows)} rows.")
except Exception as e:
    print(f"Failed to connect: {e}")
