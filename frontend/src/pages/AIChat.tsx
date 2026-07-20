import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  Send, 
  Sparkles, 
  FileText, 
  Copy,
  RotateCw,
  FolderOpen,
  ArrowRight,
  ShieldAlert,
  Save,
  MessageSquare
} from 'lucide-react';

import AIChatSidebar from '../components/AIChatSidebar';
import AIChatContextPanel from '../components/AIChatContextPanel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: string;
  sources?: string[];
  isLoading?: boolean;
}

export default function AIChat() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
  const welcomeName = isAdmin ? 'Arnim' : 'Riwitika';

  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThread, setActiveThread] = useState<string>('t-0');
  const [typingState, setTypingState] = useState(false);

  // Suggested Prompts
  const suggestedPrompts = [
    { title: 'Summarize this document', sub: 'Q2 Budget Report.pdf' },
    { title: 'Find HR Policies', sub: 'Check holiday criteria' },
    { title: 'Compare two documents', sub: 'Vendor contracts vs SOW' },
    { title: 'Explain Budget Report', sub: 'Logical cost breakdown' },
    { title: 'Generate Meeting Notes', sub: 'From May 18 transcript' },
    { title: 'Draft an Email', sub: 'Send summary to management' },
    { title: 'Find Similar Documents', sub: 'Lookup matching templates' }
  ];

  // Quick Actions Tags
  const quickActions = [
    'Summarize',
    'Translate',
    'Explain',
    'Generate',
    'Compare',
    'Rewrite',
    'Find Similar',
    'Extract Action Items'
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: text,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setTypingState(true);

    // Simulate AI response
    setTimeout(() => {
      setTypingState(false);
      
      let aiContent = '';
      let confidence = '96% confidence';
      let sources: string[] = ['Budget Report.pdf'];

      const lowerText = text.toLowerCase();
      if (lowerText.includes('summarize')) {
        aiContent = `### Executive Summary: Q2 Budget Report\n\nHere is a semantic analysis and summary of the uploaded **Q2 Budget Report**:\n\n*   **Revenue Growth**: Total incoming operations revenue reached **$42.6M** (up 14.5% compared to Q1 projections).\n*   **Operational Margins**: Maintained at **32%** due to division consolidations.\n*   **Key Risks**: Supply procurement charges increased by **8.4%** on global transit routes.\n*   **Strategic Action**: Review vendor contracts by **June 15** to lock-in rates.\n\n`;
        confidence = '98% confidence';
        sources = ['Budget Report.pdf', 'Vendor Agreement.pdf'];
      } else if (lowerText.includes('compare')) {
        aiContent = `### Document Comparison: Vendor Agreement vs SOW\n\nComparing **Vendor Agreement.pdf** and **Statement of Work (SOW)** reveals the following mismatches:\n\n1.  **SLA Clause**: The agreement commits to a **99.9% uptime**, while the SOW outlines **99.5%** expectations.\n2.  **Payment Terms**: Agreement lists **Net 30**, SOW mentions **Net 45**.\n3.  **Governance**: Agreement lists Mac OS workstations support; SOW leaves support details unspecified.`;
        confidence = '94% confidence';
        sources = ['Vendor Agreement.pdf', 'HR Policy.docx'];
      } else {
        aiContent = `Semantic lookup complete. I checked your knowledge repository for "**${text}**".\n\nBased on your active search query, I found several relevant documents: **Budget Report.pdf** (94% relevance) and **HR Policy.docx** (82% relevance). Let me know if you would like me to draft a comparative analysis.`;
        confidence = '91% confidence';
        sources = ['Budget Report.pdf', 'HR Policy.docx'];
      }

      const aiMsg: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: 'Just now',
        confidence,
        sources
      };

      setMessages(prev => [...prev, aiMsg]);
    }, 1200);
  };

  const handleThreadSelect = (id: string) => {
    setActiveThread(id);
    
    // Simulate loading past threads
    if (id === 't-1') {
      setMessages([
        {
          id: 'past-1',
          role: 'user',
          content: 'Summarize the Q2 Budget Report.',
          timestamp: '1h ago'
        },
        {
          id: 'past-2',
          role: 'assistant',
          content: `### Executive Summary: Q2 Budget Report\n\nHere is a semantic analysis and summary of the uploaded **Q2 Budget Report**:\n\n*   **Revenue Growth**: Total incoming operations revenue reached **$42.6M** (up 14.5% compared to Q1 projections).\n*   **Operational Margins**: Maintained at **32%** due to division consolidations.\n*   **Key Risks**: Supply procurement charges increased by **8.4%** on global transit routes.\n*   **Strategic Action**: Review vendor contracts by **June 15** to lock-in rates.`,
          timestamp: '1h ago',
          confidence: '98% confidence',
          sources: ['Budget Report.pdf']
        }
      ]);
    } else if (id === 't-2') {
      setMessages([
        {
          id: 'past-3',
          role: 'user',
          content: 'What are the employee KYC criteria?',
          timestamp: 'Yesterday'
        },
        {
          id: 'past-4',
          role: 'assistant',
          content: `According to the latest compliance manual, Employee KYC onboarding requires:\n\n1.  **Primary Identity Proof**: Passport, Aadhaar, or Driver's license.\n2.  **Corporate Work Email Verification**.\n3.  **Signed NDA** and policy acknowledgment sheet.\n\nAll forms must be uploaded to the **HR Policies** folder.`,
          timestamp: 'Yesterday',
          confidence: '95% confidence',
          sources: ['HR Policy.docx']
        }
      ]);
    } else {
      setMessages([]);
    }
  };

  return (
    <div className="flex h-full bg-[#f8fafc] -m-8 overflow-hidden font-sans text-slate-800">
      
      {/* LEFT SIDEBAR PANEL */}
      <AIChatSidebar
        activeThreadId={activeThread}
        onSelectThread={handleThreadSelect}
        onNewChat={() => {
          setActiveThread('t-new');
          setMessages([]);
        }}
      />

      {/* CENTER INTERACTIVE WORKSPACE */}
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden relative">
        
        {/* Main Conversation viewport */}
        <div className="flex-1 overflow-y-auto px-8 py-7 custom-scrollbar flex flex-col">
          {messages.length === 0 ? (
            
            // Welcome workspace banner
            <div className="my-auto max-w-2xl mx-auto text-center space-y-7 select-none">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Good Morning, {welcomeName}.
                </h1>
                <p className="text-slate-500 text-sm font-semibold">How can I help you work with enterprise knowledge today?</p>
              </div>

              {/* Suggestions grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[320px] overflow-y-auto px-1">
                {suggestedPrompts.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSend(p.title + ' for ' + p.sub)}
                    className="p-3.5 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl cursor-pointer text-left transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                  >
                    <span className="text-[11px] font-extrabold text-slate-850 block">{p.title}</span>
                    <span className="text-[9.5px] text-slate-455 block font-semibold mt-0.5">{p.sub}</span>
                  </div>
                ))}
              </div>
            </div>
            
          ) : (
            
            // Conversation Dialogue Log
            <div className="space-y-6 max-w-3xl mx-auto w-full pb-8">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-4 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Avatar bubble */}
                  {msg.role === 'assistant' && (
                    <div className="w-8.5 h-8.5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-[10px] shrink-0 select-none">
                      AI
                    </div>
                  )}

                  {/* Message card */}
                  <div className={`p-4.5 rounded-2xl max-w-[85%] shadow-[0_1px_3px_rgba(0,0,0,0.015)] border ${
                    msg.role === 'user'
                      ? 'bg-blue-600 border-blue-500 text-white font-semibold text-xs leading-relaxed'
                      : 'bg-white border-slate-200 text-slate-850'
                  }`}>
                    
                    {/* Content text */}
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-slate max-w-none text-xs leading-relaxed font-semibold">
                        <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        
                        {/* References source listing */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-2 select-none">Referenced Sources</span>
                            <div className="flex flex-wrap gap-2">
                              {msg.sources.map((s, sidx) => (
                                <div 
                                  key={sidx}
                                  onClick={() => alert(`Open referenced document: "${s}"`)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer text-[10px] text-slate-655 font-bold transition-all shadow-[0_1px_1px_rgba(0,0,0,0.01)]"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Dialogue Actions Footer bar */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] font-extrabold text-slate-400 select-none">
                          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                            <span>{msg.confidence}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button onClick={() => alert('Copied to clipboard (Mock)')} className="p-1 hover:text-slate-700 hover:bg-slate-55 rounded flex items-center gap-1">
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                            <button onClick={() => handleSend(messages[messages.length - 2]?.content)} className="p-1 hover:text-slate-700 hover:bg-slate-55 rounded flex items-center gap-1">
                              <RotateCw className="w-3 h-3" />
                              <span>Regen</span>
                            </button>
                            <button onClick={() => alert('Saved chat response (Mock)')} className="p-1 hover:text-slate-700 hover:bg-slate-55 rounded flex items-center gap-1">
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <p className="text-xs">{msg.content}</p>
                    )}
                    
                  </div>

                  {/* User initials bubble */}
                  {msg.role === 'user' && (
                    <div className="w-8.5 h-8.5 rounded-full bg-slate-200 border border-slate-350 flex items-center justify-center text-slate-700 font-extrabold text-[10px] shrink-0 select-none">
                      {welcomeName.charAt(0)}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typingState && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8.5 h-8.5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-[10px] shrink-0 select-none">
                    AI
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
            
          )}
        </div>

        {/* BOTTOM TYPING CONTAINER PILLS */}
        <div className="p-5 border-t border-slate-200 bg-white shrink-0">
          <div className="max-w-3xl mx-auto space-y-3.5">
            
            {/* Quick tag actions pills */}
            <div className="flex flex-wrap gap-1.5 select-none max-h-[80px] overflow-y-auto px-1">
              {quickActions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSend(`${tag} selected document context.`)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 border border-slate-200 text-[10px] text-slate-650 font-bold rounded-lg transition-all shadow-[0_1px_1.5px_rgba(0,0,0,0.01)]"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center"
            >
              <textarea
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask the Knowledge Assistant to summarize, lookup, or compare files..."
                rows={1}
                className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl pl-4 pr-12.5 py-3 text-xs text-slate-750 focus:outline-none transition-all placeholder-slate-400 font-semibold shadow-sm resize-none custom-scrollbar"
              />
              <button
                type="submit"
                className="glow-btn absolute right-2.5 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>
        </div>

      </div>

      {/* RIGHT SIDEBAR PANEL */}
      <AIChatContextPanel />

    </div>
  );
}
