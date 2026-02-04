import React, { useEffect } from 'react';
import { MessageSquare, X, Send, Activity } from 'lucide-react';
import { cn } from './ui/utils';
import type { ChatMessage } from '../types';

interface ChatBotProps {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
    chatMessages: ChatMessage[];
    inputMessage: string;
    setInputMessage: (msg: string) => void;
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
}) => { // L1591 in original
    // The scroll to bottom effect was inside App in original (L583), need to move it or keep it?
    // Original L583: useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [chatMessages]);
    // It should be inside ChatBot component.

    // Note: App passed chatEndRef, but it's better if ChatBot handles its own ref if possible, 
    // OR if we strictly follow "extract", we keep the logic where it was.
    // However, `useEffect` depends on `chatMessages`, so it makes sense to be here.
    // But the Ref was created in App. 
    // Let's keep it consistent: passing the ref is fine, but the effect uses `chatMessages`.
    // If `chatEndRef` is passed, the parent might expect to control scrolling, but usually the UI component handles auto-scroll.
    // Exception: if App.tsx has the `useEffect` L583. 
    // I should check if I included the useEffect in ChatBot.tsx code block above? No.
    // I should add it here.

    // Wait, I can't change the props signature I just defined if I want to match App.tsx EXACTLY without logic change.
    // But moving useEffect here is cleaner.

    // Let's add the useEffect here.
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, chatEndRef]);

    return (
        <>
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
        </>
    );
};
