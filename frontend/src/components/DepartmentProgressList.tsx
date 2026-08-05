import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export default function DepartmentProgressList() {
  const { data: rawUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: api.users.list,
    staleTime: 30_000,
  });

  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: ['departments-list'],
    queryFn: api.departments.list,
    staleTime: 60_000,
  });

  if (usersLoading || deptsLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate user counts by department
  const depts = departments.map((d: any) => {
    const count = rawUsers.filter((u: any) => u.department_id === d.id).length;
    return { name: d.name, count };
  });

  // Sort departments by headcount descending
  depts.sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...depts.map(d => d.count), 1) || 1;

  if (depts.length === 0) {
    return <div className="text-center py-4 text-xs text-slate-400">No departments configured.</div>;
  }

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
