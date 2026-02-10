import type { MarketInfo, MarketType, CompanyConfig } from '../types';

// API 연결 실패 시 폴백용 Mock 회사 데이터
export const MOCK_COMPANIES: CompanyConfig[] = [
    {
        id: 1,
        name: "현대건설",
        dartCode: "00126380",
        vectorCompanyName: "HDEC",
        latestReportYear: 2025,
        baseEmissions: 250684,
        investCapex: 762100000000, // 7,621억
        targetSavings: 12.5,
        s1: 75000, s2: 45000, s3: 130684, revenue: 5000, production: 1000000,
        carbon_intensity_scope1: 15.0, carbon_intensity_scope2: 9.0, carbon_intensity_scope3: 26.1, energy_intensity: 4.5
    },
    {
        id: 2,
        name: "삼성물산",
        dartCode: "000830",
        vectorCompanyName: "Samsung C&T",
        latestReportYear: 2023,
        baseEmissions: 180000,
        investCapex: 500000000000, // 5,000억
        targetSavings: 15.0,
        s1: 50000, s2: 40000, s3: 90000, revenue: 4200, production: 800000,
        carbon_intensity_scope1: 11.9, carbon_intensity_scope2: 9.5, carbon_intensity_scope3: 21.4, energy_intensity: 5.2
    }
];

// 탄소 시장 데이터 (실시간 API로 대체 가능)
export const MARKET_DATA: Record<MarketType, MarketInfo> = {
    'K-ETS': { id: 'K-ETS', name: '한국', ticker: 'KAU25', price: 15450, currency: 'KRW', change: 1.2, color: '#10b77f', desc: 'KAU25 할당배출권', high: 16500, low: 13800, volatility: 'Low' },
    'EU-ETS': { id: 'EU-ETS', name: '유럽 통합', ticker: 'EUA', price: 74.50, currency: 'EUR', change: -0.5, color: '#a5d8ff', desc: '글로벌 벤치마크', high: 76.20, low: 72.80, volatility: 'High' },
};

// [삭제됨] competitors - DB의 companies 데이터 사용
// [삭제됨] industryBenchmarks - DB의 industry_benchmarks 테이블 사용
