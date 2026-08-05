import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  Send, 
  Sparkles, 
  Paperclip,
  Check,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  DollarSign,
  PieChart,
  MessageSquare,
  MoreVertical,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export default function AIChat() {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'm-1',
      role: 'user',
      content: 'Show me the key highlights from Q2 Budget Report and compare it with Q1.',
      timestamp: '10:32 AM'
    },
    {
      id: 'm-2',
      role: 'assistant',
      content: 'Here are the key highlights from the Q2 Budget Report and a comparison with Q1:',
      timestamp: '10:32 AM',
      showStructuredCard: true
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [typingState, setTypingState] = useState(false);
  const [recentChats, setRecentChats] = useState<{ title: string; time: string }[]>([
    { title: 'Q2 Budget highlights', time: '10:32 AM' },
    { title: 'Team performance overview', time: 'Yesterday' },
    { title: 'Pending vendor contracts', time: 'Yesterday' },
    { title: 'HR policies summary', time: '2 days ago' },
    { title: 'Project status update', time: '3 days ago' }
  ]);

  // Load real conversations from backend
  const { data: dbConversations } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => api.ai.conversations(),
  });

  useEffect(() => {
    if (dbConversations && dbConversations.length > 0) {
      const mapped = dbConversations.map((c: any) => ({
        title: c.question.length > 25 ? c.question.slice(0, 25) + '...' : c.question,
        time: new Date(c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }));
      setRecentChats(mapped);
    }
  }, [dbConversations]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || typingState) return;

    // Add user message
    const userMsg = {
      id: Math.random().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setTypingState(true);

    try {
      const res = await api.ai.ask(text);
      setTypingState(false);
      const aiMsg = {
        id: Math.random().toString(),
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        sourceDocuments: res.source_documents
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Global AI Ask failed:', err);
      setTypingState(false);
      const errMsg = {
        id: Math.random().toString(),
        role: 'assistant',
        content: "AI service is temporarily unavailable.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        failedQuestion: text
      };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  const suggestedQuestions = [
    'Summarize the Sales Report - April.xlsx',
    'What are the pending approvals?',
    'Show documents uploaded by Paras Jain',
    'Compare Q2 and Q1 revenue',
    'List HR policies and documents'
  ];

  const capabilities = [
    { title: 'Summarize', desc: 'Get concise summaries of long documents', color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { title: 'Analyze', desc: 'Extract insights and key information', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { title: 'Compare', desc: 'Compare data across documents', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { title: 'Answer', desc: 'Get answers from your organization\'s data', color: 'text-purple-600 bg-purple-50 border-purple-100' }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto font-sans text-slate-800 pb-12 select-none">
      
      {/* 1. LEFT CONVERSATION WORKSPACE (WIDE COLUMN) */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[680px]">
        
        {/* Workspace Header */}
        <div className="flex items-center justify-between pb-4.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-none">AI Assistant</h1>
              <p className="text-[11px] text-slate-455 font-bold mt-1">Your intelligent workspace companion</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                alert('Workspace cleared.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-extrabold text-slate-655 bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>New Chat</span>
            </button>
            <button type="button" className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Feed Display */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 custom-scrollbar pr-1">
          {messages.length === 0 ? (
            <div className="my-auto text-center py-20">
              <Sparkles className="w-10 h-10 text-blue-600 mx-auto animate-pulse mb-3" />
              <h2 className="text-base font-extrabold text-slate-800">Ask the Intelligence Workspace</h2>
              <p className="text-xs text-slate-455 font-semibold mt-1">Select a suggested prompt or ask any questions about your documents.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-3.5">
                  
                  {/* User Bubble layout */}
                  {msg.role === 'user' ? (
                    <div className="flex justify-end items-end gap-2.5">
                      <div className="flex flex-col items-end gap-1 max-w-[80%]">
                        <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl rounded-tr-none text-slate-800 text-xs font-bold leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-text">
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-extrabold select-none mr-1.5">
                          <span>{msg.timestamp}</span>
                          <span className="text-blue-500 font-bold flex leading-none">&bull;&bull;</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    
                    // Assistant response card layout
                    <div className="flex items-start gap-3.5">
                      {/* Avatar robot symbol */}
                      <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-150 flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <Sparkles className="w-4.5 h-4.5" />
                      </div>

                      <div className="flex-1 space-y-3.5 min-w-0">
                        {msg.isError ? (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl rounded-tl-none text-red-800 text-xs font-bold leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-text max-w-[80%] space-y-2.5 animate-in fade-in duration-200">
                            <p>{msg.content}</p>
                            <button
                              type="button"
                              onClick={() => handleSend(msg.failedQuestion)}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 hover:border-red-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Retry</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-slate-800 leading-normal select-text">{msg.content}</p>
                        )}

                        {/* Structured details card wrapper */}
                        {msg.showStructuredCard && (
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-5 animate-in fade-in duration-200">
                            
                            {/* Summary header */}
                            <h3 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                              Q2 vs Q1 Budget Summary
                            </h3>

                            {/* Metrics grid cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                              {[
                                { title: 'Total Revenue', value: '₹2.45 Cr', rate: '18%', desc: 'Q1: ₹2.08 Cr', status: 'up', color: 'text-blue-600', icon: DollarSign },
                                { title: 'Net Profit', value: '₹48.6 L', rate: '22%', desc: 'Q1: ₹39.8 L', status: 'up', color: 'text-emerald-600', icon: TrendingUp },
                                { title: 'Total Expenses', value: '₹1.96 Cr', rate: '15%', desc: 'Q1: ₹1.70 Cr', status: 'down', color: 'text-red-500', icon: DollarSign },
                                { title: 'Operating Margin', value: '19.8%', rate: '3.2%', desc: 'Q1: 16.6%', status: 'up', color: 'text-blue-600', icon: PieChart }
                              ].map((item, idx) => {
                                const IconComponent = item.icon;
                                return (
                                  <div key={idx} className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[9px] text-slate-455 font-bold uppercase tracking-wider block truncate">{item.title}</span>
                                      <IconComponent className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    </div>
                                    
                                    <div className="mt-2.5">
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-extrabold text-slate-950 leading-none">{item.value}</span>
                                        <span className={`text-[8.5px] font-extrabold flex items-center leading-none ${
                                          item.status === 'down' ? 'text-red-500' : 'text-emerald-600'
                                        }`}>
                                          {item.status === 'down' ? <ArrowDown className="w-2 h-2 shrink-0" /> : <ArrowUp className="w-2 h-2 shrink-0" />}
                                          <span>{item.rate}</span>
                                        </span>
                                      </div>
                                      <span className="text-[9px] text-slate-400 font-semibold block mt-1">{item.desc}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Highlights checklist */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">
                                Key Highlights
                              </h4>
                              
                              <div className="space-y-2 text-xs font-semibold text-slate-700 leading-relaxed">
                                {[
                                  'Revenue increased by 18% driven by strong performance in Sales and Projects.',
                                  'Net profit improved by 22% due to better cost optimization and higher operational efficiency.',
                                  'Marketing expenses increased by 12% for Q2 campaigns, resulting in improved lead conversion.',
                                  'Finance and HR costs remained within the planned budget.',
                                  'Overall performance is ahead of target for Q2.'
                                ].map((hl, idx) => (
                                  <div key={idx} className="flex gap-2.5 items-start">
                                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-150/60 mt-0.5">
                                      <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                                    </div>
                                    <span className="text-slate-655 font-bold leading-normal">{hl}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Top relevant documents */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">
                                Top Relevant Documents
                              </h4>
                              
                              <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white text-xs font-semibold text-slate-750 divide-y divide-slate-100">
                                {[
                                  { name: 'Q2 Budget Report.docx', type: 'DOCX', path: '/Finance/Budget Reports/2024/Q2/', date: 'Modified 19 May 2024' },
                                  { name: 'Q1 Budget Report.docx', type: 'DOCX', path: '/Finance/Budget Reports/2024/Q1/', date: 'Modified 15 Feb 2024' },
                                  { name: 'Financial Summary Q2.xlsx', type: 'XLSX', path: '/Finance/Reports/2024/Q2/', date: 'Modified 18 May 2024' }
                                ].map((doc, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-4 p-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-[9px] border border-blue-100 shrink-0">
                                        {doc.type}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="font-extrabold text-slate-900 block truncate leading-tight">{doc.name}</span>
                                        <span className="text-[9.5px] text-slate-400 block mt-0.5 truncate leading-none">{doc.path} &bull; {doc.date}</span>
                                      </div>
                                    </div>
                                    
                                    <button 
                                      type="button"
                                      onClick={() => alert(`Opening doc: "${doc.name}"`)}
                                      className="px-3.5 py-1 text-[10.5px] font-extrabold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 hover:border-blue-350 rounded-lg transition-colors shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                                    >
                                      Open
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        )}

                        {msg.sourceDocuments && msg.sourceDocuments.length > 0 && (
                          <div className="space-y-3 mt-3 animate-in fade-in duration-200">
                            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">
                              Top Relevant Documents
                            </h4>
                            
                            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white text-xs font-semibold text-slate-750 divide-y divide-slate-100">
                              {msg.sourceDocuments.map((doc: any, sIdx: number) => (
                                <div key={sIdx} className="flex items-center justify-between gap-4 p-3 hover:bg-slate-50/50 transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-[9px] border border-blue-100 shrink-0">
                                      {doc.file_type || 'DOCX'}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-extrabold text-slate-900 block truncate leading-tight">{doc.name}</span>
                                      <span className="text-[9.5px] text-slate-400 block mt-0.5 truncate leading-none">
                                        {doc.file_path} &bull; Modified {new Date(doc.updated_at).toLocaleDateString('en-IN')}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <button 
                                    type="button"
                                    onClick={() => window.open(`/documents/${doc.id}`, '_blank')}
                                    className="px-3.5 py-1 text-[10.5px] font-extrabold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 hover:border-blue-350 rounded-lg transition-colors shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                                  >
                                    Open
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  )}

                </div>
              ))}
              {typingState && (
                <div className="flex items-start gap-3.5">
                  <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-150 flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] animate-pulse">
                    <Sparkles className="w-4.5 h-4.5" />
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

        {/* Bottom Typing input panel */}
        <div className="border-t border-slate-100 pt-4 shrink-0">
          
          {/* Main textarea form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/5 bg-[#f8fafc] rounded-xl pl-4 pr-3.5 py-2.5 transition-all shadow-sm"
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
              placeholder="Ask anything about your documents..."
              rows={1}
              className="flex-1 bg-transparent text-xs text-slate-750 focus:outline-none resize-none font-semibold placeholder-slate-400 custom-scrollbar pr-10"
            />
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                type="button" 
                onClick={() => alert('Attachments limit: 3 files.')}
                className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-450 hover:text-slate-700 transition-all"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              <button
                type="submit"
                className="glow-btn p-1.8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center shrink-0 border border-blue-500"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
          
          <span className="text-[9.5px] text-slate-400 font-bold tracking-normal block text-center mt-2.5 select-none">
            AI responses may not always be accurate. Please verify important information.
          </span>
        </div>

      </div>

      {/* 2. RIGHT SIDEBAR DETAILS (NARROW COLUMN) */}
      <div className="w-full lg:w-[280px] shrink-0 space-y-6">
        
        {/* Suggested Questions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-extrabold text-xs text-slate-900">Suggested Questions</span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2 mt-3.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                className="w-full p-2.5 text-left bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-350 rounded-xl transition-all flex gap-2.5 text-[11px] font-bold text-slate-655 leading-normal shadow-[0_1px_1.5px_rgba(0,0,0,0.015)]"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="truncate flex-1">{q}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Chats list */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-extrabold text-xs text-slate-900">Recent Chats</span>
            <button 
              type="button" 
              onClick={() => alert('Viewing entire past chats history.')}
              className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold uppercase tracking-wider"
            >
              View all
            </button>
          </div>

          <div className="space-y-3 mt-3.5">
            {recentChats.map((chat, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSend(chat.title)}
                className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold p-0.5 hover:bg-slate-50 rounded"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-extrabold text-slate-750 block truncate leading-tight">{chat.title}</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5 select-none leading-none">{chat.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Capabilities grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-extrabold text-xs text-slate-900">AI Capabilities</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 mt-3.5">
            {capabilities.map((cap, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.015)] flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10.5px] font-extrabold text-slate-900 block">{cap.title}</span>
                  <p className="text-[9px] text-slate-455 font-medium mt-1 leading-normal">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
