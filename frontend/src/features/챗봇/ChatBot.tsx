import React, { useState, useEffect, useRef } from 'react';
import {
    Send, X, MessageSquare,
    Sparkles, Bot, User, ArrowDownCircle,
    BrainCircuit
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

type ResizeDir = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

const DEFAULT_SIZE = { width: 384, height: 500 };
const MIN_SIZE = { width: 320, height: 420 };
const MAX_SIZE = { width: 1000, height: 900 };

export const ChatBot: React.FC<ChatBotProps> = ({
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    chatEndRef
}) => {
    const [size, setSize] = useState(DEFAULT_SIZE);
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{ x: number; y: number; w: number; h: number; dir: ResizeDir } | null>(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isChatOpen, chatEndRef]);

    useEffect(() => {
        if (!isResizing) return;
        const onMove = (e: MouseEvent) => {
            if (!resizeRef.current) return;
            const { x, y, w, h, dir } = resizeRef.current;
            const dx = e.clientX - x;
            const dy = e.clientY - y;

            let nextW = w;
            let nextH = h;

            if (dir === 'e' || dir === 'ne' || dir === 'se') nextW = w + dx;
            if (dir === 'w' || dir === 'nw' || dir === 'sw') nextW = w - dx;
            if (dir === 's' || dir === 'sw' || dir === 'se') nextH = h + dy;
            if (dir === 'n' || dir === 'nw' || dir === 'ne') nextH = h - dy;

            nextW = Math.max(MIN_SIZE.width, Math.min(MAX_SIZE.width, nextW));
            nextH = Math.max(MIN_SIZE.height, Math.min(MAX_SIZE.height, nextH));
            setSize({ width: nextW, height: nextH });
        };

        const onUp = () => {
            setIsResizing(false);
            resizeRef.current = null;
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isResizing]);

    const startResize = (dir: ResizeDir) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: size.width,
            h: size.height,
            dir,
        };
    };

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
                isResizing ? "select-none" : ""
            )}
            style={{ width: size.width, height: size.height }}
        >
            {/* Corner Handles */}
            <div onMouseDown={startResize('nw')} className="absolute left-0 top-0 w-3 h-3 cursor-nwse-resize z-50" />
            <div onMouseDown={startResize('ne')} className="absolute right-0 top-0 w-3 h-3 cursor-nesw-resize z-50" />
            <div onMouseDown={startResize('sw')} className="absolute left-0 bottom-0 w-3 h-3 cursor-nesw-resize z-50" />
            <div onMouseDown={startResize('se')} className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize z-50" />
            {/* Edge Handles */}
            <div onMouseDown={startResize('n')} className="absolute left-3 right-3 top-0 h-2 cursor-ns-resize z-40" />
            <div onMouseDown={startResize('s')} className="absolute left-3 right-3 bottom-0 h-2 cursor-ns-resize z-40" />
            <div onMouseDown={startResize('w')} className="absolute left-0 top-3 bottom-3 w-2 cursor-ew-resize z-40" />
            <div onMouseDown={startResize('e')} className="absolute right-0 top-3 bottom-3 w-2 cursor-ew-resize z-40" />

            <div className="p-4 bg-[#102219] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#10b77f]/20 flex items-center justify-center">
                        <Bot size={20} className="text-[#10b77f]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold flex items-center gap-1.5">
                            {"Be-REAL AI \uC5B4\uB4DC\uBC14\uC774\uC800"}
                            <span className="w-1.5 h-1.5 bg-[#10b77f] rounded-full"></span>
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            {"\uD0C4\uC18C \uACBD\uC601 \uC804\uBB38 AI \uBCF4\uC870"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsChatOpen(false)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

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
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        {"AI \uC5B4\uB4DC\uBC14\uC774\uC800"}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        {"\uC0AC\uC6A9\uC790"}
                                    </span>
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

            <div className="px-4 py-2 bg-white flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100">
                <button
                    onClick={() => setInputMessage('\uD604\uC7AC \uC2DC\uC7A5 \uD2B8\uB80C\uB4DC \uBD84\uC11D')}
                    className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                    <BrainCircuit size={10} /> {"\uC2DC\uC7A5 \uD2B8\uB80C\uB4DC"}
                </button>
                <button
                    onClick={() => setInputMessage('\uCD5C\uC801 \uB9E4\uC218 \uC2DC\uC810 \uCD94\uCC9C')}
                    className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                    <Sparkles size={10} /> {"\uB9E4\uC218 \uC2DC\uC810"}
                </button>
                <button
                    onClick={() => setInputMessage('\uAC10\uCD95 \uBAA9\uD45C \uC2DC\uBBAC\uB808\uC774\uC158')}
                    className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                    <ArrowDownCircle size={10} /> {"\uAC10\uCD95 \uC2DC\uBBAC\uB808\uC774\uC158"}
                </button>
            </div>

            <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 group"
            >
                <div className="flex-grow relative">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={"AI \uC5B4\uB4DC\uBC14\uC774\uC800\uC5D0\uAC8C \uC9C8\uBB38\uD558\uC138\uC694..."}
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
