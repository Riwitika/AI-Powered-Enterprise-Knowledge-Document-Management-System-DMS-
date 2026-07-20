import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Download, 
  Search,
  Filter
} from 'lucide-react';

import KPICard from '../components/KPICard';
import UserTable from '../components/UserTable';
import type { UserRowItem } from '../components/UserTable';
import UserDrawer from '../components/UserDrawer';
import BulkToolbar from '../components/BulkToolbar';

export default function UserManagement() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeUser, setActiveUser] = useState<UserRowItem | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Search & Filters state
  const [searchVal, setSearchVal] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // KPI Summary Cards configuration
  const kpis = [
    {
      title: 'Total Users',
      value: 284,
      description: 'Registered accounts',
      icon: Users,
      iconBgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      linkText: 'Export Directory',
      linkTo: '#'
    },
    {
      title: 'Active Users',
      value: 267,
      description: 'Active sessions this week',
      icon: Users,
      iconBgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      linkText: 'View active report',
      linkTo: '#'
    },
    {
      title: 'Departments',
      value: 12,
      description: 'Configured groups',
      icon: Users,
      iconBgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      linkText: 'Manage departments',
      linkTo: '#'
    },
    {
      title: 'Pending Invitations',
      value: 8,
      description: 'Awaiting registration',
      icon: Users,
      iconBgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      linkText: 'Review invitations',
      linkTo: '#'
    }
  ];

  // Mock list of user accounts
  const initialUsers: UserRowItem[] = [
    {
      id: 'usr-1',
      name: 'Riwitika Gupta',
      email: 'riwitika.gupta@fasttrade.com',
      initials: 'RG',
      department: 'Finance',
      role: 'manager',
      status: 'active',
      lastLogin: 'Today, 10:30 AM',
      phone: '+91 98765 43210',
      managerName: 'Arun Goyal',
      groups: ['Finance Team', 'Leadership', 'Approvers'],
      permissions: ['Read Workspace Documents', 'Upload & Create Documents', 'Share Files Internally', 'Share Files Externally'],
      devices: ['ThinkPad Windows 11 (Vite/Chrome)', 'iPhone 15 Pro'],
      securityStatus: 'Secured & Verified (2FA Enabled)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    {
      id: 'usr-2',
      name: 'Arnim Goyal',
      email: 'arnim.goyal@fasttrade.com',
      initials: 'AG',
      department: 'Operations',
      role: 'admin',
      status: 'active',
      lastLogin: 'Today, 09:15 AM',
      phone: '+91 99988 77766',
      managerName: 'Arun Goyal',
      groups: ['Leadership', 'Administrators'],
      permissions: ['Read Workspace Documents', 'Upload & Create Documents', 'Share Files Internally', 'Share Files Externally', 'Declassify & Delete Files'],
      devices: ['MacBook Pro (macOS)', 'iPad Pro'],
      securityStatus: 'Secured & Verified (2FA Enabled)'
    },
    {
      id: 'usr-3',
      name: 'Arun Goyal',
      email: 'arun.goyal@fasttrade.com',
      initials: 'AG',
      department: 'Executive Board',
      role: 'super_admin',
      status: 'active',
      lastLogin: 'Yesterday, 04:20 PM',
      phone: '+91 99000 11223',
      managerName: 'Board of Directors',
      groups: ['Leadership', 'Super Administrators', 'Shareholders'],
      permissions: ['Read Workspace Documents', 'Upload & Create Documents', 'Share Files Internally', 'Share Files Externally', 'Declassify & Delete Files', 'Modify System Settings'],
      devices: ['MacBook Air', 'iPhone 15'],
      securityStatus: 'Secured & Verified (2FA Enabled)'
    },
    {
      id: 'usr-4',
      name: 'Riwitika Gupta',
      email: 'riwitika.gupta@fasttrade.com',
      initials: 'RG',
      department: 'HR Operations',
      role: 'employee',
      status: 'active',
      lastLogin: 'Yesterday, 11:20 AM',
      phone: '+91 98877 66554',
      managerName: 'Arnim Goyal',
      groups: ['HR Team'],
      permissions: ['Read Workspace Documents', 'Upload & Create Documents', 'Share Files Internally'],
      devices: ['Dell Latitude'],
      securityStatus: 'Secured & Verified (2FA Enabled)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 'usr-5',
      name: 'Paras Jain',
      email: 'paras.jain@fasttrade.com',
      initials: 'PJ',
      department: 'Engineering',
      role: 'employee',
      status: 'active',
      lastLogin: '18 May 2024, 02:40 PM',
      phone: '+91 97766 55443',
      managerName: 'Arnim Goyal',
      groups: ['Engineering Team'],
      permissions: ['Read Workspace Documents', 'Upload & Create Documents', 'Share Files Internally'],
      devices: ['Lenovo Yoga'],
      securityStatus: 'Secured & Verified (2FA Enabled)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    {
      id: 'usr-6',
      name: 'Yukti Gupta',
      email: 'yukti.gupta@fasttrade.com',
      initials: 'YG',
      department: 'HR Operations',
      role: 'employee',
      status: 'active',
      lastLogin: 'Today, 08:30 AM',
      phone: '+91 96655 44332',
      managerName: 'Arnim Goyal',
      groups: ['HR Team'],
      permissions: ['Read Workspace Documents'],
      devices: [],
      securityStatus: 'Secured & Verified (2FA Enabled)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    {
      id: 'usr-7',
      name: 'Uttam Gupta',
      email: 'uttam.gupta@fasttrade.com',
      initials: 'UG',
      department: 'Operations',
      role: 'employee',
      status: 'active',
      lastLogin: '14 May 2024, 05:25 PM',
      phone: '+91 95544 33221',
      managerName: 'Arnim Goyal',
      groups: ['Operations Team'],
      permissions: ['Read Workspace Documents', 'Upload & Create Documents'],
      devices: [],
      securityStatus: 'Secured & Verified (2FA Enabled)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    }
  ];

  const [usersList, setUsersList] = useState<UserRowItem[]>(initialUsers);

  // Search & Filter computation
  const filteredUsers = usersList.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchVal.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchVal.toLowerCase()) ||
                          user.department.toLowerCase().includes(searchVal.toLowerCase());
    
    const matchesDept = filterDept === 'all' || user.department.toLowerCase().includes(filterDept.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  // Table row toggles
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  const handleItemClick = (item: UserRowItem) => {
    setActiveUser(item);
    setShowDrawer(true);
  };

  const handleActionClick = (item: UserRowItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveUser(item);
    setShowDrawer(true);
  };

  // Bulk operation handlers
  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) {
      setUsersList(prev => prev.filter(u => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      setShowDrawer(false);
      setActiveUser(null);
    }
  };

  const handleBulkDeactivate = () => {
    setUsersList(prev => prev.map(u => 
      selectedIds.includes(u.id) ? { ...u, status: 'inactive' } : u
    ));
    setSelectedIds([]);
    alert('Selected users deactivated.');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] -m-8 select-none font-sans text-slate-800">
      
      {/* 1. TOP DIRECTORY ROW HEADER */}
      <div className="px-8 py-4.5 border-b border-slate-200/80 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            User Management Directory
          </h1>
          <p className="text-slate-500 text-[11px] font-semibold mt-0.5">Configure access credentials, roles, departments, and active devices.</p>
        </div>

        {/* Header Invitation Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => alert('Exporting active directory CSV (Mock)')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-650 rounded-lg transition-colors bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              const emailStr = prompt('Enter work email to invite:');
              if (emailStr) {
                alert(`Invitation sent to ${emailStr}!`);
              }
            }}
            className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1.5 border border-blue-500 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      {/* 2. DIRECTORY SUMMARIES KPI GRID */}
      <div className="px-8 py-6 shrink-0 bg-white border-b border-slate-200/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpis.map((kpi, idx) => (
            <KPICard
              key={idx}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              icon={kpi.icon}
              iconBgColor={kpi.iconBgColor}
              iconColor={kpi.iconColor}
              linkText={kpi.linkText}
              linkTo={kpi.linkTo}
            />
          ))}
        </div>
      </div>

      {/* 3. SEARCH & FILTERS ROW BAR */}
      <div className="px-8 py-3 bg-white border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Search Input box */}
        <div className="relative w-full max-w-[280px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search Users, Email, Department..."
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-9.5 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-600 transition-all placeholder-slate-400 font-medium"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-455 font-extrabold uppercase tracking-wider">Filters:</span>
          </div>

          {/* Department filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-transparent border border-slate-200 hover:border-slate-350 rounded px-2.5 py-1 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer bg-white"
          >
            <option value="all">All Departments</option>
            <option value="finance">Finance</option>
            <option value="operations">Operations</option>
            <option value="hr">HR Operations</option>
            <option value="sales">Sales & Marketing</option>
          </select>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-transparent border border-slate-200 hover:border-slate-350 rounded px-2.5 py-1 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer bg-white"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
            <option value="viewer">Viewer</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border border-slate-200 hover:border-slate-350 rounded px-2.5 py-1 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* 4. MAIN DATA BODY & COLLAPSIBLE PROFILE DRAWER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Table list main section */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto px-8 py-5 custom-scrollbar">
            
            {/* Table layout render */}
            <UserTable
              items={filteredUsers}
              selectedIds={selectedIds}
              activeId={activeUser?.id}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onItemClick={handleItemClick}
              onActionClick={handleActionClick}
            />
          </div>

          {/* Bulk toolbar floating wrapper */}
          {selectedIds.length > 0 && (
            <div className="px-8 py-3 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-center">
              <BulkToolbar
                selectedCount={selectedIds.length}
                onAssignRole={() => {
                  const r = prompt('Enter new role (super_admin/admin/manager/employee/viewer):');
                  if (r) {
                    setUsersList(prev => prev.map(u => selectedIds.includes(u.id) ? { ...u, role: r as any } : u));
                    setSelectedIds([]);
                    alert('Roles assigned.');
                  }
                }}
                onMoveDept={() => {
                  const d = prompt('Enter new department name:');
                  if (d) {
                    setUsersList(prev => prev.map(u => selectedIds.includes(u.id) ? { ...u, department: d } : u));
                    setSelectedIds([]);
                    alert('Departments moved.');
                  }
                }}
                onDeactivate={handleBulkDeactivate}
                onDelete={handleBulkDelete}
                onExport={() => {
                  alert(`Exporting CSV report for ${selectedIds.length} accounts.`);
                  setSelectedIds([]);
                }}
              />
            </div>
          )}

          {/* Bottom Pagination indicators */}
          {selectedIds.length === 0 && (
            <div className="px-8 py-3 border-t border-slate-150/60 bg-white flex items-center justify-between shrink-0 select-none text-[11px] font-semibold text-slate-500">
              <span>Showing 1 to {filteredUsers.length} of {usersList.length} accounts</span>
              
              <div className="flex items-center gap-1.5">
                <button type="button" className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors" disabled>&lt;</button>
                <button type="button" className="w-6 h-6 rounded flex items-center justify-center bg-blue-600 text-white font-extrabold shadow-sm">1</button>
                <button type="button" className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors" disabled>&gt;</button>
              </div>
            </div>
          )}
        </div>

        {/* Slide-out details drawer */}
        {showDrawer && activeUser && (
          <div className="animate-in slide-in-from-right-6 duration-200 border-l border-slate-200 bg-white h-full overflow-hidden shrink-0">
            <UserDrawer
              item={activeUser}
              onClose={() => {
                setShowDrawer(false);
                setActiveUser(null);
              }}
              onEditClick={(item) => alert(`Editing profile data for: ${item.name} (Mock)`)}
              onResetPassword={(item) => alert(`Temporary password reset link generated for: ${item.email} (Mock)`)}
              onSuspendClick={(item) => {
                setUsersList(prev => prev.map(u => u.id === item.id ? { ...u, status: 'suspended' } : u));
                setActiveUser(prev => prev ? { ...prev, status: 'suspended' } : null);
                alert(`${item.name} suspended.`);
              }}
              onDeactivateClick={(item) => {
                setUsersList(prev => prev.map(u => u.id === item.id ? { ...u, status: 'inactive' } : u));
                setActiveUser(prev => prev ? { ...prev, status: 'inactive' } : null);
                alert(`${item.name} deactivated.`);
              }}
            />
          </div>
        )}

      </div>
      
    </div>
  );
}
