import { useState } from 'react';
import { 
  X, 
  KeyRound, 
  UserX, 
  AlertTriangle, 
  Edit3, 
  ShieldCheck, 
  Smartphone, 
  Laptop 
} from 'lucide-react';
import type { UserRowItem } from './UserTable';

interface UserDrawerProps {
  item: UserRowItem | null;
  onClose: () => void;
  onEditClick?: (item: UserRowItem) => void;
  onResetPassword?: (item: UserRowItem) => void;
  onSuspendClick?: (item: UserRowItem) => void;
  onDeactivateClick?: (item: UserRowItem) => void;
}

export default function UserDrawer({
  item,
  onClose,
  onEditClick,
  onResetPassword,
  onSuspendClick,
  onDeactivateClick
}: UserDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'activity'>('profile');

  if (!item) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-fuchsia-50 text-fuchsia-755 border-fuchsia-150">Super Admin</span>;
      case 'admin':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-rose-50 text-rose-755 border-rose-150">Admin</span>;
      case 'manager':
      case 'department_manager':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-755 border-indigo-150">Manager</span>;
      case 'employee':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-blue-50 text-blue-755 border-blue-150">Employee</span>;
      case 'viewer':
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-slate-50 text-slate-500 border-slate-200">Viewer</span>;
      default:
        return <span className="px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase bg-slate-50 text-slate-550 border-slate-200">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full border text-[8px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border-emerald-150">Active</span>;
      case 'inactive':
        return <span className="px-2 py-0.5 rounded-full border text-[8px] font-extrabold uppercase bg-slate-50 text-slate-500 border-slate-200">Inactive</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full border text-[8px] font-extrabold uppercase bg-amber-50 text-amber-700 border-amber-150">Pending</span>;
      case 'suspended':
        return <span className="px-2 py-0.5 rounded-full border text-[8px] font-extrabold uppercase bg-red-50 text-red-700 border-red-150">Suspended</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full border text-[8px] font-extrabold uppercase bg-slate-50 text-slate-500 border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden select-none font-sans text-slate-800 w-[330px]">
      
      {/* 1. Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <span className="font-extrabold text-sm text-slate-900">User Identity Profile</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* 2. Selection Tabs */}
      <div className="px-3 border-b border-slate-100 flex items-center gap-1.5 shrink-0 text-slate-500 font-bold text-[10px] uppercase tracking-wider bg-slate-50/50">
        {[
          { id: 'profile', label: 'Details' },
          { id: 'permissions', label: 'Security & Access' },
          { id: 'activity', label: 'Log Feed' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-2 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {activeTab === 'profile' && (
          <>
            {/* Identity Card widget */}
            <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col items-center text-center gap-3">
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-16 h-16 rounded-full border border-slate-200 object-cover shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg font-extrabold text-slate-750">
                  {item.initials}
                </div>
              )}
              
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{item.name}</h4>
                <p className="text-[10.5px] font-mono text-slate-450 select-all mt-0.5">{item.email}</p>
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                {getRoleBadge(item.role)}
                {getStatusBadge(item.status)}
              </div>
            </div>

            {/* Profile fields */}
            <div className="space-y-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">User Properties</span>
              
              <div className="grid grid-cols-3 gap-y-3.5 text-xs font-semibold text-slate-700 select-text">
                <span className="text-slate-400 text-[10.5px] font-bold">Department</span>
                <span className="col-span-2 text-slate-800 font-bold">{item.department}</span>

                <span className="text-slate-400 text-[10.5px] font-bold">Supervisor</span>
                <span className="col-span-2 text-slate-850 font-semibold">{item.managerName || 'Arun Goyal'}</span>

                <span className="text-slate-400 text-[10.5px] font-bold">Phone</span>
                <span className="col-span-2 text-slate-500 font-mono font-medium">{item.phone || '+91 98765 43210'}</span>

                <span className="text-slate-400 text-[10.5px] font-bold self-start mt-0.5">Groups</span>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {(item.groups || ['Finance Team', 'General Users']).map(g => (
                    <span key={g} className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[9px] text-slate-500 font-bold">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Device active status */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Registered Devices</span>
              <div className="space-y-2">
                {[
                  { name: 'ThinkPad Windows 11', type: 'laptop', desc: 'Active Session &bull; Chrome' },
                  { name: 'iPhone 15 Pro', type: 'mobile', desc: 'Active Session &bull; iOS App' }
                ].map((d, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                      {d.type === 'laptop' ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-800 block leading-tight">{d.name}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5" dangerouslySetInnerHTML={{ __html: d.desc }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'permissions' && (
          <>
            {/* Security Audit panel */}
            <div className="bg-emerald-50/50 border border-emerald-150/60 rounded-xl p-3.5 flex gap-3 select-none">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[11px] font-extrabold text-emerald-800 block">Identity Status Secured</span>
                <span className="text-[9.5px] text-slate-500 font-medium block mt-0.5">2-Factor Authentication (2FA) is active. No suspicious attempts logged.</span>
              </div>
            </div>

            {/* Permissions list checkboxes */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Permissions Details</span>
              <div className="space-y-2.5">
                {[
                  { name: 'Read Workspace Documents', active: true },
                  { name: 'Upload & Create Documents', active: true },
                  { name: 'Share Files Internally', active: true },
                  { name: 'Share Files Externally', active: item.role === 'admin' || item.role === 'manager' || item.role === 'super_admin' },
                  { name: 'Declassify & Delete Files', active: item.role === 'admin' || item.role === 'super_admin' },
                  { name: 'Modify System Settings', active: item.role === 'super_admin' }
                ].map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={p.active}
                      readOnly
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 focus:outline-none cursor-default"
                    />
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className="relative pl-4 border-l border-slate-200 space-y-5 py-2">
            {[
              { text: `Logged in from Chrome (Windows)`, time: 'Today, 10:30 AM' },
              { text: `Downloaded budget report spreadsheet`, time: 'Yesterday, 11:25 AM' },
              { text: `Updated security password`, time: '14 May 2024, 04:15 PM' },
              { text: `Account profile created by Arnim`, time: '01 May 2024, 09:00 AM' }
            ].map((act, idx) => (
              <div key={idx} className="relative text-xs font-semibold">
                <div className="absolute -left-[22.5px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white border border-slate-200 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                </div>
                <p className="text-slate-750 font-extrabold leading-normal">{act.text}</p>
                <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Action Buttons Footer */}
      <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50 flex flex-col gap-2 select-none">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEditClick?.(item)}
            className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-[10.5px] font-extrabold text-slate-700 bg-white rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit Profile</span>
          </button>
          
          <button
            type="button"
            onClick={() => onResetPassword?.(item)}
            className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-[10.5px] font-extrabold text-slate-700 bg-white rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Pass</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSuspendClick?.(item)}
            className="border border-red-200 text-red-650 hover:bg-red-50 text-[10.5px] font-extrabold rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>Suspend</span>
          </button>
          
          <button
            type="button"
            onClick={() => onDeactivateClick?.(item)}
            className="border border-red-200 text-red-650 hover:bg-red-50 text-[10.5px] font-extrabold rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
          >
            <UserX className="w-3.5 h-3.5 text-red-500" />
            <span>Deactivate</span>
          </button>
        </div>
      </div>

    </div>
  );
}
