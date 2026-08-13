import { Clock, Activity } from 'lucide-react';

interface RecentDocItem {
  id: string;
  name: string;
  modifiedAt: string;
  ownerName: string;
  fileType: string;
}

interface DocumentsEmptyWorkspaceProps {
  recentDocs: RecentDocItem[];
  onOpenDoc: (id: string) => void;
}

function getFileIconBadge(fileType: string) {
  const type = fileType?.toUpperCase();
  if (type === 'DOCX' || type === 'DOC') {
    return (
      <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs">
        W
      </div>
    );
  }
  if (type === 'PDF') {
    return (
      <div className="w-6 h-6 rounded-md bg-rose-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs">
        PDF
      </div>
    );
  }
  if (type === 'XLSX' || type === 'XLS') {
    return (
      <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs">
        X
      </div>
    );
  }
  if (type === 'PPTX' || type === 'PPT') {
    return (
      <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs">
        P
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-md bg-slate-500 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs">
      TXT
    </div>
  );
}

export default function DocumentsEmptyWorkspace({ recentDocs, onOpenDoc }: DocumentsEmptyWorkspaceProps) {
  const mockActivity = [
    { id: 1, user: 'You', action: 'edited Employee Handbook.docx', time: '2h ago', avatarBg: 'bg-blue-100 text-blue-700' },
    { id: 2, user: 'Arnim Goyal', action: 'commented on Leave Policy.docx', time: '5h ago', avatarBg: 'bg-indigo-100 text-indigo-700' },
    { id: 3, user: 'Riwitika Gupta', action: 'uploaded Sales Presentation.pptx', time: 'Yesterday', avatarBg: 'bg-purple-100 text-purple-700' },
    { id: 4, user: 'Yukti Gupta', action: 'edited Financial Report.xlsx', time: '2 days ago', avatarBg: 'bg-emerald-100 text-emerald-700' },
    { id: 5, user: 'Uttam Gupta', action: 'uploaded Office Layout.png', time: '3 days ago', avatarBg: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#f8fafc] p-6 md:p-8 gap-8 select-none custom-scrollbar max-w-5xl mx-auto w-full">

      {/* Hero Illustration + Heading Section */}
      <div className="flex flex-col items-center text-center gap-3 pt-2">
        
        {/* Document stack graphic with floating file type badges */}
        <div className="relative w-36 h-28 flex items-center justify-center mb-1">
          {/* Main central sheet */}
          <div className="w-20 h-24 bg-white rounded-2xl border border-slate-250 shadow-lg flex flex-col p-3 gap-2 relative z-10">
            <div className="w-8 h-2 bg-blue-100 rounded-full" />
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
            <div className="w-14 h-1.5 bg-slate-200 rounded-full" />
          </div>
          
          {/* Floating document badges around */}
          <div className="absolute top-2 left-3 w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-[9px] flex items-center justify-center shadow-md animate-bounce">
            W
          </div>
          <div className="absolute bottom-3 left-6 w-6 h-6 rounded-lg bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-md">
            PDF
          </div>
          <div className="absolute top-4 right-4 w-6 h-6 rounded-lg bg-emerald-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-md">
            X
          </div>
          <div className="absolute bottom-2 right-5 w-6 h-6 rounded-lg bg-amber-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-md">
            P
          </div>
        </div>

        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Enterprise Knowledge Repository
        </h1>
        <p className="text-xs text-slate-500 font-semibold max-w-md leading-relaxed">
          Select a document from the Explorer to begin working.
        </p>
      </div>

      {/* Middle Section: Recent Documents & Recent Activity (2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">

        {/* Recent Documents Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Recent Documents</span>
            </span>
            <button type="button" className="text-[11px] font-bold text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="flex flex-col divide-y divide-slate-100/60">
            {recentDocs.length === 0 ? (
              <p className="text-[11px] text-slate-400 font-medium py-4 text-center">No recent documents available.</p>
            ) : (
              recentDocs.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onOpenDoc(doc.id)}
                  className="flex items-center justify-between py-2 px-1 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getFileIconBadge(doc.fileType)}
                    <span className="text-[11.5px] font-bold text-slate-700 group-hover:text-blue-600 truncate">
                      {doc.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                    Edited {doc.modifiedAt}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>Recent Activity</span>
            </span>
            <button type="button" className="text-[11px] font-bold text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="flex flex-col divide-y divide-slate-100/60">
            {mockActivity.map((act) => (
              <div key={act.id} className="flex items-center justify-between py-2 px-1 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${act.avatarBg}`}>
                    {act.user.charAt(0)}
                  </div>
                  <p className="text-[11.5px] text-slate-650 font-semibold truncate">
                    <strong className="text-slate-850 font-bold">{act.user}</strong> {act.action}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
