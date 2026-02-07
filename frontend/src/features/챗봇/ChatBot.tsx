import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send, Activity } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import type { ChatMessage } from '../../types';

interface ChatBotProps {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
    chatMessages: ChatMessage[];
    inputMessage: string;
    setInputMessage: (msg: string) => void;
    handleSendMessage: (e: React.FormEvent) => void;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    reportScope: 'year' | 'all';
    setReportScope: (scope: 'year' | 'all') => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    chatEndRef,
    reportScope,
    setReportScope
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [dimensions, setDimensions] = useState({ width: 380, height: 600 });
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, chatEndRef]);

    useEffect(() => {
        if (!textareaRef.current) return;
        const el = textareaRef.current;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }, [inputMessage]);

    type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

    const startResize = (e: React.MouseEvent<HTMLDivElement>, dir: ResizeDir) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isChatOpen) return;
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const { width, height } = dimensions;

        const onMove = (event: MouseEvent) => {
            let deltaX = event.clientX - startX;
            let deltaY = event.clientY - startY;
            let newWidth = width;
            let newHeight = height;

            if (dir.includes('w')) {
                deltaX = -deltaX;
                newWidth = Math.max(320, width + deltaX);
            }
            if (dir.includes('e')) {
                newWidth = Math.max(320, width + deltaX);
            }
            if (dir.includes('n')) {
                deltaY = -deltaY;
                newHeight = Math.max(420, height + deltaY);
            }
            if (dir.includes('s')) {
                newHeight = Math.max(420, height + deltaY);
            }

            setDimensions({ width: newWidth, height: newHeight });
        };

        const onUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as unknown as React.FormEvent);
        }
    };

    return (
        <>
            <div
                className={`fixed bottom-8 right-8 z-40 transition-all duration-500 ${
                    isChatOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
                }`}
            >
                <div
                    className="relative"
                    style={{
                        width: dimensions.width,
                        height: dimensions.height,
                        minWidth: 320,
                        minHeight: 420
                    }}
                >
                    <div className="absolute inset-0 bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center rounded-t-[32px]">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#10b77f] p-2 rounded-xl shadow-lg">
                                    <MessageSquare size={18} />
                                </div>
                                <span className="font-bold text-sm tracking-wide">Strategic AI Agent</span>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FCFA] space-y-4">
                            {chatMessages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={cn(
                                            'max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed',
                                            msg.role === 'user'
                                                ? 'bg-[#10b77f] text-white rounded-br-none'
                                                : 'bg-white text-slate-600 border border-slate-100 rounded-bl-none'
                                        )}
                                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                    <div className="px-4 pt-4 bg-white border-t border-slate-100 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setReportScope('year')}
                            className={cn(
                                'flex-1 py-2 rounded-2xl text-xs font-semibold transition-all',
                                reportScope === 'year'
                                    ? 'bg-slate-900 text-white shadow'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            )}
                        >
                            올해 보고서만
                        </button>
                        <button
                            type="button"
                            onClick={() => setReportScope('all')}
                            className={cn(
                                'flex-1 py-2 rounded-2xl text-xs font-semibold transition-all',
                                reportScope === 'all'
                                    ? 'bg-slate-900 text-white shadow'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            )}
                        >
                            전체 보고서
                        </button>
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 rounded-b-[32px]">
                        <textarea
                            ref={textareaRef}
                            value={inputMessage}
                                onChange={e => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="전략을 질문하세요..."
                                rows={1}
                                className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#10b77f] outline-none font-medium placeholder:text-slate-400 resize-none overflow-y-auto"
                                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                            />
                            <button className="bg-slate-900 text-white p-3 rounded-xl hover:bg-[#10b77f] transition-all shadow-md">
                                <Send size={18} />
                            </button>
                        </form>
                    </div>

                    {isChatOpen && (
                        <>
                            <div className="absolute -top-3 left-0 right-0 h-6 cursor-n-resize" onMouseDown={e => startResize(e, 'n')} />
                            <div className="absolute -bottom-3 left-0 right-0 h-6 cursor-s-resize" onMouseDown={e => startResize(e, 's')} />
                            <div className="absolute top-0 bottom-0 -left-3 w-6 cursor-w-resize" onMouseDown={e => startResize(e, 'w')} />
                            <div className="absolute top-0 bottom-0 -right-3 w-6 cursor-e-resize" onMouseDown={e => startResize(e, 'e')} />
                            <div className="absolute -top-4 -left-4 w-8 h-8 cursor-nw-resize" onMouseDown={e => startResize(e, 'nw')} />
                            <div className="absolute -top-4 -right-4 w-8 h-8 cursor-ne-resize" onMouseDown={e => startResize(e, 'ne')} />
                            <div className="absolute -bottom-4 -left-4 w-8 h-8 cursor-sw-resize" onMouseDown={e => startResize(e, 'sw')} />
                            <div className="absolute -bottom-4 -right-4 w-8 h-8 cursor-se-resize" onMouseDown={e => startResize(e, 'se')} />
                        </>
                    )}
                </div>
            </div>

            {!isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-8 right-8 bg-slate-900 hover:bg-[#10b77f] text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-3 z-40 group duration-300"
                >
                    <Activity size={24} className="text-[#10b77f] group-hover:text-white transition-colors" />
                    <span className="font-bold pr-1 text-sm tracking-wide hidden md:inline-block">AI 전략 분석</span>
                </button>
            )}
        </>
    );
};
