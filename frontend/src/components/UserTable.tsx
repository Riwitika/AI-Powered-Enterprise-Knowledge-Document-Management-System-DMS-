import React from 'react';
import { MoreVertical } from 'lucide-react';

export interface UserRowItem {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  department: string;
  role: 'employee' | 'manager' | 'admin' | 'super_admin' | 'viewer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  lastLogin: string;
  phone?: string;
  managerName?: string;
  permissions?: string[];
  groups?: string[];
  devices?: string[];
  securityStatus?: string;
}

interface UserTableProps {
  items: UserRowItem[];
  selectedIds: string[];
  activeId?: string | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onItemClick: (item: UserRowItem) => void;
  onActionClick: (item: UserRowItem, e: React.MouseEvent) => void;
}

export default function UserTable({
  items,
  selectedIds,
  activeId,
  onToggleSelect,
  onToggleSelectAll,
  onItemClick,
  onActionClick
}: UserTableProps) {
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-fuchsia-50 text-fuchsia-700 border-fuchsia-150">Super Admin</span>;
      case 'admin':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-rose-50 text-rose-700 border-rose-150">Admin</span>;
      case 'manager':
      case 'department_manager':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border-indigo-150">Manager</span>;
      case 'employee':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border-blue-150">Employee</span>;
      case 'viewer':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-slate-50 text-slate-500 border-slate-200">Viewer</span>;
      default:
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-slate-50 text-slate-550 border-slate-200">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full border text-[8.5px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border-emerald-150">Active</span>;
      case 'inactive':
        return <span className="px-2 py-0.5 rounded-full border text-[8.5px] font-extrabold uppercase bg-slate-50 text-slate-500 border-slate-200">Inactive</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full border text-[8.5px] font-extrabold uppercase bg-amber-50 text-amber-700 border-amber-150">Pending</span>;
      case 'suspended':
        return <span className="px-2 py-0.5 rounded-full border text-[8.5px] font-extrabold uppercase bg-red-50 text-red-700 border-red-150">Suspended</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full border text-[8.5px] font-extrabold uppercase bg-slate-50 text-slate-500 border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="w-full overflow-x-auto select-none">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/60 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/30">
            <th className="py-3 px-4 w-10">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 focus:outline-none"
              />
            </th>
            <th className="py-3 px-4 w-14"></th>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Email</th>
            <th className="py-3 px-4 w-36">Department</th>
            <th className="py-3 px-4 w-28">Role</th>
            <th className="py-3 px-4 w-28">Status</th>
            <th className="py-3 px-4 w-40">Last Login</th>
            <th className="py-3 px-4 w-10"></th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-100/60 text-xs font-semibold text-slate-700">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isActive = activeId === item.id;

            return (
              <tr
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`group border border-transparent transition-all cursor-pointer hover:bg-slate-50/50 ${
                  isActive 
                    ? 'bg-blue-50/60 hover:bg-blue-50' 
                    : isSelected 
                      ? 'bg-slate-50/40' 
                      : ''
                }`}
              >
                {/* Checkbox */}
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 focus:outline-none"
                  />
                </td>

                {/* Avatar */}
                <td className="py-3 px-4">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-700 shrink-0">
                      {item.initials}
                    </div>
                  )}
                </td>

                {/* Name */}
                <td className="py-3 px-4 font-extrabold text-slate-900 truncate max-w-[150px]">
                  {item.name}
                </td>

                {/* Email */}
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500 select-all truncate max-w-[200px]">
                  {item.email}
                </td>

                {/* Department */}
                <td className="py-3 px-4 text-slate-650 font-bold truncate max-w-[130px]">
                  {item.department}
                </td>

                {/* Role */}
                <td className="py-3 px-4">
                  {getRoleBadge(item.role)}
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  {getStatusBadge(item.status)}
                </td>

                {/* Last Login */}
                <td className="py-3 px-4 text-slate-500 font-medium">
                  {item.lastLogin}
                </td>

                {/* Action Trigger */}
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => onActionClick(item, e)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-150 rounded-lg transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
