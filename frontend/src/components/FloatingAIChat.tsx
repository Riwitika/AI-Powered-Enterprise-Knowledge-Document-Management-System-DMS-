import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Loader2, 
  Trash2, 
  Plus, 
  Copy, 
  ArrowLeftRight, 
  CornerDownLeft, 
  StickyNote, 
  RefreshCw,
  ChevronRight,
  BrainCircuit
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { aiService } from '../services/aiService';
import type { DocumentContext, AIProvider } from '../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isRegenerated?: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Summarize Document', prompt: 'Summarize the current document.' },
  { label: 'Explain Document', prompt: 'Explain the details of this document.' },
  { label: 'Key Risks', prompt: 'Extract all potential key risks and compliance vulnerabilities from this document.' },
  { label: 'Deadlines', prompt: 'Extract all deadlines and timeline constraints from this document.' },
  { label: 'Rewrite Professionally', prompt: 'Rewrite the document professionally.' },
  { label: 'Convert to Table', prompt: 'Convert the primary specifications of this document into a structured Markdown table.' },
  { label: 'Action Items', prompt: 'Generate a list of action items, decisions and checklist.' }
];

export default function FloatingAIChat() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState<AIProvider>('mock');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Enterprise AI Assistant. I have loaded your current document context. Ask me to summarize, review risks, rewrite parts, or generate tables.',
      timestamp: new Date()
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  // Document context state
  const [docContext, setDocContext] = useState<DocumentContext>({
    title: 'General Workspace',
    fileType: 'System Context',
    department: 'All Departments',
    owner: 'Fast Trade KMS',
    tags: ['Workspace'],
    version: 'v1.0',
    selectedText: '',
    fullContent: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Listen for editor events
  useEffect(() => {
    const handleDocChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setDocContext(prev => ({
          ...prev,
          ...customEvent.detail
        }));
      }
    };

    const handleContentUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setDocContext(prev => ({
          ...prev,
          fullContent: customEvent.detail.fullContent
        }));
      }
    };

    const handleSelection = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setDocContext(prev => ({
          ...prev,
          selectedText: customEvent.detail.text
        }));
      }
    };

    const handleTriggerAI = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setIsOpen(true);
        handleAsk(customEvent.detail);
      }
    };

    window.addEventListener('kms-active-document-change', handleDocChange);
    window.addEventListener('kms-active-document-content-update', handleContentUpdate);
    window.addEventListener('kms-editor-selection', handleSelection);
    window.addEventListener('trigger-floating-ai', handleTriggerAI);

    return () => {
      window.removeEventListener('kms-active-document-change', handleDocChange);
      window.removeEventListener('kms-active-document-content-update', handleContentUpdate);
      window.removeEventListener('kms-editor-selection', handleSelection);
      window.removeEventListener('trigger-floating-ai', handleTriggerAI);
    };
  }, [docContext]);

  // Clear selections when navigating between pages
  useEffect(() => {
    setShowNotification(null);
  }, [location.pathname]);

  const [showNotification, setShowNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || isThinking) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);

    try {
      const response = await aiService.ask(queryText, {
        provider,
        documentContext: docContext,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      const assistantMessage: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: `Error: ${(err as Error).message || 'Failed to generate response'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const query = question;
    setQuestion('');
    handleAsk(query);
  };

  const handleClearConversation = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Conversation history cleared. How can I assist you with your document content today?',
        timestamp: new Date()
      }
    ]);
    triggerToast('Chat history cleared');
  };

  const handleNewConversation = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Started new conversation. Context loaded: ${docContext.title}`,
        timestamp: new Date()
      }
    ]);
    triggerToast('Started new conversation thread');
  };

  // Response helper actions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast('Response copied to clipboard');
  };

  const insertAtCursor = (text: string) => {
    window.dispatchEvent(new CustomEvent('kms-ai-insert-content', {
      detail: { content: text }
    }));
    triggerToast('Inserted content into document');
  };

  const replaceSelection = (text: string) => {
    window.dispatchEvent(new CustomEvent('kms-ai-replace-content', {
      detail: { content: text }
    }));
    triggerToast('Replaced selected section');
  };

  const saveAsNote = (text: string) => {
    const savedNotes = JSON.parse(localStorage.getItem('kms-saved-notes') || '[]');
    savedNotes.push({
      id: Math.random().toString(),
      docTitle: docContext.title,
      content: text,
      timestamp: new Date().toLocaleString()
    });
    localStorage.setItem('kms-saved-notes', JSON.stringify(savedNotes));
    triggerToast('Saved response to local notebook');
  };

  const regenerateResponse = (userQueryIndex: number) => {
    if (userQueryIndex < 0 || isThinking) return;
    const lastUserQuery = messages[userQueryIndex].content;
    // Remove all messages after this query
    setMessages(prev => prev.slice(0, userQueryIndex + 1));
    handleAsk(lastUserQuery);
  };

  return (
    <>
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-24 right-6 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg z-[99999] animate-in fade-in slide-in-from-bottom-3 duration-250 select-none">
          {showNotification}
        </div>
      )}

      {/* Floating Toggle Button (Visible only when panel is closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9998] flex items-center select-none font-sans">
          <div className="mr-3 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 shadow-md animate-in fade-in slide-in-from-right-3 duration-250">
            Ask AI Assistant
          </div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('kms-close-layout-dropdowns'));
              setIsOpen(true);
            }}
            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 border border-blue-500"
            title="Open AI Assistant Panel"
          >
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </button>
        </div>
      )}

      {/* Right Side Sliding Panel */}
      <div 
        className={`fixed top-0 right-0 h-screen w-[440px] bg-white border-l border-slate-200/90 shadow-[0_0_40px_rgba(0,0,0,0.08)] z-[9999] flex flex-col transition-all duration-300 ease-out transform ${
          isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-900 block">AI Document Assistant</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block -mt-0.5">
                Fast Trade AI Core
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewConversation}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              title="New Conversation"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={handleClearConversation}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-850 transition-colors"
              title="Clear Thread"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-700 transition-colors"
              title="Close Panel"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Context Card */}
        <div className="px-5 py-3 border-b border-slate-100 bg-blue-50/20 text-[10px] text-slate-600 flex items-center justify-between select-none">
          <div className="flex flex-col truncate pr-4">
            <span className="font-extrabold text-slate-850 truncate">Context: {docContext.title}</span>
            <span className="text-[9px] text-slate-450 mt-0.5">
              Type: {docContext.fileType} | Version: {docContext.version} | Owner: {docContext.owner}
            </span>
          </div>
          <select 
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-[9px] text-slate-550 focus:outline-none focus:border-blue-500 shadow-sm shrink-0"
          >
            <option value="mock">Mock LLM</option>
            <option value="openai">OpenAI GPT-4</option>
            <option value="gemini">Google Gemini 1.5</option>
            <option value="claude">Anthropic Claude 3</option>
            <option value="azure">Azure LLM</option>
          </select>
        </div>

        {/* Message Container Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 custom-scrollbar">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-[9px] shrink-0 shadow-sm select-none">
                    AI
                  </div>
                )}
                
                <div className="max-w-[85%] space-y-2">
                  <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-850 border border-slate-200/80 rounded-tl-none'
                  }`}>
                    {/* Render Content */}
                    <div className="space-y-2 whitespace-pre-wrap">
                      {msg.content.startsWith('###') ? (
                        // Render simple markdown headlines and tables
                        msg.content.split('\n').map((line, lIdx) => {
                          if (line.startsWith('### ')) {
                            return <h3 key={lIdx} className="font-extrabold text-[12px] text-slate-900 mt-2 mb-1">{line.replace('### ', '')}</h3>;
                          }
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <strong key={lIdx} className="block text-slate-900 font-extrabold mt-1">{line.replace(/\*\*/g, '')}</strong>;
                          }
                          if (line.startsWith('* ')) {
                            return <li key={lIdx} className="ml-3 list-disc text-slate-655 font-medium">{line.replace('* ', '')}</li>;
                          }
                          if (line.startsWith('|')) {
                            // Render mock tables cleanly
                            return (
                              <div key={lIdx} className="font-mono text-[10px] bg-slate-50 p-1 border border-slate-100 rounded my-0.5 overflow-x-auto text-slate-600">
                                {line}
                              </div>
                            );
                          }
                          return <p key={lIdx} className="font-medium text-slate-655">{line}</p>;
                        })
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>

                  {/* Actions for Assistant Message */}
                  {!isUser && msg.id !== 'welcome' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 select-none">
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                      <button
                        onClick={() => insertAtCursor(msg.content)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                        title="Insert at cursor"
                      >
                        <CornerDownLeft className="h-3 w-3" /> Insert
                      </button>
                      
                      {docContext.selectedText && (
                        <button
                          onClick={() => replaceSelection(msg.content)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50 border border-blue-200/60 rounded-lg transition-colors shadow-sm"
                          title="Replace selected highlight"
                        >
                          <ArrowLeftRight className="h-3 w-3" /> Replace Selection
                        </button>
                      )}

                      <button
                        onClick={() => saveAsNote(msg.content)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                        title="Save as notebook note"
                      >
                        <StickyNote className="h-3 w-3" /> Save Note
                      </button>

                      {/* Find index of matching user query */}
                      {(() => {
                        const userQueryIndex = messages.slice(0, idx).reduce((acc, m, curIdx) => m.role === 'user' ? curIdx : acc, -1);
                        if (userQueryIndex !== -1) {
                          return (
                            <button
                              onClick={() => regenerateResponse(userQueryIndex)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                              title="Regenerate response"
                            >
                              <RefreshCw className="h-3 w-3" /> Regenerate
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking Loader */}
          {isThinking && (
            <div className="flex gap-3 justify-start">
              <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-[9px] shrink-0 select-none">
                AI
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-slate-450 italic">
                <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-500" />
                <span>AI Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion actions panel (Visible only when not generating) */}
        {!isThinking && (
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-1.5 select-none shrink-0 max-h-[100px] overflow-y-auto">
            {QUICK_ACTIONS.map((act, index) => (
              <button
                key={index}
                onClick={() => handleAsk(act.prompt)}
                className="text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 transition-all shadow-sm hover:border-slate-300"
              >
                {act.label}
              </button>
            ))}
          </div>
        )}

        {/* Selected text context banner */}
        {docContext.selectedText && (
          <div className="px-5 py-1.5 border-t border-blue-100 bg-blue-50/30 text-[9px] font-bold text-blue-700 flex items-center justify-between shrink-0 select-none truncate">
            <span className="truncate pr-4">Active Selection: "{docContext.selectedText}"</span>
            <button 
              onClick={() => setDocContext(prev => ({ ...prev, selectedText: '' }))}
              className="text-blue-500 hover:text-blue-700 shrink-0 font-extrabold uppercase"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0 select-none">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isThinking}
            placeholder={docContext.selectedText ? "Ask about selection..." : "Ask about document..."}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 transition-all placeholder-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!question.trim() || isThinking}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-2.5 shadow-sm transition-all disabled:opacity-50 flex items-center justify-center border border-blue-500 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}
