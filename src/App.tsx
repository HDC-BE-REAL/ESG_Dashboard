import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, ComposedChart, Line, Area, AreaChart, PieChart, Pie,
  ReferenceLine, Scatter, Label
} from 'recharts';
import {
  Leaf, TrendingUp, TrendingDown, MessageSquare, Send, FileText, X,
  BarChart3, Zap, Calculator, Activity, Filter, Award, BarChart4,
  History, Trash2, MousePointer2, CheckCircle2, Globe, AlertCircle,
  MoreHorizontal, ArrowRight, Coins, LayoutGrid, Target, Flag, CalendarCheck,
  LineChart as LineChartIcon, Quote, Lock, Briefcase, Scale, TrendingUp as TrendingUpIcon,
  ChevronRight, Info, Cloud, Euro, CheckCircle, Download, Star, Lightbulb, Check,
  PoundSterling, Trees, Plus, ShieldCheck, SlidersHorizontal, AlertTriangle, Bot, Sparkles, ArrowDown,
  Printer, Share2, RotateCcw, ThumbsUp, Clock, Wallet, Database, ChevronDown, ChevronUp
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * ==============================================================================
 * 1. Utilities & CVA Configuration
 * ==============================================================================
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatting Function for Korean Won
const formatKRW = (value: number) => {
  return (value / 100000000).toFixed(1) + "억원";
};

// Helper for billions format in text
const formatBillions = (value: number) => {
  return (value / 100000000).toFixed(0) + "억 원";
};

// Custom Tooltip Component (Glassmorphism)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-xl shadow-2xl text-xs z-50">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 justify-between min-w-[120px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500 font-medium capitalize">{entry.name}</span>
            </div>
            <span className="font-bold text-slate-900 font-mono">
              {entry.name === 'EU-ETS' ? '€' : (entry.name === 'UK-ETS' ? '£' : '₩')}
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b77f] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#10b77f] hover:bg-[#0e9f6e] text-white shadow-lg shadow-[#10b77f]/20",
        destructive: "text-slate-400 hover:text-red-500 hover:bg-red-50",
        outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-500",
        tab: "text-slate-400 hover:text-slate-700 font-medium",
        tabActive: "bg-white text-[#10b77f] shadow-sm ring-1 ring-slate-100 font-bold",

        // Market Specific Buttons
        marketK: "text-slate-500 hover:bg-emerald-50 hover:text-[#10b77f]",
        marketKActive: "bg-[#10b77f]/10 text-[#10b77f] ring-1 ring-[#10b77f]/30",
        marketEU: "text-slate-500 hover:bg-blue-50 hover:text-blue-600",
        marketEUActive: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3",
        xs: "h-7 rounded-lg px-2 text-[10px]",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const cardVariants = cva(
  "rounded-[24px] border border-slate-100 shadow-sm bg-white overflow-hidden transition-all relative group hover:shadow-md duration-300",
  {
    variants: {
      variant: {
        default: "bg-white",
        dark: "bg-[#10221c] text-white border-[#1a2e28]", // Dark theme from reference
        blue: "bg-[#615CEB] text-white border-[#615CEB] shadow-blue-500/20",
        hoverable: "hover:scale-[1.02] cursor-pointer border-transparent hover:border-[#10b77f]/30",
        active: "ring-2 ring-[#10b77f] border-[#10b77f] shadow-lg scale-[1.02]",
        inactive: "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 cursor-pointer border-dashed bg-slate-50",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    }
  }
);

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ring-inset tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-slate-50 text-slate-600 ring-slate-200",
        success: "bg-[#e7fdf0] text-[#0e9f6e] ring-[#0e9f6e]/20",
        warning: "bg-orange-50 text-orange-700 ring-orange-600/20",
        blue: "bg-blue-50 text-blue-700 ring-blue-700/10",
        purple: "bg-purple-50 text-purple-700 ring-purple-700/10",
        amber: "bg-amber-50 text-amber-700 ring-amber-700/10",
        top: "bg-blue-500 text-white ring-blue-500 shadow-sm shadow-blue-200",
        me: "bg-slate-800 text-white ring-slate-800 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { }
const Button = ({ className, variant, size, ...props }: ButtonProps) => <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> { }
const Card = ({ className, variant, padding, ...props }: CardProps) => <div className={cn(cardVariants({ variant, padding, className }))} {...props} />;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> { }
const Badge = ({ className, variant, ...props }: BadgeProps) => <span className={cn(badgeVariants({ variant, className }))} {...props} />;

/**
 * ==============================================================================
 * 2. Types & Data Structures
 * ==============================================================================
 */

type TabType = 'dashboard' | 'compare' | 'simulator' | 'target' | 'investment';
type MarketType = 'K-ETS' | 'EU-ETS';
type IntensityType = 'revenue' | 'production';
type TimeRangeType = '1개월' | '3개월' | '1년' | '전체';

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
  intensityValue?: number;
}

interface TrendData {
  date: string;
  type: 'actual' | 'forecast';
  'K-ETS'?: number;
  'EU-ETS'?: number;
  month?: string;
}

interface Tranche {
  id: number;
  market: MarketType;
  price: number;
  month: string;
  isFuture: boolean;
  percentage: number;
}

interface MarketInfo {
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

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const MARKET_DATA: Record<MarketType, MarketInfo> = {
  'K-ETS': { id: 'K-ETS', name: '한국', ticker: 'KAU25', price: 15450, currency: 'KRW', change: 1.2, color: '#10b77f', desc: 'KAU25 할당배출권', high: 16500, low: 13800, volatility: 'Low' },
  'EU-ETS': { id: 'EU-ETS', name: '유럽 통합', ticker: 'EUA', price: 74.50, currency: 'EUR', change: -0.5, color: '#a5d8ff', desc: '글로벌 벤치마크', high: 76.20, low: 72.80, volatility: 'High' },
};

/**
 * ==============================================================================
 * 3. Main Application Component
 * ==============================================================================
 */

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [intensityType, setIntensityType] = useState<IntensityType>('revenue');
  const [activeScopes, setActiveScopes] = useState({ s1: true, s2: true, s3: false });

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
  const [activeMarkets, setActiveMarkets] = useState<MarketType[]>(['K-ETS', 'EU-ETS']);

  // Investment State
  const [investTotalAmount, setInvestTotalAmount] = useState<number>(762100000000);
  const [investCarbonPrice, setInvestCarbonPrice] = useState<number>(45000);
  const [investTechCost, setInvestTechCost] = useState<number>(85000);

  const [investEnergySavings, setInvestEnergySavings] = useState<number>(12.5);
  const [investDiscountRate, setInvestDiscountRate] = useState<number>(4.2);
  const [investTimeline, setInvestTimeline] = useState<number>(5);

  const [selectedCompId, setSelectedCompId] = useState<number>(1);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{ role: string, text: string }[]>([
    { role: 'assistant', text: '탄소 경영 대시보드에 오신 것을 환영합니다. 무엇을 도와드릴까요?' }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  // UI State
  const [isInsightOpen, setIsInsightOpen] = useState<boolean>(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const EXPOSURE_RATIO = { K: 0.7, EU: 0.3 };

  const competitors: Competitor[] = [
    { id: 1, name: "우리 기업", s1: 75000, s2: 45000, s3: 120000, allowance: 100000, revenue: 5000, production: 1000000, trustScore: 95, trajectory: [{ year: '22', v: 145000 }, { year: '23', v: 130000 }, { year: '24', v: 125000 }, { year: '25', v: 120000 }] },
    { id: 2, name: "A사 (Top)", s1: 45000, s2: 40000, s3: 85000, allowance: 95000, revenue: 4800, production: 1200000, trustScore: 88, trajectory: [{ year: '22', v: 110000 }, { year: '23', v: 100000 }, { year: '24', v: 95000 }, { year: '25', v: 85000 }] },
    { id: 3, name: "B사 (Peer)", s1: 95000, s2: 65000, s3: 150000, allowance: 110000, revenue: 5200, production: 900000, trustScore: 62, trajectory: [{ year: '22', v: 165000 }, { year: '23', v: 164000 }, { year: '24', v: 163000 }, { year: '25', v: 160000 }] },
    { id: 4, name: "C사 (Peer)", s1: 55000, s2: 42000, s3: 98000, allowance: 105000, revenue: 5100, production: 1100000, trustScore: 82, trajectory: [{ year: '22', v: 105000 }, { year: '23', v: 102000 }, { year: '24', v: 100000 }, { year: '25', v: 97000 }] }
  ];

  const industryBenchmarks = { revenue: { top10: 15.2, median: 22.5 }, production: { top10: 65.0, median: 92.4 } };

  // --- Effects: Generate 2023-2026 Data ---
  useEffect(() => {
    const generateData = () => {
      const data: TrendData[] = [];
      const startDate = new Date('2023-01-01');
      const today = new Date();
      const endDate = new Date('2026-12-31');

      let kauPrice = 13500;
      let euaPrice = 85.0;

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) continue;

        const dateStr = d.toISOString().split('T')[0];
        const isFuture = d > today;

        let kChange = (Math.random() - 0.5) * 200;
        if (d.getFullYear() === 2023) kChange -= 10;
        if (d.getFullYear() === 2024) kChange += 15;

        let eChange = (Math.random() - 0.5) * 1.5;
        if (d.getFullYear() === 2023 && d.getMonth() > 6) eChange -= 0.2;
        if (d.getFullYear() === 2025) eChange += 0.1;

        kauPrice += kChange;
        euaPrice += eChange;

        kauPrice = Math.max(8000, Math.min(25000, kauPrice));
        euaPrice = Math.max(50, Math.min(100, euaPrice));

        data.push({
          date: dateStr,
          type: isFuture ? 'forecast' : 'actual',
          'K-ETS': Math.round(kauPrice),
          'EU-ETS': Number(euaPrice.toFixed(2))
        });
      }
      return data;
    };

    setFullHistoryData(generateData());
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
  const selectedComp = useMemo(() => competitors.find(c => c.id === selectedCompId) || competitors[0], [selectedCompId]);

  const totalExposure = useMemo(() => {
    return (activeScopes.s1 ? selectedComp.s1 : 0) +
      (activeScopes.s2 ? selectedComp.s2 : 0) +
      (activeScopes.s3 ? selectedComp.s3 : 0) -
      selectedComp.allowance;
  }, [selectedComp, activeScopes]);

  const costK_KRW = totalExposure * MARKET_DATA['K-ETS'].price;
  const costEU_KRW = totalExposure * MARKET_DATA['EU-ETS'].price * 1450;

  const activeTranches = tranches.filter(t => activeMarkets.includes(t.market));
  const totalAllocatedPct = activeTranches.reduce((sum, t) => sum + t.percentage, 0);

  const simCost = activeTranches.reduce((sum, t) => {
    const marketInfo = MARKET_DATA[t.market];
    const exRate = t.market === 'EU-ETS' ? 1450 : 1;
    return sum + (totalExposure * (t.percentage / 100) * t.price * exRate);
  }, 0);

  const vwap = activeTranches.length > 0
    ? activeTranches.reduce((sum, t) => sum + (t.price * t.percentage), 0) / totalAllocatedPct
    : 0;

  const budgetInWon = simBudget * 100000000;
  const estimatedSavings = budgetInWon * (0.1 + (simRisk * 0.002)); // 10% ~ 30% savings based on risk

  const processIntensity = (c: Competitor) => {
    const totalE = (activeScopes.s1 ? c.s1 : 0) + (activeScopes.s2 ? c.s2 : 0) + (activeScopes.s3 ? c.s3 : 0);
    return intensityType === 'revenue' ? totalE / c.revenue : (totalE / c.production) * 1000;
  };

  const chartData = useMemo(() => {
    return competitors.map(c => ({ ...c, intensityValue: processIntensity(c) })).sort((a, b) => (a.intensityValue || 0) - (b.intensityValue || 0));
  }, [intensityType, activeScopes]);

  const topThreshold = industryBenchmarks[intensityType].top10;
  const medianThreshold = industryBenchmarks[intensityType].median;
  const myRank = chartData.findIndex(c => c.id === selectedCompId) + 1;

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

  const sbtiAnalysis = useMemo(() => {
    const baseYear = 2021;
    const currentYear = 2026;
    const targetYear = 2030;
    const netZeroYear = 2050;
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
    // [UPDATED] Real-time Simulation Logic

    // 1. Inputs & Variables
    const revenue = 16730100000000;
    const totalEmissions = 250684;
    const greenInvestment = investTotalAmount;

    // 2. Risk Calculation (Total Risk over Timeline)
    // Risk Liability = Annual Emission * Carbon Price * Timeline (Simplified cumulative risk)
    const annualRisk = totalEmissions * investCarbonPrice;
    const totalRiskLiability = annualRisk * investTimeline;

    // 3. Break-even Analysis
    // Annual Benefit = (Energy Savings + Carbon Tax Savings)
    // Energy Savings = Revenue * 0.05 (Assume 5% energy cost) * (Savings Rate / 100)
    const estimatedEnergyCost = revenue * 0.05; // 5% of revenue is energy
    const annualEnergySavings = estimatedEnergyCost * (investEnergySavings / 100);
    const annualTotalBenefit = annualEnergySavings + annualRisk;

    // Discounted Cash Flow (Simplified NPV)
    let npv = -greenInvestment;
    let cumulativeSavings = 0;
    let paybackPeriod = 0;
    const breakEvenChartData = [];

    // Generate Chart Data (0 to 10 years)
    for (let year = 0; year <= 10; year++) {
      let savingsThisYear = 0;
      if (year > 0) {
        // Apply discount rate
        savingsThisYear = annualTotalBenefit / Math.pow(1 + (investDiscountRate / 100), year);
        cumulativeSavings += savingsThisYear;
        npv += savingsThisYear;

        // Calculate Payback Period (Exact crossing point)
        if (cumulativeSavings >= greenInvestment && paybackPeriod === 0) {
          const prevSavings = cumulativeSavings - savingsThisYear;
          const remaining = greenInvestment - prevSavings;
          paybackPeriod = (year - 1) + (remaining / savingsThisYear);
        }
      }

      breakEvenChartData.push({
        year: `Y${year}`,
        investment: greenInvestment, // Constant Investment Line
        savings: Math.round(cumulativeSavings), // Cumulative Savings Curve
      });
    }

    const roi = ((cumulativeSavings - greenInvestment) / greenInvestment) * 100;
    const isInvestFavorable = npv > 0;

    // Adjust logic for 'Liability vs Investment' chart
    // We want the 'Liability' bar to react to timeline and carbon price
    const liabilityChartData = [
      { name: 'Investment', value: greenInvestment, fill: '#10b77f' },
      { name: 'Risk Liability', value: totalRiskLiability, fill: '#94a3b8' } // 10-year risk or Timeline risk? using Timeline
    ];

    return {
      targetYear: 2030,
      totalEmissions,
      liabilityCost: totalRiskLiability, // Updated to cumulative
      investmentCost: greenInvestment,
      netBenefit: npv,
      isInvestFavorable,
      roi: roi.toFixed(1),
      payback: paybackPeriod > 0 ? paybackPeriod.toFixed(1) : "> 10",
      chartData: breakEvenChartData, // Line/Area chart data
      liabilityChartData, // Bar chart data
      annualTotalBenefit
    };
  }, [investTotalAmount, investCarbonPrice, investEnergySavings, investDiscountRate, investTimeline]);

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const point = data.activePayload[0].payload as TrendData;
      const price = point[selectedMarket] as number;
      const remaining = 100 - totalAllocatedPct;
      if (remaining <= 0) return;
      const newTranche: Tranche = { id: Date.now(), market: selectedMarket, price: price, month: point.month || '26.01', isFuture: point.type === 'forecast', percentage: Math.min(10, remaining) };
      setTranches([...tranches, newTranche]);
    }
  };

  const updateTranchePercentage = (id: number, val: string) => {
    const value = parseInt(val, 10) || 0;
    const otherSum = tranches.filter(t => t.id !== id && activeMarkets.includes(t.market)).reduce((sum, t) => sum + t.percentage, 0);
    setTranches(tranches.map(t => t.id === id ? { ...t, percentage: Math.min(value, 100 - otherSum) } : t));
  };

  const removeTranche = (id: number) => setTranches(tranches.filter(t => t.id !== id));

  const toggleMarket = (id: MarketType) => {
    setSelectedMarket(id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const userText = inputMessage;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputMessage('');
    setTimeout(() => {
      let aiResponse = '';
      if (userText.includes('전략') || userText.includes('추천')) {
        const volatility = MARKET_DATA[selectedMarket].volatility;
        aiResponse = volatility === 'High'
          ? `[${MARKET_DATA[selectedMarket].name} 전략] 현재 시장 변동성이 높습니다. 분할 매수(Tranche)를 추천합니다.`
          : `[${MARKET_DATA[selectedMarket].name} 전략] 시장이 안정적입니다. 목표 물량을 조기 확보하세요.`;
      } else {
        aiResponse = `${selectedMarket} 시장 데이터를 분석 중입니다. "구매 전략 알려줘"라고 물어보세요.`;
      }
      setChatMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
    }, 800);
  };

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [chatMessages]);

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

      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl text-[#10b77f]"><Leaf size={24} /></div>
          <span className="text-xl font-bold tracking-tight text-slate-800">ESG OS</span>
        </div>
        <div className="flex bg-slate-100/50 p-1 rounded-xl">
          {tabs.map(t => (
            <Button key={t.id} variant={activeTab === t.id ? 'tabActive' : 'tab'} onClick={() => setActiveTab(t.id)}>{t.label}</Button>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">

        {/* --- Dashboard Tab --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* KPI Cards Section */}
            {/* ... (Same as before) ... */}
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
                <p className="text-sm font-medium text-slate-500">무상 할당량 소진율</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{((selectedComp.allowance / (selectedComp.s1 + selectedComp.s2)) * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-400 mt-2">할당량 활용 (Utilization)</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Pie Chart (Scope Contribution) - Width 4/12 */}
              <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-slate-900 text-lg font-bold">Scope별 배출 기여도</h3>
                  <button className="text-slate-400 hover:text-[#10b77f] transition-colors"><MoreHorizontal size={20} /></button>
                </div>
                <div className="flex-1 w-full min-h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'Scope 1', value: selectedComp.s1, color: '#0da559' }, { name: 'Scope 2', value: selectedComp.s2, color: '#86efac' }, { name: 'Scope 3', value: selectedComp.s3, color: '#dcfce7' }]}
                        dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} cornerRadius={6}
                      >
                        <Cell fill="#0da559" /> {/* Scope 1 - Primary Green */}
                        <Cell fill="#86efac" /> {/* Scope 2 - Pastel Green */}
                        <Cell fill="#dcfce7" /> {/* Scope 3 - Lightest */}
                        <Label
                          value="100%"
                          position="center"
                          className="text-3xl font-black fill-slate-900"
                          style={{ fontSize: '24px', fontWeight: '900' }}
                        />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        layout="vertical"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        content={({ payload }) => (
                          <div className="grid grid-cols-1 gap-2 mt-2 w-full">
                            {payload?.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between py-1 px-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer w-full">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                  <span className="text-sm font-medium text-slate-700">{entry.value}</span>
                                </div>
                                <span className="text-base font-normal text-slate-900">
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
                      <div className="w-3 h-0.5 bg-[#10b77f] rounded-full"></div>
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
                      <Tooltip content={<CustomTooltip />} />

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

        {/* --- Compare Tab --- */}
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
                      className={cn("relative flex items-center justify-center rounded-lg text-sm font-medium transition-all", intensityType === 'revenue' ? "bg-[#10b77f]/10 text-[#10b77f] ring-1 ring-[#10b77f]" : "text-slate-500 hover:bg-slate-50")}
                    >
                      매출액 (Revenue)
                    </button>
                    <button
                      onClick={() => setIntensityType('production')}
                      className={cn("relative flex items-center justify-center rounded-lg text-sm font-medium transition-all", intensityType === 'production' ? "bg-[#10b77f]/10 text-[#10b77f] ring-1 ring-[#10b77f]" : "text-slate-500 hover:bg-slate-50")}
                    >
                      생산량 (Production)
                    </button>
                  </div>
                </div>

                {/* Rankings */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">경쟁사 순위</h3>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">실시간 데이터</span>
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
                            isSelected ? "ring-2 ring-offset-2 ring-[#10b77f]/50" : "hover:shadow-md",
                            isMe
                              ? (isSelected ? "border-[#10b77f] bg-[#10b77f]/10" : "border-[#10b77f]/50 bg-[#10b77f]/5")
                              : (isSelected ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white")
                          )}
                        >
                          <div className={cn("flex items-center justify-center size-8 rounded-full font-bold text-sm transition-colors",
                            isMe ? "bg-[#10b77f] text-white shadow-sm" : (isSelected ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600")
                          )}>
                            {isMe ? <Star size={14} fill="white" /> : idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                              {comp.name}
                              {isMe && <span className="text-[10px] text-[#10b77f] bg-[#10b77f]/10 px-1.5 py-0.5 rounded font-bold">Me</span>}
                            </h4>
                            <p className={cn("text-xs", isMe ? "text-[#10b77f] font-medium" : "text-slate-400")}>
                              {isMe ? "현재 성과" : "글로벌 피어"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={cn("block text-lg font-bold", isMe ? "text-[#10b77f]" : "text-slate-900")}>
                              {comp.intensityValue?.toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-500">tCO2e</span>
                          </div>
                          {isSelected && <div className="absolute right-0 top-0 p-1.5"><div className="w-2 h-2 rounded-full bg-[#10b77f]"></div></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: Chart */}
              <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
                <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 lg:p-8 flex flex-col relative shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">탄소 집약도 비교 (Intensity Comparison)</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-sm text-slate-500">{intensityType === 'revenue' ? '매출액' : '생산량'} 기준 집약도</p>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <div className="flex gap-1">
                          {(['s1', 's2', 's3'] as const).map(scope => (
                            <button
                              key={scope}
                              onClick={() => setActiveScopes(prev => ({ ...prev, [scope]: !prev[scope] }))}
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border",
                                activeScopes[scope]
                                  ? "bg-[#10b77f]/10 text-[#10b77f] border-[#10b77f]/30"
                                  : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              {scope.replace('s', 'S')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex gap-4 text-xs font-medium">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#10b77f] rounded-sm"></div>자사 (Our Co)</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 rounded-sm"></div>선택됨</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 rounded-sm"></div>기타</div>
                    </div>
                  </div>

                  {/* Recharts Implementation */}
                  <div className="flex-1 w-full min-h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barSize={60}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <ReferenceLine y={topThreshold} stroke="#10b77f" strokeDasharray="3 3">
                          <Label value={`상위 10% (${topThreshold})`} position="right" fill="#10b77f" fontSize={11} fontWeight={700} />
                        </ReferenceLine>
                        <ReferenceLine y={medianThreshold} stroke="#94a3b8" strokeDasharray="5 5">
                          <Label value={`중앙값 (${medianThreshold})`} position="right" fill="#94a3b8" fontSize={11} fontWeight={700} />
                        </ReferenceLine>
                        <Bar dataKey="intensityValue" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => {
                            const isMe = entry.id === 1;
                            const isSelected = entry.id === selectedCompId;
                            let fillColor = '#cbd5e1'; // Default Gray

                            if (isMe) {
                              fillColor = isSelected ? '#059669' : '#10b77f'; // Darker green if selected
                            } else if (isSelected) {
                              fillColor = '#1e293b'; // Dark Slate for selected competitor
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
            <div className="w-full transition-all duration-300">
              {isInsightOpen ? (
                <div className="bg-[#111814] text-white rounded-xl p-6 lg:p-8 flex flex-col md:flex-row gap-6 md:items-start shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none bg-gradient-to-l from-[#10b77f] to-transparent"></div>

                  <div className="flex-shrink-0 bg-white/10 p-3 rounded-lg text-[#10b77f]">
                    <Lightbulb size={24} />
                  </div>

                  <div className="flex-1 flex flex-col gap-2 relative z-10">
                    {/* Title & Content */}
                    <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                      전략적 인사이트: 효율성 격차 (Efficiency Gap)
                      <span className="text-[10px] font-bold bg-[#10b77f]/20 text-[#10b77f] px-2 py-0.5 rounded-full border border-[#10b77f]/30">조치 필요 (Action Required)</span>
                    </h3>
                    <p className="text-slate-300 leading-relaxed max-w-3xl text-sm">
                      <strong className="text-white">우리 기업</strong>은 현재 업계 평균(Median)을 상회하고 있으나, 상위 10% 진입을 위해서는 생산 집약도의 <span className="text-[#10b77f] font-bold">15% 추가 감축</span>이 필요합니다.
                      선두 기업(A사)의 주요 경쟁력은 40% 더 높은 <span className="text-white underline decoration-[#10b77f]/50 decoration-2 underline-offset-4">재생에너지 전환율</span>에서 기인합니다.
                    </p>
                  </div>

                  <div className="flex flex-col justify-center min-w-[140px] gap-2 relative z-10">
                    <button className="bg-[#10b77f] hover:bg-[#0e9f6e] text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#10b77f]/20">
                      세부 실행 계획
                      <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => setIsInsightOpen(false)}
                      className="text-slate-400 hover:text-white text-sm font-medium py-1 px-4 text-center transition-colors flex items-center justify-center gap-1"
                    >
                      접기 <ChevronUp size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center animate-in fade-in zoom-in-95 duration-300">
                  <button
                    onClick={() => setIsInsightOpen(true)}
                    className="bg-[#111814] text-white hover:bg-slate-800 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold transition-all hover:scale-105 border border-slate-700"
                  >
                    <Lightbulb size={16} className="text-[#10b77f]" />
                    전략적 인사이트 보기 (Efficiency Gap)
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Simulator Tab --- */}
        {activeTab === 'simulator' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(MARKET_DATA).map((market) => {
                const isActive = selectedMarket === market.id;
                return (
                  <Card
                    key={market.id}
                    variant={isActive ? 'active' : 'hoverable'}
                    onClick={() => toggleMarket(market.id as MarketType)}
                    className="cursor-pointer bg-white p-5 border border-slate-100 shadow-sm"
                    padding="none"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {market.id === 'EU-ETS' && <Euro size={20} className="text-slate-500" />}
                        {market.id === 'K-ETS' && <Globe size={20} className="text-slate-500" />}
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

            <Card padding="lg" className="relative overflow-hidden bg-white border border-slate-100">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">글로벌 가격 동향 (Global Price Trend)</h3>
                  <p className="text-sm text-slate-500">다중 시장 수렴 분석 (Convergence Analysis)</p>
                  <div className="flex gap-2 mt-2">
                    <p className="text-[10px] text-[#10b77f] font-bold bg-[#10b77f]/10 w-fit px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Database size={10} /> Source: EEX & KRX Data
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex gap-3 text-xs font-medium">
                    <div className={cn("flex items-center gap-1.5 transition-opacity", selectedMarket === 'K-ETS' ? "opacity-100 font-bold text-slate-900" : "opacity-40 text-slate-400")}><span className="w-2 h-2 rounded-full bg-[#10b77f]"></span> K-ETS</div>
                    <div className={cn("flex items-center gap-1.5 transition-opacity", selectedMarket === 'EU-ETS' ? "opacity-100 font-bold text-slate-900" : "opacity-40 text-slate-400")}><span className="w-2 h-2 rounded-full bg-[#a5d8ff]"></span> EU-ETS</div>
                  </div>
                  <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                  <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                    {(['1개월', '3개월', '1년', '전체'] as const).map(range => (
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
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      tickFormatter={(value) => {
                        if (!value) return '';
                        const d = new Date(value);
                        if (timeRange === '전체' || timeRange === '1년') return `${d.getFullYear()}.${d.getMonth() + 1}`;
                        return `${d.getMonth() + 1}.${d.getDate()}`;
                      }}
                    />

                    {/* Left Axis: EU-ETS (EUR) */}
                    <YAxis yAxisId="left" orientation="left" hide={false} domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#a5d8ff' }} label={{ value: 'EUR', angle: -90, position: 'insideLeft', fill: '#a5d8ff', fontSize: 10 }} />

                    {/* Right Axis: K-ETS (KRW) */}
                    <YAxis yAxisId="right" orientation="right" hide={false} domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#10b77f' }} label={{ value: 'KRW', angle: 90, position: 'insideRight', fill: '#10b77f', fontSize: 10 }} />

                    <Tooltip content={<CustomTooltip />} />
                    {(timeRange !== '1개월') && (
                      <ReferenceLine yAxisId="left" x="2026-01-01" stroke="#94a3b8" strokeDasharray="5 5" label={{ value: '현재', fill: '#94a3b8', fontSize: 10 }} />
                    )}

                    {/* EU-ETS Line on Left Axis */}
                    <Line
                      isAnimationActive={false}
                      yAxisId="left"
                      type="monotone"
                      dataKey="EU-ETS"
                      stroke={MARKET_DATA['EU-ETS'].color}
                      strokeWidth={selectedMarket === 'EU-ETS' ? 3 : 1}
                      strokeOpacity={selectedMarket === 'EU-ETS' ? 1 : 0.4}
                      dot={false}
                    />

                    {/* K-ETS Line on Right Axis */}
                    <Line
                      isAnimationActive={false}
                      yAxisId="right"
                      type="monotone"
                      dataKey="K-ETS"
                      stroke={MARKET_DATA['K-ETS'].color}
                      strokeWidth={selectedMarket === 'K-ETS' ? 3 : 1}
                      strokeOpacity={selectedMarket === 'K-ETS' ? 1 : 0.4}
                      dot={false}
                    />
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
                  <button className="bg-[#10b77f] hover:bg-[#0e9f6e] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-[#10b77f]/20">
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
                      {activeTranches.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-sm font-medium text-slate-900">{t.month}</td>
                          <td className="p-3 text-sm text-slate-900 font-mono">{(totalExposure * (t.percentage / 100)).toLocaleString()}</td>
                          <td className="p-3 text-sm text-slate-900 font-semibold">{t.market === 'EU-ETS' ? '€' : '₩'}{t.price.toLocaleString()}</td>
                          <td className="p-3 text-sm text-slate-500">{t.market}</td>
                          <td className="p-3">
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", t.isFuture ? "bg-amber-50 text-amber-700" : "bg-[#10b77f]/10 text-[#10b77f]")}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", t.isFuture ? "bg-amber-500" : "bg-[#10b77f]")}></span>
                              {t.isFuture ? '대기' : '완료'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 hover:text-[#10b77f] cursor-pointer">
                            <MoreHorizontal size={18} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Financial Diagnosis */}
              <div className="w-full lg:w-[32%] bg-[#102219] rounded-xl shadow-lg p-6 flex flex-col justify-between text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b77f]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck className="text-[#10b77f]" size={24} />
                    <h3 className="text-lg font-bold">재무 건전성 진단</h3>
                  </div>
                  <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <label className="text-slate-300">예산 배정 (Budget)</label>
                        <span className="font-mono text-[#10b77f]">{simBudget}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={simBudget} onChange={(e) => setSimBudget(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>보수적</span><span>공격적</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <label className="text-slate-300">리스크 허용범위 (Risk)</label>
                        <span className="font-mono text-[#10b77f]">{simRisk < 30 ? '낮음' : simRisk < 70 ? '중간' : '높음'}</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={simRisk} onChange={(e) => setSimRisk(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
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
                      <p className="text-xl font-bold">{formatBillions(budgetInWon)}</p>
                    </div>
                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs text-slate-400 mb-1">예상 절감액</p>
                      <div className="flex items-end gap-1">
                        <p className="text-xl font-bold text-[#10b77f]">{formatBillions(estimatedSavings)}</p>
                        <p className="text-[10px] text-slate-400 mb-1">({((estimatedSavings / budgetInWon) * 100).toFixed(1)}%)</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-slate-300 flex items-center gap-1">
                      <CheckCircle className="text-[#10b77f]" size={14} />
                      전략이 안전 마진 내에 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Target Tab --- */}
        {activeTab === 'target' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* ... Same as previous ... */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="flex flex-col justify-between">
                <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">기준 연도 배출량 (2021)</p><p className="text-3xl font-bold text-slate-900">{sbtiAnalysis.baseEmission.toLocaleString()} <span className="text-sm font-medium text-slate-400">t</span></p></div>
                <div className="mt-4 flex items-center gap-1 text-slate-500 text-xs font-bold"><Flag size={14} /> Baseline (S1+S2)</div>
              </Card>
              <Card className="flex flex-col justify-between">
                <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">현재 배출량 (2026)</p><p className="text-3xl font-bold text-slate-900">{sbtiAnalysis.actualEmissionNow.toLocaleString()} <span className="text-sm font-medium text-slate-400">t</span></p></div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold w-fit px-2 py-1 rounded-full bg-[#10b77f]/10 text-[#10b77f]">
                  <TrendingDown size={14} />
                  {sbtiAnalysis.actualReductionPct}% 감축 (vs 2021)
                </div>
              </Card>
              <Card className={cn("flex flex-col justify-between border-2", sbtiAnalysis.isAhead ? "border-[#10b77f]/20 bg-[#10b77f]/5" : "border-red-100 bg-red-50/30")}>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">SBTi 목표 달성도</p><p className={cn("text-3xl font-bold", sbtiAnalysis.isAhead ? "text-[#10b77f]" : "text-red-600")}>{sbtiAnalysis.isAhead ? '초과 달성' : '미달'}</p>
                </div>
                <div className={cn("mt-4 text-xs font-bold flex items-center gap-1", sbtiAnalysis.isAhead ? "text-[#10b77f]" : "text-red-500")}>
                  {sbtiAnalysis.isAhead ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  목표 대비 {Math.abs(sbtiAnalysis.gap).toLocaleString()}t {sbtiAnalysis.isAhead ? '여유' : '초과'}
                </div>
              </Card>
              <Card className="flex flex-col justify-between bg-[#10221c] text-white border-[#1a2e28]">
                <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Zero 목표 (2050)</p><p className="text-3xl font-bold text-[#10b77f]">D-24</p></div>
                <div className="mt-4 text-xs font-bold text-slate-400 flex items-center gap-1"><Target size={14} /> 잔여 감축 필요량: 90%</div>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card padding="lg" className="lg:col-span-2">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><LineChartIcon size={20} className="text-[#10b77f]" /> Net Zero 경로 (SBTi 1.5°C)</h3>
                  <div className="flex gap-4 text-[10px] font-bold">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>실적 (Actual)</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b77f]"></div>SBTi 목표</div>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sbtiAnalysis.trajectory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSbti" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b77f" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b77f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area isAnimationActive={false} type="monotone" dataKey="sbti" name="SBTi 경로" stroke="#10b77f" fill="url(#colorSbti)" strokeWidth={2} strokeDasharray="5 5" />
                      <Line isAnimationActive={false} type="monotone" dataKey="actual" name="배출량" stroke="#1e293b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#1e293b' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <div className="space-y-6">
                <Card className="h-full bg-[#10b77f] text-white border-[#0e9f6e] flex flex-col justify-center p-8 shadow-xl shadow-[#10b77f]/20">
                  <Quote className="text-white/30 mb-6" size={40} />
                  <p className="text-xl font-bold leading-relaxed mb-6">
                    "현재 감축 속도(연평균 -5.2%)는 SBTi 요구사항(-4.2%)을 상회하고 있습니다. 2030년 중간 목표 달성이 유력합니다."
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-white/80 bg-white/10 w-fit px-3 py-1.5 rounded-full"><CheckCircle2 size={14} /> AI 지속가능성 진단</div>
                </Card>
                <Card className="p-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">주요 감축 활동 현황</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-0.5"><Zap size={14} /></div>
                      <div><p className="text-sm font-bold text-slate-700">재생에너지 전환 (RE100)</p><p className="text-xs text-slate-400 mt-0.5">태양광 PPA 계약 체결 완료</p></div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-0.5"><Briefcase size={14} /></div>
                      <div><p className="text-sm font-bold text-slate-700">공정 효율화</p><p className="text-xs text-slate-400 mt-0.5">스마트 팩토리 시스템 도입 중</p></div>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* --- Investment Tab --- */}
        {activeTab === 'investment' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* ... Same as previous ... */}
            <div className="flex flex-col gap-6 mb-4">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <span className="text-slate-400 hover:text-[#10b77f] transition-colors cursor-pointer">전략 (Strategy)</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-medium">페이지 5: 투자 전략</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    투자 전략: <span className="text-[#10b77f]">녹색 설비투자(CAPEX) 배분</span>
                  </h2>
                  <p className="text-slate-500 text-base max-w-2xl">
                    부채 대비 7,621억 원 규모의 녹색 투자 계획에 대한 전략적 분석입니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50">
                    <Printer size={20} /> 리포트 출력
                  </Button>
                  <Button className="gap-2 shadow-lg shadow-[#10b77f]/25 bg-[#10b77f] hover:bg-[#0e9f6e] text-white">
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
                    <SlidersHorizontal className="text-[#10b77f]" size={20} />
                    <h3 className="text-lg font-bold text-slate-900">시뮬레이션 변수</h3>
                  </div>
                  <div className="flex flex-col gap-8 flex-1">
                    {/* Slider 1 */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-medium text-slate-500">탄소세율 (Tax Rate)</label>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">₩{investCarbonPrice.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ 톤</span></span>
                      </div>
                      <input
                        type="range" min="10000" max="100000" step="1000" value={investCarbonPrice} onChange={(e) => setInvestCarbonPrice(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                      />
                      <div className="flex justify-between mt-1 text-[10px] text-slate-400 uppercase tracking-wider">
                        <span>보수적</span><span>공격적</span>
                      </div>
                    </div>
                    {/* Slider 2 */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-medium text-slate-500">에너지 절감률</label>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{investEnergySavings}% <span className="text-xs text-slate-400 font-normal">YoY</span></span>
                      </div>
                      <input
                        type="range" min="0" max="30" step="0.5" value={investEnergySavings} onChange={(e) => setInvestEnergySavings(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                      />
                    </div>
                    {/* Slider 3 */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-medium text-slate-500">할인율 (Discount)</label>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{investDiscountRate}%</span>
                      </div>
                      <input
                        type="range" min="1" max="10" step="0.1" value={investDiscountRate} onChange={(e) => setInvestDiscountRate(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                      />
                    </div>
                    {/* Slider 4 */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-medium text-slate-500">이행 기간 (Timeline)</label>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{investTimeline} 년</span>
                      </div>
                      <input
                        type="range" min="1" max="10" step="1" value={investTimeline} onChange={(e) => setInvestTimeline(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10b77f]"
                      />
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <button onClick={() => { setInvestCarbonPrice(45000); setInvestEnergySavings(12.5); setInvestDiscountRate(4.2); setInvestTimeline(5); }} className="w-full py-2.5 rounded-lg border border-[#10b77f] text-[#10b77f] font-bold text-sm hover:bg-[#10b77f]/5 transition-colors flex items-center justify-center gap-2">
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
                    <Coins size={120} className="text-[#10b77f]" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#10b77f]/10 text-[#10b77f] text-xs font-bold uppercase tracking-wider">승인됨 (Approved)</span>
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
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#10b77f]"></div><span className="text-slate-500">투자 (Investment)</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-400"></div><span className="text-slate-500">리스크 부채 (Risk Liability)</span></div>
                      </div>
                    </div>
                    <div className="relative flex-1 min-h-[180px] flex items-end justify-center gap-16 pb-6 border-b border-slate-100">
                      {/* Bar 1 */}
                      <div className="flex flex-col items-center gap-2 w-24 group z-10 relative cursor-pointer">
                        <span className="text-sm font-bold text-[#10b77f] opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">{(investmentAnalysis.investmentCost / 100000000).toFixed(0)}억</span>
                        <div className="w-full bg-[#10b77f] rounded-t-lg relative hover:brightness-110 transition-all shadow-lg shadow-[#10b77f]/20" style={{ height: '140px' }}></div>
                        <span className="text-xs font-bold text-slate-500 mt-2 text-center">녹색 설비투자<br />(Action)</span>
                      </div>
                      {/* Bar 2 */}
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
                      <span className="text-xs font-bold bg-[#10b77f]/10 text-[#10b77f] px-2 py-1 rounded">4.5년 후 전환</span>
                    </div>
                    <div className="relative w-full h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={investmentAnalysis.chartData}>
                          <defs>
                            <linearGradient id="gradientSavings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b77f" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10b77f" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis hide />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="investment" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                          <Area type="monotone" dataKey="savings" stroke="#10b77f" strokeWidth={3} fill="url(#gradientSavings)" />
                          {/* Break-even point marker simulation */}
                          {Number(investmentAnalysis.payback) <= 10 && (
                            <ReferenceLine x={`Y${Math.floor(Number(investmentAnalysis.payback))}`} stroke="#10b77f" strokeDasharray="3 3" label={{ value: 'BEP', position: 'top', fill: '#10b77f', fontSize: 10, fontWeight: 700 }} />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Verdict & KPIs (3 Cols) */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                {/* Verdict Card */}
                <div className="bg-[#10b77f]/5 border border-[#10b77f]/20 rounded-2xl p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#10b77f] flex items-center justify-center text-white mb-3 shadow-lg shadow-[#10b77f]/30">
                    <ThumbsUp size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">재무적 판단 (Verdict)</h3>
                  <div className="bg-[#10b77f] text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-4 shadow-sm">
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
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">투자수익률 (ROI 10yr)</p>
                      <p className="text-2xl font-black text-[#10b77f]">+{investmentAnalysis.roi}%</p>
                    </div>
                    <TrendingUp size={32} className="text-[#10b77f]/30" />
                  </div>
                  {/* Payback */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">회수 기간 (Payback)</p>
                      <p className="text-2xl font-black text-slate-900">{investmentAnalysis.payback} <span className="text-sm font-medium text-slate-400">년</span></p>
                    </div>
                    <Clock size={32} className="text-slate-300" />
                  </div>
                  {/* NPV */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">순현재가치 (NPV)</p>
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
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 ${isChatOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-white w-[380px] h-[600px] rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3"><div className="bg-[#10b77f] p-2 rounded-xl shadow-lg"><MessageSquare size={18} /></div><span className="font-bold text-sm tracking-wide">Strategic AI Agent</span></div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-all"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-[#F8FCFA] space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={cn("max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed", msg.role === 'user' ? "bg-[#10b77f] text-white rounded-br-none" : "bg-white text-slate-600 border border-slate-100 rounded-bl-none")}>{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="전략을 질문하세요..." className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#10b77f] outline-none font-medium placeholder:text-slate-400" />
            <button className="bg-slate-900 text-white p-3 rounded-xl hover:bg-[#10b77f] transition-all shadow-md"><Send size={18} /></button>
          </form>
        </div>
      </div>

      {!isChatOpen && (
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 bg-slate-900 hover:bg-[#10b77f] text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-3 z-40 group duration-300">
          <Activity size={24} className="text-[#10b77f] group-hover:text-white transition-colors" />
          <span className="font-bold pr-1 text-sm tracking-wide hidden md:inline-block">AI 전략 분석</span>
        </button>
      )}
    </div>
  );
};

export default App;