import type { Competitor, MarketInfo, MarketType, CompanyConfig } from '../types';

export const MOCK_COMPANIES: CompanyConfig[] = [
    {
        id: 1,
        name: "현대건설",
        dartCode: "00126380",
        baseEmissions: 250684,
        investCapex: 762100000000, // 7,621억
        targetSavings: 12.5,
        s1: 75000, s2: 45000, s3: 130684, allowance: 100000, revenue: 5000, production: 1000000
    },
    {
        id: 2,
        name: "삼성물산",
        dartCode: "000830",
        baseEmissions: 180000,
        investCapex: 500000000000, // 5,000억
        targetSavings: 15.0,
        s1: 50000, s2: 40000, s3: 90000, allowance: 80000, revenue: 4200, production: 800000
    }
];

export const MARKET_DATA: Record<MarketType, MarketInfo> = {
    'K-ETS': { id: 'K-ETS', name: '한국', ticker: 'KAU25', price: 15450, currency: 'KRW', change: 1.2, color: '#10b77f', desc: 'KAU25 할당배출권', high: 16500, low: 13800, volatility: 'Low' },
    'EU-ETS': { id: 'EU-ETS', name: '유럽 통합', ticker: 'EUA', price: 74.50, currency: 'EUR', change: -0.5, color: '#a5d8ff', desc: '글로벌 벤치마크', high: 76.20, low: 72.80, volatility: 'High' },
};

export const competitors: Competitor[] = [
    { id: 1, name: "우리 기업", s1: 75000, s2: 45000, s3: 120000, allowance: 100000, revenue: 5000, production: 1000000, trustScore: 95, trajectory: [{ year: '22', v: 145000 }, { year: '23', v: 130000 }, { year: '24', v: 125000 }, { year: '25', v: 120000 }] },
    { id: 2, name: "A사 (Top)", s1: 45000, s2: 40000, s3: 85000, allowance: 95000, revenue: 4800, production: 1200000, trustScore: 88, trajectory: [{ year: '22', v: 110000 }, { year: '23', v: 100000 }, { year: '24', v: 95000 }, { year: '25', v: 85000 }] },
    { id: 3, name: "B사 (Peer)", s1: 95000, s2: 65000, s3: 150000, allowance: 110000, revenue: 5200, production: 900000, trustScore: 62, trajectory: [{ year: '22', v: 165000 }, { year: '23', v: 164000 }, { year: '24', v: 163000 }, { year: '25', v: 160000 }] },
    { id: 4, name: "C사 (Peer)", s1: 55000, s2: 42000, s3: 98000, allowance: 105000, revenue: 5100, production: 1100000, trustScore: 82, trajectory: [{ year: '22', v: 105000 }, { year: '23', v: 102000 }, { year: '24', v: 100000 }, { year: '25', v: 97000 }] }
];

export const industryBenchmarks = { revenue: { top10: 15.2, median: 22.5 }, production: { top10: 65.0, median: 92.4 } };
