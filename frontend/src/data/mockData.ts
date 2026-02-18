import type { Competitor, MarketInfo, MarketType, CompanyConfig, ReductionOption, ProcurementMix } from '../types';

// ── K-ETS Price Scenarios (원/tCO₂e) ──
export const ETS_PRICE_SCENARIOS = {
    low: { label: '보수적 (Low)', price: 10000, color: '#10b981' },
    base: { label: '기준 (Base)', price: 15000, color: '#f59e0b' },
    high: { label: '스트레스 (High)', price: 25000, color: '#ef4444' },
} as const;

// ── Allocation Change Scenarios ──
export const ALLOCATION_SCENARIOS = {
    maintain: { label: '현행 유지', factor: 1.0, description: '현재 무상할당 수준 유지' },
    decrease10: { label: '할당량 10% 축소', factor: 0.9, description: '유상할당 비중 확대 대비' },
    decrease30: { label: '할당량 30% 축소', factor: 0.7, description: '강력한 탄소 규제 시나리오' },
    zero: { label: '무상할당 폐지 (0%)', factor: 0.0, description: '전량 경매/매수 전환' },
} as const;

// ── Default Reduction Options (MAC 현실화) ──
export const DEFAULT_REDUCTION_OPTIONS: ReductionOption[] = [
    { id: 'energy', name: '에너지 효율 개선', annualReduction: 5000, cost: 0.4, mac: 8000, leadTime: 6, enabled: false, thisYearApplicable: true },
    { id: 'process', name: '공정 개선', annualReduction: 2000, cost: 0.24, mac: 12000, leadTime: 9, enabled: false, thisYearApplicable: true },
    { id: 'fuel', name: '연료 전환', annualReduction: 3000, cost: 0.66, mac: 22000, leadTime: 12, enabled: false, thisYearApplicable: true },
    { id: 'renewable', name: '재생전력 도입', annualReduction: 8000, cost: 2.8, mac: 35000, leadTime: 18, enabled: false, thisYearApplicable: false },
];

// ── Default Procurement Mix ──
export const DEFAULT_PROCUREMENT_MIX: ProcurementMix = {
    freeAllocation: 83,
    auction: 10,
    market: 7,
};

// ── Auction Configuration ──
export const AUCTION_CONFIG = {
    discountRate: 0.85,             // [데모용 하드코딩] 시장가의 85%
    latestAuctionSavingsRate: 2.3,  // [신규] 최신 시장 평균 할인율 (시장가 대비 절감률)
    maxPct: 30,                     // 최대 경매 비중 %
};

// ── Procurement Method Tooltips ──
export const PROCUREMENT_TOOLTIPS: Record<string, string> = {
    freeAllocation: '정부 무상할당: 업종별 배출 기준에 따라 무상으로 배분받는 배출권 (비용 0원)',
    auction: '정부 경매: 환경부 주관 배출권 유상 경매 (시장가 대비 약 85% 수준)',
    market: 'KRX 장내거래: 한국거래소 배출권 시장에서 시장가로 매수',
};

// ── Risk Trigger Defaults ──
export const RISK_TRIGGER_DEFAULTS = {
    priceThreshold: 20000,       // 원/tCO₂e
    volumeThreshold: 10,         // % 증가율
    financialThreshold: 2,       // % (탄소비용/영업이익)
};

// API 연결 실패 시 폴백용 Mock 회사 데이터
export const MOCK_COMPANIES: CompanyConfig[] = [
    {
        id: 1,
        name: "현대건설",
        dartCode: "00126380",
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
