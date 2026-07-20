import { useState } from 'react';
import { 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2 
} from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

export default function PptViewer({ activeDoc }: { activeDoc: any }) {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [zoom, setZoom] = useState(60);

  const getPptSlides = (): Slide[] => {
    const name = activeDoc?.name || '';
    if (name.toLowerCase().includes('budget') || name.toLowerCase().includes('finance')) {
      return [
        {
          id: 1,
          title: 'Budget Allocation Review',
          subtitle: 'Q2 Performance & Operations',
          content: (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Q2 Budget Review</h2>
                <p className="text-slate-400 font-extrabold text-xs uppercase tracking-widest">Department Expenditures Overview</p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-[500px] pt-4 select-none">
                {[
                  { label: 'Engineering', val: '₹1.2 Cr', color: 'bg-blue-600' },
                  { label: 'Operations', val: '₹85 L', color: 'bg-emerald-600' },
                  { label: 'Marketing', val: '₹45 L', color: 'bg-purple-650' }
                ].map((q) => (
                  <div key={q.label} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col items-center shadow-sm">
                    <span className="text-[10px] text-slate-450 font-black">{q.label}</span>
                    <span className={`text-base font-extrabold mt-2 px-3 py-1 rounded-lg text-white ${q.color}`}>{q.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        },
        {
          id: 2,
          title: 'Strategic Objectives',
          subtitle: 'Key Goals achieved',
          content: (
            <div className="h-full flex flex-col justify-center space-y-4 px-12">
              <h3 className="text-xl font-extrabold text-slate-950 border-b border-slate-200 pb-2">Strategic Goals</h3>
              <ul className="list-disc pl-5 space-y-2 text-xs font-semibold text-slate-655">
                <li>Reduced infrastructure cloud cost overhead by 12% in Q1.</li>
                <li>Completed regulatory audit cycle compliance checklist updates.</li>
                <li>Aligned engineering roadmap budget with corporate strategy.</li>
              </ul>
            </div>
          )
        }
      ];
    }

    return [
      {
        id: 1,
        title: 'Product Roadmap',
        subtitle: '2026 Overview',
        content: (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Roadmap</h2>
              <p className="text-slate-400 font-extrabold text-xs uppercase tracking-widest">2026 Overview</p>
            </div>
            
            <div className="grid grid-cols-4 gap-4 w-full max-w-[560px] pt-4 select-none">
              {[
                { label: 'Q1', title: 'Research & Planning', color: 'bg-blue-600' },
                { label: 'Q2', title: 'MVP Development', color: 'bg-emerald-600' },
                { label: 'Q3', title: 'Beta Test & Feedback', color: 'bg-amber-500' },
                { label: 'Q4', title: 'Launch & Scale', color: 'bg-purple-600' }
              ].map((q) => (
                <div key={q.label} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col items-center shadow-sm">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${q.color}`}>
                    {q.label}
                  </span>
                  <span className="text-[10px] text-slate-700 font-extrabold mt-3 text-center leading-normal">
                    {q.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 2,
        title: 'Q1 Achievements',
        subtitle: 'Completed Milestones',
        content: (
          <div className="h-full flex flex-col justify-center space-y-4 px-12">
            <h3 className="text-xl font-extrabold text-slate-950 border-b border-slate-200 pb-2">Q1 Achievements</h3>
            <ul className="list-disc pl-5 space-y-2 text-xs font-semibold text-slate-600">
              <li>User experience research complete (50+ user interviews conducted).</li>
              <li>System architecture finalized and approved by engineering leadership.</li>
              <li>Initial visual wireframes signed off by management team.</li>
            </ul>
          </div>
        )
      },
      {
        id: 3,
        title: 'Q2 Objectives',
        subtitle: 'Core Focus Areas',
        content: (
          <div className="h-full flex flex-col justify-center space-y-4 px-12">
            <h3 className="text-xl font-extrabold text-slate-950 border-b border-slate-200 pb-2">Q2 Objectives</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl">
                <h4 className="font-extrabold text-blue-700 text-xs">Development Phase</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal">Build clean modular UI components and core data structures.</p>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl">
                <h4 className="font-extrabold text-emerald-700 text-xs">Security Audits</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal">Implement role permissions and user validation hooks.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 4,
        title: 'Summary & Goals',
        subtitle: 'Q3 & Q4 Vision',
        content: (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
            <h3 className="text-2xl font-extrabold text-slate-950">Summary & Future Goals</h3>
            <p className="text-xs text-slate-400 font-semibold max-w-[400px]">
              Our product is positioned to launch into closed beta in early Q3, leading to full enterprise commercial availability by late Q4.
            </p>
          </div>
        )
      }
    ];
  };

  const slides = getPptSlides();

  return (
    <div className="flex h-full bg-[#f3f4f6]/40 select-none">
      
      {/* 1. Slide Thumbnails Sidebar (Left) */}
      <div className="w-[170px] border-r border-slate-200 bg-white p-3 space-y-3 shrink-0 overflow-y-auto custom-scrollbar">
        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Slides</span>
        {slides.map((s, idx) => {
          const isActive = idx === activeSlideIdx;
          return (
            <div 
              key={s.id} 
              onClick={() => setActiveSlideIdx(idx)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isActive 
                  ? 'border-blue-600 bg-blue-50/10 shadow-sm' 
                  : 'border-slate-200 hover:border-slate-400 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[9px] text-slate-400 font-bold">{idx + 1}</span>
                <span className="text-[9.5px] font-extrabold text-slate-750 truncate max-w-[120px]">{s.title}</span>
              </div>
              
              {/* Mini mockup rendering */}
              <div className="h-16 w-full border border-slate-200 bg-white rounded flex flex-col items-center justify-center text-[7px] text-slate-400 p-1">
                <span className="truncate max-w-[100px] font-bold block">{s.title}</span>
                <span className="truncate max-w-[100px] text-[5px] block mt-0.5">{s.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Main Slide Workspace View (Center) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Workspace ribbon (mock presentation layout) */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-2.5 flex items-center justify-between shrink-0 text-slate-650">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-700">Slide Actions</span>
            <div className="h-4 w-[1px] bg-slate-200" />
            <button 
              type="button" 
              onClick={() => alert('Starting slide presentation... (Mock)')}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-blue-600" />
              <span>Present</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setZoom(prev => Math.max(40, prev - 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-500"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-extrabold text-slate-700 w-10 text-center">{zoom}%</span>
            <button 
              type="button" 
              onClick={() => setZoom(prev => Math.min(100, prev + 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-500"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Slide Canvas Paper */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-auto custom-scrollbar">
          <div 
            className="bg-white border border-slate-200 shadow-lg rounded-lg aspect-[16/9] w-full max-w-[800px] p-12 transition-all"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
          >
            {slides[activeSlideIdx].content}
          </div>
        </div>

        {/* Status controls */}
        <div className="bg-white border-t border-slate-200 px-6 py-2 select-none flex items-center justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-wider shrink-0">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              disabled={activeSlideIdx <= 0}
              onClick={() => setActiveSlideIdx(prev => prev - 1)}
              className="p-1 hover:bg-slate-50 border border-slate-200 rounded disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3 h-3 text-slate-650" />
            </button>
            
            <span>Slide {activeSlideIdx + 1} of {slides.length}</span>

            <button 
              type="button" 
              disabled={activeSlideIdx >= slides.length - 1}
              onClick={() => setActiveSlideIdx(prev => prev + 1)}
              className="p-1 hover:bg-slate-50 border border-slate-200 rounded disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-3 h-3 text-slate-650" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span>English (United States)</span>
            <button type="button" onClick={() => alert('Fullscreen mode triggered (Mock)')} className="p-1 hover:bg-slate-50 rounded">
              <Maximize2 className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
