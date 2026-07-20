interface ChartSegment {
  name: string;
  percentage: number;
  count: number;
  color: string;
}

export default function DepartmentOverviewChart() {
  const segments: ChartSegment[] = [
    { name: 'Projects', percentage: 35, count: 436, color: '#4f46e5' },      // Indigo
    { name: 'Reports', percentage: 25, count: 312, color: '#38bdf8' },       // Sky
    { name: 'Policies', percentage: 20, count: 250, color: '#10b981' },      // Emerald
    { name: 'Presentations', percentage: 10, count: 125, color: '#f59e0b' },  // Amber
    { name: 'Others', percentage: 10, count: 125, color: '#94a3b8' }        // Slate
  ];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2 select-none">
      
      {/* Doughnut SVG */}
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Projects: 35% (0 to 35) -> strokeDasharray="35 65" strokeDashoffset="0" */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="#4f46e5"
            strokeWidth="11"
            strokeDasharray="35 65"
            strokeDashoffset="0"
          />
          {/* Reports: 25% (35 to 60) -> strokeDasharray="25 75" strokeDashoffset="-35" */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="#38bdf8"
            strokeWidth="11"
            strokeDasharray="25 75"
            strokeDashoffset="-35"
          />
          {/* Policies: 20% (60 to 80) -> strokeDasharray="20 80" strokeDashoffset="-60" */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="#10b981"
            strokeWidth="11"
            strokeDasharray="20 80"
            strokeDashoffset="-60"
          />
          {/* Presentations: 10% (80 to 90) -> strokeDasharray="10 90" strokeDashoffset="-80" */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth="11"
            strokeDasharray="10 90"
            strokeDashoffset="-80"
          />
          {/* Others: 10% (90 to 100) -> strokeDasharray="10 90" strokeDashoffset="-90" */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="#94a3b8"
            strokeWidth="11"
            strokeDasharray="10 90"
            strokeDashoffset="-90"
          />
        </svg>
        
        {/* Center label (1,248 Documents) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[17px] font-extrabold text-slate-900 tracking-tight leading-none">1,248</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Documents</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 space-y-2.5 w-full">
        {segments.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-slate-650 font-bold">{s.name}</span>
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
