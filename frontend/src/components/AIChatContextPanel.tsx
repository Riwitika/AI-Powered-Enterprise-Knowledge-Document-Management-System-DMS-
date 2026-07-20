import { 
  FileText, 
  Settings, 
  Library, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function AIChatContextPanel() {
  const citations = [
    { name: 'Budget Report.pdf', page: 'Page 12', score: '0.94 Match' },
    { name: 'HR Policy.docx', page: 'Page 3', score: '0.87 Match' }
  ];

  return (
    <div className="w-[250px] bg-white border-l border-slate-200/80 flex flex-col h-full select-none font-sans text-slate-800">
      
      {/* Active Model Name Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="font-extrabold text-xs text-slate-900">Workspace Context</span>
        </div>
        <button 
          type="button" 
          onClick={() => alert('Model parameters: Gemini 1.5 Pro, Temperature: 0.2')}
          className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs font-semibold text-slate-700">
        
        {/* Active Knowledge source */}
        <div className="space-y-2">
          <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Knowledge Scope</span>
          
          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2">
              <Library className="w-4 h-4 text-blue-600" />
              <span className="text-slate-800 font-extrabold">Active Directory</span>
            </div>
            
            <div className="space-y-1.5 text-[10.5px]">
              <div className="flex justify-between">
                <span className="text-slate-450">Current file:</span>
                <span className="text-slate-800 font-bold truncate max-w-[110px]">Budget Report.pdf</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-455">Folder:</span>
                <span className="text-slate-850 font-semibold truncate">/Sales & Marketing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vector Citations */}
        <div className="space-y-2.5">
          <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Semantic Citations</span>
          
          <div className="space-y-2">
            {citations.map((cit, idx) => (
              <div 
                key={idx} 
                onClick={() => alert(`Open citation source: "${cit.name}"`)}
                className="p-2.5 bg-white border border-slate-200/80 rounded-xl hover:border-slate-350 cursor-pointer flex items-start gap-2.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10.5px] font-extrabold text-slate-900 block truncate">{cit.name}</span>
                  <span className="text-[9px] text-slate-455 block mt-0.5 font-medium">{cit.page} &bull; {cit.score}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 self-center" />
              </div>
            ))}
          </div>
        </div>

        {/* Capabilities parameters */}
        <div className="space-y-2">
          <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Capabilities</span>
          <div className="space-y-2.5 text-[10.5px] text-slate-650">
            {[
              'Summarize files',
              'Semantic cross-references',
              'Logical comparison',
              'Extract Action items'
            ].map((cap, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session Token Usage progress card */}
        <div className="space-y-2">
          <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Model Metrics</span>
          
          <div className="p-3 bg-blue-50/40 border border-blue-150/50 rounded-xl space-y-2">
            <div className="flex justify-between font-extrabold text-[10.5px] text-blue-750">
              <span>Token Usage</span>
              <span>14.2K / 100K</span>
            </div>
            
            <div className="w-full h-1.5 bg-blue-100/50 rounded-full overflow-hidden border border-blue-200/20">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '14.2%' }} />
            </div>
            
            <span className="text-[9px] text-slate-455 font-medium block leading-normal pt-0.5">
              Refreshes monthly. Dynamic token mapping active via Gemini 1.5.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
