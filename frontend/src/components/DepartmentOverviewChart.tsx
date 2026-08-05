import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export default function DepartmentOverviewChart() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: api.dashboard.metrics,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center py-2 w-full">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const docsByDept = metrics?.documents_by_department || {};
  const entries = Object.entries(docsByDept);

  const colors = ['#4f46e5', '#38bdf8', '#10b981', '#f59e0b', '#94a3b8', '#ec4899', '#8b5cf6'];
  const total = entries.reduce((acc, [_, count]) => acc + (count as number), 0) || (metrics?.total_documents as number) || 0;

  let currentOffset = 0;
  const segments: { name: string; count: number; percentage: number; color: string; offset: number }[] = entries.map(([name, count], index) => {
    const percentage = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
    const color = colors[index % colors.length];
    const offset = currentOffset;
    currentOffset += percentage;
    return { name, count: count as number, percentage, color, offset };
  });

  if (segments.length === 0) {
    segments.push({ name: 'No Documents', count: 0, percentage: 100, color: '#94a3b8', offset: 0 });
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2 select-none">
      
      {/* Doughnut SVG */}
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke={seg.color}
              strokeWidth="11"
              strokeDasharray={`${seg.percentage} ${100 - seg.percentage}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </svg>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[17px] font-extrabold text-slate-900 tracking-tight leading-none">{total}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Documents</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 space-y-2.5 w-full">
        {segments.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-slate-655 font-bold truncate max-w-[120px]" title={s.name}>{s.name}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="text-slate-800 font-extrabold">{s.percentage}%</span>
              <span>({s.count})</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
