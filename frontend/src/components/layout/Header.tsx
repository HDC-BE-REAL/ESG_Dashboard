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
  onNavClick
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
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
      <div className="flex items-center gap-8">
        {/* Brand & Company Selector */}
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

        {/* Tab Navigation with Flower/Sprout Animations */}
        <nav aria-label="Main Navigation" className="flex items-end gap-12 h-16 relative">
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neutral-200"></div>

          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return isActive ? (
              /* 🌸 현재 선택된 탭 (마우스 반응형 꽃 애니메이션) */
              <div key={tab.id} className="relative group flex flex-col items-center justify-end h-full w-24">

                {/* 👇 마우스 반응형 움직임이 적용된 껍데기입니다 👇 */}
                <div
                  className="transition-transform duration-200 ease-out"
                  style={{ transform: `rotate(${flowerTilt}deg)` }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="relative mb-2 animate-bloom-gentle z-10">
                    <div className="absolute w-6 h-6 bg-lime-400 rounded-full -top-6 -left-3 opacity-90 blur-[1px]"></div>
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

                    <div className="pollen-particle" style={{ '--tx': '10px', '--ty': '-15px', animationDelay: '0s', top: '40%', left: '50%' } as React.CSSProperties}></div>
                    <div className="pollen-particle" style={{ '--tx': '-12px', '--ty': '-10px', animationDelay: '1.2s', top: '30%', left: '40%' } as React.CSSProperties}></div>
                    <div className="pollen-particle" style={{ '--tx': '8px', '--ty': '-20px', animationDelay: '0.5s', top: '35%', left: '60%' } as React.CSSProperties}></div>
                    <div className="pollen-particle" style={{ '--tx': '-5px', '--ty': '-25px', animationDelay: '2s', top: '20%', left: '50%' } as React.CSSProperties}></div>
                  </div>
                </div>
                {/* 👆 동적 기울기 껍데기 끝 👆 */}

                <span className="text-neutral-900 font-bold text-sm tracking-widest uppercase mt-1 relative z-20 pb-2 border-b-2 border-lime-500">
                  {tab.label}
                </span>
                <div className="absolute bottom-0 w-16 h-4 bg-neutral-100 rounded-t-full -z-10 blur-sm opacity-50"></div>
              </div>
            ) : (
              /* 🌱 선택되지 않은 탭 (새싹 모양 버튼) */
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative group flex flex-col items-center justify-end h-full w-24 opacity-60 hover:opacity-100 transition-all cursor-pointer"
              >
                <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-tr-lg rounded-bl-lg rotate-[-15deg] absolute -left-2 -top-1 group-hover:bg-green-400 transition-colors"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-tl-lg rounded-br-lg rotate-[15deg] absolute -right-2 -top-2 group-hover:bg-green-400 transition-colors"></div>
                  <div className="w-1 h-4 bg-neutral-300 mx-auto rounded-t-full group-hover:bg-green-500 transition-colors"></div>
                </div>
                <span className="text-neutral-500 font-medium text-xs tracking-wide uppercase mt-1 pb-2 border-b-2 border-transparent group-hover:text-green-600 transition-colors">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
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
              <button onClick={() => { setActiveTab('investment'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Investments
              </button>
            </div>

            <div className="px-2 py-1.5 border-b border-slate-50 mb-1">
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Workspaces</p>
              <button onClick={() => { handleNav('data-input'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Data Input
              </button>
              <button onClick={() => { handleNav('reports'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Report Center
              </button>
              <button onClick={() => { handleNav('analytics'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Analytics
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
