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
import { DashboardTab } from './features/\uB300\uC2DC\uBCF4\uB4DC/DashboardTab';
import { CompareTab } from './features/\uACBD\uC7C1\uC0AC\uBE44\uAD50/CompareTab';
import { SimulatorTab } from './features/\uC2DC\uBBAC\uB808\uC774\uD130/SimulatorTab';
import { TargetTab } from './features/\uBAA9\uD45C\uC124\uC815/TargetTab';
import { InvestmentTab } from './features/\uD22C\uC790\uACC4\uD68D/InvestmentTab';
import { ChatBot } from './features/\uCC57\uBD07/ChatBot';
import { Login } from './features/auth/Login';
import { WelcomePage } from './features/auth/WelcomePage';
import { Signup } from './features/auth/Signup';
import { DataInput } from './features/data-input/DataInput';
import { Reports } from './features/reports/Reports';
import { Analytics } from './features/analytics/Analytics';
import { Profile } from './features/profile/Profile';
import { MarketService } from './services/api';
import { getToken, removeToken } from './services/authApi';
import { fetchProfile } from './services/profileApi';
import type { ProfileResponse } from './services/profileApi';

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

  name: "No Data",

  dartCode: "",

  baseEmissions: 0,

  investCapex: 0,

  targetSavings: 0,

  s1: 0, s2: 0, s3: 0, revenue: 0, production: 0

};

const tabs = [

  { id: 'dashboard' as TabType, label: 'Dashboard' },

  { id: 'compare' as TabType, label: 'Compare' },

  { id: 'simulator' as TabType, label: 'ETS Simulator' },

  { id: 'target' as TabType, label: 'Targets' },

  { id: 'investment' as TabType, label: 'Investments' },

];

const App: React.FC = () => {

  // --- Data State ---

  const [companies, setCompanies] = useState<CompanyConfig[]>([]);

  const [benchmarks, setBenchmarks] = useState<any>({});

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [userProfile, setUserProfile] = useState<ProfileResponse | null>(null);

  // --- State ---

  const [view, setView] = useState<ViewType>(() => {

    const savedView = localStorage.getItem('view') as ViewType | null;

    const hasToken = Boolean(getToken());

    if (!hasToken) {

      return 'login';

    }

    return savedView || 'dashboard';

  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {

    // localStorage에서 저장된 탭 복원

    const savedTab = localStorage.getItem('activeTab');

    return (savedTab as TabType) || 'dashboard';

  });

  useEffect(() => {

    const loadProfile = async () => {

      try {

        const profile = await fetchProfile();

        setUserProfile(profile);

      } catch (error) {

        setUserProfile(null);

      }

    };

    if (getToken()) {

      loadProfile();

    } else {

      setUserProfile(null);

    }

  }, [view]);

  const [intensityType, setIntensityType] = useState<IntensityType>('revenue');

  const [activeScopes, setActiveScopes] = useState({ s1: true, s2: true, s3: false });

  // Market Data State

  const [fullHistoryData, setFullHistoryData] = useState<TrendData[]>([]);

  const [oilPrices, setOilPrices] = useState<{ brent: number; wti: number }>({ brent: 82.5, wti: 78.4 });

  // Simulator State

  const [selectedMarket, setSelectedMarket] = useState<MarketType>('K-ETS');

  const [timeRange, setTimeRange] = useState<TimeRangeType>('1y');

  const [tranches, setTranches] = useState<Tranche[]>([

    { id: 1, market: 'K-ETS', price: 15200, month: '25.10', isFuture: false, percentage: 30 },

    { id: 2, market: 'EU-ETS', price: 74.20, month: '26.01', isFuture: false, percentage: 50 },

  ]);

  const [simBudget, setSimBudget] = useState<number>(75);

  const [simRisk, setSimRisk] = useState<number>(25);

  const [activeMarkets] = useState<MarketType[]>(['K-ETS', 'EU-ETS']);

  // === K-ETS Simulator State ===

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

  // Investment State

  const [investTotalAmount, setInvestTotalAmount] = useState<number>(762100000000);

  const [investCarbonPrice, setInvestCarbonPrice] = useState<number>(45000);

  const [investEnergySavings, setInvestEnergySavings] = useState<number>(12.5);

  const [investDiscountRate, setInvestDiscountRate] = useState<number>(4.2);

  const [investTimeline, setInvestTimeline] = useState<number>(5);

  // Debounced Investment State (for useMemo calculation)

  const [debouncedInvestCarbonPrice, setDebouncedInvestCarbonPrice] = useState<number>(45000);

  const [debouncedInvestEnergySavings, setDebouncedInvestEnergySavings] = useState<number>(12.5);

  const [debouncedInvestDiscountRate, setDebouncedInvestDiscountRate] = useState<number>(4.2);

  const [debouncedInvestTimeline, setDebouncedInvestTimeline] = useState<number>(5);

  // Debounce effect for Investment variables

  useEffect(() => {

    const timer = setTimeout(() => {

      setDebouncedInvestCarbonPrice(investCarbonPrice);

      setDebouncedInvestEnergySavings(investEnergySavings);

      setDebouncedInvestDiscountRate(investDiscountRate);

      setDebouncedInvestTimeline(investTimeline);

    }, 300); // 300ms delay

    return () => clearTimeout(timer);

  }, [investCarbonPrice, investEnergySavings, investDiscountRate, investTimeline]);

  const [selectedCompId, setSelectedCompId] = useState<number>(1);

  const selectedCompany = MOCK_COMPANIES.find(c => c.id === selectedCompId) || MOCK_COMPANIES[0];

  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    createMessage(
      'assistant',
      "\uC548\uB155\uD558\uC138\uC694! ESG AI \uC5B4\uB4DC\uBC14\uC774\uC800\uC785\uB2C8\uB2E4. \uBB34\uC5C7\uC744 \uB3C4\uC640\uB4DC\uB9B4\uAE4C\uC694?"
    )
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  // 🌟 1. 커스텀 네비게이션 함수 (상태 변경 + 브라우저 주소창 기록)
  const navigateTo = useCallback((newView: ViewType, newTab: TabType = activeTab) => {
    setView(newView);
    setActiveTab(newTab);
    // [프론트.txt 원리 적용] 화면을 새로고침하지 않고 URL과 히스토리만 몰래 추가합니다.
    window.history.pushState({ view: newView, activeTab: newTab }, '', `?view=${newView}&tab=${newTab}`);
  }, [activeTab]);

  // 🌟 2. 브라우저 뒤로가기/앞으로가기 (popstate) 감지
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 뒤로가기를 눌렀을 때 저장해둔 과거의 state를 꺼내서 화면을 되돌립니다.
      if (event.state) {
        setView(event.state.view || 'dashboard');
        setActiveTab(event.state.activeTab || 'dashboard');
      } else {
        // state가 없으면 URL 파라미터를 직접 읽어서 복원합니다 (초기 진입 시)
        const params = new URLSearchParams(window.location.search);
        const urlView = params.get('view') as ViewType || 'dashboard';
        const urlTab = params.get('tab') as TabType || 'dashboard';
        setView(urlView);
        setActiveTab(urlTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // UI State

  const [isInsightOpen, setIsInsightOpen] = useState<boolean>(true);

  const [reportScope, setReportScope] = useState<'latest' | 'history'>('latest');

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // view 변경 시 localStorage에 저장

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

        const benchRes = await fetch(`${API_BASE_URL}/api/v1/dashboard/benchmarks`);

        const benchJson = await benchRes.json();

        if (benchJson && benchJson.revenue) {

          setBenchmarks(benchJson);

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

    if (timeRange === '1m') {
      const start = Math.max(0, splitIndex - 22);
      const end = Math.min(filtered.length, splitIndex + 22);
      filtered = filtered.slice(start, end);
    } else if (timeRange === '3m') {
      const start = Math.max(0, splitIndex - 66);
      const end = Math.min(filtered.length, splitIndex + 66);
      filtered = filtered.slice(start, end);
    } else if (timeRange === '1y') {
      const start = Math.max(0, splitIndex - 250);
      const end = Math.min(filtered.length, splitIndex + 125);
      filtered = filtered.slice(start, end);
      return filtered.filter((_, i) => i % 5 === 0);
    } else if (timeRange === 'all') {
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

  // === K-ETS Simulator Calculation (3-Step Formula) ===

  const currentETSPrice = priceScenario === 'custom' ? customPrice : ETS_PRICE_SCENARIOS[priceScenario].price;

  const simResult = useMemo<SimResult>(() => {

    const s1s2 = selectedComp.s1 + selectedComp.s2;

    // === Step 1: 배출량 조정 ===

    const adjustedEmissions = Math.round(s1s2 * (1 + emissionChange / 100));

    // 기준년도 무상할당 = 기준 배출량의 90%

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

    // === Step 2: 이행비용 시나리오 (L/B/H) ===

    const complianceCostLow = netExposure * ETS_PRICE_SCENARIOS.low.price / 1e8;

    const complianceCostBase = netExposure * ETS_PRICE_SCENARIOS.base.price / 1e8;

    const complianceCostHigh = netExposure * ETS_PRICE_SCENARIOS.high.price / 1e8;

    // === Step 3: 감축비용 (내부 감축 투자비) ===

    const totalAbatementCost = enabledOptions

      .filter(r => r.thisYearApplicable)

      .reduce((sum, r) => sum + r.cost, 0);

    // === 합산 ===

    const complianceCostCurrent = netExposure * currentETSPrice / 1e8;

    const totalCarbonCost = complianceCostCurrent + totalAbatementCost;

    // === 수익성 영향 ===


    const operatingProfit = selectedConfig.revenue * 0.08;

    const profitImpact = operatingProfit > 0 ? (totalCarbonCost / operatingProfit) * 100 : 0;

    const economicAbatementPotential = reductionOptions

      .filter(r => r.mac < currentETSPrice && r.thisYearApplicable)

      .reduce((sum, r) => sum + r.annualReduction, 0);

    const totalHandled = adjustedAllocation + thisYearReduction + netExposure;

    const effectiveCarbonPrice = totalHandled > 0 ? (totalCarbonCost * 1e8) / totalHandled : 0;

    // === 전략 비교 ===

    const baseNetExposure = Math.max(0, adjustedEmissions - adjustedAllocation);

    const economicOptions = reductionOptions.filter(r => r.mac < currentETSPrice && r.thisYearApplicable);

    const econReduction = economicOptions.reduce((s, r) => s + r.annualReduction, 0);

    const econAbatementCost = economicOptions.reduce((s, r) => s + r.cost, 0);

    const econPurchase = Math.max(0, baseNetExposure - econReduction);

    const stratA: StrategyDetail = {

      name: 'A', label: '최적 전략',

      complianceCost: econPurchase * currentETSPrice / 1e8,

      abatementCost: econAbatementCost,

      totalCost: (econPurchase * currentETSPrice / 1e8) + econAbatementCost,

      appliedReductions: economicOptions.map(r => r.name),

      purchaseVolume: econPurchase,

      explanation: economicOptions.length > 0

        ? `${economicOptions.map(r => `${r.name}(${r.annualReduction.toLocaleString()}t, MAC ₩${(r.mac / 1000).toFixed(0)}k)`).join(' + ')} 나머지 ${econPurchase.toLocaleString()}t 구매`


        : `경제적 감축 옵션 없음 - 전량 ${baseNetExposure.toLocaleString()}t 구매`


    };

    const stratB: StrategyDetail = {

      name: 'B', label: '전량 구매',


      complianceCost: baseNetExposure * currentETSPrice / 1e8,

      abatementCost: 0,

      totalCost: baseNetExposure * currentETSPrice / 1e8,

      appliedReductions: [],

      purchaseVolume: baseNetExposure,

      explanation: `순노출량 ${baseNetExposure.toLocaleString()}t × ₩${currentETSPrice.toLocaleString()} = ${(baseNetExposure * currentETSPrice / 1e8).toFixed(2)}억원`

    };

    const allThisYearOptions = reductionOptions.filter(r => r.thisYearApplicable);

    const allReduction = allThisYearOptions.reduce((s, r) => s + r.annualReduction, 0);

    const allAbatementCost = allThisYearOptions.reduce((s, r) => s + r.cost, 0);

    const allPurchase = Math.max(0, baseNetExposure - allReduction);

    const stratC: StrategyDetail = {

      name: 'C', label: '공격적 (전체 감축)',

      complianceCost: allPurchase * currentETSPrice / 1e8,

      abatementCost: allAbatementCost,

      totalCost: (allPurchase * currentETSPrice / 1e8) + allAbatementCost,

      appliedReductions: allThisYearOptions.map(r => r.name),

      purchaseVolume: allPurchase,

      explanation: `${allThisYearOptions.map(r => r.name).join(' + ')} 전체 적용 (${allReduction.toLocaleString()}t 감축) 나머지 ${allPurchase.toLocaleString()}t 구매`

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

  // [핵심] DB의 집약도 데이터로 집약도 계산


  const getIntensityFromDB = (c: any) => {

    if (intensityType === 'revenue') {

      // 매출 집약도 = DB의 carbon_intensity_scope1/2/3 합산 (tCO2e / 매출 1억원)


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

    // [핵심] DB 데이터로 companies 배열에서 집약도 계산


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

      // DB의 집약도 데이터 전달


      carbon_intensity_scope1: (c as any).carbon_intensity_scope1 || 0,

      carbon_intensity_scope2: (c as any).carbon_intensity_scope2 || 0,

      carbon_intensity_scope3: (c as any).carbon_intensity_scope3 || 0,

      energy_intensity: (c as any).energy_intensity || 0,

      intensityValue: getIntensityFromDB(c)

    })).sort((a, b) => (a.intensityValue || 0) - (b.intensityValue || 0));

  }, [companies, intensityType, activeScopes]);

  // 에너지 집약도 벤치마크 데이터 처리


  const topThreshold = intensityType === 'energy'

    ? (chartData.length > 0 ? chartData[Math.floor(chartData.length * 0.1)]?.intensityValue || 0 : 0)

    : (benchmarks[intensityType]?.top10 || 0);

  const medianThreshold = intensityType === 'energy'

    ? (chartData.length > 0 ? chartData[Math.floor(chartData.length * 0.5)]?.intensityValue || 0 : 0)

    : (benchmarks[intensityType]?.median || 0);

  const ytdAnalysis = useMemo(() => {

    // [핵심] DB의 carbon_intensity 데이터로 집약도 계산


    const history = selectedComp.history || [];

    // history에서 최근 2개년 데이터를 비교 (데이터가 있는 최신 2개년)


    const sortedYears = history.map((h: any) => h.year).sort((a: number, b: number) => b - a);

    const latestYear = sortedYears[0];

    const previousYear = sortedYears[1];

    const currentYearData = history.find((h: any) => h.year === latestYear);

    const lastYearData = history.find((h: any) => h.year === previousYear);

    if (!currentYearData) {

      return { currentIntensity: '0.0', percentChange: '0.0', delta: '0.0', period: '-', scopeLabel: 'None' };

    }

    // [핵심] DB의 집약도 데이터로 집약도 계산


    const getIntensity = (data: any) => {

      if (intensityType === 'revenue') {

        // DB에서 가져온 매출 집약도 데이터 사용 (tCO2e / 매출 1억원)


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

      period: lastYearData ? `${latestYear} vs ${previousYear}` : `${latestYear} (비교할 데이터 없음)`,


      scopeLabel: [activeScopes.s1 ? 'S1' : '', activeScopes.s2 ? 'S2' : '', activeScopes.s3 ? 'S3' : ''].filter(Boolean).join('+') || 'None'

    };

  }, [selectedComp, intensityType, activeScopes]);

  const sbtiAnalysis = useMemo(() => {

    const baseYear = 2021;

    const history = selectedComp.history || [];

    // [핵심] DB에서 기준년도 배출량 데이터를 가져옴 (fallback 포함)


    // 1. selectedConfig.baseEmissions 사용


    // 2. 없으면 history에서 기준년도 데이터를 비교


    // 3. 최종적으로 가장 오래된 배출량 사용 (투자수익률 포함)


    let baseEmission = (selectedConfig as any).baseEmissions;

    if (!baseEmission && history.length > 0) {

      const baseYearData = history.find((h: any) => h.year === baseYear);

      if (baseYearData) {

        baseEmission = (baseYearData.s1 || 0) + (baseYearData.s2 || 0);

      } else {

        // 데이터가 없으면 가장 오래된 데이터 사용


        const oldestData = history.reduce((oldest: any, h: any) =>

          (!oldest || h.year < oldest.year) ? h : oldest, null);

        if (oldestData) {

          baseEmission = (oldestData.s1 || 0) + (oldestData.s2 || 0);

        }

      }

    }

    // 이것도 없으면 현재 배출량 사용


    if (!baseEmission) {

      baseEmission = (selectedComp.s1 || 0) + (selectedComp.s2 || 0);

    }

    const reductionRate = 0.042; // SBTi 연간 감축률 4.2%


    const currentYear = new Date().getFullYear();

    const yearsElapsed = currentYear - baseYear;

    const targetReductionPct = reductionRate * yearsElapsed;

    const targetEmissionNow = baseEmission * (1 - targetReductionPct);

    // [핵심] activeScopes에 따라 현재 배출량 계산


    const actualEmissionNow =

      (activeScopes.s1 ? (selectedComp.s1 || 0) : 0) +

      (activeScopes.s2 ? (selectedComp.s2 || 0) : 0) +

      (activeScopes.s3 ? (selectedComp.s3 || 0) : 0);

    const actualReductionPct = baseEmission > 0 ? (baseEmission - actualEmissionNow) / baseEmission : 0;

    const gap = actualEmissionNow - targetEmissionNow;

    const isAhead = gap <= 0;

    const trajectory = [];

    for (let y = baseYear; y <= 2035; y++) {

      const isHistory = y <= currentYear;

      const sbtiVal = baseEmission * (1 - (y - baseYear) * reductionRate);

      let compVal = null;

      // [핵심] history 데이터에서 사용 + activeScopes 반영


      if (history.length > 0) {

        const histRow = history.find((h: any) => h.year === y);

        if (histRow) {

          compVal =

            (activeScopes.s1 ? (histRow.s1 || 0) : 0) +

            (activeScopes.s2 ? (histRow.s2 || 0) : 0) +

            (activeScopes.s3 ? (histRow.s3 || 0) : 0);

        } else if (y > Math.max(...history.map((h: any) => h.year))) {

          // 미래년도 예측: 마지막 데이터에서 추정


          const lastYear = Math.max(...history.map((h: any) => h.year));

          const lastData = history.find((h: any) => h.year === lastYear);

          const lastTotal = lastData ?

            (activeScopes.s1 ? (lastData.s1 || 0) : 0) +

            (activeScopes.s2 ? (lastData.s2 || 0) : 0) +

            (activeScopes.s3 ? (lastData.s3 || 0) : 0) :

            actualEmissionNow;

          compVal = lastTotal * Math.pow(0.98, y - lastYear); // 연간 2% 감축률 추정


        }

      } else {

        // history 없으면 현재 데이터로 추정


        if (y === currentYear) compVal = actualEmissionNow;

        else if (y < currentYear) compVal = null; // 과거 데이터 없음


        else compVal = actualEmissionNow * Math.pow(0.98, y - currentYear);

      }

      trajectory.push({

        year: y.toString(),

        actual: compVal !== null ? Math.round(compVal) : null,

        isHistory

      });

    }

    return {

      baseYear, currentYear, baseEmission, targetEmissionNow, actualEmissionNow,

      actualReductionPct: (actualReductionPct * 100).toFixed(1),

      targetReductionPct: (targetReductionPct * 100).toFixed(1),

      gap, isAhead, trajectory

    };

  }, [selectedComp, selectedConfig, activeScopes]);

  const investmentAnalysis = useMemo(() => {

    // [핵심] DB 데이터로 투자 분석 계산 (투자수익률 포함)


    // revenue는 DB에서 가져온 원 단위 매출액


    const revenue = selectedComp.revenue || 0;

    // 매출액이 1억 미만이면 억 단위 변환 (DB 저장 형식에 따라 조정)


    const actualRevenue = revenue < 1000000000 ? revenue * 100000000 : revenue;

    // 총배출량 = Scope 1 + Scope 2 + Scope 3


    const totalEmissions = (selectedComp.s1 || 0) + (selectedComp.s2 || 0) + (selectedComp.s3 || 0);

    // 녹색 투자금액 (selectedConfig의 investCapex 사용, 없으면 기본값 사용)


    const greenInvestment = (selectedConfig as any).investCapex || investTotalAmount;

    const annualRisk = totalEmissions * investCarbonPrice;

    const totalRiskLiability = annualRisk * investTimeline;

    const estimatedEnergyCost = actualRevenue * 0.05; // 매출의 5%를 에너지 비용으로 추정


    const annualEnergySavings = estimatedEnergyCost * (investEnergySavings / 100);

    const annualTotalBenefit = annualEnergySavings + annualRisk;

    let npv = -greenInvestment;

    let cumulativeSavings = 0;

    let paybackPeriod = 0;

    const breakEvenChartData = [];

    for (let year = 0; year <= 10; year++) {

      if (year > 0) {

        const savingsThisYear = annualTotalBenefit / Math.pow(1 + (debouncedInvestDiscountRate / 100), year);

        cumulativeSavings += savingsThisYear;

        npv += savingsThisYear;

        if (cumulativeSavings >= greenInvestment && paybackPeriod === 0) {

          paybackPeriod = (year - 1) + ((greenInvestment - (cumulativeSavings - savingsThisYear)) / savingsThisYear);

        }

      }

      breakEvenChartData.push({ year: `Y${year}`, investment: greenInvestment, savings: Math.round(cumulativeSavings) });

    }

    const roi = greenInvestment > 0 ? ((cumulativeSavings - greenInvestment) / greenInvestment) * 100 : 0;

    const isInvestFavorable = npv > 0;

    const liabilityChartData = [

      { name: 'Investment', value: greenInvestment, fill: '#10b77f' },

      { name: 'Risk Liability', value: totalRiskLiability, fill: '#94a3b8' }

    ];

    return {

      liabilityCost: totalRiskLiability,

      investmentCost: greenInvestment,

      netBenefit: npv,

      roi: (((cumulativeSavings - greenInvestment) / greenInvestment) * 100).toFixed(1),

      payback: paybackPeriod > 0 ? paybackPeriod.toFixed(1) : "> 10",

      chartData: breakEvenChartData,

      annualTotalBenefit

    };

  }, [selectedComp, selectedConfig, investTotalAmount, investCarbonPrice, investEnergySavings, investDiscountRate, investTimeline]);

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

    setChatMessages((prev: ChatMessage[]) => [...prev, createMessage('user', 'Market is volatile. Recommend a staged buying plan.')]);

    setTimeout(() => {

      const market = MARKET_DATA[selectedMarket];

      const isHighV = market.volatility === 'High';

      const newTranches: Tranche[] = [

        { id: Date.now(), market: selectedMarket, price: Math.round(market.price * 0.98), month: '26.02', isFuture: true, percentage: isHighV ? 20 : 40 },

        { id: Date.now() + 1, market: selectedMarket, price: Math.round(market.price * 0.95), month: '26.05', isFuture: true, percentage: isHighV ? 20 : 30 },

        { id: Date.now() + 2, market: selectedMarket, price: Math.round(market.price * 1.02), month: '26.09', isFuture: true, percentage: isHighV ? 20 : 30 },

      ];

      setTranches(newTranches);

      const strategyText = isHighV
        ? `Current ${market.name} volatility is high. A staged buying plan over 3-4 tranches reduces risk.`
        : `Current ${market.name} volatility is moderate. Focus on key levels with a lighter staged plan.`;

      setChatMessages((prev: ChatMessage[]) => [...prev, createMessage('assistant', `${strategyText}

Recommended staged plan
- 26.02 (40%): slight pullback zone
- 26.05 (30%): additional correction zone
- 26.09 (30%): trend confirmation entry`)]);

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
    setChatMessages((prev: ChatMessage[]) => [...prev, createMessage('user', userText)]);
    setInputMessage('');

    // 1. 통신 시작 전, AI의 답변이 들어갈 '빈 칸'을 먼저 화면에 만들어 줍니다.
    const assistantId = generateMessageId();
    setChatMessages((prev: ChatMessage[]) => [
      ...prev,
      { id: assistantId, role: 'assistant', text: '' },
    ]);

    try {
      const historyPayload = chatMessages.slice(-8).map((msg) => ({
        role: msg.role,
        text: msg.text,
      }));
      const selectedYear =
        reportScope === "latest" ? selectedConfig?.latestReportYear ?? null : null;
      const activeCompany =
        companies.find((c) => c.id === selectedCompId) ||
        companies[0] ||
        selectedCompany;

      await AiService.chatStream(
        {
          message: userText,
          history: historyPayload,
          companyName: activeCompany?.name,
          companyKey: activeCompany?.dartCode,
          reportScope,
          reportYear: selectedYear,
        },
        (chunk) => {
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, text: msg.text + chunk } : msg
            )
          );
        });
    } catch (error) {
      console.error('Chat API Error:', error);
      setChatMessages((prev: ChatMessage[]) => prev.map(msg =>
        msg.id === assistantId ? { ...msg, text: '죄송합니다. 서버와 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.' } : msg
      ));
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

  if (view === 'profile') {
    return (
      <Profile
        onBack={() => setView('dashboard')}
        onProfileUpdated={setUserProfile}
        onNavigate={(next) => setView(next)}
      />
    );
  }

  if (view === 'data-input') return <DataInput onBack={() => setView('dashboard')} />;

  if (view === 'reports') return <Reports onBack={() => setView('dashboard')} />;

  if (view === 'analytics') return <Analytics onBack={() => setView('dashboard')} />;

  // 🌟 여기서부터는 로그인 이후 화면! Header를 절대 사라지지 않는 "뼈대"로 고정합니다.
  return (

    <div className="min-h-screen bg-slate-50 flex flex-col font-display relative overflow-hidden">

      {/* Background Layer: Ambient Warmth & Daylight Cycle */}

      <div className="fixed inset-0 pointer-events-none z-0">

        <div className="ambient-warmth opacity-60"></div>

        <div className="absolute inset-0 bg-sunrise-glow opacity-0 pointer-events-none"></div>

      </div>

      {/* 🌟 Header는 맨 위에 고정 */}
      <Header

        user={userProfile ? { nickname: userProfile.nickname, email: userProfile.email } : undefined}

        activeTab={activeTab}
        // 탭 이동 시에도 히스토리에 기록되게 변경
        setActiveTab={(tab: TabType) => navigateTo('dashboard', tab)}
        tabs={tabs}

        selectedCompany={companies.find(c => c.id === selectedCompId) || companies[0] || EMPTY_COMPANY}

        setSelectedCompanyId={setSelectedCompId}

        companies={companies}

        // 로고나 프로필 클릭 시 navigateTo 사용
        onLogoClick={() => navigateTo('dashboard', 'dashboard')} // Header 컴포넌트에 이 props를 추가해야 합니다!
        onProfileClick={() => navigateTo('profile')}

        onLogout={() => {

          removeToken();

          setView('login');

          setUserProfile(null);

        }}

      />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">

        {/* 🌟 view 상태에 따라 알맹이(Main)만 쏙쏙 갈아끼웁니다. Header는 안전합니다! */}
        {view === 'profile' && <Profile onBack={() => navigateTo('dashboard')} />}
        {view === 'data-input' && <DataInput onBack={() => navigateTo('dashboard')} />}
        {view === 'reports' && <Reports onBack={() => navigateTo('dashboard')} />}
        {view === 'analytics' && <Analytics onBack={() => navigateTo('dashboard')} />}

        {/* 대시보드 화면일 때만 기존 탭들(DashboardTab, CompareTab 등)을 보여줌 */}
        {view === 'dashboard' && (
          <>
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
                    investmentData={{
                      roi: investmentAnalysis.roi,
                      payback: investmentAnalysis.payback
                    }}
                    onNavigateToTab={(tabId) => navigateTo('dashboard', tabId as TabType)}
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

                {activeTab === 'investment' && (
                  <InvestmentTab
                    investTotalAmount={investTotalAmount}
                    investCarbonPrice={investCarbonPrice}
                    setInvestCarbonPrice={setInvestCarbonPrice}
                    investEnergySavings={investEnergySavings}
                    setInvestEnergySavings={setInvestEnergySavings}
                    investDiscountRate={investDiscountRate}
                    setInvestDiscountRate={setInvestDiscountRate}
                    investTimeline={investTimeline}
                    setInvestTimeline={setInvestTimeline}
                    investmentAnalysis={investmentAnalysis}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      <ChatBot
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        chatMessages={chatMessages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        chatEndRef={chatEndRef}
      />
    </div>
  );
};

export default App;
