import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { X, Send, Sparkles, Loader2, Globe, Maximize2 } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  timestamp: Date;
}

export default function FloatingAIChat() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Enterprise AI assistant. How can I help you with your documents today?',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Listen for trigger events from other pages (like DocumentTree buttons)
  useEffect(() => {
    const handleTriggerAI = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setIsOpen(true);
        const queryText = customEvent.detail;
        askMutation.mutate(queryText);
      }
    };
    window.addEventListener('trigger-floating-ai', handleTriggerAI);
    return () => window.removeEventListener('trigger-floating-ai', handleTriggerAI);
  }, []);

  // Check if we are on a document page and can parse document id
  const getActiveDocId = (): string | null => {
    const params = new URLSearchParams(location.search);
    const openDocId = params.get('open');
    if (openDocId) return openDocId;

    // Also support path format /documents/:id
    const match = location.pathname.match(/\/documents\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  };

  const askMutation = useMutation({
    mutationFn: (q: string) => {
      const docId = getActiveDocId();
      if (docId) {
        return api.ai.askDoc(docId, q);
      }
      return api.ai.ask(q);
    },
    onMutate: async (q) => {
      const userMessage: Message = {
        id: Math.random().toString(),
        role: 'user',
        content: q,
        timestamp: new Date()
      };
      const assistantPlaceholder: Message = {
        id: 'placeholder',
        role: 'assistant',
        content: 'Thinking...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, assistantPlaceholder]);
    },
    onSuccess: (res) => {
      setMessages(prev => {
        const list = [...prev];
        const placeholderIdx = list.findIndex(m => m.id === 'placeholder');
        if (placeholderIdx !== -1) {
          list[placeholderIdx] = {
            id: Math.random().toString(),
            role: 'assistant',
            content: res.answer,
            sources: res.source_documents,
            timestamp: new Date()
          };
        }
        return list;
      });
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
    onError: (err: any) => {
      setMessages(prev => {
        const list = [...prev];
        const placeholderIdx = list.findIndex(m => m.id === 'placeholder');
        if (placeholderIdx !== -1) {
          list[placeholderIdx] = {
            id: Math.random().toString(),
            role: 'assistant',
            content: `Error: ${err?.message || 'Failed to generate response'}`,
            timestamp: new Date()
          };
        }
        return list;
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || askMutation.isPending) return;
    const queryToSend = question;
    setQuestion('');
    askMutation.mutate(queryToSend);
  };

  const docId = getActiveDocId();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window Overlay */}
      {isOpen && (
        <div className="w-[380px] h-[520px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-6 duration-250">
          {/* Header */}
          <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500 text-white">
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-xs block">AI Copilot</span>
                {docId ? (
                  <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider block -mt-0.5">
                    Context: Current Document
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-blue-200/80 uppercase tracking-wider block -mt-0.5">
                    Context: Global Workspace
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                to="/chat"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-0.5 hover:bg-white/10 rounded"
                title="Open in Full Workspace"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-bold text-[10px]">
                    AI
                  </div>
                )}
                
                <div className="space-y-1.5 max-w-[80%]">
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    {msg.id === 'placeholder' ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                        <span className="text-slate-450 italic">Thinking...</span>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Sources</span>
                      {msg.sources.map((src: any, index: number) => (
                        <div key={index} className="flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:underline">
                          <Globe className="h-3 w-3 shrink-0" />
                          <span className="truncate">{src.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={docId ? "Ask about this document..." : "Ask a global question..."}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 font-medium"
            />
            <button
              type="submit"
              disabled={!question.trim() || askMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-2 shadow-sm transition-all disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button + Bubble Label (matching mockup) */}
      <div className="flex items-center">
        {!isOpen && (
          <div className="mr-3 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 shadow-md select-none animate-in fade-in slide-in-from-right-3 duration-250 whitespace-nowrap">
            Ask AI Assistant
          </div>
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 border border-blue-500"
          title="Ask AI Assistant"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="11" width="18" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M12 2V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="2" r="1.2" fill="currentColor" />
              <circle cx="8" cy="15" r="1.5" fill="currentColor" />
              <circle cx="16" cy="15" r="1.5" fill="currentColor" />
              <path d="M9 19C10.5 20 13.5 20 15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 14V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 14V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
