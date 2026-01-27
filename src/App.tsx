import { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, ComposedChart, Line, Area, AreaChart, PieChart, Pie,
  ReferenceLine, Scatter, Label
} from 'recharts';
import {
  TrendingUp, TrendingDown, MessageSquare, Send, FileText,
  Leaf, X, BarChart3, Filter, Award, BarChart4,
  History, Trash2, MousePointer2, Calculator, Activity, Zap,
  Target, Flag, CheckCircle2, AlertCircle, Lock, Scale, Database,
  MoreHorizontal, ArrowRight, Coins, Globe, Quote, Briefcase,
  LineChart as LineChartIcon, Cloud, Euro, CheckCircle, Download, Star, Lightbulb,
  PoundSterling, Trees, Plus, ShieldCheck, SlidersHorizontal, RotateCcw,
  ThumbsUp, Clock, Wallet, Printer, Share2
} from 'lucide-react';
import { cn } from './lib/utils';
import { Card, Button, Badge } from './components/ui';

// Types
type TabType = 'dashboard' | 'compare' | 'simulator' | 'target' | 'investment';
type MarketType = 'K-ETS' | 'EU-ETS';
type IntensityType = 'revenue' | 'production';
type TimeRangeType = '1개월' | '3개월' | '1년' | '연중';

interface MarketInfo {
  id: MarketType;
  name: string;
  ticker: string;
  price: number;
  change: number;
  color: string;
  volatility: string;
}

interface Competitor {
  id: number;
  name: string;
  s1: number;
  s2: number;
  s3: number;
  allowance: number;
  revenue: number;
  production: number;
  trustScore: number;
  trajectory: { year: string; v: number }[];
}

interface Tranche {
  id: number;
  market: MarketType;
  price: number;
  month: string;
  isFuture: boolean;
  percentage: number;
}

interface TrendData {
  month: string;
  type: 'actual' | 'forecast';
  'K-ETS': number;
  'EU-ETS': number;
  [key: string]: string | number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

// Constants


const COMPETITORS: Competitor[] = [
  { id: 1, name: "우리 기업", s1: 150684, s2: 100000, s3: 120000, allowance: 250684, revenue: 167301, production: 1000000, trustScore: 95, trajectory: [{ year: '22', v: 240000 }, { year: '23', v: 245000 }, { year: '24', v: 250000 }, { year: '25', v: 250684 }] },
  { id: 2, name: "A사 (Top)", s1: 45000, s2: 40000, s3: 85000, allowance: 95000, revenue: 4800, production: 1200000, trustScore: 88, trajectory: [{ year: '22', v: 110000 }, { year: '23', v: 100000 }, { year: '24', v: 95000 }, { year: '25', v: 85000 }] },
  { id: 3, name: "B사 (Peer)", s1: 95000, s2: 65000, s3: 150000, allowance: 110000, revenue: 5200, production: 900000, trustScore: 62, trajectory: [{ year: '22', v: 165000 }, { year: '23', v: 164000 }, { year: '24', v: 163000 }, { year: '25', v: 160000 }] },
  { id: 4, name: "C사 (Peer)", s1: 55000, s2: 42000, s3: 98000, allowance: 105000, revenue: 5100, production: 1100000, trustScore: 82, trajectory: [{ year: '22', v: 105000 }, { year: '23', v: 102000 }, { year: '24', v: 100000 }, { year: '25', v: 97000 }] }
];

const INDUSTRY_BENCHMARKS = {
  revenue: { top10: 15.2, median: 22.5 },
  production: { top10: 65.0, median: 92.4 }
};

const MARKET_DATA: Record<MarketType, MarketInfo> = {
  'EU-ETS': { id: 'EU-ETS', name: '유럽 통합', ticker: 'EUA', price: 153000, change: -0.5, color: '#a5d8ff', volatility: 'High' },
  'K-ETS': { id: 'K-ETS', name: '한국', ticker: 'KAU', price: 15000, change: 1.2, color: '#10b77f', volatility: 'Low' },
};

const formatKRW = (val: number) => `₩${(val / 100000000).toFixed(1)}억`;


function App() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [intensityType, setIntensityType] = useState<IntensityType>('revenue');
  const [activeScopes, setActiveScopes] = useState({ s1: true, s2: true, s3: false });
  const [planningMarket, setPlanningMarket] = useState<MarketType>('K-ETS');
  const [tranches, setTranches] = useState<Tranche[]>([
    { id: 1, market: 'K-ETS', price: 14850, month: '25.09', isFuture: false, percentage: 30 },
    { id: 2, market: 'EU-ETS', price: 151000, month: '25.11', isFuture: false, percentage: 20 },
    { id: 3, market: 'K-ETS', price: 15200, month: '26.01', isFuture: true, percentage: 25 },
    { id: 4, market: 'EU-ETS', price: 155000, month: '26.03', isFuture: true, percentage: 15 },
  ]);
  const [simBudget, setSimBudget] = useState(75);
  const [simRisk, setSimRisk] = useState(25);
  const [selectedCompId, setSelectedCompId] = useState(1);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('1년');

  // Investment State
  const [greenInvestment] = useState(762100000000);
  const [investCarbonPrice, setInvestCarbonPrice] = useState(45000);
  const [investEnergySavings, setInvestEnergySavings] = useState(12.5);
  const [investDiscountRate, setInvestDiscountRate] = useState(4.2);
  const [investTimeline, setInvestTimeline] = useState(5);
  const [investTotalAmount] = useState(762100000000); // 7621억 원

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: '탄소 경영 대시보드에 오신 것을 환영합니다. 무엇을 도와드릴까요?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derived Data
  const selectedComp = useMemo(() => COMPETITORS.find(c => c.id === selectedCompId) || COMPETITORS[0], [selectedCompId]);
  const totalExposure = selectedComp.s1 + selectedComp.s2 - selectedComp.allowance;
  const costK_KRW = totalExposure * MARKET_DATA['K-ETS'].price;
  const costEU_KRW = totalExposure * MARKET_DATA['EU-ETS'].price;

  // YTD Analysis for Dashboard
  const ytdAnalysis = useMemo(() => {
    const targetEmissions = (activeScopes.s1 ? selectedComp.s1 : 0) + (activeScopes.s2 ? selectedComp.s2 : 0) + (activeScopes.s3 ? selectedComp.s3 : 0);
    if (targetEmissions === 0) return { currentIntensity: '0.0', percentChange: '0.0', delta: '0.0', period: '-' };

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

  // SBTi / Net Zero Calculation for Dashboard Charts
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
        actual: Math.round(compVal!),
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

  // Trend Data for Simulator Chart - Dynamic based on timeRange
  const trendData = useMemo<TrendData[]>(() => {
    let count = 12;
    let getLabel = (i: number) => {
      const isFuture = i > 6;
      const month = i < 7 ? `25.${String(i + 7).padStart(2, '0')}` : `26.${String(i - 5).padStart(2, '0')}`;
      return { label: month, isFuture };
    };

    if (timeRange === '1개월') {
      count = 30;
      getLabel = (i) => {
        const d = new Date();
        d.setDate(d.getDate() - (30 - i));
        return { label: `${d.getMonth() + 1}.${d.getDate()}`, isFuture: i > 25 };
      };
    } else if (timeRange === '3개월') {
      count = 12;
      getLabel = (i) => {
        return { label: `W${i + 1}`, isFuture: i > 9 };
      };
    } else if (timeRange === '연중') {
      count = 10;
      getLabel = (i) => {
        return { label: `25.${String(i + 1).padStart(2, '0')}`, isFuture: false };
      };
    }

    return Array.from({ length: count }, (_, i) => {
      const { label, isFuture } = getLabel(i);

      const dataPoint: TrendData = {
        month: label,
        type: isFuture ? 'forecast' : 'actual',
        'K-ETS': 0,
        'EU-ETS': 0
      };

      (Object.keys(MARKET_DATA) as MarketType[]).forEach(marketKey => {
        const basePrice = MARKET_DATA[marketKey].price;
        const volatility = marketKey === 'K-ETS' ? 0.05 : 0.15;
        const timeFactor = 1 + (Math.sin(i * 0.5) * 0.02);
        const randomFactor = 1 + (Math.sin(i * 0.3 + marketKey.charCodeAt(0)) * volatility);
        const trendFactor = isFuture ? 1.02 + (i * 0.005) : 1;
        dataPoint[marketKey] = Math.round(basePrice * randomFactor * trendFactor * timeFactor);
      });

      return dataPoint;
    });
  }, [timeRange]);

  // Investment Analysis Logic
  const investmentAnalysis = useMemo(() => {
    const totalEmissions = 250684;
    const riskLiability = totalEmissions * investCarbonPrice;
    const strategicGap = greenInvestment - riskLiability;
    const riskCoverage = riskLiability > 0 ? (greenInvestment / riskLiability) * 100 : 0;
    const transitionEfficiencyPrice = totalEmissions > 0 ? greenInvestment / totalEmissions : 0;

    const chartData = [];
    const step = 200000;
    const maxPrice = Math.max(transitionEfficiencyPrice * 1.5, 5000000);

    for (let price = 0; price <= maxPrice; price += step) {
      chartData.push({
        price: price,
        liability: totalEmissions * price,
        investment: greenInvestment
      });
    }

    return {
      targetYear: 2030,
      targetReductionPct: (0.378 * 100).toFixed(1),
      totalEmissions,
      liabilityCost: riskLiability,
      investmentCost: greenInvestment,
      netBenefit: strategicGap,
      isInvestFavorable: strategicGap > 0,
      roi: riskCoverage.toFixed(1),
      transitionCostEfficiency: transitionEfficiencyPrice,
      payback: '4.5',
      chartData
    };
  }, [greenInvestment, investCarbonPrice]);

  // Calculate tranches and VWAP for each market
  const calculateMarketStats = (market: MarketType) => {
    const marketTranches = tranches.filter(t => t.market === market);
    const totalPct = marketTranches.reduce((sum, t) => sum + t.percentage, 0);
    const vwap = marketTranches.length === 0 || totalPct === 0 ? 0 :
      marketTranches.reduce((sum, t) => sum + (t.price * t.percentage), 0) / totalPct;
    return { tranches: marketTranches, totalPct, vwap };
  };

  const marketStats = {
    'K-ETS': calculateMarketStats('K-ETS'),
    'EU-ETS': calculateMarketStats('EU-ETS'),
  };

  // Current selected market stats
  const selectedMarketStats = marketStats[planningMarket];

  // Global VWAP (weighted average across all markets)
  const globalTotalPct = Object.values(marketStats).reduce((sum, s) => sum + s.totalPct, 0);
  const globalVWAP = globalTotalPct === 0 ? 0 :
    Object.values(marketStats).reduce((sum, s) => sum + (s.vwap * s.totalPct), 0) / globalTotalPct;

  // Cost calculation for selected market (simplified for demo)

  const totalSimCost = Object.entries(marketStats).reduce((sum, [_, stats]) => {
    return sum + (totalExposure * 0.25 * (stats.totalPct / 100)) * stats.vwap;
  }, 0);
  const budgetInWon = simBudget * 100000000;

  // Compare Logic
  const processIntensity = (c: Competitor) => {
    const totalE = (activeScopes.s1 ? c.s1 : 0) + (activeScopes.s2 ? c.s2 : 0) + (activeScopes.s3 ? c.s3 : 0);
    return intensityType === 'revenue' ? totalE / c.revenue : (totalE / c.production) * 1000;
  };

  const chartData = useMemo(() => {
    return COMPETITORS.map(c => ({ ...c, intensityValue: processIntensity(c) })).sort((a, b) => a.intensityValue - b.intensityValue);
  }, [intensityType, activeScopes]);

  const topThreshold = INDUSTRY_BENCHMARKS[intensityType].top10;
  const medianThreshold = INDUSTRY_BENCHMARKS[intensityType].median;
  const myRank = chartData.findIndex(c => c.id === 1) + 1;

  // Handlers
  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]) {
      const point = data.activePayload[0].payload;
      const price = point[planningMarket] as number;
      const marketTranches = tranches.filter(t => t.market === planningMarket);
      const currentPct = marketTranches.reduce((sum, t) => sum + t.percentage, 0);
      const remaining = 100 - currentPct;
      if (remaining <= 0) return;

      const newTranche: Tranche = {
        id: Date.now(),
        market: planningMarket,
        price,
        month: point.month,
        isFuture: point.type === 'forecast',
        percentage: Math.min(25, remaining)
      };
      setTranches([...tranches, newTranche]);
    }
  };

  const updateTranchePercentage = (id: number, val: string, market: MarketType) => {
    const value = parseInt(val, 10) || 0;
    const otherSum = tranches.filter(t => t.id !== id && t.market === market).reduce((sum, t) => sum + t.percentage, 0);
    const allowedValue = Math.min(value, 100 - otherSum);
    setTranches(tranches.map(t => t.id === id ? { ...t, percentage: allowedValue } : t));
  };

  const removeTranche = (id: number) => setTranches(tranches.filter(t => t.id !== id));

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const userMsg = inputMessage;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputMessage('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `현재 ${activeTab} 분석 결과에 기반하여 조언 드립니다. 우리 기업의 탄소 리스크는 업계 평균 수준이나 해외 노출분(30%)에 대한 선제적 대응이 필요해 보입니다.` }]);
    }, 800);
  };

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [chatMessages]);

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-sans flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg"><Leaf size={24} /></div>
          <span className="text-xl font-black tracking-tighter uppercase text-slate-800">ESG OS</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['dashboard', 'compare', 'simulator', 'target', 'investment'] as const).map(t => (
            <Button key={t} variant={activeTab === t ? 'tabActive' : 'tab'} onClick={() => setActiveTab(t)}>{t.toUpperCase()}</Button>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total Emissions */}
              <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <Cloud size={24} />
                  </div>
                  <Badge variant="success" className="bg-emerald-100 text-emerald-700">
                    <TrendingDown size={14} className="mr-1" />
                    4.2%
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-500">총 탄소 배출량 (Total Emissions)</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{(selectedComp.s1 + selectedComp.s2).toLocaleString()} <span className="text-sm font-normal text-slate-400">tCO2e</span></p>
                <p className="text-xs text-slate-400 mt-2">전년 대비 (vs Last Year)</p>
              </div>

              {/* Card 2: Risk Exposure */}
              <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <Euro size={24} />
                  </div>
                  <Badge variant="default" className="bg-slate-100 text-slate-600">
                    <AlertCircle size={14} className="mr-1" />
                    안정적 (Stable)
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-500">EU 리스크 노출액</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">€ {(costEU_KRW / 1450 / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-slate-400 mt-2">탄소 가격 영향 (Pricing Impact)</p>
              </div>

              {/* Card 3: Carbon Intensity */}
              <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                    <Activity size={24} />
                  </div>
                  <Badge variant={Number(ytdAnalysis.percentChange) > 0 ? "warning" : "success"} className={Number(ytdAnalysis.percentChange) > 0 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}>
                    {Number(ytdAnalysis.percentChange) > 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                    {Math.abs(Number(ytdAnalysis.percentChange))}%
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-500">탄소 집약도 (Intensity)</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{ytdAnalysis.currentIntensity}</p>
                <p className="text-xs text-slate-400 mt-2">{intensityType === 'revenue' ? 'tCO2e / 1억 매출' : 'kg / 제품 단위'}</p>
              </div>

              {/* Card 4: Allowances */}
              <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                    <CheckCircle size={24} />
                  </div>
                  <Badge variant="success" className="bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={14} className="mr-1" />
                    양호 (On Track)
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-500">무상 할당량</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{((selectedComp.allowance / (selectedComp.s1 + selectedComp.s2)) * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-400 mt-2">할당량 활용 (Utilization)</p>
              </div>
            </div>

            {/* Charts Section - 4+8 Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Pie Chart (Scope Contribution) - Width 4/12 */}
              <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-slate-900 text-lg font-bold">Scope별 배출 기여도</h3>
                  <button className="text-slate-400 hover:text-emerald-500 transition-colors"><MoreHorizontal size={20} /></button>
                </div>
                <div className="flex-1 w-full min-h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'Scope 1', value: selectedComp.s1, color: '#0da559' }, { name: 'Scope 2', value: selectedComp.s2, color: '#86efac' }, { name: 'Scope 3', value: selectedComp.s3, color: '#dcfce7' }]}
                        dataKey="value" cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2} cornerRadius={6}
                      >
                        <Cell fill="#0da559" />
                        <Cell fill="#86efac" />
                        <Cell fill="#dcfce7" />
                        <Label
                          value="100%"
                          position="center"
                          className="text-2xl font-bold fill-slate-900"
                          style={{ fontSize: '20px', fontWeight: '700' }}
                        />
                      </Pie>
                      <Tooltip />
                      <Legend
                        layout="vertical"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        content={({ payload }) => (
                          <div className="flex flex-col gap-1 mt-2 w-full">
                            {payload?.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer w-full">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                  <span className="text-sm font-medium text-slate-700">{entry.value}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">
                                  {((entry.payload.value / (selectedComp.s1 + selectedComp.s2 + selectedComp.s3)) * 100).toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Area Chart (Annual Trajectory) - Width 8/12 */}
              <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                  <div>
                    <h3 className="text-slate-900 text-lg font-bold">연간 배출 추이 (Trajectory)</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-slate-500">실적 vs 목표 대비 성과</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs font-semibold text-slate-600">실적 (Actual)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-slate-300 border border-slate-300 border-dashed"></div>
                      <span className="text-xs font-medium text-slate-400">목표 (Target)</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sbtiAnalysis.trajectory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b77f" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b77f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis width={60} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip />

                      {/* Target Line (Simulated) */}
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#cbd5e1"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                      />

                      {/* Actual Data Area */}
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="#10b77f"
                        fillOpacity={1}
                        fill="url(#chartGradient)"
                        strokeWidth={3}
                      />

                      {/* Reference Line for Current Year */}
                      <ReferenceLine x="2026" stroke="#10b77f" strokeDasharray="3 3">
                        <Label value="현재 (2026)" position="top" fill="#10b77f" fontSize={10} fontWeight={700} />
                      </ReferenceLine>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-4 mb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">업계 벤치마킹 분석</h2>
                  <p className="text-slate-500 text-sm mt-1">페이지 2 / 5: 주요 경쟁사 대비 집약도 비교</p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download size={16} /> 리포트 내보내기
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* LEFT PANEL */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Filter */}
                <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-1 h-10">
                    <button
                      onClick={() => setIntensityType('revenue')}
                      className={cn("relative flex items-center justify-center rounded-lg text-sm font-medium transition-all", intensityType === 'revenue' ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500" : "text-slate-500 hover:bg-slate-50")}
                    >
                      매출액 (Revenue)
                    </button>
                    <button
                      onClick={() => setIntensityType('production')}
                      className={cn("relative flex items-center justify-center rounded-lg text-sm font-medium transition-all", intensityType === 'production' ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500" : "text-slate-500 hover:bg-slate-50")}
                    >
                      생산량 (Production)
                    </button>
                  </div>
                </div>

                {/* Rankings */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">경쟁사 순위</h3>
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">실시간 데이터</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-snug">탄소 집약도 기준 (tCO2e / 단위). 낮을수록 우수합니다.</p>

                  <div className="flex flex-col gap-3">
                    {chartData.map((comp, idx) => {
                      const isMe = comp.id === 1;
                      const isSelected = selectedCompId === comp.id;
                      return (
                        <div
                          key={comp.id}
                          onClick={() => setSelectedCompId(comp.id)}
                          className={cn(
                            "group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                            isSelected ? "ring-2 ring-offset-2 ring-emerald-500/50" : "hover:shadow-md",
                            isMe
                              ? (isSelected ? "border-emerald-500 bg-emerald-500/10" : "border-emerald-500/50 bg-emerald-500/5")
                              : (isSelected ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white")
                          )}
                        >
                          <div className={cn("flex items-center justify-center size-8 rounded-full font-bold text-sm transition-colors",
                            isMe ? "bg-emerald-500 text-white shadow-sm" : (isSelected ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600")
                          )}>
                            {isMe ? <Star size={14} fill="white" /> : idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              {comp.name}
                              {isMe && <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">Me</span>}
                            </h4>
                            <p className={cn("text-xs", isMe ? "text-emerald-600 font-medium" : "text-slate-400")}>
                              {isMe ? "현재 성과" : "글로벌 피어"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={cn("block text-lg font-bold", isMe ? "text-emerald-600" : "text-slate-900")}>
                              {comp.intensityValue?.toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-500">tCO2e</span>
                          </div>
                          {isSelected && <div className="absolute right-0 top-0 p-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: Chart */}
              <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
                <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 lg:p-8 flex flex-col relative shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">탄소 집약도 비교 (Intensity Comparison)</h3>
                      <p className="text-sm text-slate-500">매출액 기준 집약도 (tCO2e / 1억)</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Scope Toggles */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveScopes(prev => ({ ...prev, s1: !prev.s1 }))}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                            activeScopes.s1
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          S1
                        </button>
                        <button
                          onClick={() => setActiveScopes(prev => ({ ...prev, s2: !prev.s2 }))}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                            activeScopes.s2
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          S2
                        </button>
                        <button
                          onClick={() => setActiveScopes(prev => ({ ...prev, s3: !prev.s3 }))}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                            activeScopes.s3
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          S3
                        </button>
                      </div>
                      {/* Legend */}
                      <div className="flex gap-4 text-xs font-medium">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>자사 (Our Co)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 rounded-sm"></div>선택됨</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 rounded-sm"></div>기타</div>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Implementation */}
                  <div className="flex-1 w-full min-h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barSize={60}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip />
                        <ReferenceLine y={topThreshold} stroke="#10b981" strokeDasharray="3 3">
                          <Label value={`상위 10% (${topThreshold})`} position="right" fill="#10b981" fontSize={11} fontWeight={700} />
                        </ReferenceLine>
                        <ReferenceLine y={medianThreshold} stroke="#94a3b8" strokeDasharray="5 5">
                          <Label value={`중앙값 (${medianThreshold})`} position="right" fill="#94a3b8" fontSize={11} fontWeight={700} />
                        </ReferenceLine>
                        <Bar dataKey="intensityValue" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => {
                            const isMe = entry.id === 1;
                            const isSelected = entry.id === selectedCompId;
                            let fillColor = '#cbd5e1';

                            if (isMe) {
                              fillColor = isSelected ? '#059669' : '#10b981';
                            } else if (isSelected) {
                              fillColor = '#1e293b';
                            }

                            return <Cell key={`cell-${index}`} fill={fillColor} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Insight Footer */}
            <div className="w-full">
              <div className="bg-slate-900 text-white rounded-xl p-6 lg:p-8 flex flex-col md:flex-row gap-6 md:items-start shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none bg-gradient-to-l from-emerald-500 to-transparent"></div>

                <div className="flex-shrink-0 bg-white/10 p-3 rounded-lg text-emerald-400">
                  <Lightbulb size={24} />
                </div>

                <div className="flex-1 flex flex-col gap-2 relative z-10">
                  <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    전략적 인사이트: 효율성 격차 (Efficiency Gap)
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">조치 필요 (Action Required)</span>
                  </h3>
                  <p className="text-slate-300 leading-relaxed max-w-3xl text-sm">
                    <strong className="text-white">우리 기업</strong>은 현재 업계 평균(Median)을 상회하고 있으나, 상위 10% 진입을 위해서는 생산 집약도의 <span className="text-emerald-400 font-bold">15% 추가 감축</span>이 필요합니다.
                    선두 기업(A사)의 주요 경쟁력은 40% 더 높은 <span className="text-white underline decoration-emerald-500/50 decoration-2 underline-offset-4">재생에너지 전환율</span>에서 기인합니다.
                  </p>
                </div>

                <div className="flex flex-col justify-center min-w-[140px] gap-2 relative z-10">
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20">
                    세부 실행 계획
                    <ArrowRight size={16} />
                  </button>
                  <button className="text-slate-400 hover:text-white text-sm font-medium py-1 px-4 text-center transition-colors">
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simulator Tab */}
        {activeTab === 'simulator' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Market Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(MARKET_DATA).map((market) => {
                const isActive = planningMarket === market.id;
                return (
                  <Card
                    key={market.id}
                    variant={isActive ? 'active' : 'hoverable'}
                    onClick={() => setPlanningMarket(market.id as MarketType)}
                    className="cursor-pointer bg-white p-5 border border-slate-100 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {market.id === 'K-ETS' && <Globe size={20} className="text-slate-500" />}
                        {market.id === 'EU-ETS' && <Euro size={20} className="text-slate-500" />}
                        <span className="text-sm font-medium text-slate-500">{market.ticker}</span>
                      </div>
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
                        market.change > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
                      )}>
                        {market.change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(market.change)}%
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 tracking-tight">
                      {market.id === 'EU-ETS' ? '€' : '₩'}
                      {market.price.toLocaleString()}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Global Price Trend Chart */}
            <Card padding="lg" className="relative overflow-hidden bg-white border border-slate-100">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">글로벌 가격 동향 (Global Price Trend)</h3>
                  <p className="text-sm text-slate-500">다중 시장 수렴 분석 (Convergence Analysis)</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex gap-3 text-xs font-medium">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> K-ETS</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span> EU-ETS</div>
                  </div>
                  <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                  <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                    {(['1개월', '3개월', '1년', '연중'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={cn("px-3 py-1 rounded transition-colors", timeRange === range ? "bg-white text-slate-900 shadow-sm" : "hover:bg-white/50 text-slate-500")}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} onClick={handleChartClick} className="cursor-crosshair">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                    <YAxis yAxisId="left" orientation="left" hide domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />
                    <Tooltip />
                    <ReferenceLine yAxisId="left" x="26.01" stroke="#94a3b8" strokeDasharray="5 5" label={{ value: '현재', fill: '#94a3b8', fontSize: 10 }} />
                    <Line isAnimationActive={false} yAxisId="left" type="monotone" dataKey="EU-ETS" stroke={MARKET_DATA['EU-ETS'].color} strokeWidth={planningMarket === 'EU-ETS' ? 4 : 2} strokeOpacity={planningMarket === 'EU-ETS' ? 1 : 0.8} dot={planningMarket === 'EU-ETS' ? { r: 4 } : false} />
                    <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="K-ETS" stroke={MARKET_DATA['K-ETS'].color} strokeWidth={planningMarket === 'K-ETS' ? 4 : 2} strokeOpacity={planningMarket === 'K-ETS' ? 1 : 0.8} dot={planningMarket === 'K-ETS' ? { r: 4 } : false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="flex flex-col lg:flex-row gap-6 pb-8">
              {/* Left: Smart Tranche Planner Table */}
              <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">스마트 분할 매수 플래너 (Tranche Planner)</h3>
                    <p className="text-sm text-slate-500">변동성 기반 매수 전략 제안</p>
                  </div>
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-emerald-500/20">
                    <Plus size={18} /> 추가
                  </button>
                </div>
                <div className="overflow-x-auto p-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">전략 날짜</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">물량 (tCO2)</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">목표가</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">시장</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">실행</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tranches.filter(t => t.market === planningMarket).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-sm font-medium text-slate-900">{t.month}</td>
                          <td className="p-3 text-sm text-slate-900 font-mono">{(totalExposure * (t.percentage / 100)).toLocaleString()}</td>
                          <td className="p-3 text-sm text-slate-900 font-semibold">₩{t.price.toLocaleString()}</td>
                          <td className="p-3 text-sm text-slate-500">{t.market}</td>
                          <td className="p-3">
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", t.isFuture ? "bg-amber-50 text-amber-700" : "bg-emerald-500/10 text-emerald-600")}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", t.isFuture ? "bg-amber-500" : "bg-emerald-500")}></span>
                              {t.isFuture ? '대기' : '완료'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 hover:text-emerald-500 cursor-pointer">
                            <MoreHorizontal size={18} />
                          </td>
                        </tr>
                      ))}
                      {tranches.filter(t => t.market === planningMarket).length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            <MousePointer2 size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">차트를 클릭하여 매수 계획을 추가하세요</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Financial Diagnosis */}
              <div className="w-full lg:w-[32%] bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col justify-between text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck className="text-emerald-400" size={24} />
                    <h3 className="text-lg font-bold">재무 건전성 진단</h3>
                  </div>
                  <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <label className="text-slate-300">예산 배정 (Budget)</label>
                        <span className="font-mono text-emerald-400">{simBudget}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={simBudget} onChange={(e) => setSimBudget(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>보수적</span><span>공격적</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <label className="text-slate-300">리스크 허용범위 (Risk)</label>
                        <span className="font-mono text-emerald-400">{simRisk < 33 ? '낮음' : simRisk < 66 ? '중간' : '높음'}</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={simRisk} onChange={(e) => setSimRisk(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>저변동성</span><span>고수익</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">총 예산</p>
                      <p className="text-xl font-bold">₩{simBudget}억</p>
                    </div>
                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs text-slate-400 mb-1">예상 절감액</p>
                      <div className="flex items-end gap-1">
                        <p className="text-xl font-bold text-emerald-400">₩{Math.round(simBudget * 0.12)}억</p>
                        <p className="text-[10px] text-slate-400 mb-1">(12%)</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-slate-300 flex items-center gap-1">
                      <CheckCircle className="text-emerald-400" size={14} />
                      전략이 안전 마진 내에 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Target Tab */}
        {activeTab === 'target' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">SBTi Target Management</h2>
              <p className="text-slate-500 text-sm">기업 탄소 감축 목표 및 진행 현황 관리</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Target Setting Card */}
              <Card padding="lg" className="rounded-[40px] space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={20} className="text-emerald-500" />
                  <h3 className="text-lg font-black">감축 목표 설정</h3>
                </div>
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-600 uppercase">Target 2030</span>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-3xl font-black text-emerald-600">-58%</p>
                    <p className="text-[10px] text-slate-400 mt-1">Scope 1/2 기준</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-600 uppercase">Target 2050</span>
                      <Badge variant="blue">Planned</Badge>
                    </div>
                    <p className="text-3xl font-black text-blue-600">Net Zero</p>
                    <p className="text-[10px] text-slate-400 mt-1">전 Scope 대상</p>
                  </div>
                </div>
              </Card>

              {/* Progress Overview */}
              <Card padding="lg" className="lg:col-span-2 rounded-[40px]">
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                  <Flag size={20} className="text-emerald-500" />
                  목표 달성 현황
                </h3>
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-3xl border border-emerald-100">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">현재 진행률</p>
                        <p className="text-4xl font-black text-emerald-600">42.3%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase">목표 대비</p>
                        <p className="text-lg font-black text-slate-800">58% 중 24.5% 달성</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/50 h-4 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: '42.3%' }} />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                      <span>2022 Baseline</span>
                      <span>현재</span>
                      <span>2030 Target</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                      <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                      <p className="text-xl font-black">3</p>
                      <p className="text-[10px] text-slate-400">완료 이니셔티브</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                      <Activity size={24} className="text-blue-500 mx-auto mb-2" />
                      <p className="text-xl font-black">5</p>
                      <p className="text-[10px] text-slate-400">진행중</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                      <AlertCircle size={24} className="text-orange-500 mx-auto mb-2" />
                      <p className="text-xl font-black">2</p>
                      <p className="text-[10px] text-slate-400">주의 필요</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Reduction Initiatives */}
            <Card padding="lg" className="rounded-[40px]">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <Scale size={20} className="text-emerald-500" />
                감축 이니셔티브 현황
              </h3>
              <div className="space-y-4">
                {[
                  { name: '재생에너지 조달 확대', target: '30,000t', progress: 85, status: 'on-track' },
                  { name: '공정 효율화 프로젝트', target: '15,000t', progress: 62, status: 'on-track' },
                  { name: '전기차 전환', target: '5,000t', progress: 45, status: 'delayed' },
                  { name: 'LED 조명 교체', target: '2,000t', progress: 100, status: 'completed' },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm",
                      item.status === 'completed' ? 'bg-emerald-500' :
                        item.status === 'on-track' ? 'bg-blue-500' : 'bg-orange-500'
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">{item.name}</span>
                        <span className="text-xs text-slate-400">{item.target} 목표</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-500",
                          item.status === 'completed' ? 'bg-emerald-500' :
                            item.status === 'on-track' ? 'bg-blue-500' : 'bg-orange-500'
                        )} style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                    <span className={cn("text-sm font-black",
                      item.status === 'completed' ? 'text-emerald-500' :
                        item.status === 'on-track' ? 'text-blue-500' : 'text-orange-500'
                    )}>{item.progress}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Investment Tab */}
        {activeTab === 'investment' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-6 mb-4">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <span className="text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer">전략 (Strategy)</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-medium">페이지 5: 투자 전략</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    투자 전략: <span className="text-emerald-500">녹색 설비투자(CAPEX) 배분</span>
                  </h2>
                  <p className="text-slate-500 text-base max-w-2xl">
                    부채 대비 7,621억 원 규모의 녹색 투자 계획에 대한 전략적 분석입니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50">
                    <Printer size={20} /> 리포트 출력
                  </Button>
                  <Button className="gap-2 shadow-lg shadow-emerald-500/25 bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Share2 size={20} /> 전략 내보내기
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Left Panel: Simulation Controls (3 Cols) */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 h-full flex flex-col shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <SlidersHorizontal className="text-emerald-500" size={20} />
                    <h3 className="text-lg font-bold text-slate-900">시뮬레이션 변수</h3>
                  </div>
                  <div className="flex flex-col gap-8 flex-1">
                    {/* Slider 1 - Carbon Tax Rate */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-medium text-slate-500">탄소세율 (Tax Rate)</label>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">₩{investCarbonPrice.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ 톤</span></span>
                      </div>
                      <input
                        type="range" min="10000" max="100000" step="1000" value={investCarbonPrice} onChange={(e) => setInvestCarbonPrice(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between mt-1 text-[10px] text-slate-400 uppercase tracking-wider">
                        <span>보수적</span><span>공격적</span>
                      </div>
                    </div>
                    {/* Slider 2 - Energy Savings */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-medium text-slate-500">에너지 절감률</label>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{investEnergySavings}% <span className="text-xs text-slate-400 font-normal">YoY</span></span>
                      </div>
                      <input
                        type="range" min="0" max="30" step="0.5" value={investEnergySavings} onChange={(e) => setInvestEnergySavings(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    {/* Slider 3 - Discount Rate */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-medium text-slate-500">할인율 (Discount)</label>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{investDiscountRate}%</span>
                      </div>
                      <input
                        type="range" min="1" max="10" step="0.1" value={investDiscountRate} onChange={(e) => setInvestDiscountRate(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    {/* Slider 4 - Timeline */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-medium text-slate-500">이행 기간 (Timeline)</label>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{investTimeline} 년</span>
                      </div>
                      <input
                        type="range" min="1" max="10" step="1" value={investTimeline} onChange={(e) => setInvestTimeline(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <button onClick={() => { setInvestCarbonPrice(45000); setInvestEnergySavings(12.5); setInvestDiscountRate(4.2); setInvestTimeline(5); }} className="w-full py-2.5 rounded-lg border border-emerald-500 text-emerald-500 font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
                      <RotateCcw size={18} /> 시뮬레이션 초기화
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Panel: Visualizations (6 Cols) */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                {/* Hero Stat Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <Coins size={120} className="text-emerald-500" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider">승인됨 (Approved)</span>
                      <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">총 녹색 투자액 (Total Green CAPEX)</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{(investTotalAmount / 100000000).toLocaleString()}</h2>
                      <span className="text-xl font-bold text-slate-400">억 원 (KRW)</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">재생에너지 전환 및 탄소 포집 기술(CCUS) 도입을 위해 배정됨.</p>
                  </div>
                </div>

                {/* Charts Container */}
                <div className="flex-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-8">
                  {/* Bar Chart Section */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-bold text-slate-900">부채(Risk) vs 투자(Action)</h3>
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-slate-500">투자 (Investment)</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-400"></div><span className="text-slate-500">리스크 부채 (Risk Liability)</span></div>
                      </div>
                    </div>
                    <div className="relative flex-1 min-h-[180px] flex items-end justify-center gap-16 pb-6 border-b border-slate-100">
                      {/* Bar 1: Investment */}
                      <div className="flex flex-col items-center gap-2 w-24 group z-10 relative cursor-pointer">
                        <span className="text-sm font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">{(investmentAnalysis.investmentCost / 100000000).toFixed(0)}억</span>
                        <div className="w-full bg-emerald-500 rounded-t-lg relative hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20" style={{ height: '140px' }}></div>
                        <span className="text-xs font-bold text-slate-500 mt-2 text-center">녹색 설비투자<br />(Action)</span>
                      </div>
                      {/* Bar 2: Risk */}
                      <div className="flex flex-col items-center gap-2 w-24 group z-10 relative cursor-pointer">
                        <span className="text-sm font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">{(investmentAnalysis.liabilityCost / 100000000).toFixed(0)}억</span>
                        <div className="w-full bg-slate-300 rounded-t-lg relative hover:brightness-95 transition-all" style={{ height: `${Math.min(200, (investmentAnalysis.liabilityCost / investmentAnalysis.investmentCost) * 140)}px` }}>
                          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '8px 8px' }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 mt-2 text-center">환경 부채<br />(Inaction)</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Chart Section */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-bold text-slate-900">손익분기점 도달 시기 (Break-even)</h3>
                      <span className="text-xs font-bold bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded">4.5년 후 전환</span>
                    </div>
                    <div className="relative w-full h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={Array.from({ length: 11 }, (_, i) => ({
                          year: i,
                          cost: 100,
                          savings: 10 + (i * i * 1.5)
                        }))}>
                          <defs>
                            <linearGradient id="gradientSavings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis hide />
                          <Tooltip />
                          <Line type="monotone" dataKey="cost" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                          <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={3} fill="url(#gradientSavings)" />
                          <ReferenceLine x={4.5} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'BEP', position: 'top', fill: '#10b981', fontSize: 10, fontWeight: 700 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Verdict & KPIs (3 Cols) */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                {/* Verdict Card */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-emerald-500/30">
                    <ThumbsUp size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">재무적 판단 (Verdict)</h3>
                  <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-4 shadow-sm">
                    강력 매수 (Strong Buy)
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    시뮬레이션 결과 매우 긍정적입니다. 5년 차부터 리스크 헷징 효과가 구현 비용을 상회합니다.
                  </p>
                </div>

                {/* KPI Cards Stack */}
                <div className="flex flex-col gap-4">
                  {/* ROI */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">투자수익률 (ROI 10yr)</p>
                      <p className="text-2xl font-black text-emerald-500">+{investmentAnalysis.roi}%</p>
                    </div>
                    <TrendingUp size={32} className="text-emerald-500/30" />
                  </div>
                  {/* Payback */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">회수 기간 (Payback)</p>
                      <p className="text-2xl font-black text-slate-900">{investmentAnalysis.payback} <span className="text-sm font-medium text-slate-400">년</span></p>
                    </div>
                    <Clock size={32} className="text-slate-300" />
                  </div>
                  {/* NPV */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">순현재가치 (NPV)</p>
                      <p className="text-2xl font-black text-slate-900">{(investmentAnalysis.netBenefit / 100000000).toFixed(0)} <span className="text-sm font-medium text-slate-400">억 원</span></p>
                    </div>
                    <Wallet size={32} className="text-slate-300" />
                  </div>
                </div>

                {/* Analyst Insight */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex-1 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="text-amber-500" size={20} />
                    <h4 className="text-sm font-bold text-slate-900">분석가 인사이트</h4>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    이 CAPEX 배분은 인프라 현대화와 동시에 2026년 예상되는 탄소세 인상에 대비하는 이중 목적(Dual-purpose) 전략으로 작용합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Bot */}
      <div className={cn("fixed bottom-8 right-8 z-50 transition-all duration-500", isChatOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none')}>
        <div className="bg-white w-[400px] h-[600px] rounded-[40px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3"><div className="bg-emerald-500 p-2 rounded-xl shadow-lg"><MessageSquare size={18} /></div><span className="font-black text-sm uppercase tracking-tighter">Strategic Intelligence</span></div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn("max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm leading-relaxed", msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-100')}>{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100 flex gap-3">
            <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="분석관에게 조언을 구하세요..." className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium" />
            <Button type="submit" className="shadow-lg shadow-emerald-500/20"><Send size={20} /></Button>
          </form>
        </div>
      </div>

      {!isChatOpen && (
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-10 right-10 bg-slate-900 text-white p-5 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-3 z-40 group">
          <Activity size={24} className="text-emerald-400 group-hover:animate-pulse" />
          <span className="font-black pr-2 text-sm uppercase tracking-widest text-nowrap">전략 분석</span>
        </button>
      )}
    </div>
  );
}

export default App;
