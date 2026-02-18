import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type {
  TabType, MarketType, IntensityType, TimeRangeType,
  TrendData, Tranche, ChatMessage, CompanyConfig,
  PriceScenarioType, AllocationChangeType, ReductionOption, SimResult, StrategyDetail
} from './types';
import {
  MARKET_DATA, MOCK_COMPANIES,
  ETS_PRICE_SCENARIOS, ALLOCATION_SCENARIOS, DEFAULT_REDUCTION_OPTIONS, AUCTION_CONFIG
} from './data/mockData';
import { API_BASE_URL } from './config';
import { Header } from './components/layout/Header';
import { DashboardTab } from './features/대시보드/DashboardTab';
import { CompareTab } from './features/경쟁사비교/CompareTab';
import { SimulatorTab } from './features/시뮬레이터/SimulatorTab';
import { TargetTab } from './features/목표설정/TargetTab';
import { ChatBot } from './features/챗봇/ChatBot';
import { Login } from './features/auth/Login';
import { WelcomePage } from './features/auth/WelcomePage';
import { Signup } from './features/auth/Signup';
import { DataInput } from './features/data-input/DataInput';
import { Reports } from './features/reports/Reports';
import { Analytics } from './features/analytics/Analytics';
import { Profile } from './features/profile/Profile';
import { MarketService, AiService } from './services/api';

type ViewType = 'login' | 'signup' | 'welcome' | 'dashboard' | 'profile' | 'data-input' | 'reports' | 'analytics';

const generateMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createMessage = (role: string, text: string): ChatMessage => ({
  id: generateMessageId(),
  role,
  text
});

// Default empty company to prevent crashes
const EMPTY_COMPANY: CompanyConfig = {
  id: 0,
  name: "데이터 없음",
  dartCode: "",
  baseEmissions: 0,
  targetSavings: 0,
  s1: 0, s2: 0, s3: 0, revenue: 0, production: 0
};
const tabs = [
  { id: 'dashboard' as TabType, label: '대시보드' },
  { id: 'compare' as TabType, label: '경쟁사 비교' },
  { id: 'simulator' as TabType, label: 'ETS 시뮬레이터' },
  { id: 'target' as TabType, label: '목표 관리' },
];

const App: React.FC = () => {
  // --- Data State ---
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // --- State ---
  const [view, setView] = useState<ViewType>(() => {
    // 새로고침 시 저장된 view 복원
    const savedView = localStorage.getItem('view');
    return (savedView as ViewType) || 'login';
  });
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // 새로고침 시 저장된 탭 복원
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as TabType) || 'dashboard';
  });
  const [intensityType, setIntensityType] = useState<IntensityType>('revenue');
  const [activeScopes, setActiveScopes] = useState({ s1: true, s2: true, s3: false });

  // Market Data State
  const [fullHistoryData, setFullHistoryData] = useState<TrendData[]>([]);
  const [oilPrices, setOilPrices] = useState<{ brent: number; wti: number }>({ brent: 82.5, wti: 78.4 });

  // Simulator State
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('K-ETS');
  const [timeRange, setTimeRange] = useState<TimeRangeType>('1년');
  const [tranches, setTranches] = useState<Tranche[]>([
    { id: 1, market: 'K-ETS', price: 15200, month: '25.10', isFuture: false, percentage: 30 },
    { id: 2, market: 'EU-ETS', price: 74.20, month: '26.01', isFuture: false, percentage: 50 },
  ]);

  const [simBudget, setSimBudget] = useState<number>(75);
  const [simRisk, setSimRisk] = useState<number>(25);
  const [activeMarkets] = useState<MarketType[]>(['K-ETS', 'EU-ETS']);

  // ── K-ETS Simulator State ──
  const [priceScenario, setPriceScenario] = useState<PriceScenarioType>('base');
  const [customPrice, setCustomPrice] = useState<number>(15000);
  const [allocationChange, setAllocationChange] = useState<AllocationChangeType>('maintain');
  const [emissionChange, setEmissionChange] = useState<number>(0);
  const [reductionOptions, setReductionOptions] = useState<ReductionOption[]>(DEFAULT_REDUCTION_OPTIONS);
  const [auctionEnabled, setAuctionEnabled] = useState<boolean>(true);
  const [auctionTargetPct, setAuctionTargetPct] = useState<number>(10);

  const toggleReduction = useCallback((id: string) => {
    setReductionOptions(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, []);

  const [selectedCompId, setSelectedCompId] = useState<number>(1);
  const selectedCompany = MOCK_COMPANIES.find(c => c.id === selectedCompId) || MOCK_COMPANIES[0];
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    createMessage('assistant', '탄소 경영 대시보드에 오신 것을 환영합니다. 무엇을 도와드릴까요?')
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  // UI State
  const [isInsightOpen, setIsInsightOpen] = useState<boolean>(true);
  const [reportScope, setReportScope] = useState<'latest' | 'history'>('latest');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // view 상태 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('view', view);
  }, [view]);

  // activeTab 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // --- Effects: Fetch Data from API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Market Trends
        const trends = await MarketService.getMarketTrends('all');
        if (trends.chart_data && trends.chart_data.length > 0) {
          const mappedData = trends.chart_data.map((d: any) => ({
            date: d.date,
            krPrice: d['K-ETS'] || d.krPrice,
            euPrice: d['EU-ETS'] || d.euPrice,
            type: d.type || 'actual'
          }));
          setFullHistoryData(mappedData);
        }

        // 2. Oil Prices
        const oil = await MarketService.getOilPrices();
        if (oil && oil.brent) {
          setOilPrices({ brent: oil.brent, wti: oil.wti });
        }

        // 2. Dashboard Data (Companies & Benchmarks)
        const dashboardRes = await fetch(`${API_BASE_URL}/api/v1/dashboard/companies`);
        const dashboardJson = await dashboardRes.json();

        if (Array.isArray(dashboardJson) && dashboardJson.length > 0) {
          setCompanies(dashboardJson);
          console.log('[System] Companies loaded:', dashboardJson.length);
          // Set initial selected company
          setSelectedCompId(dashboardJson[0].id);
        } else {
          console.warn('[System] No companies returned from API. Using Mock Data.');
          setCompanies(MOCK_COMPANIES);
          if (MOCK_COMPANIES.length > 0) {
            setSelectedCompId(MOCK_COMPANIES[0].id);
          }
        }

      } catch (err) {
        console.error('[System] Failed to fetch startup data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const trendData = useMemo<any[]>(() => {
    if (fullHistoryData.length === 0) return [];

    let filtered = [...fullHistoryData];
    const todayIndex = filtered.findIndex(d => d.type === 'forecast');
    const splitIndex = todayIndex === -1 ? filtered.length - 30 : todayIndex;

    if (timeRange === '1개월') {
      const start = Math.max(0, splitIndex - 22);
      const end = Math.min(filtered.length, splitIndex + 22);
      filtered = filtered.slice(start, end);
    } else if (timeRange === '3개월') {
      const start = Math.max(0, splitIndex - 66);
      const end = Math.min(filtered.length, splitIndex + 66);
      filtered = filtered.slice(start, end);
    } else if (timeRange === '1년') {
      const start = Math.max(0, splitIndex - 250);
      const end = Math.min(filtered.length, splitIndex + 125);
      filtered = filtered.slice(start, end);
      return filtered.filter((_, i) => i % 5 === 0);
    } else if (timeRange === '전체') {
      return filtered.filter((_, i) => i % 10 === 0);
    }

    return filtered;
  }, [timeRange, fullHistoryData]);

  // --- Calculations ---
  // Use companies state for selection
  const selectedConfig = useMemo(() => {
    if (companies.length === 0) return EMPTY_COMPANY;
    return companies.find((c: CompanyConfig) => c.id === selectedCompId) || companies[0];
  }, [companies, selectedCompId]);

  const selectedComp = useMemo(() => {
    return {
      id: selectedConfig.id,
      name: selectedConfig.name,
      s1: selectedConfig.s1,
      s2: selectedConfig.s2,
      s3: selectedConfig.s3,
      revenue: selectedConfig.revenue,
      production: selectedConfig.production || 0,
      trustScore: 95,
      trajectory: [],
      intensityValue: 0,
      // Pass through new fields if available
      carbon_intensity_scope1: selectedConfig.carbon_intensity_scope1,
      carbon_intensity_scope2: selectedConfig.carbon_intensity_scope2,
      carbon_intensity_scope3: selectedConfig.carbon_intensity_scope3,
      energy_intensity: selectedConfig.energy_intensity,
      history: (selectedConfig as any).history // Explicit cast to avoid lingering type issues
    };
  }, [selectedConfig]);

  const totalExposure = useMemo(() => {
    return (activeScopes.s1 ? selectedComp.s1 : 0) +
      (activeScopes.s2 ? selectedComp.s2 : 0) +
      (activeScopes.s3 ? selectedComp.s3 : 0);
  }, [selectedComp, activeScopes]);

  const costEU_KRW = totalExposure * MARKET_DATA['EU-ETS'].price * 1450;
  const activeTranches = tranches.filter(t => activeMarkets.includes(t.market));
  const totalAllocatedPct = activeTranches.reduce((sum: number, t: Tranche) => sum + t.percentage, 0);

  const budgetInWon = simBudget * 100000000;
  const estimatedSavings = budgetInWon * (0.1 + (simRisk * 0.002));

  // ── K-ETS Simulator Calculation (3-Step Formula) ──
  const currentETSPrice = priceScenario === 'custom' ? customPrice : ETS_PRICE_SCENARIOS[priceScenario].price;

  const simResult = useMemo<SimResult>(() => {
    const s1s2 = selectedComp.s1 + selectedComp.s2;

    // === Step 1: 순노출 ===
    const adjustedEmissions = Math.round(s1s2 * (1 + emissionChange / 100));
    // 무상 할당량은 기준 배출량의 90%로 가정
    const baseAllocation = selectedConfig.baseEmissions * 0.9;
    const adjustedAllocation = Math.round(baseAllocation * ALLOCATION_SCENARIOS[allocationChange].factor);

    const enabledOptions = reductionOptions.filter(r => r.enabled);
    const thisYearReduction = enabledOptions
      .filter(r => r.thisYearApplicable)
      .reduce((sum, r) => sum + r.annualReduction, 0);
    const nextYearReduction = enabledOptions
      .filter(r => !r.thisYearApplicable)
      .reduce((sum, r) => sum + r.annualReduction, 0);

    const netExposure = Math.max(0, adjustedEmissions - adjustedAllocation - thisYearReduction);

    // === Step 2: 컴플라이언스 비용 (L/B/H) ===
    const complianceCostLow = netExposure * ETS_PRICE_SCENARIOS.low.price / 1e8;
    const complianceCostBase = netExposure * ETS_PRICE_SCENARIOS.base.price / 1e8;
    const complianceCostHigh = netExposure * ETS_PRICE_SCENARIOS.high.price / 1e8;

    // === Step 3: 감축 비용 (올해 적용분만) ===
    const totalAbatementCost = enabledOptions
      .filter(r => r.thisYearApplicable)
      .reduce((sum, r) => sum + r.cost, 0);

    // === 합산 ===
    const complianceCostCurrent = netExposure * currentETSPrice / 1e8;
    const totalCarbonCost = complianceCostCurrent + totalAbatementCost;

    // === 파생 지표 ===
    const operatingProfit = selectedConfig.revenue * 0.08;
    const profitImpact = operatingProfit > 0 ? (totalCarbonCost / operatingProfit) * 100 : 0;

    const economicAbatementPotential = reductionOptions
      .filter(r => r.mac < currentETSPrice && r.thisYearApplicable)
      .reduce((sum, r) => sum + r.annualReduction, 0);

    const totalHandled = adjustedAllocation + thisYearReduction + netExposure;
    const effectiveCarbonPrice = totalHandled > 0 ? (totalCarbonCost * 1e8) / totalHandled : 0;

    // === 전략 생성 ===
    const baseNetExposure = Math.max(0, adjustedEmissions - adjustedAllocation);

    const economicOptions = reductionOptions.filter(r => r.mac < currentETSPrice && r.thisYearApplicable);
    const econReduction = economicOptions.reduce((s, r) => s + r.annualReduction, 0);
    const econAbatementCost = economicOptions.reduce((s, r) => s + r.cost, 0);
    const econPurchase = Math.max(0, baseNetExposure - econReduction);
    const stratA: StrategyDetail = {
      name: 'A', label: '감축 우선',
      complianceCost: econPurchase * currentETSPrice / 1e8,
      abatementCost: econAbatementCost,
      totalCost: (econPurchase * currentETSPrice / 1e8) + econAbatementCost,
      appliedReductions: economicOptions.map(r => r.name),
      purchaseVolume: econPurchase,
      explanation: economicOptions.length > 0
        ? `${economicOptions.map(r => `${r.name}(${r.annualReduction.toLocaleString()}t, MAC ₩${(r.mac / 1000).toFixed(0)}k)`).join(' + ')} → 잔여 ${econPurchase.toLocaleString()}t 구매`
        : `경제적 감력 옵션 없음 → 전량 ${baseNetExposure.toLocaleString()}t 구매`
    };

    const stratB: StrategyDetail = {
      name: 'B', label: '전량 구매',
      complianceCost: baseNetExposure * currentETSPrice / 1e8,
      abatementCost: 0,
      totalCost: baseNetExposure * currentETSPrice / 1e8,
      appliedReductions: [],
      purchaseVolume: baseNetExposure,
      explanation: `순노출 ${baseNetExposure.toLocaleString()}t × ₩${currentETSPrice.toLocaleString()} = ${(baseNetExposure * currentETSPrice / 1e8).toFixed(2)}억원`
    };

    const allThisYearOptions = reductionOptions.filter(r => r.thisYearApplicable);
    const allReduction = allThisYearOptions.reduce((s, r) => s + r.annualReduction, 0);
    const allAbatementCost = allThisYearOptions.reduce((s, r) => s + r.cost, 0);
    const allPurchase = Math.max(0, baseNetExposure - allReduction);
    const stratC: StrategyDetail = {
      name: 'C', label: '혼합 (전체 감축)',
      complianceCost: allPurchase * currentETSPrice / 1e8,
      abatementCost: allAbatementCost,
      totalCost: (allPurchase * currentETSPrice / 1e8) + allAbatementCost,
      appliedReductions: allThisYearOptions.map(r => r.name),
      purchaseVolume: allPurchase,
      explanation: `${allThisYearOptions.map(r => r.name).join(' + ')} 전체 적용 (${allReduction.toLocaleString()}t 감축) → 잔여 ${allPurchase.toLocaleString()}t 구매`
    };

    const strategies = [stratA, stratB, stratC];
    const optimalStrategyIndex = strategies.reduce((minIdx, s, i, arr) =>
      s.totalCost < arr[minIdx].totalCost ? i : minIdx, 0);

    return {
      adjustedEmissions, adjustedAllocation, thisYearReduction, nextYearReduction, netExposure,
      complianceCostLow, complianceCostBase, complianceCostHigh,
      totalAbatementCost, totalCarbonCost, effectiveCarbonPrice,
      profitImpact, operatingProfit, economicAbatementPotential,
      strategies, optimalStrategyIndex
    };
  }, [selectedComp, emissionChange, allocationChange, reductionOptions, selectedConfig, currentETSPrice]);

  // [수정] DB의 집약도 값을 직접 사용
  const getIntensityFromDB = (c: any) => {
    if (intensityType === 'revenue') {
      // 탄소 집약도 = DB의 carbon_intensity_scope1/2/3 합계 (tCO2e / 매출 1억원)
      const s1Intensity = activeScopes.s1 ? (c.carbon_intensity_scope1 || 0) : 0;
      const s2Intensity = activeScopes.s2 ? (c.carbon_intensity_scope2 || 0) : 0;
      const s3Intensity = activeScopes.s3 ? (c.carbon_intensity_scope3 || 0) : 0;
      return s1Intensity + s2Intensity + s3Intensity;
    } else {
      // 에너지 집약도 = DB의 energy_intensity (TJ / 매출 1억원)
      return c.energy_intensity || 0;
    }
  };

  const chartData = useMemo(() => {
    // [수정] DB에서 가져온 companies 데이터와 탄소 집약도 사용
    if (companies.length === 0) return [];

    return companies.map(c => ({
      id: c.id,
      name: c.name,
      s1: c.s1,
      s2: c.s2,
      s3: c.s3,
      revenue: c.revenue,
      production: (c as any).production || 0,
      trustScore: 85,
      trajectory: [],
      // DB의 집약도 값 사용
      carbon_intensity_scope1: (c as any).carbon_intensity_scope1 || 0,
      carbon_intensity_scope2: (c as any).carbon_intensity_scope2 || 0,
      carbon_intensity_scope3: (c as any).carbon_intensity_scope3 || 0,
      energy_intensity: (c as any).energy_intensity || 0,
      intensityValue: getIntensityFromDB(c)
    })).sort((a, b) => (a.intensityValue || 0) - (b.intensityValue || 0));
  }, [companies, intensityType, activeScopes]);

  // 에너지 집약도는 벤치마크를 차트 데이터에서 계산
  const topThreshold = intensityType === 'energy'
    ? (chartData.length > 0 ? chartData[Math.floor(chartData.length * 0.1)]?.intensityValue || 0 : 0)
    : 0;
  const medianThreshold = intensityType === 'energy'
    ? (chartData.length > 0 ? chartData[Math.floor(chartData.length * 0.5)]?.intensityValue || 0 : 0)
    : 0;

  const ytdAnalysis = useMemo(() => {
    // [수정] DB의 carbon_intensity 값을 직접 사용
    const history = selectedComp.history || [];

    // history에서 최신 2개 연도 찾기 (가장 최근 연도와 그 전 연도)
    const sortedYears = history.map((h: any) => h.year).sort((a: number, b: number) => b - a);
    const latestYear = sortedYears[0];
    const previousYear = sortedYears[1];

    const currentYearData = history.find((h: any) => h.year === latestYear);
    const lastYearData = history.find((h: any) => h.year === previousYear);

    if (!currentYearData) {
      return { currentIntensity: '0.0', percentChange: '0.0', delta: '0.0', period: '-', scopeLabel: 'None' };
    }

    // [수정] DB의 집약도 값 직접 사용
    const getIntensity = (data: any) => {
      if (intensityType === 'revenue') {
        // DB에 저장된 탄소 집약도 값 사용 (tCO2e / 매출 1억원)
        return (activeScopes.s1 ? (data.carbon_intensity_scope1 || 0) : 0) +
          (activeScopes.s2 ? (data.carbon_intensity_scope2 || 0) : 0) +
          (activeScopes.s3 ? (data.carbon_intensity_scope3 || 0) : 0);
      } else {
        // 에너지 집약도 = DB의 energy_intensity (TJ / 매출 1억원)
        return data.energy_intensity || 0;
      }
    };

    const ty_intensity = getIntensity(currentYearData);
    const ly_intensity = lastYearData ? getIntensity(lastYearData) : ty_intensity;

    const diff = ty_intensity - ly_intensity;
    const pct = ly_intensity !== 0 ? (diff / ly_intensity) * 100 : 0;

    return {
      currentIntensity: ty_intensity.toFixed(2),
      percentChange: pct.toFixed(1),
      delta: diff.toFixed(2),
      period: lastYearData ? `${latestYear} vs ${previousYear}` : `${latestYear} (비교 데이터 없음)`,
      scopeLabel: [activeScopes.s1 ? 'S1' : '', activeScopes.s2 ? 'S2' : '', activeScopes.s3 ? 'S3' : ''].filter(Boolean).join('+') || 'None'
    };
  }, [selectedComp, intensityType, activeScopes]);

  const sbtiAnalysis = useMemo(() => {
    const baseYear = 2021;
    const history = selectedComp.history || [];
    const reductionRate = 0.042;
    const currentYear = new Date().getFullYear();

    // scope 합산 헬퍼 (activeScopes 반영)
    const sumScopes = (row: any) =>
      (activeScopes.s1 ? (row.s1 || 0) : 0) +
      (activeScopes.s2 ? (row.s2 || 0) : 0) +
      (activeScopes.s3 ? (row.s3 || 0) : 0);

    // 히스토리 정렬 (선언 순서 고정으로 TDZ 방지)
    const sortedHist = [...history].sort((a: any, b: any) => a.year - b.year);

    // Scope 3 데이터 존재 여부
    const hasScope3 = activeScopes.s3 && sortedHist.some((h: any) => (h.s3 || 0) > 0);

    // 기준연도 배출량 (SBTi 경로 시작점 = actual 첫 해와 일치)
    let baseEmission = 0;
    if (sortedHist.length > 0) {
      const baseYearData = sortedHist.find((h: any) => h.year === baseYear);
      baseEmission = sumScopes(baseYearData ?? sortedHist[0]);
    }
    if (!baseEmission) baseEmission = sumScopes(selectedComp);

    // 최신 실적 연도 기준으로 SBTi 목표 계산 (실적 연도와 비교 연도 일치)
    const latestDataYear = sortedHist.length > 0 ? sortedHist[sortedHist.length - 1].year : currentYear;
    const targetEmissionNow = baseEmission * (1 - reductionRate * (latestDataYear - baseYear));
    const actualEmissionNow = sumScopes(selectedComp);
    const actualReductionPct = baseEmission > 0 ? (baseEmission - actualEmissionNow) / baseEmission : 0;
    const gap = baseEmission > 0 ? Math.round(actualEmissionNow - targetEmissionNow) : 0;
    const isAhead = gap <= 0;

    // ── 로그-선형 회귀: log(E_t) = α + β*t (OLS) ──────────────────────────
    const regPoints = sortedHist
      .map((h: any) => ({ t: h.year, e: sumScopes(h) }))
      .filter(p => p.e > 0);

    let alpha = 0, beta = 0, sigma = 0, seBeta = 0, regressionValid = false;
    let tMean = baseYear, Stt = 1; // fallback

    if (regPoints.length >= 2) {
      const n = regPoints.length;
      const logY = regPoints.map(p => Math.log(p.e));
      const tVals = regPoints.map(p => p.t);
      tMean = tVals.reduce((s, t) => s + t, 0) / n;
      const yMean = logY.reduce((s, y) => s + y, 0) / n;
      Stt = tVals.reduce((s, t) => s + (t - tMean) ** 2, 0);
      const Sty = tVals.reduce((s, t, i) => s + (t - tMean) * (logY[i] - yMean), 0);
      beta = Stt > 0 ? Sty / Stt : 0;
      alpha = yMean - beta * tMean;
      const SSR = logY.reduce((s, y, i) => s + (y - (alpha + beta * tVals[i])) ** 2, 0);
      sigma = n > 2 ? Math.sqrt(SSR / (n - 2)) : 0;
      seBeta = Stt > 0 ? Math.sqrt((sigma ** 2) / Stt) : 0;
      regressionValid = true;
    } else if (regPoints.length === 1) {
      // 데이터 1개: 앵커 유지, SBTi 감축률 가정
      alpha = Math.log(regPoints[0].e) + reductionRate * regPoints[0].t;
      beta = -reductionRate;
      regressionValid = false;
    }

    const annualRate = Math.exp(beta) - 1; // β → 연율 변환
    const speedGap = annualRate * 100 - (-reductionRate * 100); // + 이면 SBTi 대비 느림

    // ── Monte Carlo (10,000회): 2030 SBTi 달성 확률 ────────────────────────
    const sbtiTarget2030 = Math.max(0, baseEmission * (1 - reductionRate * (2030 - baseYear)));
    let achievementProbability = 0;

    if (regressionValid) {
      const n = regPoints.length;
      const logE2030Mean = alpha + beta * 2030;
      const predSigma = sigma > 0
        ? sigma * Math.sqrt(1 + 1 / n + (2030 - tMean) ** 2 / Math.max(Stt, 1e-10))
        : 0;

      if (predSigma > 0) {
        const N_SIM = 10000;
        let success = 0;
        for (let i = 0; i < N_SIM; i++) {
          // Box-Muller 정규분포 샘플
          let u = 0, v = 0;
          while (u === 0) u = Math.random();
          while (v === 0) v = Math.random();
          const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
          if (Math.exp(logE2030Mean + predSigma * z) <= sbtiTarget2030) success++;
        }
        achievementProbability = Math.round((success / N_SIM) * 100);
      } else {
        achievementProbability = Math.exp(logE2030Mean) <= sbtiTarget2030 ? 100 : 0;
      }
    }

    // ── Net Zero 2050 메트릭 ────────────────────────────────────────────────
    const currentReductionPct = (actualReductionPct * 100);
    const remainingGap = (90 - currentReductionPct);

    // ── Trajectory (2021~2030) ──────────────────────────────────────────────
    const trajectory = [];
    for (let y = baseYear; y <= 2030; y++) {
      const sbtiVal = Math.max(0, baseEmission * (1 - reductionRate * (y - baseYear)));
      const histRow = sortedHist.find((h: any) => h.year === y);
      const actual = histRow ? Math.round(sumScopes(histRow)) : null;

      // 회귀 예측선: 실적 데이터가 있는 연도는 표시 안 함 (마지막 실적 연도는 연결점으로 표시)
      let forecast: number | null = null;
      if (regressionValid || regPoints.length === 1) {
        const logF = alpha + beta * y;
        const rawForecast = Math.round(Math.exp(logF));
        forecast = (actual !== null && y < latestDataYear) ? null : rawForecast;
      }

      trajectory.push({
        year: y.toString(),
        actual,
        forecast,
        sbti: Math.round(sbtiVal),
        isHistory: y <= latestDataYear,
      });
    }

    return {
      baseYear, currentYear, latestDataYear,
      baseEmission, targetEmissionNow, actualEmissionNow,
      actualReductionPct: currentReductionPct.toFixed(1),
      targetReductionPct: (reductionRate * (latestDataYear - baseYear) * 100).toFixed(1),
      gap, isAhead,
      // 회귀 통계
      annualRate: (annualRate * 100).toFixed(2),
      seBeta: (seBeta * 100).toFixed(2),
      regressionValid,
      // Monte Carlo
      achievementProbability,
      // 감축 속도 분석
      speedGap: speedGap.toFixed(2),
      requiredAcceleration: Math.max(0, speedGap).toFixed(2),
      // Net Zero 2050
      currentReductionPct: currentReductionPct.toFixed(1),
      remainingGap: remainingGap.toFixed(1),
      // 메타
      hasScope3,
      trajectory,
    };
  }, [selectedComp, activeScopes]);

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const point = data.activePayload[0].payload;
      const priceKey = selectedMarket === 'K-ETS' ? 'krPrice' : 'euPrice';
      const price = point[priceKey];
      const totalPct = tranches.reduce((sum, t) => sum + t.percentage, 0);
      if (totalPct >= 100) return;
      setTranches([...tranches, { id: Date.now(), market: selectedMarket, price, month: point.date.slice(2, 7).replace('-', '.'), isFuture: false, percentage: Math.min(10, 100 - totalPct) }]);
    }
  };

  const generateAIPlan = () => {
    setIsChatOpen(true);
    setChatMessages((prev: ChatMessage[]) => [...prev, createMessage('user', "시장 동향을 분석하여 최적의 분할 매수 전략을 생성해줘.")]);

    setTimeout(() => {
      const market = MARKET_DATA[selectedMarket];
      const isHighV = market.volatility === 'High';
      const newTranches: Tranche[] = [
        { id: Date.now(), market: selectedMarket, price: Math.round(market.price * 0.98), month: '26.02', isFuture: true, percentage: isHighV ? 20 : 40 },
        { id: Date.now() + 1, market: selectedMarket, price: Math.round(market.price * 0.95), month: '26.05', isFuture: true, percentage: isHighV ? 20 : 30 },
        { id: Date.now() + 2, market: selectedMarket, price: Math.round(market.price * 1.02), month: '26.09', isFuture: true, percentage: isHighV ? 20 : 30 },
      ];
      setTranches(newTranches);

      const strategyText = isHighVolatility
        ? `⚠️ [고변동성 감지] ${market.name} 시장의 변동성이 높습니다. 리스크 분산을 위해 3~4회에 걸친 분할 매수(Tranche) 전략을 제안합니다.`
        : `✅ [안정적 추세] ${market.name} 시장 가격이 안정적입니다. 저점 매수를 위해 상반기에 물량을 집중하는 공격적 전략을 제안합니다.`;

      setChatMessages((prev: ChatMessage[]) => [...prev, createMessage('assistant', `${strategyText}\n\n📊 생성된 플랜:\n- 26.02 (40%): 단기 저점 예상\n- 26.05 (30%): 추가 하락 대응\n- 26.09 (30%): 잔여 물량 확보`)]);

    }, 1500);
  };

  const appendToMessage = (id: string, text: string) => {
    if (!text) return;
    setChatMessages((prev: ChatMessage[]) => prev.map(msg => msg.id === id ? { ...msg, text: msg.text + text } : msg));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const userText = inputMessage.trim();
    const historyPayload = chatMessages.slice(-8).map(msg => ({ role: msg.role, text: msg.text }));
    const selectedYear = reportScope === 'latest' ? selectedConfig?.latestReportYear : null;
    setChatMessages((prev: ChatMessage[]) => [...prev, createMessage('user', userText)]);
    setInputMessage('');

    if (userText.includes('전략') || userText.includes('플랜')) {
      generateAIPlan();
      return;
    }

    const assistantId = generateMessageId();
    setChatMessages(prev => [...prev, { id: assistantId, role: 'assistant', text: '' }]);

    try {
      await AiService.chatStream(userText, (chunk) => {
        setChatMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, text: msg.text + chunk } : msg));
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const reader = res.body && typeof res.body.getReader === 'function' ? res.body.getReader() : null;
      if (!reader) {
        const fallback = await res.text();
        setChatMessages((prev: ChatMessage[]) => [...prev, createMessage('assistant', fallback || '답변을 가져오지 못했습니다.')]);
        return;
      }

      const decoder = new TextDecoder();
      const assistantId = generateMessageId();
      setChatMessages((prev: ChatMessage[]) => [...prev, { id: assistantId, role: 'assistant', text: '' }]);

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            const remaining = decoder.decode();
            appendToMessage(assistantId, remaining);
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          appendToMessage(assistantId, chunk);
        }
      } catch (streamError) {
        console.error('Stream parsing error:', streamError);
        appendToMessage(assistantId, '\n[스트리밍 중 연결이 끊겼습니다.]');
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      setChatMessages((prev: ChatMessage[]) => [...prev, createMessage('assistant', '죄송합니다. 서버와 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.')]);
    }
  };

  // Early return for views ensuring selectedCompany is available
  if (view === 'login') return <Login onLogin={(companyName) => {
    setView('welcome');
  }} onSignup={() => setView('signup')} />;
  if (view === 'signup') return <Signup onBack={() => setView('login')} onComplete={(companyName) => {
    setView('welcome');
  }} />;
  if (view === 'welcome') return <WelcomePage onContinue={() => setView('dashboard')} companyName={selectedCompany?.name || 'My Company'} />;
  if (view === 'profile') return <Profile onBack={() => setView('dashboard')} />;
  if (view === 'data-input') return <DataInput onBack={() => setView('dashboard')} />;
  if (view === 'reports') return <Reports onBack={() => setView('dashboard')} />;
  if (view === 'analytics') return <Analytics onBack={() => setView('dashboard')} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-display relative overflow-hidden">
      {/* Background Layer: Ambient Warmth & Daylight Cycle */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="ambient-warmth opacity-60"></div>
        <div className="absolute inset-0 bg-sunrise-glow opacity-0 pointer-events-none"></div>
      </div>

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        selectedCompany={companies.find(c => c.id === selectedCompId) || companies[0] || EMPTY_COMPANY}
        setSelectedCompanyId={setSelectedCompId}
        companies={companies}
        onProfileClick={() => setView('profile')}
        onLogout={() => setView('login')}
      />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">

        {companies.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-100">
            <p className="text-xl font-medium text-slate-800 mb-2">데이터가 없습니다</p>
            <p className="text-slate-500">PDF 문서를 추출하여 데이터를 추가해주세요.</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab
                selectedComp={selectedComp}
                costEU_KRW={costEU_KRW}
                ytdAnalysis={ytdAnalysis}
                intensityType={intensityType}
                sbtiAnalysis={sbtiAnalysis}
                activeScopes={activeScopes}
                setActiveScopes={setActiveScopes}
                compareData={{
                  rank: chartData.findIndex(c => c.id === selectedCompId) + 1,
                  totalCompanies: chartData.length,
                  intensityValue: chartData.find(c => c.id === selectedCompId)?.intensityValue || 0
                }}
                simulatorData={{
                  ketsPrice: MARKET_DATA['K-ETS'].price,
                  ketsChange: MARKET_DATA['K-ETS'].change
                }}
                onNavigateToTab={(tabId) => setActiveTab(tabId as TabType)}
              />
            )}

            {activeTab === 'compare' && (
              <CompareTab
                intensityType={intensityType}
                setIntensityType={setIntensityType}
                chartData={chartData}
                selectedCompId={selectedCompId}
                setSelectedCompId={setSelectedCompId}
                activeScopes={activeScopes}
                setActiveScopes={setActiveScopes}
                topThreshold={topThreshold}
                medianThreshold={medianThreshold}
                isInsightOpen={isInsightOpen}
                setIsInsightOpen={setIsInsightOpen}
                myCompanyId={selectedCompId}
              />
            )}

            {activeTab === 'simulator' && (
              <SimulatorTab
                selectedMarket={selectedMarket}
                setSelectedMarket={setSelectedMarket}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                trendData={trendData}
                handleChartClick={handleChartClick}
                // New Props
                priceScenario={priceScenario}
                setPriceScenario={setPriceScenario}
                customPrice={customPrice}
                setCustomPrice={setCustomPrice}
                allocationChange={allocationChange}
                setAllocationChange={setAllocationChange}
                emissionChange={emissionChange}
                setEmissionChange={setEmissionChange}
                reductionOptions={reductionOptions}
                toggleReduction={toggleReduction}
                auctionEnabled={auctionEnabled}
                setAuctionEnabled={setAuctionEnabled}
                auctionTargetPct={auctionTargetPct}
                setAuctionTargetPct={setAuctionTargetPct}
                simResult={simResult}
                currentETSPrice={currentETSPrice}
              />
            )}

            {activeTab === 'target' && (
              <TargetTab sbtiAnalysis={sbtiAnalysis} />
            )}

          </>
        )}

      </main >

      <ChatBot
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        chatMessages={chatMessages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        chatEndRef={chatEndRef}
      />
    </div >
  );
};

export default App;
