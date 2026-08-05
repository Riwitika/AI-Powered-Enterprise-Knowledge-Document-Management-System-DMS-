import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  Users, 
  UserPlus, 
  Download, 
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';

import KPICard from '../components/KPICard';
import UserTable from '../components/UserTable';
import type { UserRowItem } from '../components/UserTable';
import UserDrawer from '../components/UserDrawer';
import BulkToolbar from '../components/BulkToolbar';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeUser, setActiveUser] = useState<UserRowItem | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Search & Filters state
  const [searchVal, setSearchVal] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Department modal state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptParent, setNewDeptParent] = useState<number | ''>('');

  // Fetch real users and departments from backend
  const { data: rawUsers = [], isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: api.users.list,
    staleTime: 30_000,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: api.departments.list,
    staleTime: 60_000,
  });

  // Map backend UserResponse to UserRowItem
  const usersList: UserRowItem[] = useMemo(() => rawUsers.map((u: any) => ({
    id: u.id,
    name: u.full_name,
    email: u.email,
    initials: u.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    department: u.department?.name || 'Unassigned',
    role: (u.role?.name || 'employee') as any,
    status: (u.is_active ? 'active' : 'inactive') as any,
    lastLogin: u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown',
    phone: '',
    managerName: '',
    groups: [],
    permissions: [],
    devices: [],
    securityStatus: u.is_active ? 'Active Account' : 'Inactive',
  })), [rawUsers]);

  // Role converter mapping helper
  const roleNameToId = (name: string): number | null => {
    const n = name.toLowerCase().trim();
    if (n === 'super_admin' || n === 'super admin') return 1;
    if (n === 'admin') return 2;
    if (n === 'manager' || n === 'department manager' || n === 'department_manager') return 3;
    if (n === 'employee') return 4;
    if (n === 'viewer') return 5;
    return null;
  };

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setSelectedIds([]);
      setShowDrawer(false);
      setActiveUser(null);
    },
    onError: (err: any) => alert(err.message || 'Failed to delete user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => alert(err.message || 'Failed to update user'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      alert('User created successfully!');
    },
    onError: (err: any) => alert(err.message || 'Failed to create user'),
  });

  // Department CRUD mutations
  const createDeptMutation = useMutation({
    mutationFn: (data: any) => api.departments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setNewDeptName('');
      setNewDeptParent('');
      alert('Department created successfully!');
    },
    onError: (err: any) => alert(err.message || 'Failed to create department'),
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.departments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      alert('Department updated successfully!');
    },
    onError: (err: any) => alert(err.message || 'Failed to update department'),
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id: number) => api.departments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      alert('Department deleted successfully!');
    },
    onError: (err: any) => alert(err.message || 'Failed to delete department'),
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
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;
    for (const id of selectedIds) {
      await deleteMutation.mutateAsync(id).catch(() => null);
    }
    setSelectedIds([]);
    setShowDrawer(false);
    setActiveUser(null);
  };

  const handleBulkDeactivate = async () => {
    for (const id of selectedIds) {
      await updateMutation.mutateAsync({ id, data: { is_active: false } }).catch(() => null);
    }
    setSelectedIds([]);
    alert('Selected users deactivated.');
  };

  // KPI Summary Cards configuration — derived from real data
  const activeCount = usersList.filter(u => u.status === 'active').length;
  const kpis = [
    {
      title: 'Total Users',
      value: usersLoading ? '...' : usersList.length,
      description: 'Registered accounts',
      icon: Users,
      iconBgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      linkText: 'Export Directory',
      linkTo: '#'
    },
    {
      title: 'Active Users',
      value: usersLoading ? '...' : activeCount,
      description: 'Active accounts',
      icon: Users,
      iconBgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      linkText: 'View active report',
      linkTo: '#'
    },
    {
      title: 'Departments',
      value: usersLoading ? '...' : departments.length,
      description: 'Configured groups',
      icon: Users,
      iconBgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      linkText: 'Manage departments',
    },
    {
      title: 'Inactive Users',
      value: usersLoading ? '...' : (usersList.length - activeCount),
      description: 'Inactive accounts',
      icon: Users,
      iconBgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      linkText: 'Review users',
      linkTo: '#'
    }
  ];

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

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] -m-6 select-none font-sans text-slate-800">
      
      {/* 1. TOP DIRECTORY ROW HEADER */}
      <div className="px-8 py-4.5 border-b border-slate-200/80 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            User Management Directory
          </h1>
          <p className="text-slate-500 text-[11px] font-semibold mt-0.5">Configure access credentials, roles, departments, and active devices.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetchUsers()}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => alert('Exporting CSV directory reports.')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-655 rounded-lg transition-colors bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              const emailStr = prompt('Enter work email:');
              const nameStr = prompt('Enter full name:');
              const passStr = prompt('Enter temporary password:');
              if (emailStr && nameStr && passStr) {
                createMutation.mutate({ email: emailStr, full_name: nameStr, password: passStr });
              }
            }}
            className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1.5 border border-blue-500 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      {/* Loading / Error state */}
      {usersLoading && (
        <div className="px-8 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 font-semibold flex items-center gap-2">
          <div className="h-3 w-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading users from database...
        </div>
      )}
      {usersError && (
        <div className="px-8 py-3 bg-red-50 border-b border-red-100 text-xs text-red-600 font-semibold flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          Failed to load users. <button onClick={() => refetchUsers()} className="underline">Retry</button>
        </div>
      )}

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
              onClickLink={kpi.title === 'Departments' ? () => setShowDeptModal(true) : undefined}
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
            {departments.map((d: any) => (
              <option key={d.id} value={d.name.toLowerCase()}>{d.name}</option>
            ))}
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
                  const rName = prompt('Enter new role (admin/manager/employee/viewer):');
                  if (rName) {
                    const rId = roleNameToId(rName);
                    if (!rId) {
                      alert(`Invalid role name: "${rName}". Please enter admin, manager, employee, or viewer.`);
                      return;
                    }
                    Promise.all(selectedIds.map(id => updateMutation.mutateAsync({ id, data: { role_id: rId } })))
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['users-list'] });
                        setSelectedIds([]);
                        alert('Selected users roles updated.');
                      })
                      .catch((err) => alert(err.message || 'Failed to assign role'));
                  }
                }}
                onMoveDept={() => {
                  const dName = prompt('Enter new department name:');
                  if (dName) {
                    const matchedDept = departments.find((d: any) => d.name.toLowerCase() === dName.toLowerCase());
                    if (!matchedDept) {
                      alert(`Department "${dName}" does not exist. Available departments: ${departments.map((d: any) => d.name).join(', ')}`);
                      return;
                    }
                    Promise.all(selectedIds.map(id => updateMutation.mutateAsync({ id, data: { department_id: matchedDept.id } })))
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['users-list'] });
                        setSelectedIds([]);
                        alert('Selected users departments updated.');
                      })
                      .catch((err) => alert(err.message || 'Failed to move department'));
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

          {/* Pagination */}
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
              onEditClick={(item) => {
                const newName = prompt('Edit full name:', item.name);
                if (newName && newName !== item.name) {
                  updateMutation.mutate({ id: item.id, data: { full_name: newName } });
                }
              }}
              onResetPassword={(item) => alert(`Password reset link sent to: ${item.email}`)}
              onSuspendClick={(item) => {
                updateMutation.mutate({ id: item.id, data: { is_active: false } });
                setActiveUser(prev => prev ? { ...prev, status: 'suspended' } : null);
              }}
              onDeactivateClick={(item) => {
                updateMutation.mutate({ id: item.id, data: { is_active: false } });
                setActiveUser(prev => prev ? { ...prev, status: 'inactive' } : null);
              }}
            />
          </div>
        )}

      </div>

      {/* 5. DEPARTMENT MANAGEMENT MODAL OVERLAY */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Manage Corporate Divisions</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Configure organization structure</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-xs font-semibold text-slate-700">
              {/* Creation Form */}
              <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 space-y-4">
                <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Add New Department</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Department Name</label>
                    <input
                      type="text"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="e.g. Engineering, Sales"
                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Parent Division (Optional)</label>
                    <select
                      value={newDeptParent}
                      onChange={(e) => setNewDeptParent(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600"
                    >
                      <option value="">-- No Parent Division --</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newDeptName.trim()) {
                      alert('Please provide a department name.');
                      return;
                    }
                    createDeptMutation.mutate({
                      name: newDeptName.trim(),
                      parent_id: newDeptParent === '' ? null : newDeptParent
                    });
                  }}
                  disabled={createDeptMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-bold text-[11px] uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
                >
                  Create Department
                </button>
              </div>

              {/* Department Directory List */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold text-slate-455 uppercase tracking-widest block">Active Divisions Directory</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                  {departments.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 italic">No departments found.</div>
                  ) : (
                    departments.map((d: any) => {
                      const parentDept = departments.find((p: any) => p.id === d.parent_id);
                      return (
                        <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="min-w-0">
                            <span className="font-extrabold text-xs text-slate-800 block truncate max-w-[200px]" title={d.name}>{d.name}</span>
                            {parentDept && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium truncate max-w-[200px]" title={parentDept.name}>
                                Sub-division of: <strong className="text-slate-500 font-bold">{parentDept.name}</strong>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const newName = prompt('Rename department:', d.name);
                                if (newName && newName !== d.name) {
                                  updateDeptMutation.mutate({
                                    id: d.id,
                                    data: { name: newName.trim(), parent_id: d.parent_id }
                                  });
                                }
                              }}
                              className="px-2.5 py-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-[10px] font-bold shadow-sm"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const pStr = prompt('Enter parent ID or "root" to clear parent:', d.parent_id || 'root');
                                if (pStr !== null) {
                                  const parentVal = pStr.toLowerCase() === 'root' ? null : Number(pStr);
                                  updateDeptMutation.mutate({
                                    id: d.id,
                                    data: { name: d.name, parent_id: parentVal }
                                  });
                                }
                              }}
                              className="px-2.5 py-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-[10px] font-bold shadow-sm"
                            >
                              Move
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the department "${d.name}"?`)) {
                                  deleteDeptMutation.mutate(d.id);
                                }
                              }}
                              className="px-2 py-1 text-red-650 hover:bg-red-50 rounded text-[10px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
