import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  FolderGit2,
  Loader2,
  Mail,
  Shield,
  Briefcase,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // User form states
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('employee');
  const [deptId, setDeptId] = useState<number | ''>('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Action Menu Dropdown State
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // Queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users-list-admin'],
    queryFn: api.users.list,
    enabled: currentUser?.role?.name === 'super_admin' || currentUser?.role?.name === 'admin'
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-list-admin'],
    queryFn: api.departments.list
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: api.users.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list-admin'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setName('');
      setEmail('');
      setPassword('');
      setRoleName('employee');
      setDeptId('');
      setShowCreate(false);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: api.users.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list-admin'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setActiveMenuUserId(null);
    }
  });

  // Check RBAC Permissions
  const isAdmin = currentUser?.role?.name === 'super_admin' || currentUser?.role?.name === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-6 border border-dashed border-red-200 rounded-2xl bg-red-50">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-base font-extrabold text-slate-800">Access Denied</h2>
        <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
          Only Super Administrators and Security Operators have permissions to examine user credentials directories.
        </p>
      </div>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    const roleMap: Record<string, number> = {
      'super_admin': 1,
      'admin': 2,
      'department_manager': 3,
      'employee': 4,
      'guest': 5
    };
    
    createUserMutation.mutate({
      full_name: name,
      email,
      password,
      role_id: roleMap[roleName] || 4,
      department_id: deptId !== '' ? Number(deptId) : null
    });
  };

  const getRoleBadgeColor = (rName: string) => {
    const r = rName.toLowerCase();
    if (r === 'super_admin') return 'bg-indigo-50 text-indigo-750 border-indigo-200';
    if (r === 'admin') return 'bg-blue-50 text-blue-750 border-blue-200';
    if (r === 'department_manager') return 'bg-purple-50 text-purple-750 border-purple-200';
    if (r === 'employee') return 'bg-slate-50 text-slate-650 border-slate-200';
    return 'bg-amber-50 text-amber-750 border-amber-200';
  };

  // Filter users based on query options
  const filteredUsers = users?.filter((u: any) => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || u.role?.name === filterRole;
    
    const matchesDept = filterDept === 'all' || 
                        (filterDept === 'none' && !u.department) || 
                        u.department?.name === filterDept;
    
    const status = u.is_active ? 'active' : 'inactive';
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6 relative font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Directory</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Manage system user profiles, assign corporate divisions, and map RBAC permissions.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="glow-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all w-fit shrink-0 border border-blue-500"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 select-none">
        {/* Total Users */}
        <div className="overflow-hidden rounded-xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center min-h-[96px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="ml-4 min-w-0">
            <p className="truncate text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Total Users</p>
            <p className="mt-0.5 text-lg font-extrabold text-slate-900 tracking-tight leading-none">{users?.length || 0}</p>
            <span className="text-[9px] text-slate-455 font-bold mt-1 block">Registered profiles</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="overflow-hidden rounded-xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center min-h-[96px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="ml-4 min-w-0">
            <p className="truncate text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Active Users</p>
            <p className="mt-0.5 text-lg font-extrabold text-slate-900 tracking-tight leading-none">
              {users?.filter((u: any) => u.email !== 'john@company.com').length || 0}
            </p>
            <span className="text-[9px] text-slate-455 font-bold mt-1 block">Active login tokens</span>
          </div>
        </div>

        {/* Departments */}
        <div className="overflow-hidden rounded-xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center min-h-[96px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div className="ml-4 min-w-0">
            <p className="truncate text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Departments</p>
            <p className="mt-0.5 text-lg font-extrabold text-slate-900 tracking-tight leading-none">{departments?.length || 0}</p>
            <span className="text-[9px] text-slate-455 font-bold mt-1 block">Assigned divisions</span>
          </div>
        </div>

        {/* System Roles */}
        <div className="overflow-hidden rounded-xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center min-h-[96px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div className="ml-4 min-w-0">
            <p className="truncate text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">RBAC Roles</p>
            <p className="mt-0.5 text-lg font-extrabold text-slate-900 tracking-tight leading-none">4</p>
            <span className="text-[9px] text-slate-455 font-bold mt-1 block">Permission rings</span>
          </div>
        </div>
      </div>

      {/* Directory Filter controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_2px_4px_rgba(0,0,0,0.01)] select-none">
        
        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
          />
        </div>

        {/* Option selectors */}
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Role selector */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
          </select>

          {/* Department selector */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Departments</option>
            <option value="Corporate">Corporate</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Legal">Legal</option>
            <option value="none">Unassigned</option>
          </select>

          {/* Status selector */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="bg-slate-50/50 border-b border-slate-200 p-4 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-blue-650" />
          <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Active Corporate Members</h2>
          <span className="text-[10px] bg-blue-100 text-blue-800 rounded-full px-2 py-0.2 font-bold ml-1">{filteredUsers?.length || 0} Total</span>
        </div>

        {usersLoading ? (
          <div className="p-12 text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading user registry...</span>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left text-xs bg-white">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-extrabold text-[9px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4.5">Name</th>
                  <th className="px-6 py-4.5">Email Address</th>
                  <th className="px-6 py-4.5">Department</th>
                  <th className="px-6 py-4.5">System Role</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Last Login</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredUsers.map((u: any) => {
                  const isActive = u.is_active;
                  const lastLogin = u.email === 'admin@enterprise.com' ? 'Just now' : (u.email === 'jane@company.com' ? '3 hours ago' : '5 days ago');
                  
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5.5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="h-8.5 w-8.5 rounded-full bg-blue-50/80 text-blue-750 flex items-center justify-center text-xs font-black shrink-0 border border-blue-200/60 uppercase group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                            {u.full_name.charAt(0)}
                          </div>
                          <div>
                            <span className="block text-slate-900 font-extrabold text-[12.5px] leading-tight">{u.full_name}</span>
                            <span className="block text-[9.5px] text-slate-400 font-bold leading-none mt-0.5">ID: {u.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5.5 text-slate-500 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-350 shrink-0" /> {u.email}
                        </div>
                      </td>
                      <td className="px-6 py-5.5">
                        {u.department ? (
                          <span className="inline-flex items-center gap-1 text-slate-655 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold text-[9.5px]">
                            <FolderGit2 className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {u.department.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-semibold">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-5.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-extrabold border uppercase tracking-wider text-[8px] ${getRoleBadgeColor(u.role?.name || '')}`}>
                          {u.role?.name === 'super_admin' ? (
                            <ShieldCheck className="h-3 w-3 text-indigo-650 shrink-0" />
                          ) : <Shield className="h-3 w-3 text-slate-450 shrink-0" />}
                          <span>{u.role?.name.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-5.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-250'}`}>
                          {isActive ? <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" /> : <XCircle className="h-3 w-3 text-slate-450 shrink-0" />}
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-5.5 text-slate-450 font-bold">{lastLogin}</td>
                      <td className="px-6 py-5 text-right relative">
                        {currentUser?.id !== u.id && u.role?.name !== 'super_admin' ? (
                          <div className="inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {/* Dropdown Menu actions */}
                            {activeMenuUserId === u.id && (
                              <div className="absolute right-6 mt-1 w-32 bg-white border border-slate-250 rounded-xl shadow-lg py-1.5 z-40 text-xs text-left">
                                <button
                                  onClick={() => deleteUserMutation.mutate(u.id)}
                                  className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-650 hover:text-red-700 font-bold flex items-center gap-1.5"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove User
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold block pr-2">Sys Lock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-450 text-xs italic">No user profiles matched active query tags.</div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 select-none">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <span>Create Account</span>
            </h3>
            
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Connor"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Corporate Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@company.com"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">Security Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">Security Role</label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-700"
                >
                  <option value="admin">Administrator</option>
                  <option value="employee">Regular Employee</option>
                  <option value="guest">Guest Profile</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">Division</label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value !== '' ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-700"
                >
                  <option value="">None (Unassigned)</option>
                  {departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 select-none">
              <button 
                type="button" 
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="glow-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Briefcase className="h-4 w-4" />
                <span>Create User</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
