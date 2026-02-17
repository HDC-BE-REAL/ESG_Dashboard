"""
대시보드 전용 테이블 초기화 스크립트
기존 PDF 추출 테이블과 별도로 대시보드 조회용 통합 테이블 생성
"""

from sqlalchemy import text
from database import engine, SessionLocal, Base
from models import DashboardEmission, IndustryBenchmark, PDFExtractionLog, User


def create_tables():
    """대시보드 전용 테이블 생성"""
    print("Creating dashboard tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")
    print("   - dashboard_emissions (대시보드 조회용 통합 테이블)")
    print("   - industry_benchmarks (업계 벤치마크)")
    print("   - pdf_extraction_logs (추출 이력)")
    print("   - users (애플리케이션 계정)")


def drop_tables():
    """대시보드 테이블 삭제 (주의: 데이터 손실)"""
    print("Dropping dashboard tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Tables dropped!")


def check_connection():
    """DB 연결 확인"""
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1")).fetchone()
        print("✅ Database connection successful!")

        # 현재 테이블 확인
        tables = db.execute(text("SHOW TABLES")).fetchall()
        if tables:
            print(f"\n📋 Existing tables ({len(tables)}):")
            for table in tables:
                print(f"   - {table[0]}")
        else:
            print("\n📋 No tables found. Run 'python init_db.py create' to create tables.")

        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("   Please check your .env file and MySQL connection.")
        return False


def show_data():
    """저장된 데이터 확인"""
    db = SessionLocal()
    try:
        emissions = db.query(DashboardEmission).order_by(
            DashboardEmission.company_name,
            DashboardEmission.year
        ).all()

        print(f"\n📊 Dashboard Emissions ({len(emissions)} records):\n")

        current_company = None
        for e in emissions:
            if e.company_name != current_company:
                current_company = e.company_name
                print(f"\n[{e.company_name}]")

            print(f"  {e.year}: S1={e.scope1:,.0f} S2={e.scope2:,.0f} S3={e.scope3:,.0f} "
                  f"Allowance={e.allowance:,.0f} Revenue={e.revenue/1000000000000:.1f}조")

        benchmarks = db.query(IndustryBenchmark).all()
        if benchmarks:
            print(f"\n📈 Industry Benchmarks ({len(benchmarks)} records):")
            for b in benchmarks:
                print(f"  [{b.industry}] {b.year}")
                print(f"    Revenue Intensity - Top10: {b.intensity_revenue_top10}, Median: {b.intensity_revenue_median}")
                print(f"    Production Intensity - Top10: {b.intensity_production_top10}, Median: {b.intensity_production_median}")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("""
╔═══════════════════════════════════════════════════════════════╗
║             ESG Dashboard DB Manager (Dashboard Only)         ║
╚═══════════════════════════════════════════════════════════════╝

대시보드 조회 전용 테이블 관리 스크립트
(기존 PDF 추출 테이블은 별도로 관리됩니다)

Usage: python init_db.py [command]

Commands:
  check  - Check database connection and show existing tables
  create - Create dashboard tables
  drop   - Drop dashboard tables (WARNING: data loss)
  show   - Show current dashboard data

Example:
  python init_db.py check
  python init_db.py reset
        """)
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "check":
        check_connection()
    elif command == "create":
        create_tables()
    elif command == "create_admin":
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
        
        db = SessionLocal()
        try:
            # Check if admin exists
            admin = db.query(User).filter(User.email == "admin").first()
            if not admin:
                print("Creating admin user (admin/0000)...")
                hashed_password = pwd_context.hash("0000")
                new_admin = User(
                    email="admin",
                    hashed_password=hashed_password,
                    company_name="ESG Admin",
                    nickname="Administrator",
                    classification="admin"
                )
                db.add(new_admin)
                db.commit()
                print("[OK] Admin user created successfully!")
            else:
                print("[INFO] Admin user already exists.")
                # Optional: Update password if needed
                # admin.hashed_password = pwd_context.hash("0000")
                # db.commit()
                # print("[OK] Admin password reset to 0000.")
        except Exception as e:
            print(f"[ERROR] Error creating admin: {e}")
        finally:
            db.close()
    elif command == "drop":
        confirm = input("⚠️  This will delete dashboard data. Type 'yes' to confirm: ")
        if confirm.lower() == "yes":
            drop_tables()
        else:
            print("❌ Cancelled.")
    elif command == "show":
        show_data()
    else:
        print(f"❌ Unknown command: {command}")
        sys.exit(1)
