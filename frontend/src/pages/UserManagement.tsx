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
  Briefcase
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
    
    createUserMutation.mutate({
      full_name: name,
      email,
      password,
      role_name: roleName,
      department_id: deptId !== '' ? Number(deptId) : null
    });
  };

  const getRoleBadgeColor = (rName: string) => {
    const r = rName.toLowerCase();
    if (r === 'super_admin') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (r === 'admin') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (r === 'department_manager') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (r === 'employee') return 'bg-slate-50 text-slate-600 border-slate-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6 relative font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Directory</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage system user profiles, assign corporate divisions, and map RBAC permissions.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="glow-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors w-fit shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-blue-650" />
          <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Active Corporate Members</h2>
        </div>

        {usersLoading ? (
          <div className="p-12 text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading system logs...</span>
          </div>
        ) : users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left text-xs bg-white">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-bold text-[9px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">System Role</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.full_name}</td>
                    <td className="px-6 py-4 text-slate-500 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-300" /> {u.email}
                    </td>
                    <td className="px-6 py-4">
                      {u.department ? (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                          <FolderGit2 className="h-3.5 w-3.5 text-slate-400" /> {u.department.name}
                        </span>
                      ) : (
                        <span className="text-slate-450 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold border uppercase tracking-wider text-[8px] ${getRoleBadgeColor(u.role?.name || '')}`}>
                        {u.role?.name === 'super_admin' ? (
                          <ShieldCheck className="h-3 w-3 text-indigo-600" />
                        ) : <Shield className="h-3 w-3 text-slate-400" />}
                        <span>{u.role?.name.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {currentUser?.id !== u.id && u.role?.name !== 'super_admin' && (
                        <button
                          onClick={() => deleteUserMutation.mutate(u.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs italic">No user accounts indexed in active directory.</div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <span>Create Account</span>
            </h3>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name</label>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Corporate Email</label>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Security Password</label>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Security Role</label>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Division</label>
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

            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="glow-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
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
