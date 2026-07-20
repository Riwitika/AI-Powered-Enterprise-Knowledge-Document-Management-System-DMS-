import { ArrowUp } from 'lucide-react';

export default function SystemOverviewChart() {
  // SVG dimension: 400x180
  // Data points coordinates:
  // 13 May: x=30, y=140
  // 14 May: x=100, y=115
  // 15 May: x=170, y=105
  // 16 May: x=240, y=90
  // 17 May: x=310, y=70
  // 19 May: x=380, y=60
  
  return (
    <div className="flex flex-col h-full select-none font-sans text-slate-800">
      
      {/* Chart Canvas Area */}
      <div className="relative w-full h-[150px] mt-2">
        <svg viewBox="0 0 420 160" className="w-full h-full">
          {/* Grid lines */}
          <line x1="20" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="20" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="20" y1="100" x2="400" y2="100" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="20" y1="140" x2="400" y2="140" stroke="#f1f5f9" strokeWidth="1" />

          {/* Left Y-axis labels */}
          <text x="5" y="24" fill="#94a3b8" fontSize="8" fontWeight="bold">400</text>
          <text x="5" y="64" fill="#94a3b8" fontSize="8" fontWeight="bold">300</text>
          <text x="5" y="104" fill="#94a3b8" fontSize="8" fontWeight="bold">200</text>
          <text x="5" y="144" fill="#94a3b8" fontSize="8" fontWeight="bold">100</text>
          <text x="12" y="160" fill="#94a3b8" fontSize="8" fontWeight="bold">0</text>

          {/* Path line drawing */}
          <path
            d="M 40 140 L 110 115 L 180 105 L 250 90 L 320 70 L 390 60"
            fill="transparent"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points markers circles */}
          <circle cx="40" cy="140" r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="110" cy="115" r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="180" cy="105" r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="250" cy="90" r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="320" cy="70" r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="390" cy="60" r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />

          {/* X-axis date labels */}
          <text x="28" y="156" fill="#94a3b8" fontSize="8" fontWeight="bold">13 May</text>
          <text x="98" y="156" fill="#94a3b8" fontSize="8" fontWeight="bold">14 May</text>
          <text x="168" y="156" fill="#94a3b8" fontSize="8" fontWeight="bold">15 May</text>
          <text x="238" y="156" fill="#94a3b8" fontSize="8" fontWeight="bold">16 May</text>
          <text x="308" y="156" fill="#94a3b8" fontSize="8" fontWeight="bold">17 May</text>
          <text x="378" y="156" fill="#94a3b8" fontSize="8" fontWeight="bold">19 May</text>
        </svg>
      </div>

      {/* Grid Legend metrics panel cards */}
      <div className="grid grid-cols-4 gap-3.5 mt-5 border-t border-slate-100 pt-4">
        
        {[
          { label: 'Active Users', value: '218', rate: '12%' },
          { label: 'New Users', value: '24', rate: '9%' },
          { label: 'Documents Added', value: '1,248', rate: '15%' },
          { label: 'AI Queries', value: '3,542', rate: '17%' }
        ].map((block) => (
          <div key={block.label} className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
            <span className="text-[9.5px] text-slate-450 font-bold block truncate uppercase tracking-wider">{block.label}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-extrabold text-slate-900 leading-none">{block.value}</span>
              <span className="text-[9px] text-emerald-600 font-extrabold flex items-center leading-none">
                <ArrowUp className="w-2.5 h-2.5 shrink-0" />
                <span>{block.rate}</span>
              </span>
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}
