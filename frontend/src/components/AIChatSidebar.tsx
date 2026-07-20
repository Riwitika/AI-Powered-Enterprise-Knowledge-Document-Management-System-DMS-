import { 
  MessageSquare, 
  Pin, 
  FileText, 
  Search,
  Sparkles,
  History
} from 'lucide-react';

interface ConversationThread {
  id: string;
  title: string;
  time: string;
  pinned?: boolean;
}

interface AIChatSidebarProps {
  activeThreadId?: string;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
}

export default function AIChatSidebar({
  activeThreadId,
  onSelectThread,
  onNewChat
}: AIChatSidebarProps) {
  
  const pinnedThreads: ConversationThread[] = [
    { id: 't-1', title: 'Q2 Budget Analysis', time: '1h ago', pinned: true },
    { id: 't-2', title: 'Employee KYC Checks', time: 'Yesterday', pinned: true }
  ];

  const recentThreads: ConversationThread[] = [
    { id: 't-3', title: 'HR Policies Review', time: 'Yesterday' },
    { id: 't-4', title: 'Vendor SOW Comparison', time: '2d ago' },
    { id: 't-5', title: 'Marketing Campaign SOW', time: '4d ago' }
  ];

  const starredDocs = [
    { name: 'Budget Report.pdf', size: '2.4 MB' },
    { name: 'HR Policy.docx', size: '890 KB' },
    { name: 'Vendor Agreement.pdf', size: '1.1 MB' }
  ];

  return (
    <div className="w-[250px] bg-white border-r border-slate-200/80 flex flex-col h-full select-none font-sans text-slate-800">
      
      {/* 1. New chat btn */}
      <div className="p-4 shrink-0 border-b border-slate-150/60">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full py-2 px-3 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-extrabold text-slate-700 bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>New AI Workspace</span>
        </button>
      </div>

      {/* Search Threads input */}
      <div className="px-4 py-2 shrink-0 border-b border-slate-100 bg-slate-50/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search History..."
            className="w-full bg-white border border-slate-200/80 rounded-lg pl-8.5 pr-3 py-1.2 text-[10.5px] text-slate-700 focus:outline-none focus:border-blue-600 transition-all font-medium placeholder-slate-400"
          />
        </div>
      </div>

      {/* Pinned and Recents listings */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        
        {/* Pinned section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-2 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
            <Pin className="w-3 h-3 text-slate-400" />
            <span>Pinned Conversations</span>
          </div>
          <div className="space-y-0.5">
            {pinnedThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold ${
                  activeThreadId === thread.id 
                    ? 'bg-blue-50/60 text-blue-700' 
                    : 'text-slate-650 hover:bg-slate-50/80'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate flex-1">{thread.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* History section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-2 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
            <History className="w-3 h-3 text-slate-400" />
            <span>Recent Chats</span>
          </div>
          <div className="space-y-0.5">
            {recentThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold ${
                  activeThreadId === thread.id 
                    ? 'bg-blue-50/60 text-blue-700' 
                    : 'text-slate-650 hover:bg-slate-50/80'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate flex-1">{thread.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Starred Documents */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-2 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Workspace References</span>
          </div>
          <div className="space-y-1">
            {starredDocs.map((doc, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 px-2 py-1.2 hover:bg-slate-50/50 rounded-lg cursor-pointer"
                onClick={() => alert(`Mock open referenced doc: "${doc.name}"`)}
              >
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-700 block truncate">{doc.name}</span>
                  <span className="text-[9.5px] text-slate-400 block font-medium mt-0.2">{doc.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
