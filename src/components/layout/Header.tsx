import React, { useState } from 'react';
import { Leaf, Building2, ChevronDown, Check } from 'lucide-react';
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
}

export const Header: React.FC<HeaderProps> = ({
    activeTab,
    setActiveTab,
    tabs,
    selectedCompany,
    setSelectedCompanyId,
    companies
}) => {
    const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
    const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
            <div className="flex items-center gap-8">
                {/* Unified Brand & Company Selector Pill */}
                <div className="flex items-center bg-slate-100/50 rounded-2xl p-1.5 border border-slate-200/50">
                    <div className="flex items-center gap-2 px-3 py-1.5">
                        <div className="text-[#10b77f]"><Leaf size={20} /></div>
                        <span className="text-lg font-bold tracking-tight text-slate-800">ESG OS</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-5 bg-slate-300 mx-1"></div>

                    {/* Company Selector - Integrated */}
                    <Dropdown
                        isOpen={isCompanyMenuOpen}
                        onClose={() => setIsCompanyMenuOpen(false)}
                        align="left"
                        width="w-56"
                        trigger={
                            <button
                                onClick={() => setIsCompanyMenuOpen(!isCompanyMenuOpen)}
                                className="flex items-center gap-2 text-slate-700 font-bold text-lg hover:text-[#10b77f] transition-colors focus:outline-none px-3 py-1.5 rounded-xl hover:bg-white hover:shadow-sm"
                            >
                                {/* Glowing Green Indicator (Left) */}
                                <span className="relative flex h-2.5 w-2.5 mx-0.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b77f] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b77f]"></span>
                                </span>
                                <span>{selectedCompany.name}</span>
                                <ChevronDown size={16} className={cn("transition-transform duration-200 text-slate-400", isCompanyMenuOpen ? "rotate-180" : "group-hover:text-[#10b77f]")} />
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
                                            ? "bg-[#10b77f]/10 text-[#10b77f]"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <Building2 size={18} className={selectedCompany.id === comp.id ? "text-[#10b77f]" : "text-slate-400 group-hover/item:text-[#10b77f]"} />
                                        {comp.name}
                                    </span>
                                    {selectedCompany.id === comp.id && <Check size={16} className="text-[#10b77f]" />}
                                </button>
                            ))}
                        </div>
                    </Dropdown>
                </div>
            </div>

            {/* Tab Navigation as Dropdown (Toggle) */}
            <Dropdown
                isOpen={isTabMenuOpen}
                onClose={() => setIsTabMenuOpen(false)}
                align="right"
                width="w-48"
                trigger={
                    <button
                        onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
                        className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200/50 px-5 py-2.5 rounded-full transition-all group"
                    >
                        {/* Showing Current Tab */}
                        <span className="text-base font-bold text-slate-800">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </span>
                        <ChevronDown size={18} className={cn("text-slate-400 transition-transform duration-200", isTabMenuOpen ? "rotate-180" : "group-hover:text-slate-600")} />
                    </button>
                }
            >
                <div className="p-1.5 space-y-0.5">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navigate To</div>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setActiveTab(t.id);
                                setIsTabMenuOpen(false);
                            }}
                            className={cn(
                                "w-full text-right px-4 py-2.5 rounded-xl text-base font-medium transition-all block hover:bg-slate-50",
                                activeTab === t.id
                                    ? "text-[#10b77f] bg-[#10b77f]/5"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </Dropdown>
        </nav>
    );
};
