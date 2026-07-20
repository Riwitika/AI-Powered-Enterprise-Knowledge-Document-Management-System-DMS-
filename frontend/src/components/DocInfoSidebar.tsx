import { useState } from 'react';
import { 
  Calendar, 
  Tag, 
  Plus, 
  Sparkles,
  Shield,
  MessageSquare
} from 'lucide-react';

interface DocInfoSidebarProps {
  locationPath?: string;
  ownerName?: string;
  createdOn?: string;
  lastModified?: string;
  tags?: string[];
  description?: string;
  whoCanAccess?: string;
  accessType?: string;
  aiSummaryText?: string;
}

export default function DocInfoSidebar({
  locationPath = '/02_Finance/Reports',
  ownerName = 'Amit Verma',
  createdOn = '14 May 2024, 11:00 AM',
  lastModified = '19 May 2024, 10:30 AM',
  tags = ['Budget', 'Q2', 'Finance'],
  description = 'Quarter 2 budget report including departmental allocations, variances and forecasts.',
  whoCanAccess = 'Finance Team, Managers',
  accessType = 'Can view, download',
  aiSummaryText = 'This budget document outlines expenditure plans for the second quarter. Total projections show a 24% allocation to engineering operations, with compliance and legal audits remaining unchanged.'
}: DocInfoSidebarProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'activity' | 'comments'>('properties');
  const [comments, setComments] = useState([
    { author: 'Amit Verma', initials: 'AV', comment: 'Please review the updated variance figures in Section 3.', time: 'Today, 10:35 AM' },
    { author: 'Neha Gupta', initials: 'NG', comment: 'Looks solid. Checked the compliance checklist too.', time: 'Yesterday, 05:20 PM' }
  ]);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments(prev => [
      ...prev,
      { author: 'Arnim Goyal', initials: 'AG', comment: newComment.trim(), time: 'Just now' }
    ]);
    setNewComment('');
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden border-l border-slate-200 select-none font-sans text-slate-800 w-[300px] shrink-0">
      
      {/* Tab controls */}
      <div className="px-3 border-b border-slate-100 flex items-center gap-1.5 shrink-0 text-slate-500 font-bold text-[10px] uppercase tracking-wider bg-slate-50/50">
        {[
          { id: 'properties', label: 'Properties' },
          { id: 'activity', label: 'Activity' },
          { id: 'comments', label: `Comments (${comments.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-2 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4.5 space-y-5.5 custom-scrollbar">
        {activeTab === 'properties' && (
          <>
            {/* AI Summary Card (Prominent, matching prompt) */}
            <div className="bg-gradient-to-br from-blue-50/30 to-indigo-50/50 border border-blue-150/60 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.015)] relative overflow-hidden select-none">
              <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>AI Assistant Summary</span>
              </div>
              <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                {aiSummaryText}
              </p>
            </div>

            {/* Properties fields grid */}
            <div className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div className="border-b border-slate-50 pb-1 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">File Metadata</span>
              </div>
              
              <div className="grid grid-cols-3 gap-y-3 select-text">
                <span className="text-slate-400 text-[10.5px] font-bold">Location</span>
                <span className="col-span-2 text-slate-650 font-mono text-[10.5px] truncate">{locationPath}</span>

                <span className="text-slate-400 text-[10.5px] font-bold">Owner</span>
                <span className="col-span-2 text-slate-800 font-bold">{ownerName}</span>

                <span className="text-slate-400 text-[10.5px] font-bold">Created on</span>
                <span className="col-span-2 text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                  <span>{createdOn}</span>
                </span>

                <span className="text-slate-400 text-[10.5px] font-bold">Modified</span>
                <span className="col-span-2 text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                  <span>{lastModified}</span>
                </span>

                <span className="text-slate-400 text-[10.5px] font-bold self-start mt-0.5">Description</span>
                <p className="col-span-2 text-[11px] text-slate-600 leading-relaxed font-medium">
                  {description}
                </p>
              </div>
            </div>

            {/* Tags section */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tags</span>
              <div className="flex flex-wrap gap-1.5 items-center">
                {tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold text-slate-600 flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5 text-slate-400" />
                    <span>{t}</span>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => alert('Add tag (Mock)')}
                  className="px-1.5 py-0.5 border border-dashed border-slate-300 hover:border-slate-400 rounded text-[9px] font-bold text-slate-500 hover:text-slate-700 bg-white flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Add tag</span>
                </button>
              </div>
            </div>

            {/* Security access configuration */}
            <div className="space-y-3.5 text-xs font-semibold text-slate-700 border-t border-slate-100 pt-3.5">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Access Security</span>
              </div>
              <div className="grid grid-cols-3 gap-y-2.5">
                <span className="text-slate-400 text-[10.5px] font-bold">Group access</span>
                <span className="col-span-2 text-slate-800 font-bold">{whoCanAccess}</span>

                <span className="text-slate-400 text-[10.5px] font-bold">Access permissions</span>
                <span className="col-span-2 text-slate-500 font-medium">{accessType}</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className="relative pl-4 border-l border-slate-200 space-y-5 py-2">
            {[
              { text: 'Amit Verma modified version to v2.1', time: '19 May 2024, 10:30 AM' },
              { text: 'Neha Gupta viewed document', time: '18 May 2024, 05:25 PM' },
              { text: 'Rohit Sharma shared with finance team', time: '17 May 2024, 02:40 PM' },
              { text: 'Amit Verma created document', time: '14 May 2024, 11:00 AM' }
            ].map((act, idx) => (
              <div key={idx} className="relative text-xs font-semibold">
                <div className="absolute -left-[22.5px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white border border-slate-200 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                </div>
                <p className="text-slate-750 font-extrabold leading-normal">{act.text}</p>
                <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">{act.time}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-3.5 flex-1 overflow-y-auto">
              {comments.map((c, idx) => (
                <div key={idx} className="flex gap-2.5 text-xs p-2.5 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 font-extrabold text-[10px] text-slate-700">
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800">{c.author}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{c.time}</span>
                    </div>
                    <p className="text-slate-650 leading-relaxed font-medium mt-1 text-[11px]">{c.comment}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment adding box */}
            <form onSubmit={handleAddComment} className="p-1 border-t border-slate-100 bg-white flex items-center gap-2 pt-3 shrink-0">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:bg-white text-slate-800 font-medium"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-1.5 shadow-sm transition-all disabled:opacity-50 flex items-center justify-center"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
