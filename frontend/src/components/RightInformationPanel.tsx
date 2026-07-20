import { useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Folder, 
  Calendar, 
  Tag, 
  Plus, 
  ChevronDown,
  Eye
} from 'lucide-react';
import type { DocumentRowItem } from './DocumentTable';

interface RightInformationPanelProps {
  item: DocumentRowItem | null;
  onClose: () => void;
  onOpenClick?: (item: DocumentRowItem) => void;
  onDownloadClick?: (item: DocumentRowItem) => void;
  onShareClick?: (item: DocumentRowItem) => void;
}

export default function RightInformationPanel({
  item,
  onClose,
  onOpenClick,
  onDownloadClick,
  onShareClick
}: RightInformationPanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'versions' | 'comments'>('details');

  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none text-slate-400">
        <Folder className="w-12 h-12 text-slate-200 mb-3" />
        <p className="text-xs font-bold">No file selected</p>
        <p className="text-[10px] text-slate-450 mt-1 max-w-[180px] leading-relaxed">
          Select a file to inspect its details, version log, activity feed, and permissions.
        </p>
      </div>
    );
  }

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'docx' || type === 'doc') return 'bg-blue-50 text-blue-650 border-blue-100';
    if (type === 'pdf') return 'bg-red-50 text-red-650 border-red-100';
    if (type === 'xlsx' || type === 'xls' || type === 'csv') return 'bg-emerald-50 text-emerald-650 border-emerald-100';
    if (type === 'pptx' || type === 'ppt') return 'bg-orange-50 text-orange-650 border-orange-100';
    return 'bg-slate-50 text-slate-500 border-slate-200';
  };

  const getFileInitial = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'docx' || type === 'doc') return 'W';
    if (type === 'pdf') return 'P';
    if (type === 'xlsx' || type === 'xls' || type === 'csv') return 'X';
    if (type === 'pptx' || type === 'ppt') return 'P';
    if (type === 'txt') return 'T';
    return 'D';
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden select-none font-sans text-slate-800">
      {/* 1. Header (Name + Close Button) */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <span className="font-extrabold text-sm text-slate-900 truncate max-w-[220px] block">
          {item.name}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* 2. Tabs */}
      <div className="px-3 border-b border-slate-100 flex items-center gap-1.5 shrink-0 text-slate-500 font-bold text-[10.5px] uppercase tracking-wider bg-slate-50/50">
        {[
          { id: 'details', label: 'Details' },
          { id: 'activity', label: 'Activity' },
          { id: 'versions', label: 'Versions' },
          { id: 'comments', label: 'Comments (3)' }
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

      {/* 3. Dynamic Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {activeTab === 'details' && (
          <>
            {/* Preview Thumbnail Card */}
            <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-extrabold text-lg border ${getFileTypeColor(item.fileType)}`}>
                  {getFileInitial(item.fileType)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-slate-900 truncate block">{item.name}</h4>
                  <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider mt-0.5">{item.fileType} • {item.size}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                    {item.version || 'v1.0'} &bull; Updated on {item.modifiedAt} by {item.ownerName}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenClick?.(item)}
                  className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 text-[10.5px] font-bold flex items-center justify-center gap-1 border border-blue-500"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open</span>
                  <ChevronDown className="w-3 h-3 text-blue-200" />
                </button>
                
                <button
                  type="button"
                  onClick={() => onDownloadClick?.(item)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg py-1.5 text-[10.5px] font-bold flex items-center justify-center gap-1 bg-white"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => onShareClick?.(item)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg py-1.5 text-[10.5px] font-bold flex items-center justify-center gap-1 bg-white"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Properties Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-xs text-slate-900">Properties</h4>
                <button
                  type="button"
                  onClick={() => alert('Properties editing triggered (Mock)')}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-3 gap-y-3.5 text-xs font-semibold text-slate-700">
                <span className="text-slate-400 text-[10.5px] font-bold">Location</span>
                <span className="col-span-2 text-slate-650 font-mono text-[10.5px] select-all">/02_Finance/Reports</span>

                <span className="text-slate-400 text-[10.5px] font-bold">Owner</span>
                <span className="col-span-2 text-slate-800 font-bold">{item.ownerName}</span>

                <span className="text-slate-400 text-[10.5px] font-bold">Created on</span>
                <span className="col-span-2 text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                  <span>14 May 2024, 11:00 AM</span>
                </span>

                <span className="text-slate-400 text-[10.5px] font-bold">Last modified</span>
                <span className="col-span-2 text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                  <span>{item.modifiedAt}</span>
                </span>

                <span className="text-slate-400 text-[10.5px] font-bold">Tags</span>
                <div className="col-span-2 flex flex-wrap gap-1.5 items-center">
                  {['Budget', 'Q2', 'Finance'].map(t => (
                    <span key={t} className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[9px] font-bold text-blue-600 flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" />
                      <span>{t}</span>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => alert('Add tag clicked (Mock)')}
                    className="px-1.5 py-0.5 border border-dashed border-slate-300 hover:border-slate-400 rounded text-[9px] font-bold text-slate-500 hover:text-slate-700 bg-white flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Add tag</span>
                  </button>
                </div>

                <span className="text-slate-400 text-[10.5px] font-bold self-start mt-0.5">Description</span>
                <p className="col-span-2 text-[11px] text-slate-600 leading-relaxed font-medium">
                  Quarter 2 budget report including departmental allocations, variances and forecasts.
                </p>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-xs text-slate-900">Permissions</h4>
                <button
                  type="button"
                  onClick={() => alert('Permissions manager triggered (Mock)')}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold hover:underline"
                >
                  Manage
                </button>
              </div>

              <div className="grid grid-cols-3 gap-y-3.5 text-xs font-semibold text-slate-700">
                <span className="text-slate-400 text-[10.5px] font-bold">Who can access</span>
                <span className="col-span-2 text-slate-800 font-bold">Finance Team, Managers</span>

                <span className="text-slate-400 text-[10.5px] font-bold">Access type</span>
                <span className="col-span-2 text-slate-500 font-medium">Can view, download</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className="relative pl-4 border-l border-slate-200 space-y-5 py-2">
            {[
              { text: 'Amit Verma updated version to v2.1', time: '19 May 2024, 10:30 AM' },
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

        {activeTab === 'versions' && (
          <div className="space-y-4">
            {[
              { ver: 'v2.1', time: '19 May 2024, 10:30 AM', author: 'Amit Verma', size: '2.4 MB', current: true },
              { ver: 'v2.0', time: '18 May 2024, 04:15 PM', author: 'Amit Verma', size: '2.3 MB' },
              { ver: 'v1.0', time: '14 May 2024, 11:00 AM', author: 'Amit Verma', size: '1.2 MB' }
            ].map((v, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-150/60 rounded-xl">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900">{v.ver}</span>
                    {v.current && (
                      <span className="px-1.5 py-0.2 rounded border text-[8px] font-extrabold bg-blue-50 text-blue-600 border-blue-100 uppercase">Current</span>
                    )}
                  </div>
                  <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">{v.time} &bull; by {v.author}</span>
                </div>
                
                <span className="text-[10px] text-slate-500 font-bold select-none">{v.size}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="space-y-3.5">
              {[
                { author: 'Amit Verma', initials: 'AV', comment: 'Please review the updated variance figures in Section 3.', time: 'Today, 10:35 AM' },
                { author: 'Neha Gupta', initials: 'NG', comment: 'Looks solid. Checked the compliance checklist too.', time: 'Yesterday, 05:20 PM' }
              ].map((c, idx) => (
                <div key={idx} className="flex gap-2.5 text-xs p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div className="w-6.5 h-6.5 rounded-full bg-slate-200 flex items-center justify-center shrink-0 font-extrabold text-[9px] text-slate-700">
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

            {/* Comment Form */}
            <form onSubmit={(e) => { e.preventDefault(); alert('Add comment (Mock)'); }} className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:bg-white text-slate-800 font-medium"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-[10.5px] font-bold shadow-sm"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
