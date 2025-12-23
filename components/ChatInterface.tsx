import React, { useState, useRef, useEffect } from 'react';
import { DivinationResult } from '../types';
import { chatWithDivinationAI } from '../services/geminiService_fixed';
import { storage } from '../services/storage';

interface ChatInterfaceProps {
    divinationResult: DivinationResult;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ divinationResult }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // generate a conversation id on mount
    useEffect(() => {
        try {
            const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
                ? (crypto as any).randomUUID()
                : `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
            setConversationId(id);
        } catch (e) {
            setConversationId(`${Date.now()}_${Math.floor(Math.random() * 1e6)}`);
        }
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput(''); // Clear input early

        // Add user message to UI
        const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Persist the user message first (non-blocking)
            try {
                await storage.saveConversation(conversationId || undefined, {
                    messages: [{ role: 'user', text: userMsg }],
                    divination: divinationResult || null
                });
            } catch (e) {
                console.warn('Failed to save user message locally/remote:', e);
            }

            // Call AI Service (pass conversationId so service can tag the record)
            const responseText = await chatWithDivinationAI(divinationResult, messages, userMsg, conversationId || undefined);

            // Append model message locally
            const updated = [...messages, { role: 'user' as const, text: userMsg }, { role: 'model' as const, text: responseText }];
            setMessages(updated);

            // Persist full exchange (non-blocking)
            try {
                await storage.saveConversation(conversationId || undefined, {
                    messages: updated,
                    divination: divinationResult || null
                });
            } catch (e) {
                console.warn('Failed to save conversation after response:', e);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "抱歉，神諭連結中斷，請重試。" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in-up">
            <div className="bg-white/5 backdrop-blur-md border border-yellow-200/20 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[500px]">

                {/* Header */}
                <div className="bg-emerald-950/50 p-4 border-b border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-600/20 flex items-center justify-center text-yellow-200 text-lg">
                        🤔
                    </div>
                    <h3 className="text-lg font-serif text-yellow-100/90 tracking-wide">
                        向大師請益
                    </h3>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <div className="text-center text-white/40 mt-12 px-8">
                            <p className="mb-2 text-xl opacity-50">✨</p>
                            <p className="text-sm">
                                對卦象還有疑問嗎？<br />
                                您可以直接詢問大師，獲取更深入的指引。
                            </p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`
                  max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${msg.role === 'user'
                                        ? 'bg-emerald-600/80 text-white rounded-tr-sm border border-emerald-500/30'
                                        : 'bg-stone-800/80 text-yellow-50/90 rounded-tl-sm border border-stone-600/30'
                                    }
                `}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-stone-800/80 rounded-2xl px-4 py-3 rounded-tl-sm border border-stone-600/30 flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-yellow-200/50 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-yellow-200/50 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-yellow-200/50 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/20 border-t border-white/5">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="請輸入您的問題..."
                            disabled={isLoading}
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50 focus:bg-black/30 transition-colors"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="bg-yellow-600/80 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
