import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowUp } from 'lucide-react';

export default function SystemOverviewChart() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: api.dashboard.metrics,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-[150px] items-center justify-center">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeUsers = metrics?.active_users_count ?? 0;
  const totalUsers = metrics?.total_users_count ?? 0;
  const totalDocs = metrics?.total_documents ?? 0;
  const aiQueries = metrics?.ai_questions_asked_count ?? 0;

  // Render a nice line SVG based on document counts
  // Default values to scale relative to the real document count
  const maxVal = Math.max(totalDocs, 10) || 10;
  const yVal = (val: number) => 140 - Math.min(120, (val / maxVal) * 120);

  const pt1 = yVal(totalDocs * 0.5);
  const pt2 = yVal(totalDocs * 0.6);
  const pt3 = yVal(totalDocs * 0.7);
  const pt4 = yVal(totalDocs * 0.85);
  const pt5 = yVal(totalDocs * 0.9);
  const pt6 = yVal(totalDocs);

  const pathD = `M 40 ${pt1} L 110 ${pt2} L 180 ${pt3} L 250 ${pt4} L 320 ${pt5} L 390 ${pt6}`;

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
          <text x="5" y="24" fill="#94a3b8" fontSize="8" fontWeight="bold">{maxVal}</text>
          <text x="5" y="64" fill="#94a3b8" fontSize="8" fontWeight="bold">{Math.round(maxVal * 0.75)}</text>
          <text x="5" y="104" fill="#94a3b8" fontSize="8" fontWeight="bold">{Math.round(maxVal * 0.5)}</text>
          <text x="5" y="144" fill="#94a3b8" fontSize="8" fontWeight="bold">{Math.round(maxVal * 0.25)}</text>
          <text x="12" y="160" fill="#94a3b8" fontSize="8" fontWeight="bold">0</text>

          {/* Path line drawing */}
          <path
            d={pathD}
            fill="transparent"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points markers circles */}
          <circle cx="40" cy={pt1} r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="110" cy={pt2} r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="180" cy={pt3} r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="250" cy={pt4} r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="320" cy={pt5} r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
          <circle cx="390" cy={pt6} r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />

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
          { label: 'Active Users', value: activeUsers.toLocaleString(), rate: '12%' },
          { label: 'Total Users', value: totalUsers.toLocaleString(), rate: '9%' },
          { label: 'Documents Added', value: totalDocs.toLocaleString(), rate: '15%' },
          { label: 'AI Queries', value: aiQueries.toLocaleString(), rate: '17%' }
        ].map((block) => (
          <div key={block.label} className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
            <span className="text-[9.5px] text-slate-455 font-bold block truncate uppercase tracking-wider">{block.label}</span>
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
