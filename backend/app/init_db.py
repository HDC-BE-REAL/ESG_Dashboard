"""
대시보드 전용 테이블 초기화 스크립트
기존 PDF 추출 테이블과 별도로 대시보드 조회용 통합 테이블 생성
"""

from sqlalchemy import text
from database import engine, SessionLocal, Base
from models import DashboardEmission, IndustryBenchmark, PDFExtractionLog


def create_tables():
    """대시보드 전용 테이블 생성"""
    print("Creating dashboard tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")
    print("   - dashboard_emissions (대시보드 조회용 통합 테이블)")
    print("   - industry_benchmarks (업계 벤치마크)")
    print("   - pdf_extraction_logs (추출 이력)")


def drop_tables():
    """대시보드 테이블 삭제 (주의: 데이터 손실)"""
    print("Dropping dashboard tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Tables dropped!")


def insert_sample_data():
    """샘플 데이터 삽입"""
    db = SessionLocal()

    try:
        # 1. 현대건설 연도별 데이터
        print("Inserting sample data for 현대건설...")
        hyundai_data = [
            DashboardEmission(
                company_id=1, company_name="현대건설", year=2021,
                scope1=80000, scope2=65000, scope3=140000,
                allowance=105000,
                revenue=15000000000000,
                carbon_intensity=(80000+65000)/(15000000000000/100000000),  # (S1+S2)/매출1억
                energy_intensity=0.85,  # 샘플값
                base_year=2021, base_emissions=250684,
                is_verified=True
            ),
            DashboardEmission(
                company_id=1, company_name="현대건설", year=2022,
                scope1=80000, scope2=65000, scope3=145000,
                allowance=103000,
                revenue=15500000000000, carbon_intensity=0, energy_intensity=0, # production=970000,
                is_verified=True
            ),
            DashboardEmission(
                company_id=1, company_name="현대건설", year=2023,
                scope1=78000, scope2=52000, scope3=135000,
                allowance=102000,
                revenue=16200000000000, carbon_intensity=0, energy_intensity=0, # production=990000,
                is_verified=True
            ),
            DashboardEmission(
                company_id=1, company_name="현대건설", year=2024,
                scope1=76000, scope2=49000, scope3=132000,
                allowance=101000,
                revenue=16730100000000, carbon_intensity=0, energy_intensity=0, # production=1000000,
                is_verified=True
            ),
            DashboardEmission(
                company_id=1, company_name="현대건설", year=2025,
                scope1=75000, scope2=45000, scope3=130684,
                allowance=100000,
                revenue=17500000000000,
                carbon_intensity=(75000+45000)/(17500000000000/100000000),
                energy_intensity=0.82,
                target_reduction_pct=12.5,
                base_year=2021, base_emissions=250684,
                is_verified=False
            ),
        ]
        db.add_all(hyundai_data)

        # 2. 삼성물산 데이터
        print("Inserting sample data for 삼성물산...")
        samsung_data = [
            DashboardEmission(
                company_id=2, company_name="삼성물산", year=2025,
                scope1=50000, scope2=40000, scope3=90000,
                allowance=80000,
                revenue=14000000000000,
                carbon_intensity=(50000+40000)/(14000000000000/100000000),
                energy_intensity=0.75,
                target_reduction_pct=15.0,
            ),
        ]
        db.add_all(samsung_data)

        # 3. 경쟁사 데이터
        print("Inserting sample data for 경쟁사...")
        competitors_data = [
            # A사 (Top)
            DashboardEmission(
                company_id=3, company_name="A사 (Top)", year=2025,
                scope1=45000, scope2=40000, scope3=85000,
                allowance=95000,
                revenue=16000000000000,
                carbon_intensity=(45000+40000)/(16000000000000/100000000),
                energy_intensity=0.65,
            ),
            # B사 (Peer)
            DashboardEmission(
                company_id=4, company_name="B사 (Peer)", year=2025,
                scope1=95000, scope2=65000, scope3=150000,
                allowance=110000,
                revenue=17300000000000,
                carbon_intensity=(95000+65000)/(17300000000000/100000000),
                energy_intensity=0.95,
            ),
            # C사 (Peer)
            DashboardEmission(
                company_id=5, company_name="C사 (Peer)", year=2025,
                scope1=55000, scope2=42000, scope3=98000,
                allowance=105000,
                revenue=17000000000000,
                carbon_intensity=(55000+42000)/(17000000000000/100000000),
                energy_intensity=0.78,
            ),
        ]
        db.add_all(competitors_data)

        # 4. 업계 벤치마크
        print("Inserting industry benchmarks...")
        benchmarks = [
            IndustryBenchmark(
                industry="건설업",
                year=2025,
                intensity_revenue_top10=15.2,
                intensity_revenue_median=22.5,
                intensity_revenue_avg=25.0,
                intensity_production_top10=65.0,
                intensity_production_median=92.4,
                intensity_production_avg=100.0
            ),
        ]
        db.add_all(benchmarks)

        db.commit()
        print("\n✅ Sample data inserted successfully!")
        print(f"   - {len(hyundai_data)} 현대건설 연도별 데이터")
        print(f"   - {len(samsung_data)} 삼성물산 데이터")
        print(f"   - {len(competitors_data)} 경쟁사 데이터")
        print(f"   - {len(benchmarks)} 벤치마크 데이터")

    except Exception as e:
        db.rollback()
        print(f"❌ Error inserting sample data: {e}")
        raise
    finally:
        db.close()


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
  seed   - Insert sample data
  reset  - Drop + Create + Seed (WARNING: data loss)
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
    elif command == "drop":
        confirm = input("⚠️  This will delete dashboard data. Type 'yes' to confirm: ")
        if confirm.lower() == "yes":
            drop_tables()
        else:
            print("❌ Cancelled.")
    elif command == "seed":
        insert_sample_data()
    elif command == "reset":
        confirm = input("⚠️  This will delete all dashboard data and recreate tables. Type 'yes' to confirm: ")
        if confirm.lower() == "yes":
            drop_tables()
            create_tables()
            insert_sample_data()
        else:
            print("❌ Cancelled.")
    elif command == "show":
        show_data()
    else:
        print(f"❌ Unknown command: {command}")
        sys.exit(1)
