import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  Sparkles, 
  FileText, 
  History,
  CornerDownRight,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  timestamp: Date;
}

export default function AIChat() {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Queries
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: api.ai.conversations
  });

  // Mutations
  const askMutation = useMutation({
    mutationFn: api.ai.ask,
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
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

  const handleSubmit = (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const queryToSend = customQ || question;
    if (!queryToSend.trim() || askMutation.isPending) return;
    setQuestion('');
    askMutation.mutate(queryToSend);
  };

  const handleSelectHistoryItem = (item: any) => {
    setMessages([
      {
        id: `h-user-${item.id}`,
        role: 'user',
        content: item.question,
        timestamp: new Date(item.created_at)
      },
      {
        id: `h-assistant-${item.id}`,
        role: 'assistant',
        content: item.answer,
        sources: item.source_document_ids ? item.source_document_ids.map((id: string) => ({ id, name: `Cited Reference Document` })) : [],
        timestamp: new Date(item.created_at)
      }
    ]);
  };

  const suggestionPrompts = [
    "Summarize corporate security guidelines",
    "List department file ownership rules",
    "Search legal policies on document sharing",
    "Analyze recent file ingests"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      
      {/* Past questions sidebar */}
      <div className="border border-slate-200 bg-white rounded-xl p-4 flex flex-col h-full overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3 shrink-0">
          <History className="h-4.5 w-4.5 text-blue-600" />
          <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Chat Registry</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing logs...</span>
            </div>
          ) : history && history.length > 0 ? (
            history.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistoryItem(item)}
                className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer text-xs transition-all text-slate-600 hover:text-slate-900 block truncate font-medium"
              >
                <div className="font-bold text-slate-800 truncate mb-0.5">{item.question}</div>
                <div className="text-[9px] text-slate-400 font-semibold">{new Date(item.created_at).toLocaleDateString()}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-xs text-slate-400 py-8 italic flex flex-col items-center justify-center space-y-2">
              <HelpCircle className="h-8 w-8 text-slate-200" />
              <span>No conversational history found.</span>
            </div>
          )}
        </div>
      </div>

      {/* Main chat interface */}
      <div className="lg:col-span-3 glass-card rounded-xl flex flex-col h-full overflow-hidden relative shadow-sm">
        
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center gap-3">
          <div className="h-9 w-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm">Enterprise RAG Assistant</h2>
            <p className="text-[10px] text-slate-400 font-medium">Conversations are fully grounded in indexed vector information assets.</p>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
              <MessageSquare className="h-12 w-12 text-slate-200 animate-float" />
              <h3 className="font-extrabold text-slate-700 text-sm tracking-tight">Semantic Grounded Conversations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Query abstract terms, departmental policies, or complex file contents. The assistant searches your vector database to synthesize answers with document citations.
              </p>
              
              {/* Sugestion prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-4">
                {suggestionPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(undefined, p)}
                    className="p-3 text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <span className="truncate pr-2">{p}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-blue-600 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-3.5 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm rounded-tr-none font-semibold' 
                    : 'bg-white border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                }`}>
                  {m.content === 'Thinking...' ? (
                    <span className="flex items-center gap-1 py-1">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  ) : (
                    m.content
                  )}
                  
                  {/* Citations */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="border-t border-slate-100 pt-3 mt-3 space-y-2 text-slate-500">
                      <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
                        <CornerDownRight className="h-3 w-3 text-blue-600" />
                        <span>Sources cited</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((src: any) => (
                          <Link
                            key={src.id}
                            to={`/documents/${src.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] text-blue-650 hover:text-blue-700 transition-colors"
                          >
                            <FileText className="h-3 w-3 text-slate-400" />
                            <span className="font-semibold">{src.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => handleSubmit(e)} className="border-t border-slate-200 p-4 bg-slate-50 shrink-0 flex gap-2.5">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={askMutation.isPending}
            placeholder="Ask about company SOPs, project specs, code bases..."
            className="flex-1 bg-white border border-slate-250 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 text-slate-800"
          />
          <button
            type="submit"
            disabled={askMutation.isPending || !question.trim()}
            className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            {askMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
}
