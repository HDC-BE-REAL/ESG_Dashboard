import React, { useState } from 'react';
import { Leaf, Building2, ChevronDown, Check, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { cn } from '../ui/utils';
import type { TabType, CompanyConfig } from '../../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  tabs: { id: TabType; label: string }[];
  selectedCompany: CompanyConfig;
  setSelectedCompanyId: (id: number) => void;
  companies: CompanyConfig[];
  onProfileClick: () => void;
  onLogout: () => void;
  onLogoClick?: () => void;
  onNavClick?: (view: 'dashboard' | 'data-input' | 'reports' | 'analytics') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  tabs,
  selectedCompany,
  setSelectedCompanyId,
  companies,
  onProfileClick,
  onLogout,
  onLogoClick,
  onNavClick
}) => {
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Helper to handle navigation
  const handleNav = (view: 'dashboard' | 'data-input' | 'reports' | 'analytics') => {
    if (view === 'dashboard') {
      setActiveTab('dashboard');
      if (onNavClick) onNavClick('dashboard');
    } else {
      if (onNavClick) onNavClick(view);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
      <div className="flex items-center gap-8">
        {/* Be-REAL Brand & Company Selector */}
        <div className="flex items-center rounded-2xl p-1.5">
          <div className="flex items-center gap-3 px-3 py-1.5 overflow-hidden">
            <button
              onClick={() => onLogoClick ? onLogoClick() : setActiveTab('dashboard')}
              className="group flex items-center justify-center relative shrink-0 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-2"
            >
              <div className="relative flex items-center gap-1 leading-none select-none">
                <span className="font-black text-[#84cc16] text-4xl leading-none animate-esg-pulse-glow drop-shadow-sm group-hover:scale-110 transition-transform duration-300">E</span>
                <span className="font-black text-[#84cc16] text-4xl leading-none animate-esg-pulse-glow group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.2s' }}>S</span>
                <span className="font-black text-[#84cc16] text-4xl leading-none animate-esg-pulse-glow group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.4s' }}>G</span>
              </div>
            </button>
          </div>

          {/* Company Selector */}
          <Dropdown
            isOpen={isCompanyMenuOpen}
            onClose={() => setIsCompanyMenuOpen(false)}
            align="left"
            width="w-56"
            trigger={
              <button
                onClick={() => setIsCompanyMenuOpen(!isCompanyMenuOpen)}
                className="flex items-center gap-2 text-slate-700 font-bold text-lg hover:text-emerald-700 transition-colors focus:outline-none px-3 py-1.5 rounded-xl hover:bg-white hover:shadow-sm"
              >
                <span>{selectedCompany.name}</span>
                <ChevronDown size={16} className={cn("transition-transform duration-200 text-slate-400", isCompanyMenuOpen ? "rotate-180" : "group-hover:text-emerald-700")} />
              </button>
            }
          >
            <div className="p-1.5 space-y-0.5">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Company</div>
              {companies.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompanyId(comp.id);
                    setIsCompanyMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl text-base font-medium transition-all flex items-center justify-between group/item",
                    selectedCompany.id === comp.id
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Building2 size={18} className={selectedCompany.id === comp.id ? "text-emerald-700" : "text-slate-400 group-hover/item:text-emerald-700"} />
                    {comp.name}
                  </span>
                  {selectedCompany.id === comp.id && <Check size={16} className="text-emerald-700" />}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

      </div>

      {/* Profile & Settings Dropdown */}
      <div className="flex items-center gap-4">
        <Dropdown
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          align="right"
          width="w-64"
          trigger={
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center justify-center size-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-all border-2 border-transparent hover:border-emerald-700/30 shadow-sm"
            >
              <User size={20} className="text-slate-600" />
            </button>
          }
        >
          <div className="p-1.5 space-y-0.5">
            <div className="px-4 py-3 border-b border-slate-50 mb-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="size-2 bg-emerald-500 rounded-full"></span>
                <p className="text-sm font-black text-slate-900">위험한 물방개</p>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-tight">admin@be-real.com</p>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="px-2 py-1.5 border-b border-slate-50 mb-1">
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">바로가기 (Shortcuts)</p>
              <button onClick={() => { setActiveTab('dashboard'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 대시보드
              </button>
              <button onClick={() => { setActiveTab('compare'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> 경쟁사비교
              </button>
              <button onClick={() => { setActiveTab('simulator'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> 시뮬레이터
              </button>
              <button onClick={() => { setActiveTab('target'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> 목표설정
              </button>
              <button onClick={() => { setActiveTab('investment'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> 투자계획
              </button>
            </div>

            <div className="px-2 py-1.5 border-b border-slate-50 mb-1">
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Workspaces</p>
              <button onClick={() => { handleNav('data-input'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 데이터 입력
              </button>
              <button onClick={() => { handleNav('reports'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 리포트 센터
              </button>
              <button onClick={() => { handleNav('analytics'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 데이터 분석
              </button>
            </div>

            <button
              onClick={() => {
                onProfileClick();
                setIsProfileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2"
            >
              <User size={16} /> Profile Settings
            </button>

            <div className="h-px bg-slate-100 my-1 mx-2"></div>
            <button
              onClick={() => {
                onLogout();
                setIsProfileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all flex items-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </Dropdown>
      </div>
    </nav>
  );
};
