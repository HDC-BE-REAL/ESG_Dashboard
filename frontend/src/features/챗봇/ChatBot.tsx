import React, { useState, useEffect } from 'react';
import {
    Send, X, Maximize2, Minimize2, MessageSquare,
    Sparkles, Bot, User, Trash2, ArrowDownCircle,
    ChevronRight, BrainCircuit
} from 'lucide-react';
import { cn } from '../../components/ui/utils';
import type { ChatMessage } from '../../types';

interface ChatBotProps {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
    chatMessages: ChatMessage[];
    inputMessage: string;
    setInputMessage: (input: string) => void;
    handleSendMessage: (e: React.FormEvent) => void;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatBot: React.FC<ChatBotProps> = ({
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    chatEndRef
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isChatOpen, chatEndRef]);

    if (!isChatOpen) {
        return (
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#10b77f] text-white rounded-full shadow-lg shadow-[#10b77f]/30 flex items-center justify-center hover:scale-110 transition-transform z-50 group"
            >
                <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            </button>
        );
    }

    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 transition-all duration-300 ease-in-out overflow-hidden",
                isExpanded ? "w-[800px] h-[600px]" : "w-96 h-[500px]"
            )}
        >
            {/* Header */}
            <div className="p-4 bg-[#102219] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#10b77f]/20 flex items-center justify-center">
                        <Bot size={20} className="text-[#10b77f]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold flex items-center gap-1.5">
                            Be-REAL AI Advisor
                            <span className="w-1.5 h-1.5 bg-[#10b77f] rounded-full"></span>
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">탄소 경영 전문 AI 보조</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button
                        onClick={() => setIsChatOpen(false)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {chatMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex flex-col max-w-[85%] group animate-in slide-in-from-bottom-2",
                            msg.role === 'user' ? "ml-auto items-end" : "items-start"
                        )}
                    >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                            {msg.role === 'assistant' ? (
                                <>
                                    <Bot size={12} className="text-[#10b77f]" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">AI Advisor</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">You</span>
                                    <User size={12} className="text-slate-400" />
                                </>
                            )}
                        </div>
                        <div
                            className={cn(
                                "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                msg.role === 'user'
                                    ? "bg-[#10b77f] text-white rounded-tr-none"
                                    : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                            )}
                        >
                            {msg.text.split('\n').map((line, i) => (
                                <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                            ))}
                        </div>
                    </div>
                ))}
                {/* Placeholder for streaming or thinking */}
                {chatMessages[chatMessages.length - 1]?.role === 'user' && (
                    <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#10b77f]/10 flex items-center justify-center">
                            <Sparkles size={14} className="text-[#10b77f]" />
                        </div>
                        <div className="h-8 w-16 bg-white border border-slate-100 rounded-full flex items-center justify-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#10b77f] rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-[#10b77f] rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-[#10b77f] rounded-full"></span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100">
                <button
                    onClick={() => setInputMessage('현재 시장 트렌드 분석해줘')}
                    className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                    <BrainCircuit size={10} /> 시장 트렌드
                </button>
                <button
                    onClick={() => setInputMessage('최적 매수 시점 추천')}
                    className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                    <Maximize2 size={10} /> 매수 시점
                </button>
                <button
                    onClick={() => setInputMessage('감축 목표 시뮬레이션')}
                    className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                    <ArrowDownCircle size={10} /> 감축 시뮬레이션
                </button>
            </div>

            {/* Input */}
            <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 group"
            >
                <div className="flex-grow relative">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="AI 어드바이저에게 질문하세요..."
                        className="w-full bg-slate-50 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-[#10b77f]/20 transition-all placeholder:text-slate-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        <Sparkles size={16} className="text-[#10b77f] opacity-50 group-focus-within:opacity-100 transition-opacity" />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="w-11 h-11 bg-[#10b77f] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#10b77f]/20 hover:bg-[#0e9f6e] disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};
