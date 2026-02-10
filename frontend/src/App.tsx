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

  // --- Effects: Fetch Market Data from API ---
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
  const selectedConfig = useMemo(() => MOCK_COMPANIES.find(c => c.id === selectedCompId) || MOCK_COMPANIES[0], [selectedCompId]);

  const selectedComp = useMemo(() => {
    return {
      id: selectedConfig.id,
      name: selectedConfig.name,
      s1: selectedConfig.s1,
      s2: selectedConfig.s2,
      s3: selectedConfig.s3,
      allowance: selectedConfig.allowance,
      revenue: selectedConfig.revenue,
      production: selectedConfig.production,
      trustScore: 95,
      trajectory: [],
      intensityValue: 0
    };
  }, [selectedConfig]);

  const totalExposure = useMemo(() => {
    return (activeScopes.s1 ? selectedComp.s1 : 0) +
      (activeScopes.s2 ? selectedComp.s2 : 0) +
      (activeScopes.s3 ? selectedComp.s3 : 0) -
      selectedComp.allowance;
  }, [selectedComp, activeScopes]);

  const costEU_KRW = totalExposure * MARKET_DATA['EU-ETS'].price * 1450;
  const activeTranches = tranches.filter(t => activeMarkets.includes(t.market));
  const budgetInWon = simBudget * 100000000;
  const estimatedSavings = budgetInWon * (0.1 + (simRisk * 0.002));

  const processIntensity = (c: any) => {
    const totalE = (activeScopes.s1 ? c.s1 : 0) + (activeScopes.s2 ? c.s2 : 0) + (activeScopes.s3 ? c.s3 : 0);
    return intensityType === 'revenue' ? totalE / c.revenue : (totalE / c.production) * 1000;
  };

  const chartData = useMemo(() => {
    return competitors.map(c => ({ ...c, intensityValue: processIntensity(c) })).sort((a, b) => (a.intensityValue || 0) - (b.intensityValue || 0));
  }, [intensityType, activeScopes]);

  const topThreshold = industryBenchmarks[intensityType].top10;
  const medianThreshold = industryBenchmarks[intensityType].median;

  const ytdAnalysis = useMemo(() => {
    const targetEmissions = (activeScopes.s1 ? selectedComp.s1 : 0) + (activeScopes.s2 ? selectedComp.s2 : 0) + (activeScopes.s3 ? selectedComp.s3 : 0);
    if (targetEmissions === 0) return { currentIntensity: '0.0', percentChange: '0.0', delta: '0.0', period: '-', scopeLabel: 'None' };

    const ty_ytd = intensityType === 'revenue' ? (targetEmissions / 2) / (selectedComp.revenue / 2) : ((targetEmissions / 2) / (selectedComp.production / 2)) * 1000;
    const ly_ytd = ty_ytd * 1.095;
    const diff = ty_ytd - ly_ytd;
    const pct = (diff / ly_ytd) * 100;

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
      else compVal = actualEmissionNow * Math.pow(0.98, y - 2026);

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
      baseYear, currentYear, baseEmission, targetEmissionNow, actualEmissionNow,
      actualReductionPct: (actualReductionPct * 100).toFixed(1),
      targetReductionPct: (targetReductionPct * 100).toFixed(1),
      gap, isAhead, trajectory
    };
  }, [selectedComp]);

  const investmentAnalysis = useMemo(() => {
    const greenInvestment = investTotalAmount;
    const totalEmissions = 250684;
    const annualRisk = totalEmissions * debouncedInvestCarbonPrice;
    const totalRiskLiability = annualRisk * debouncedInvestTimeline;
    const annualEnergySavings = (16730100000000 * 0.05) * (debouncedInvestEnergySavings / 100);
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

    return {
      liabilityCost: totalRiskLiability,
      investmentCost: greenInvestment,
      netBenefit: npv,
      roi: (((cumulativeSavings - greenInvestment) / greenInvestment) * 100).toFixed(1),
      payback: paybackPeriod > 0 ? paybackPeriod.toFixed(1) : "> 10",
      chartData: breakEvenChartData,
      annualTotalBenefit
    };
  }, [investTotalAmount, debouncedInvestCarbonPrice, debouncedInvestEnergySavings, debouncedInvestDiscountRate, debouncedInvestTimeline]);

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
    setChatMessages(prev => [...prev, createMessage('user', "시장 동향을 분석하여 최적의 분할 매수 전략을 생성해줘.")]);
    setTimeout(() => {
      const market = MARKET_DATA[selectedMarket];
      const isHighV = market.volatility === 'High';
      const newTranches: Tranche[] = [
        { id: Date.now(), market: selectedMarket, price: Math.round(market.price * 0.98), month: '26.02', isFuture: true, percentage: isHighV ? 20 : 40 },
        { id: Date.now() + 1, market: selectedMarket, price: Math.round(market.price * 0.95), month: '26.05', isFuture: true, percentage: isHighV ? 20 : 30 },
        { id: Date.now() + 2, market: selectedMarket, price: Math.round(market.price * 1.02), month: '26.09', isFuture: true, percentage: isHighV ? 20 : 30 },
      ];
      setTranches(newTranches);
      setChatMessages(prev => [...prev, createMessage('assistant', `✅ [AI 전략 수립 완료] ${market.name} 시장 분석 결과, 저점 분할 매수 전략을 생성했습니다. 상세 내역은 시뮬레이터 탭에서 확인 가능합니다.`)]);
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const userText = inputMessage.trim();
    setChatMessages(prev => [...prev, createMessage('user', userText)]);
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
    } catch (error) {
      console.error('Chat Error:', error);
      setChatMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, text: '죄송합니다. 서버와 연결할 수 없습니다.' } : msg));
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
        tabs={[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'compare', label: 'Comparison' },
          { id: 'simulator', label: 'Simulator' },
          { id: 'target', label: 'Target' },
          { id: 'investment', label: 'Investment' },
        ]}
        selectedCompany={selectedConfig}
        setSelectedCompanyId={setSelectedCompId}
        companies={MOCK_COMPANIES}
        onProfileClick={() => setView('profile')}
        onLogout={() => setView('login')}
        onLogoClick={() => {
          setView('dashboard');
          setActiveTab('dashboard');
        }}
        onNavClick={(targetView) => {
          if (targetView === 'dashboard') {
            setView('dashboard');
            setActiveTab('dashboard');
          } else {
            setView(targetView);
          }
        }}
      />

      <main className="flex-grow p-8 max-w-7xl mx-auto w-full">
        <div key={activeTab}>
          {activeTab === 'dashboard' && (
            <DashboardTab
              selectedComp={selectedComp}
              costEU_KRW={costEU_KRW}
              ytdAnalysis={ytdAnalysis}
              intensityType={intensityType}
              sbtiAnalysis={sbtiAnalysis}
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
              investCarbonPrice={debouncedInvestCarbonPrice}
              setInvestCarbonPrice={setInvestCarbonPrice}
              investEnergySavings={debouncedInvestEnergySavings}
              setInvestEnergySavings={setInvestEnergySavings}
              investDiscountRate={debouncedInvestDiscountRate}
              setInvestDiscountRate={setInvestDiscountRate}
              investTimeline={debouncedInvestTimeline}
              setInvestTimeline={setInvestTimeline}
              investmentAnalysis={investmentAnalysis}
            />
          )}
        </div>
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
