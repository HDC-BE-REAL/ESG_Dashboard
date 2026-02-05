import { useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui';

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

interface ChatBotProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: ChatMessage[];
    inputMessage: string;
    setInputMessage: (msg: string) => void;
    isTyping: boolean;
    onSendMessage: (e: React.FormEvent) => void;
}

export function ChatBot({
    isOpen,
    setIsOpen,
    messages,
    inputMessage,
    setInputMessage,
    isTyping,
    onSendMessage,
}: ChatBotProps) {
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => scrollToBottom(), [messages]);

    return (
        <>
            <div className={cn("fixed bottom-8 right-8 z-50 transition-all duration-500", isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none')}>
                <div className="bg-white w-[400px] h-[600px] rounded-[40px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3"><div className="bg-emerald-500 p-2 rounded-xl shadow-lg"><MessageSquare size={18} /></div><span className="font-black text-sm uppercase tracking-tighter">Strategic Intelligence</span></div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                <div className={cn("max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm leading-relaxed", msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-100')}>{msg.text}</div>
                            </div>
                        ))}
                        {isTyping && <div className="flex justify-start"><div className="bg-white border border-slate-100 p-4 rounded-3xl text-sm text-slate-400">입력 중...</div></div>}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={onSendMessage} className="p-6 bg-white border-t border-slate-100 flex gap-3">
                        <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="분석관에게 조언을 구하세요..." className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium" />
                        <Button type="submit" className="shadow-lg shadow-emerald-500/20"><Send size={20} /></Button>
                    </form>
                </div>
            </div>

            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="fixed bottom-10 right-10 bg-slate-900 text-white p-5 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-3 z-40 group">
                    <Activity size={24} className="text-emerald-400 group-hover:animate-pulse" />
                    <span className="font-black pr-2 text-sm uppercase tracking-widest text-nowrap">전략 분석</span>
                </button>
            )}
        </>
    );
}
