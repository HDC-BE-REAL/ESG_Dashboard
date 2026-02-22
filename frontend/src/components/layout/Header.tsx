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
  user?: {
    nickname?: string;
    email?: string;
  };
  onProfileClick: () => void;
  onLogout: () => void;
  onLogoClick?: () => void;
  onNavClick?: (view: 'dashboard' | 'data-input' | 'reports' | 'analytics') => void;
  currentView?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  tabs,
  selectedCompany,
  setSelectedCompanyId,
  companies,
  user,
  onProfileClick,
  onLogout,
  onLogoClick,
  onNavClick,
  currentView,
}) => {
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // 🌟 마우스 위치에 따른 꽃 기울기 각도를 저장하는 State
  const [flowerTilt, setFlowerTilt] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    setFlowerTilt(-percentX * 25); // 최대 25도까지 기울어짐
  };

  const handleMouseLeave = () => {
    setFlowerTilt(0); // 마우스가 벗어나면 원상복구
  };

  const handleNav = (view: 'dashboard' | 'data-input' | 'reports' | 'analytics') => {
    if (view === 'dashboard') {
      setActiveTab('dashboard');
      if (onNavClick) onNavClick('dashboard');
    } else {
      if (onNavClick) onNavClick(view);
    }
  };

  return (
    <nav className="bg-transparent px-8 py-4 flex justify-between items-center sticky top-0 z-30">

      {/* 1. 왼쪽: 로고 및 기업 선택 (네비게이션을 여기서 뺐습니다) */}
      <div className="flex items-center gap-8">
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

          <Dropdown
            isOpen={isCompanyMenuOpen}
            onClose={() => setIsCompanyMenuOpen(false)}
            align="left"
            width="w-56"
            trigger={
              <button
                onClick={() => setIsCompanyMenuOpen(!isCompanyMenuOpen)}
                className="flex items-center gap-2 text-slate-700 font-bold text-lg hover:text-emerald-700 transition-colors focus:outline-none px-3 py-1.5 rounded-xl"
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

      {/* 🌟 2. 중앙: Profile 뷰이면 Profile Setting, 아니면 활성 탭 표시 🌟 */}
      {currentView === 'profile' && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-16 flex items-end">
          <div className="flex items-end justify-center h-full relative min-w-[120px]">
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-transparent"></div>
            <div className="relative group flex flex-col items-center justify-end h-full w-24">
              <div
                className="transition-transform duration-200 ease-out"
                style={{ transform: `scale(0.6) rotate(${flowerTilt}deg)` }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div className="relative mt-8 -mb-6 animate-bloom-gentle z-10">
                  <div className="w-12 h-12 relative flex items-center justify-center">
                    <div className="w-4 h-4 bg-lime-500 rounded-full z-20 shadow-flower-glow"></div>
                    <div className="absolute w-5 h-5 bg-lime-400 rotate-0 -translate-y-3 rounded-full"></div>
                    <div className="absolute w-5 h-5 bg-lime-400 rotate-45 translate-x-3 -translate-y-2 rounded-full"></div>
                    <div className="absolute w-5 h-5 bg-lime-400 rotate-90 translate-x-3 translate-y-2 rounded-full"></div>
                    <div className="absolute w-5 h-5 bg-lime-400 rotate-135 -translate-x-0 translate-y-3 rounded-full"></div>
                    <div className="absolute w-5 h-5 bg-lime-400 rotate-180 -translate-x-3 translate-y-2 rounded-full"></div>
                    <div className="absolute w-5 h-5 bg-lime-400 -rotate-45 -translate-x-3 -translate-y-2 rounded-full"></div>
                  </div>
                  <div className="w-1 h-8 bg-green-600 mx-auto mt-[-10px] rounded-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-lime-500 to-green-700"></div>
                  </div>
                  <div className="absolute bottom-2 -left-3 w-3 h-3 bg-green-500 rounded-tr-xl rounded-bl-xl rotate-[-20deg]"></div>
                  <div className="absolute bottom-4 -right-3 w-3 h-3 bg-green-500 rounded-tl-xl rounded-br-xl rotate-[20deg]"></div>
                </div>
              </div>
              <span className="text-neutral-900 font-bold text-xs tracking-widest uppercase mt-1 relative z-20 pb-2 border-b-2 border-lime-500">
                Profile Setting
              </span>
            </div>
          </div>
        </div>
      )}
      {currentView !== 'profile' && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-16 flex items-end">
          <div className="flex items-end justify-center h-full relative min-w-[120px]">
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-transparent"></div>

            {/* 현재 activeTab과 일치하는 탭 단 1개만 필터링하여 렌더링 */}
            {tabs.filter(tab => tab.id === activeTab).map((tab) => (
              <div key={tab.id} className="relative group flex flex-col items-center justify-end h-full w-24">
                <div
                  className="transition-transform duration-200 ease-out"
                  style={{ transform: `scale(0.6) rotate(${flowerTilt}deg)` }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* 👇 mt-8을 추가하고 mb를 더 줄여서 꽃을 타이틀에 밀착시켰습니다 👇 */}
                  <div className="relative mt-8 -mb-6 animate-bloom-gentle z-10">
                    <div className="w-12 h-12 relative flex items-center justify-center">
                      <div className="w-4 h-4 bg-lime-500 rounded-full z-20 shadow-flower-glow"></div>
                      <div className="absolute w-5 h-5 bg-lime-400 rotate-0 -translate-y-3 rounded-full"></div>
                      <div className="absolute w-5 h-5 bg-lime-400 rotate-45 translate-x-3 -translate-y-2 rounded-full"></div>
                      <div className="absolute w-5 h-5 bg-lime-400 rotate-90 translate-x-3 translate-y-2 rounded-full"></div>
                      <div className="absolute w-5 h-5 bg-lime-400 rotate-135 -translate-x-0 translate-y-3 rounded-full"></div>
                      <div className="absolute w-5 h-5 bg-lime-400 rotate-180 -translate-x-3 translate-y-2 rounded-full"></div>
                      <div className="absolute w-5 h-5 bg-lime-400 -rotate-45 -translate-x-3 -translate-y-2 rounded-full"></div>
                    </div>
                    <div className="w-1 h-8 bg-green-600 mx-auto mt-[-10px] rounded-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-lime-500 to-green-700"></div>
                    </div>
                    <div className="absolute bottom-2 -left-3 w-3 h-3 bg-green-500 rounded-tr-xl rounded-bl-xl rotate-[-20deg]"></div>
                    <div className="absolute bottom-4 -right-3 w-3 h-3 bg-green-500 rounded-tl-xl rounded-br-xl rotate-[20deg]"></div>
                  </div>
                </div>
                <span className="text-neutral-900 font-bold text-xs tracking-widest uppercase mt-1 relative z-20 pb-2 border-b-2 border-lime-500">
                  {tab.id === 'dashboard' ? 'Home' : tab.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 오른쪽: 프로필 및 세팅 드롭다운 */}
      <div className="flex items-center gap-4">
        {/* 기존 프로필 드롭다운 코드 (변경 없음) */}
        <Dropdown
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          align="right"
          width="w-64"
          trigger={
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center justify-center size-10 rounded-full bg-transparent hover:bg-black/5 transition-all"
            >
              <User size={20} className="text-slate-600" />
            </button>
          }
        >
          {/* 하위 메뉴들 생략... 기존 코드와 동일 */}
          <div className="p-1.5 space-y-0.5">
            <div className="px-4 py-3 border-b border-slate-50 mb-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="size-2 bg-emerald-500 rounded-full"></span>
                <p className="text-sm font-black text-slate-900">{user?.nickname || 'Wild Diver'}</p>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-tight">{user?.email || 'admin@be-real.com'}</p>
            </div>

            <div className="px-2 py-1.5 border-b border-slate-50 mb-1">
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shortcuts</p>
              <button onClick={() => { setActiveTab('dashboard'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Dashboard
              </button>
              <button onClick={() => { setActiveTab('compare'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Compare
              </button>
              <button onClick={() => { setActiveTab('simulator'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Simulator
              </button>
              <button onClick={() => { setActiveTab('target'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Targets
              </button>
            </div>

            <button
              onClick={() => {
                onProfileClick();
                setIsProfileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2"
            >
              <SettingsIcon size={16} /> Profile Settings
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
