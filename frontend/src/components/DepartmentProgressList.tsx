interface DeptHeadcount {
  name: string;
  count: number;
}

export default function DepartmentProgressList() {
  const depts: DeptHeadcount[] = [
    { name: 'Sales & Marketing', count: 96 },
    { name: 'Human Resources', count: 54 },
    { name: 'Finance', count: 48 },
    { name: 'Product', count: 39 },
    { name: 'Procurement', count: 31 },
    { name: 'IT', count: 24 }
  ];

  const maxCount = 100; // max reference value

  return (
    <div className="space-y-4 select-none py-1.5">
      {depts.map((dept) => {
        const percent = Math.min(100, Math.round((dept.count / maxCount) * 100));

        return (
          <div key={dept.name} className="space-y-1.5 text-xs font-semibold text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-800 font-extrabold">{dept.name}</span>
              <span className="text-slate-900 font-extrabold">{dept.count}</span>
            </div>
            
            {/* Progress bar wrapper */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
