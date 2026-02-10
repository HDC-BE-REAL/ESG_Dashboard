import React, { useState, useEffect, useRef, useMemo } from 'react';
import type {
  TabType, MarketType, IntensityType, TimeRangeType,
  TrendData, Tranche, ChatMessage, CompanyConfig
} from './types';
import { MARKET_DATA, competitors, industryBenchmarks, MOCK_COMPANIES } from './data/mockData';
import { Header } from './components/layout/Header';
import { DashboardTab } from './features/대시보드/DashboardTab';
import { CompareTab } from './features/경쟁사비교/CompareTab';
import { SimulatorTab } from './features/시뮬레이터/SimulatorTab';
import { TargetTab } from './features/목표설정/TargetTab';
import { InvestmentTab } from './features/투자계획/InvestmentTab';
import { ChatBot } from './features/챗봇/ChatBot';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [intensityType, setIntensityType] = useState<IntensityType>('revenue');
  const [activeScopes, setActiveScopes] = useState({ s1: true, s2: true, s3: false });

  // Data State
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [benchmarks, setBenchmarks] = useState({ revenue: { top10: 0, median: 0 }, production: { top10: 0, median: 0 } });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Simulator State
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('K-ETS');
  const [timeRange, setTimeRange] = useState<TimeRangeType>('1년');
  const [tranches, setTranches] = useState<Tranche[]>([
    { id: 1, market: 'K-ETS', price: 15200, month: '25.10', isFuture: false, percentage: 30 },
    { id: 2, market: 'EU-ETS', price: 74.20, month: '26.01', isFuture: false, percentage: 50 },
  ]);

  const [fullHistoryData, setFullHistoryData] = useState<TrendData[]>([]);

  const [simBudget, setSimBudget] = useState<number>(75);
  const [simRisk, setSimRisk] = useState<number>(25);
  const [activeMarkets] = useState<MarketType[]>(['K-ETS', 'EU-ETS']);

  // Investment State
  const [investTotalAmount, setInvestTotalAmount] = useState<number>(762100000000);
  const [investCarbonPrice, setInvestCarbonPrice] = useState<number>(45000);

  const [investEnergySavings, setInvestEnergySavings] = useState<number>(12.5);
  const [investDiscountRate, setInvestDiscountRate] = useState<number>(4.2);
  const [investTimeline, setInvestTimeline] = useState<number>(5);

  const [selectedCompId, setSelectedCompId] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    createMessage('assistant', '탄소 경영 대시보드에 오신 것을 환영합니다. 무엇을 도와드릴까요?')
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [reportScope, setReportScope] = useState<'latest' | 'all'>('all');

  // UI State
  const [isInsightOpen, setIsInsightOpen] = useState<boolean>(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Effects: Fetch Data from API ---
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // 1. Market Data
        const marketRes = await fetch(`${API_BASE_URL}/api/v1/sim/dashboard/market-trends?period=all`);
        const marketJson = await marketRes.json();

        if (marketJson.chart_data && marketJson.chart_data.length > 0) {
          setFullHistoryData(marketJson.chart_data);
        } else {
          console.warn('[System] API returned empty market data, using fallback.');
          const fallbackData: TrendData[] = [];
          const startDate = new Date('2023-01-01');
          const endDate = new Date();
          let krPrice = 13500;
          let euPrice = 72.0;
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d.getDay() === 0 || d.getDay() === 6) continue;
            krPrice += (Math.random() - 0.5) * 200;
            euPrice += (Math.random() - 0.5) * 1.0;
            fallbackData.push({
              date: d.toISOString().split('T')[0],
              krPrice: Math.round(Math.max(8000, Math.min(20000, krPrice))),
              euPrice: Number(Math.max(50, Math.min(100, euPrice)).toFixed(2))
            });
          }
          setFullHistoryData(fallbackData);
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
          console.warn('[System] No companies returned from API.');
          setCompanies([]);
        }

        const benchRes = await fetch(`${API_BASE_URL}/api/v1/dashboard/benchmarks`);
        const benchJson = await benchRes.json();
        if (benchJson && benchJson.revenue) {
          setBenchmarks(benchJson);
        }

      } catch (err) {
        console.error('[System] Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
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
      energy_intensity: selectedConfig.energy_intensity
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

  const processIntensity = (c: CompanyConfig) => {
    const totalE = (activeScopes.s1 ? c.s1 : 0) + (activeScopes.s2 ? c.s2 : 0) + (activeScopes.s3 ? c.s3 : 0);
    // Safety check for division by zero
    if (intensityType === 'revenue') {
      return c.revenue ? totalE / c.revenue : 0;
    } else {
      return c.production ? (totalE / c.production) * 1000 : 0;
    }
  };

  const chartData = useMemo(() => {
    // Also include the selected company in the chart data if it's not already there?
    // The strict comparison logic might differ from original mock logic.
    // For now, keep using 'competitors' mock data vs 'companies'. 
    // Ideally, 'competitors' should also come from API or be derived from 'companies'.
    // The user didn't explicitly ask for competitors to be dynamic, but 'dashboard' tab uses 'companies'.
    // CompareTab uses 'competitors'. 
    // We'll leave 'competitors' as mock for now unless asked.
    return competitors.map(c => ({ ...c, intensityValue: processIntensity(c) })).sort((a, b) => (a.intensityValue || 0) - (b.intensityValue || 0));
  }, [intensityType, activeScopes]);

  const topThreshold = benchmarks[intensityType]?.top10 || 0;
  const medianThreshold = benchmarks[intensityType]?.median || 0;

  const ytdAnalysis = useMemo(() => {
    const targetEmissions = (activeScopes.s1 ? selectedComp.s1 : 0) + (activeScopes.s2 ? selectedComp.s2 : 0) + (activeScopes.s3 ? selectedComp.s3 : 0);

    if (targetEmissions === 0 || selectedComp.revenue === 0) return { currentIntensity: '0.0', percentChange: '0.0', delta: '0.0', period: '-', scopeLabel: 'None' };

    const ty_ytd = intensityType === 'revenue'
      ? (targetEmissions / 2) / (selectedComp.revenue / 2 || 1)
      : ((targetEmissions / 2) / (selectedComp.production / 2 || 1)) * 1000;

    const ly_ytd = ty_ytd * 1.095;
    const diff = ty_ytd - ly_ytd;
    const pct = (diff / ly_ytd || 1) * 100;

    return {
      currentIntensity: ty_ytd.toFixed(1),
      percentChange: pct.toFixed(1),
      delta: diff.toFixed(1),
      period: `2026.01~06 vs 전년동기`,
      scopeLabel: [activeScopes.s1 ? 'S1' : '', activeScopes.s2 ? 'S2' : '', activeScopes.s3 ? 'S3' : ''].filter(Boolean).join('+') || 'None'
    };
  }, [selectedComp, intensityType, activeScopes]);

  const sbtiAnalysis = useMemo(() => {
    const baseYear = 2021;
    const currentYear = 2026;
    const baseEmission = 145000;
    const reductionRate = 0.042;
    const yearsElapsed = currentYear - baseYear;
    const targetReductionPct = reductionRate * yearsElapsed;
    const targetEmissionNow = baseEmission * (1 - targetReductionPct);
    const actualEmissionNow = selectedComp.s1 + selectedComp.s2;
    const actualReductionPct = (baseEmission - actualEmissionNow) / baseEmission;
    const gap = actualEmissionNow - targetEmissionNow;
    const isAhead = gap <= 0;
    const trajectory = [];
    for (let y = baseYear; y <= 2035; y++) {
      const isHistory = y <= currentYear;
      const sbtiVal = baseEmission * (1 - (y - baseYear) * reductionRate);
      let compVal = null;
      if (y === baseYear) compVal = baseEmission;
      else if (y === 2022) compVal = 145000;
      else if (y === 2023) compVal = 130000;
      else if (y === 2024) compVal = 125000;
      else if (y === 2025) compVal = 120000;
      else if (y === 2026) compVal = actualEmissionNow;
      else {
        compVal = actualEmissionNow * Math.pow(0.98, y - 2026);
      }
      trajectory.push({
        year: y.toString(),
        sbti: Math.round(sbtiVal),
        actual: Math.round(compVal),
        isHistory,
        target: Math.round(sbtiVal * 1.05),
        bau: Math.round(baseEmission * Math.pow(1.015, y - baseYear))
      });
    }
    return {
      baseYear,
      currentYear,
      baseEmission,
      targetEmissionNow,
      actualEmissionNow,
      actualReductionPct: (actualReductionPct * 100).toFixed(1),
      targetReductionPct: (targetReductionPct * 100).toFixed(1),
      gap,
      isAhead,
      trajectory
    };
  }, [selectedComp]);

  const investmentAnalysis = useMemo(() => {
    const revenue = 16730100000000;
    const totalEmissions = 250684;
    const greenInvestment = investTotalAmount;

    const annualRisk = totalEmissions * investCarbonPrice;
    const totalRiskLiability = annualRisk * investTimeline;

    const estimatedEnergyCost = revenue * 0.05;
    const annualEnergySavings = estimatedEnergyCost * (investEnergySavings / 100);
    const annualTotalBenefit = annualEnergySavings + annualRisk;

    let npv = -greenInvestment;
    let cumulativeSavings = 0;
    let paybackPeriod = 0;
    const breakEvenChartData = [];

    for (let year = 0; year <= 10; year++) {
      let savingsThisYear = 0;
      if (year > 0) {
        savingsThisYear = annualTotalBenefit / Math.pow(1 + (investDiscountRate / 100), year);
        cumulativeSavings += savingsThisYear;
        npv += savingsThisYear;

        if (cumulativeSavings >= greenInvestment && paybackPeriod === 0) {
          const prevSavings = cumulativeSavings - savingsThisYear;
          const remaining = greenInvestment - prevSavings;
          paybackPeriod = (year - 1) + (remaining / savingsThisYear);
        }
      }

      breakEvenChartData.push({
        year: `Y${year}`,
        investment: greenInvestment,
        savings: Math.round(cumulativeSavings),
      });
    }

    const roi = ((cumulativeSavings - greenInvestment) / greenInvestment) * 100;
    const isInvestFavorable = npv > 0;

    const liabilityChartData = [
      { name: 'Investment', value: greenInvestment, fill: '#10b77f' },
      { name: 'Risk Liability', value: totalRiskLiability, fill: '#94a3b8' }
    ];

    return {
      targetYear: 2030,
      totalEmissions,
      liabilityCost: totalRiskLiability,
      investmentCost: greenInvestment,
      netBenefit: npv,
      isInvestFavorable,
      roi: roi.toFixed(1),
      payback: paybackPeriod > 0 ? paybackPeriod.toFixed(1) : "> 10",
      chartData: breakEvenChartData,
      liabilityChartData,
      annualTotalBenefit
    };
  }, [investTotalAmount, investCarbonPrice, investEnergySavings, investDiscountRate, investTimeline]);

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const point = data.activePayload[0].payload as TrendData;
      // Map selectedMarket to the correct data key
      const priceKey = selectedMarket === 'K-ETS' ? 'krPrice' : 'euPrice';
      const price = point[priceKey as keyof TrendData] as number;
      const remaining = 100 - totalAllocatedPct;
      if (remaining <= 0) return;
      const newTranche: Tranche = { id: Date.now(), market: selectedMarket, price: price, month: point.month || '26.01', isFuture: false, percentage: Math.min(10, remaining) };
      setTranches([...tranches, newTranche]);
    }
  };

  // [ADDED] AI Generation Logic
  const generateAIPlan = () => {
    setIsChatOpen(true);
    setChatMessages((prev: ChatMessage[]) => [...prev, createMessage('user', "시장 동향을 분석하여 최적의 분할 매수 전략을 생성해줘.")]);

    setTimeout(() => {
      const market = MARKET_DATA[selectedMarket];
      const isHighVolatility = market.volatility === 'High';

      const newTranches: Tranche[] = [
        { id: Date.now(), market: selectedMarket, price: Math.round(market.price * 0.98), month: '26.02', isFuture: true, percentage: isHighVolatility ? 20 : 40 },
        { id: Date.now() + 1, market: selectedMarket, price: Math.round(market.price * 0.95), month: '26.05', isFuture: true, percentage: isHighVolatility ? 20 : 30 },
        { id: Date.now() + 2, market: selectedMarket, price: Math.round(market.price * 1.02), month: '26.09', isFuture: true, percentage: isHighVolatility ? 20 : 10 },
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

    if (userText.includes('전략') || userText.includes('추천') || userText.includes('생성')) {
      setTimeout(() => generateAIPlan(), 800);
      return;
    }

    try {
      const payload = {
        message: userText,
        history: historyPayload,
        companyName: selectedConfig?.name,
        companyKey: selectedConfig?.vectorCompanyName,
        reportScope,
        reportYear: selectedYear || null
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain'
        },
        body: JSON.stringify(payload)
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

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'compare', label: '비교 분석' },
    { id: 'simulator', label: '시뮬레이터' },
    { id: 'target', label: '목표 관리' },
    { id: 'investment', label: '투자 전략' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FCFA] text-slate-900 flex flex-col" style={{ fontFamily: '"Pretendard", "Malgun Gothic", sans-serif' }}>
      {/* Defined Gradients for Charts */}
      <svg style={{ height: 0 }}>
        <defs>
          <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b77f" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b77f" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorLiability" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b77f" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b77f" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientSavings" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b77f" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#10b77f" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

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
                  rank: chartData.findIndex(c => c.id === 1) + 1,
                  totalCompanies: chartData.length,
                  intensityValue: chartData.find(c => c.id === 1)?.intensityValue || 0
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
        reportScope={reportScope}
        setReportScope={setReportScope}
      />
    </div >
  );
};

export default App;
