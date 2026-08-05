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
  BrainCircuit,
  ChevronDown,
  Paperclip,
  FileText,
  FileWarning,
  Layers
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
  sourceDocuments?: any[];
  isError?: boolean;
  failedQuestion?: string;
}

const DOCUMENT_ACTIONS = [
  { label: 'Summarize Document', prompt: 'Summarize the current document.' },
  { label: 'Executive Summary', prompt: 'Generate an executive summary of this document.' },
  { label: 'Rewrite Professionally', prompt: 'Rewrite the document professionally.' },
  { label: 'Improve Grammar', prompt: 'Improve the grammar and language mechanics of the text.' },
  { label: 'Explain Document', prompt: 'Explain the details of this document.' }
];

const ANALYSIS_ACTIONS = [
  { label: 'Extract Risks', prompt: 'Extract all potential key risks and compliance vulnerabilities from this document.' },
  { label: 'Extract Decisions', prompt: 'Extract key decisions from this document.' },
  { label: 'Extract Deadlines', prompt: 'Extract all deadlines and timeline constraints from this document.' },
  { label: 'Action Items', prompt: 'Generate meeting action items and decisions from this document.' },
  { label: 'Compliance Check', prompt: 'Perform a compliance check audit on this document.' }
];

const CREATION_ACTIONS = [
  { label: 'Meeting Minutes', prompt: 'Create Meeting Minutes Sync' },
  { label: 'SOP', prompt: 'Create standard operating compliance SOP' },
  { label: 'Policy', prompt: 'Create HR policy outline' },
  { label: 'Proposal', prompt: 'Create Project Proposal Outline' },
  { label: 'Technical Document', prompt: 'Create Technical specification outline' }
];

export default function FloatingAIChat() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [provider] = useState<AIProvider>('openai');
  
  // Custom loading status cycle
  const [loadingStatus, setLoadingStatus] = useState('AI Thinking...');

  // Active accordion quick actions
  const [activeGroup, setActiveGroup] = useState<'doc' | 'analysis' | 'creation' | null>(null);

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

  const [selectedMeta, setSelectedMeta] = useState<{ text: string; locationType: string }>({
    text: '',
    locationType: ''
  });

  // Route-based context checks
  const isDocumentPage = location.pathname.includes('/documents/') && !location.pathname.endsWith('/documents');
  const hasActiveDoc = isDocumentPage && docContext.title && docContext.title !== 'General Workspace';
  const activeMode = hasActiveDoc ? 'document' : 'repository';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome! I'm your AI Document Assistant. I can search your repository, summarize documents, explain policies, generate new content, and answer questions using your organization's knowledge.",
      timestamp: new Date()
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const displayStatus = isThinking ? "Generating..." : "Ready";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Format welcome message when mode/doc changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Welcome! I'm your AI Document Assistant. ${hasActiveDoc ? `I have loaded context for "${docContext.title}".` : 'I have loaded your organization repository.'} I can search your repository, summarize documents, explain policies, generate new content, and answer questions using your organization's knowledge.`,
        timestamp: new Date()
      }
    ]);
  }, [activeMode, docContext.title]);

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
        setSelectedMeta({
          text: customEvent.detail.text,
          locationType: customEvent.detail.locationType || 'Paragraph'
        });
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

  // Clear notifications and reset document context when navigating away from document views
  useEffect(() => {
    setShowNotification(null);
    const isDocPage = location.pathname.includes('/documents/') && !location.pathname.endsWith('/documents');
    if (!isDocPage) {
      setDocContext({
        title: 'General Workspace',
        fileType: 'System Context',
        department: 'All Departments',
        owner: 'Fast Trade KMS',
        tags: ['Workspace'],
        version: 'v1.0',
        selectedText: '',
        fullContent: ''
      });
    }
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
    
    // Start Loading Status cycler
    setLoadingStatus('Searching repository...');
    const statusCycle = ['Searching repository...', 'Reading documents...', 'Generating response...'];
    let cycleIdx = 0;
    const cycleInterval = setInterval(() => {
      cycleIdx = (cycleIdx + 1) % statusCycle.length;
      setLoadingStatus(statusCycle[cycleIdx]);
    }, 700);

    try {
      const response = await aiService.ask(queryText, {
        provider,
        documentContext: docContext,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        mode: activeMode
      });

      clearInterval(cycleInterval);
      const assistantMessageId = Math.random().toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        sourceDocuments: response.sourceDocuments
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsThinking(false);

      // Streaming Typewriter simulation
      const words = response.answer.split(' ');
      let currentWordIndex = 0;
      let currentContent = '';

      const streamInterval = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentContent += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex];
          setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: currentContent } : m));
          currentWordIndex++;
        } else {
          clearInterval(streamInterval);
        }
      }, 20);

    } catch (err) {
      clearInterval(cycleInterval);
      setIsThinking(false);
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: 'AI service is temporarily unavailable.',
        timestamp: new Date(),
        isError: true,
        failedQuestion: queryText
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const query = question;
    setQuestion('');
    handleAsk(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (question.trim()) {
        const query = question;
        setQuestion('');
        handleAsk(query);
      }
    }
  };

  const handleClearConversation = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Welcome! I'm your AI Document Assistant. ${hasActiveDoc ? `I have loaded context for "${docContext.title}".` : 'I have loaded your organization repository.'} I can search your repository, summarize documents, explain policies, generate new content, and answer questions using your organization's knowledge.`,
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
        content: `Welcome! I'm your AI Document Assistant. ${hasActiveDoc ? `I have loaded context for "${docContext.title}".` : 'I have loaded your organization repository.'} I can search your repository, summarize documents, explain policies, generate new content, and answer questions using your organization's knowledge.`,
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
    setMessages(prev => prev.slice(0, userQueryIndex + 1));
    handleAsk(lastUserQuery);
  };

  const toggleAccordion = (group: 'doc' | 'analysis' | 'creation') => {
    setActiveGroup(prev => prev === group ? null : group);
  };

  return (
    <>
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-24 right-6 bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl z-[99999] animate-in fade-in slide-in-from-bottom-3 duration-250 select-none font-semibold">
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
        className={`fixed top-0 right-0 h-screen w-[440px] bg-white border-l border-slate-200/90 shadow-[0_0_40px_rgba(0,0,0,0.06)] z-[9999] flex flex-col transition-all duration-300 ease-out transform ${
          isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <BrainCircuit className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-900 block">AI Document Assistant</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block -mt-0.5 select-none">
                {activeMode === 'document' ? 'Document Assistant Mode' : 'Repository Assistant Mode'}
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
              title="Clear Conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-455 hover:text-slate-700 transition-colors"
              title="Close Panel"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Context Header Card (Polished UI Indicator) */}
        <div className="px-5 py-3 border-b border-slate-100 bg-blue-50/15 text-[10px] text-slate-655 flex items-center justify-between select-none shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.005)]">
          {hasActiveDoc ? (
            <div className="flex flex-col truncate pr-4">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Document:</span>
              <span className="font-extrabold text-slate-850 truncate">{docContext.title}</span>
              <div className="flex items-center gap-2 text-[9px] text-slate-455 mt-0.5 font-bold">
                <span>Version: {docContext.version}</span>
                <span>•</span>
                <span>Status: {displayStatus}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col truncate pr-4">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Workspace:</span>
              <span className="font-extrabold text-slate-850 truncate">Finance / Reports</span>
              <div className="flex items-center gap-2 text-[9px] text-slate-455 mt-0.5 font-bold">
                <span>Repository Status: {displayStatus}</span>
              </div>
            </div>
          )}
          
          <div className="bg-blue-500/10 border border-blue-200/50 rounded-lg px-2.5 py-1 font-extrabold text-[8px] text-blue-700 tracking-wider uppercase select-none shrink-0 shadow-sm">
            Enterprise AI (Auto)
          </div>
        </div>

        {/* Message Container Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 custom-scrollbar">
          
          {/* Smart Empty State suggestions */}
          {messages.length <= 1 && (
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-3.5 mt-1 mb-2 animate-in fade-in slide-in-from-top-3 duration-250 border-dashed">
              <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">
                I can help you:
              </span>
              <div className="grid grid-cols-1 gap-1 text-xs font-bold text-slate-650">
                {[
                  { text: 'Search company documents', prompt: 'Find Finance Policies' },
                  { text: 'Summarize active files', prompt: 'Summarize the current document.' },
                  { text: 'Explain loaded terms', prompt: 'Explain the details of this document.' },
                  { text: 'Generate draft proposals', prompt: 'Locate Project Proposal' },
                  { text: 'Create standard compliance SOPs', prompt: 'Create standard operating compliance SOP' },
                  { text: 'Extract timelines and milestones', prompt: 'Extract all deadlines and timeline constraints from this document.' },
                  { text: 'Answer general repository queries', prompt: 'What is Fast Trade?' }
                ].map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAsk(item.prompt)}
                    className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-xl text-left transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm relative ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : msg.isError
                        ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none'
                        : 'bg-white text-slate-855 border border-slate-200/80 rounded-tl-none'
                  }`}>
                    {/* Render Content */}
                    <div className="space-y-2 whitespace-pre-wrap">
                      {msg.content.startsWith('###') ? (
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
                            return (
                              <div key={lIdx} className="font-mono text-[10px] bg-slate-50 p-1.5 border border-slate-100 rounded my-0.5 overflow-x-auto text-slate-600">
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
                    {/* Timestamp bubble indicator */}
                    <span className={`text-[8px] block mt-1.5 select-none font-bold ${isUser ? 'text-blue-200 text-right' : 'text-slate-400 text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {!isUser && msg.isError && (
                      <div className="mt-2 flex items-center">
                        <button
                          type="button"
                          onClick={() => handleAsk(msg.failedQuestion || '')}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 hover:border-red-300 rounded-lg text-[9px] font-extrabold flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {!isUser && msg.sourceDocuments && msg.sourceDocuments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Sources & Citations:</span>
                      <div className="flex flex-col gap-1">
                        {msg.sourceDocuments.map((doc: any, sIdx: number) => (
                          <div key={sIdx} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                            <div className="flex items-center gap-1.5 truncate">
                              <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded font-black text-[8px] border border-blue-100 flex items-center justify-center shrink-0">
                                {doc.file_type || 'DOCX'}
                              </div>
                              <span className="text-[10px] font-extrabold text-slate-750 truncate max-w-[200px]" title={doc.name}>
                                {doc.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => window.open(`/documents/${doc.id}`, '_blank')}
                              className="px-2 py-0.5 border border-blue-200 text-blue-650 hover:bg-blue-50 text-[9px] font-bold rounded shadow-sm shrink-0"
                            >
                              Open
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions for Assistant Message */}
                  {!isUser && msg.id !== 'welcome' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 select-none">
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3 w-3 text-slate-400" /> Copy
                      </button>
                      <button
                        onClick={() => insertAtCursor(msg.content)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                        title="Insert at cursor"
                      >
                        <CornerDownLeft className="h-3 w-3 text-slate-400" /> Insert
                      </button>
                      
                      {docContext.selectedText && (
                        <button
                          onClick={() => replaceSelection(msg.content)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold text-blue-650 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50 border border-blue-200/60 rounded-lg transition-colors shadow-sm"
                          title="Replace selected highlight"
                        >
                          <ArrowLeftRight className="h-3 w-3 text-blue-500" /> Replace Selection
                        </button>
                      )}

                      <button
                        onClick={() => saveAsNote(msg.content)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                        title="Save as notebook note"
                      >
                        <StickyNote className="h-3 w-3 text-slate-400" /> Save Note
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
                              <RefreshCw className="h-3 w-3 text-slate-400" /> Regenerate
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

          {/* Thinking Loader (Dynamic Enterprise status indicators) */}
          {isThinking && (
            <div className="flex gap-3 justify-start animate-pulse">
              <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-[9px] shrink-0 select-none">
                AI
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2.5 text-xs text-slate-450 italic">
                <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-500" />
                <span className="font-semibold text-slate-550">{loadingStatus}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Collapsible Action Sections (Counts + Outlined Icons + Consistent Spacing) */}
        {!isThinking && (
          <div className="border-t border-slate-100 bg-slate-50/50 flex flex-col select-none shrink-0 select-none transition-all duration-200">
            {/* Category 1: Document Actions */}
            <div className="border-b border-slate-200/50">
              <button
                type="button"
                onClick={() => toggleAccordion('doc')}
                className="w-full px-5 py-2.5 flex items-center justify-between text-[10px] font-extrabold text-slate-550 hover:bg-slate-100/40 transition-colors uppercase tracking-widest"
              >
                <div className="flex items-center gap-2 text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Document Actions ({DOCUMENT_ACTIONS.length})</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeGroup === 'doc' ? 'rotate-180' : ''}`} />
              </button>
              {activeGroup === 'doc' && (
                <div className="px-5 pb-3 pt-0.5 flex flex-wrap gap-1.5 animate-in fade-in duration-200">
                  {DOCUMENT_ACTIONS.map((act, index) => (
                    <button
                      key={index}
                      onClick={() => handleAsk(act.prompt)}
                      className="text-[9px] font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-full px-2.5 py-1 transition-all shadow-sm flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category 2: Analysis Actions */}
            <div className="border-b border-slate-200/50">
              <button
                type="button"
                onClick={() => toggleAccordion('analysis')}
                className="w-full px-5 py-2.5 flex items-center justify-between text-[10px] font-extrabold text-slate-550 hover:bg-slate-100/40 transition-colors uppercase tracking-widest"
              >
                <div className="flex items-center gap-2 text-slate-600">
                  <FileWarning className="w-3.5 h-3.5 text-amber-500" />
                  <span>Analysis Actions ({ANALYSIS_ACTIONS.length})</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeGroup === 'analysis' ? 'rotate-180' : ''}`} />
              </button>
              {activeGroup === 'analysis' && (
                <div className="px-5 pb-3 pt-0.5 flex flex-wrap gap-1.5 animate-in fade-in duration-200">
                  {ANALYSIS_ACTIONS.map((act, index) => (
                    <button
                      key={index}
                      onClick={() => handleAsk(act.prompt)}
                      className="text-[9px] font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-full px-2.5 py-1 transition-all shadow-sm flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category 3: Creation Blueprints */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('creation')}
                className="w-full px-5 py-2.5 flex items-center justify-between text-[10px] font-extrabold text-slate-550 hover:bg-slate-100/40 transition-colors uppercase tracking-widest"
              >
                <div className="flex items-center gap-2 text-slate-600">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Creation Blueprints ({CREATION_ACTIONS.length})</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeGroup === 'creation' ? 'rotate-180' : ''}`} />
              </button>
              {activeGroup === 'creation' && (
                <div className="px-5 pb-3 pt-0.5 flex flex-wrap gap-1.5 animate-in fade-in duration-200">
                  {CREATION_ACTIONS.map((act, index) => (
                    <button
                      key={index}
                      onClick={() => handleAsk(act.prompt)}
                      className="text-[9px] font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-full px-2.5 py-1 transition-all shadow-sm flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected text context banner */}
        {docContext.selectedText && (
          <div className="px-5 py-2.5 border-t border-blue-100 bg-blue-50/30 text-[9.5px] font-bold text-blue-700 flex flex-col shrink-0 select-none">
            <div className="flex items-center justify-between">
              <span className="uppercase text-[8px] text-blue-500 font-extrabold">Active Selection (in {selectedMeta.locationType}):</span>
              <button 
                onClick={() => {
                  setSelectedMeta({ text: '', locationType: '' });
                  setDocContext(prev => ({ ...prev, selectedText: '' }));
                }}
                className="text-blue-500 hover:text-blue-750 font-extrabold uppercase text-[8px]"
              >
                Clear Selection
              </button>
            </div>
            <span className="truncate mt-0.5 text-slate-700 font-semibold bg-white/50 px-2 py-1 rounded border border-blue-200/20">"{docContext.selectedText}"</span>
          </div>
        )}

        {/* Input Form with attachment, submit, and clear buttons */}
        <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-100 bg-white flex flex-col gap-2 shrink-0 select-none">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
            rows={2}
            placeholder={docContext.selectedText ? "Ask about selection..." : "Ask anything about your documents or type / for AI commands..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 transition-all placeholder-slate-400 disabled:opacity-50 resize-none max-h-24 overflow-y-auto"
          />
          <div className="flex items-center justify-between mt-1 px-1">
            <div className="flex items-center gap-3">
              {/* UI Only Attachment Icon */}
              <button
                type="button"
                onClick={() => triggerToast('Attachment upload UI simulated')}
                className="p-1 text-slate-400 hover:text-slate-650 transition-colors"
                title="Attach Document Reference"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              {/* Clear thread helper */}
              <button
                type="button"
                onClick={handleClearConversation}
                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                title="Clear Chat Logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!question.trim() || isThinking}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 border border-blue-500"
            >
              <span>Send</span>
              <Send className="h-3 w-3" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
