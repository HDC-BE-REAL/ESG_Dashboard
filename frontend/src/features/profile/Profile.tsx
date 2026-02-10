import React, { useState } from 'react';

interface ProfileProps {
    onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBack }) => {
    const [nickname, setNickname] = useState('위험한 물방개');
    const [classification, setClassification] = useState('mammal');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('프로필이 저장되었습니다.');
        onBack();
    };

    return (
        <section id="page-profile" className="page-section active min-h-screen bg-background-light font-sans-kr relative overflow-x-hidden pl-24">
            {/* Background Glow */}
            <div className="fixed inset-0 h-[300px] bg-sunrise-glow -z-10 pointer-events-none"></div>

            {/* Profile Sidebar */}
            <nav className="fixed left-0 top-0 h-full w-24 flex flex-col items-center py-8 z-50 bg-transparent border-r border-gray-100/50">
                <div className="absolute top-0 left-0 w-full h-8 overflow-hidden pointer-events-none">
                    <div className="snow-leopard-walker" title="지켜보고 있는 눈표범">
                        <svg className="w-full h-full drop-shadow-sm" fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <path d="M8 18C8 18 10 14 16 14C22 14 24 18 24 18L26 22H6L8 18Z" fill="#F5F5F5"></path>
                                <circle cx="12" cy="16" fill="#A8A29E" r="1.5"></circle>
                                <circle cx="18" cy="17" fill="#A8A29E" r="1.2"></circle>
                                <circle cx="22" cy="16" fill="#A8A29E" r="1"></circle>
                                <circle cx="24" cy="14" fill="#F5F5F5" r="5"></circle>
                                <circle cx="23" cy="13" fill="#1F2937" r="0.5"></circle>
                                <circle cx="26" cy="13" fill="#1F2937" r="0.5"></circle>
                                <path d="M24.5 15L23.5 16H25.5L24.5 15Z" fill="#FCA5A5"></path>
                                <path d="M21 10L23 12L20 13L21 10Z" fill="#F5F5F5"></path>
                                <path d="M27 10L25 12L28 13L27 10Z" fill="#F5F5F5"></path>
                                <path d="M6 20C4 20 2 16 4 14C6 12 8 16 8 18" stroke="#F5F5F5" strokeLinecap="round" strokeWidth="3"></path>
                                <path d="M10 22V26" stroke="#F5F5F5" strokeLinecap="round" strokeWidth="2"></path>
                                <path d="M22 22V26" stroke="#F5F5F5" strokeLinecap="round" strokeWidth="2"></path>
                            </g>
                        </svg>
                    </div>
                </div>

                {/* Dashboard Link */}
                <button
                    onClick={onBack}
                    className="mb-8 p-3 text-primary-dark bg-white/80 hover:bg-green-50 shadow-sm hover:shadow-md rounded-full transition-all duration-300 relative group/home hover:rotate-12 mt-4 backdrop-blur-sm cursor-pointer border-none"
                    title="대시보드로 이동"
                >
                    <span className="material-symbols-outlined filled text-3xl">eco</span>
                </button>

                {/* Nav Items Container */}
                <div className="flex flex-col items-center gap-6 relative w-full px-2">
                    {/* Vertical Decoration Line */}
                    <svg className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 h-full -z-10 text-stone-200/50" fill="none" preserveAspectRatio="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 100">
                        <path d="M12,0 C18,20 6,40 12,60 C18,80 6,100 12,120" vectorEffect="non-scaling-stroke"></path>
                    </svg>

                    <button
                        onClick={onBack}
                        className="group nav-item relative flex items-center justify-center w-full cursor-pointer bg-transparent border-none"
                        title="대시보드"
                    >
                        <div className="pebble-icon pebble-shape-1 w-12 h-12 flex items-center justify-center bg-white border-2 border-pebble-1 text-gray-400 transition-all duration-300 ease-out shadow-sm group-hover:border-primary/30 group-hover:shadow-md">
                            <span className="material-symbols-outlined text-xl">dashboard</span>
                        </div>
                    </button>

                    <button
                        className="group nav-item relative flex items-center justify-center w-full translate-x-1 cursor-pointer bg-transparent border-none"
                        title="프로필"
                    >
                        <div className="absolute inset-0 bg-green-100/50 rounded-full blur-xl scale-150 -z-10"></div>
                        <div className="pebble-icon pebble-shape-2 w-14 h-14 flex items-center justify-center bg-green-50 border-2 border-primary text-primary-dark transition-all duration-300 ease-out shadow-lg hover:shadow-xl ring-4 ring-white/50 backdrop-blur-sm">
                            <span className="material-symbols-outlined filled text-2xl">person</span>
                        </div>
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="layout-container flex flex-col grow h-full max-w-[1200px] mx-auto w-full p-6 md:p-12 lg:p-16 relative">
                <header className="w-full flex justify-between items-center mb-16 md:mb-24">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-forest-green transition-colors duration-200 group cursor-pointer bg-transparent border-none"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        <span className="text-sm font-medium tracking-wide">대시보드로 돌아가기</span>
                    </button>
                </header>

                <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-12 lg:gap-24 relative">
                    {/* Left Column: Character */}
                    <div className="w-full lg:w-4/12 flex flex-col items-center lg:items-end lg:pr-8 lg:border-r border-gray-100 relative">
                        <div className="relative flex flex-col items-center text-center lg:text-right">
                            <div className="w-48 h-48 mb-6 relative group cursor-pointer transition-transform hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gray-50 rounded-full shadow-inner"></div>
                                <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-sm">
                                    <img
                                        alt="눈표범 일러스트"
                                        className="w-full h-full object-cover"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCS3T_sgrw_vBLSShpo_Ll9p7JqZbdPe_nphWYDP0lLMXhbL9fyuq2t1kv_3GqA4Cu126wmUL1RTZrd2IkIDerj3p_a4ADUxBn79sU_nhgl9qQVlAth2VA9TQjYB3l7RRwiAazZuac542ZM4frrPINAjJhsPWN_sL7xpYt0oR8tr9QyNNZUtx3KUld_1aEIniOCwHayPTxSWKvzHt5Xcw2qZYCva_bGGIqeSOaLt82Y1FUu90k3F3zunM_bDjVzbD7q038f51M1uE0"
                                    />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md text-forest-green border border-gray-100">
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">Snow Leopard</h3>
                            <div className="relative group/badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-100 cursor-pointer hover:bg-red-100 transition-colors">
                                <span className="material-symbols-outlined text-sm filled">warning</span>
                                <span>상태: 멸종위기</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="w-full lg:w-5/12 flex flex-col justify-center">
                        <div className="w-full">
                            <div className="mb-12">
                                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight font-display">Profile Settings</h1>
                                <p className="text-gray-500 text-base leading-relaxed">
                                    ESG 포털에서 다른 사람들에게 보여질 모습을 선택하세요.<br />
                                    당신의 아이덴티티는 환경에 대한 약속을 반영합니다.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-2 custom-cursor-area">
                                    <label className="block text-sm font-medium text-gray-500" htmlFor="nickname">닉네임</label>
                                    <div className="relative group">
                                        <input
                                            className="block w-full py-3 px-0 pr-28 bg-transparent border-0 border-b border-gray-200 text-gray-900 placeholder-gray-300 focus:border-forest-green focus:ring-0 transition-all duration-300 text-lg font-medium outline-none"
                                            id="nickname"
                                            name="nickname"
                                            placeholder="닉네임을 입력하세요"
                                            type="text"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                        />
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100 tracking-tight">위기</span>
                                            <button
                                                className="text-gray-400 hover:text-forest-green transition-colors p-1.5 rounded-full hover:bg-gray-50 border-none bg-transparent"
                                                title="랜덤 생성"
                                                type="button"
                                            >
                                                <span className="material-symbols-outlined text-lg">autorenew</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-500" htmlFor="classification">멸종위기종 분류</label>
                                    <div className="relative group">
                                        <select
                                            className="block w-full py-3 px-0 bg-transparent border-0 border-b border-gray-200 text-gray-900 focus:border-forest-green focus:ring-0 transition-all duration-300 text-lg font-medium cursor-pointer appearance-none outline-none"
                                            id="classification"
                                            name="classification"
                                            value={classification}
                                            onChange={(e) => setClassification(e.target.value)}
                                        >
                                            <option value="mammal">포유류 (Mammals)</option>
                                            <option value="bird">조류 (Birds)</option>
                                            <option value="reptile">파충류 (Reptiles)</option>
                                            <option value="amphibian">양서류 (Amphibians)</option>
                                            <option value="fish">어류 (Fish)</option>
                                            <option value="insect">곤충 (Insects)</option>
                                            <option value="plant">식물 (Plants)</option>
                                        </select>
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-hover:text-forest-green transition-colors">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-12 flex items-center gap-8">
                                    <button
                                        className="flex-1 bg-forest-green hover:bg-[#14241b] text-white font-bold py-4 px-8 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 border-none"
                                        type="submit"
                                    >
                                        <span>적용하기</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                    <button
                                        onClick={onBack}
                                        type="button"
                                        className="text-gray-400 hover:text-gray-900 font-medium transition-colors px-4 text-sm whitespace-nowrap cursor-pointer bg-transparent border-none"
                                    >
                                        취소
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </section>
    );
};
