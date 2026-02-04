export type TabType = 'dashboard' | 'compare' | 'simulator' | 'target' | 'investment';
export type MarketType = 'K-ETS' | 'EU-ETS';
export type IntensityType = 'revenue' | 'production';
export type TimeRangeType = '1개월' | '3개월' | '1년' | '전체';

export interface TrajectoryData {
    year: string;
    v: number;
}

export interface CompanyConfig {
    id: number;
    name: string;
    dartCode: string;
    baseEmissions: number; // 기준 배출량
    investCapex: number;   // 녹색 투자액
    targetSavings: number; // 목표 절감률
    // Extra data for simulation/dashboard
    s1: number;
    s2: number;
    s3: number;
    allowance: number;
    revenue: number;
    production: number;
}

export interface Competitor {
    id: number;
    name: string;
    s1: number;
    s2: number;
    s3: number;
    allowance: number;
    revenue: number;
    production: number;
    trustScore: number;
    trajectory: TrajectoryData[];
    intensityValue?: number;
}

export interface TrendData {
    date: string;
    type: 'actual' | 'forecast';
    'K-ETS'?: number;
    'EU-ETS'?: number;
    month?: string;
}

export interface Tranche {
    id: number;
    market: MarketType;
    price: number;
    month: string;
    isFuture: boolean;
    percentage: number;
}

export interface MarketInfo {
    id: MarketType;
    name: string;
    ticker: string;
    price: number;
    currency: string;
    change: number;
    color: string;
    desc: string;
    high: number;
    low: number;
    volatility: string;
}

export interface ChatMessage {
    role: string; // 'user' | 'assistant' but was string in state type
    text: string;
}
