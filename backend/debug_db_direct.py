import os
import sys
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load .env explicitly
load_dotenv(dotenv_path="../.env")

DB_USER = os.getenv("DB_USER", "aiot101")
DB_PASSWORD = os.getenv("DB_PASSWORD", "nOv@3212")
DB_HOST = os.getenv("DB_HOST", "118.36.173.89")
DB_PORT = os.getenv("DB_PORT", "19306")
DB_NAME = os.getenv("DB_NAME", "esg")

# URL Encode password to handle special chars like '@'
ENCODED_PASSWORD = quote_plus(DB_PASSWORD)

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{ENCODED_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Connecting to: {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        print("✅ Connection successful!")
        
        # Check tables
        result = connection.execute(text("SHOW TABLES;"))
        tables = [row[0] for row in result]
        print(f"Tables: {tables}")
        
        if 'dashboard_emissions' in tables:
            # Check content count
            count = connection.execute(text("SELECT COUNT(*) FROM dashboard_emissions;")).scalar()
            print(f"📊 Total rows in 'dashboard_emissions': {count}")
            
            # Check year distribution
            years = connection.execute(text("SELECT year, COUNT(*) FROM dashboard_emissions GROUP BY year;")).fetchall()
            print("📅 Rows by Year:")
            for y in years:
                print(f"Year {y[0]}: {y[1]} rows")
            
            # Check schema
            columns = connection.execute(text("DESCRIBE dashboard_emissions;")).fetchall()
            print("📝 Table Schema:")
            for col in columns:
                print(f"{col[0]} ({col[1]})")

        else:
            print("❌ Table 'dashboard_emissions' NOT found!")
            
except Exception as e:
    print(f"❌ Connection failed: {e}")
