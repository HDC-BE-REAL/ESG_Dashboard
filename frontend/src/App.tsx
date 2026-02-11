import React, { useState, useEffect, useRef, useMemo } from 'react';
import type {
  TabType, MarketType, IntensityType, TimeRangeType,
  TrendData, Tranche, ChatMessage, CompanyConfig
} from './types';
import { MARKET_DATA, MOCK_COMPANIES } from './data/mockData';
import { Header } from './components/layout/Header';
import { DashboardTab } from './features/대시보드/DashboardTab';
import { CompareTab } from './features/경쟁사비교/CompareTab';
import { SimulatorTab } from './features/시뮬레이터/SimulatorTab';
import { TargetTab } from './features/목표설정/TargetTab';
import { InvestmentTab } from './features/투자계획/InvestmentTab';
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
  investCapex: 0,
  targetSavings: 0,
  s1: 0, s2: 0, s3: 0, revenue: 0, production: 0
};
const App: React.FC = () => {
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
    createMessage('assistant', '탄소 경영 대시보드에 오신 것을 환영합니다. 무엇을 도와드릴까요?')
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  // UI State
  const [isInsightOpen, setIsInsightOpen] = useState<boolean>(true);
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

        const benchRes = await fetch(`${API_BASE_URL}/api/v1/dashboard/benchmarks`);
        const benchJson = await benchRes.json();
        if (benchJson && benchJson.revenue) {
          setBenchmarks(benchJson);
        }

      } catch (err) {
        console.error('[System] Failed to fetch startup data:', err);
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

  // [수정] DB의 탄소 집약도 값을 직접 사용
  const getIntensityFromDB = (c: any) => {
    // DB에서 가져온 carbon_intensity_scope1/2/3 값 사용
    const s1Intensity = activeScopes.s1 ? (c.carbon_intensity_scope1 || 0) : 0;
    const s2Intensity = activeScopes.s2 ? (c.carbon_intensity_scope2 || 0) : 0;
    const s3Intensity = activeScopes.s3 ? (c.carbon_intensity_scope3 || 0) : 0;

    // 매출 기준 집약도 = 각 scope 집약도의 합 (DB에 이미 매출 1억원당 tCO2e로 저장됨)
    if (intensityType === 'revenue') {
      return s1Intensity + s2Intensity + s3Intensity;
    } else {
      // 생산량 기준은 DB에 없으므로 계산 (fallback)
      const totalE = (activeScopes.s1 ? c.s1 : 0) + (activeScopes.s2 ? c.s2 : 0) + (activeScopes.s3 ? c.s3 : 0);
      return c.production ? (totalE / c.production) * 1000 : 0;
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
      // DB의 탄소 집약도 값 사용
      carbon_intensity_scope1: (c as any).carbon_intensity_scope1 || 0,
      carbon_intensity_scope2: (c as any).carbon_intensity_scope2 || 0,
      carbon_intensity_scope3: (c as any).carbon_intensity_scope3 || 0,
      intensityValue: getIntensityFromDB(c)
    })).sort((a, b) => (a.intensityValue || 0) - (b.intensityValue || 0));
  }, [companies, intensityType, activeScopes]);

  const topThreshold = benchmarks[intensityType]?.top10 || 0;
  const medianThreshold = benchmarks[intensityType]?.median || 0;

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

    // [수정] DB의 탄소 집약도 값 직접 사용
    const getIntensity = (data: any) => {
      if (intensityType === 'revenue') {
        // DB에 저장된 탄소 집약도 값 사용 (tCO2e / 매출 1억원)
        return (activeScopes.s1 ? (data.carbon_intensity_scope1 || 0) : 0) +
          (activeScopes.s2 ? (data.carbon_intensity_scope2 || 0) : 0) +
          (activeScopes.s3 ? (data.carbon_intensity_scope3 || 0) : 0);
      } else {
        // 생산량 기준은 DB에 없으므로 계산
        const totalE = (activeScopes.s1 ? (data.s1 || 0) : 0) +
          (activeScopes.s2 ? (data.s2 || 0) : 0) +
          (activeScopes.s3 ? (data.s3 || 0) : 0);
        return selectedComp.production ? (totalE / selectedComp.production) * 1000 : 0;
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

    // [수정] DB에서 기준년도 배출량 가져오기 (fallback 제거)
    // 1. selectedConfig.baseEmissions 사용
    // 2. 없으면 history에서 기준년도 데이터 찾기
    // 3. 최후 수단으로 현재 배출량 사용 (하드코딩 제거)
    let baseEmission = (selectedConfig as any).baseEmissions;
    if (!baseEmission && history.length > 0) {
      const baseYearData = history.find((h: any) => h.year === baseYear);
      if (baseYearData) {
        baseEmission = (baseYearData.s1 || 0) + (baseYearData.s2 || 0);
      } else {
        // 가장 오래된 데이터로 대체
        const oldestData = history.reduce((oldest: any, h: any) =>
          (!oldest || h.year < oldest.year) ? h : oldest, null);
        if (oldestData) {
          baseEmission = (oldestData.s1 || 0) + (oldestData.s2 || 0);
        }
      }
    }
    // 여전히 없으면 현재 배출량 사용
    if (!baseEmission) {
      baseEmission = (selectedComp.s1 || 0) + (selectedComp.s2 || 0);
    }

    const reductionRate = 0.042; // SBTi 연간 감축률 4.2%
    const currentYear = new Date().getFullYear();
    const yearsElapsed = currentYear - baseYear;
    const targetReductionPct = reductionRate * yearsElapsed;
    const targetEmissionNow = baseEmission * (1 - targetReductionPct);
    const actualEmissionNow = (selectedComp.s1 || 0) + (selectedComp.s2 || 0);
    const actualReductionPct = baseEmission > 0 ? (baseEmission - actualEmissionNow) / baseEmission : 0;
    const gap = actualEmissionNow - targetEmissionNow;
    const isAhead = gap <= 0;

    const trajectory = [];
    for (let y = baseYear; y <= 2035; y++) {
      const isHistory = y <= currentYear;
      const sbtiVal = baseEmission * (1 - (y - baseYear) * reductionRate);
      let compVal = null;

      // [수정] history 데이터 우선 사용
      if (history.length > 0) {
        const histRow = history.find((h: any) => h.year === y);
        if (histRow) {
          compVal = (histRow.s1 || 0) + (histRow.s2 || 0);
        } else if (y > Math.max(...history.map((h: any) => h.year))) {
          // 미래 예측: 마지막 실제 데이터 기반
          const lastYear = Math.max(...history.map((h: any) => h.year));
          const lastData = history.find((h: any) => h.year === lastYear);
          const lastTotal = lastData ? (lastData.s1 || 0) + (lastData.s2 || 0) : actualEmissionNow;
          compVal = lastTotal * Math.pow(0.98, y - lastYear); // 연간 2% 감소 가정
        }
      } else {
        // history 없으면 현재 데이터 기반 추정
        if (y === currentYear) compVal = actualEmissionNow;
        else if (y < currentYear) compVal = null; // 과거 데이터 없음
        else compVal = actualEmissionNow * Math.pow(0.98, y - currentYear);
      }

      trajectory.push({
        year: y.toString(),
        sbti: Math.round(sbtiVal),
        actual: compVal !== null ? Math.round(compVal) : null,
        isHistory,
        target: Math.round(sbtiVal * 1.05),
        bau: Math.round(baseEmission * Math.pow(1.015, y - baseYear))
      });
    }
    return {
      baseYear, currentYear, baseEmission, targetEmissionNow, actualEmissionNow,
      actualReductionPct: (actualReductionPct * 100).toFixed(1),
      targetReductionPct: (targetReductionPct * 100).toFixed(1),
      gap, isAhead, trajectory
    };
  }, [selectedComp, selectedConfig]);

  const investmentAnalysis = useMemo(() => {
    // [수정] DB에서 가져온 실제 데이터 사용 (하드코딩 제거)
    // revenue는 DB에서 '원' 단위로 저장됨
    const revenue = selectedComp.revenue || 0;
    // 매출이 1억 단위면 실제 원 단위로 변환 (DB 형식에 따라 조정)
    const actualRevenue = revenue < 1000000000 ? revenue * 100000000 : revenue;

    // 총 배출량 = Scope 1 + Scope 2 + Scope 3
    const totalEmissions = (selectedComp.s1 || 0) + (selectedComp.s2 || 0) + (selectedComp.s3 || 0);

    // 녹색 투자 금액 (selectedConfig의 investCapex 사용, 없으면 기본값)
    const greenInvestment = (selectedConfig as any).investCapex || investTotalAmount;

    const annualRisk = totalEmissions * investCarbonPrice;
    const totalRiskLiability = annualRisk * investTimeline;

    const estimatedEnergyCost = actualRevenue * 0.05; // 매출의 5%를 에너지 비용으로 가정
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
                myCompanyId={companies.length > 0 ? companies[0].id : undefined}
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
                activeTranches={activeTranches}
                totalExposure={totalExposure}
                simBudget={simBudget}
                setSimBudget={setSimBudget}
                simRisk={simRisk}
                setSimRisk={setSimRisk}
                budgetInWon={budgetInWon}
                estimatedSavings={estimatedSavings}
                generateAIPlan={generateAIPlan}
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
estimatedSavings = { estimatedSavings }
generateAIPlan = { generateAIPlan }
  />
            )}

{
  activeTab === 'target' && (
    <TargetTab sbtiAnalysis={sbtiAnalysis} />
  )
}

{
  activeTab === 'investment' && (
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
  )
}
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
