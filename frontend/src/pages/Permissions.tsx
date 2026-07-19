import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Loader2, 
  FolderOpen,
  User,
  Building,
  ShieldCheck,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

export default function Permissions() {
  const queryClient = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  
  // Grant Form state
  const [grantType, setGrantType] = useState<'user' | 'department'>('user');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetDeptId, setTargetDeptId] = useState<number | ''>('');
  const [accessType, setAccessType] = useState('view');

  // Queries
  const { data: documents } = useQuery({
    queryKey: ['documents-list-perms'],
    queryFn: api.documents.list
  });

  const { data: doc, isLoading: docLoading } = useQuery({
    queryKey: ['document', selectedDocId],
    queryFn: () => selectedDocId ? api.documents.get(selectedDocId) : null,
    enabled: !!selectedDocId
  });

  const { data: permissions, isLoading: permsLoading, refetch: refetchPerms } = useQuery({
    queryKey: ['document-permissions', selectedDocId],
    queryFn: () => selectedDocId ? api.permissions.list(selectedDocId) : [],
    enabled: !!selectedDocId
  });

  const { data: users } = useQuery({
    queryKey: ['users-list-perms'],
    queryFn: api.users.list
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-list-perms'],
    queryFn: api.departments.list
  });

  // Mutations
  const updateAccessLevelMutation = useMutation({
    mutationFn: ({ id, level }: { id: string; level: string }) => 
      api.documents.update(id, { access_level: level }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', selectedDocId] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
    }
  });

  const grantPermMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      api.permissions.grant(id, payload),
    onSuccess: () => {
      refetchPerms();
      setTargetUserId('');
      setTargetDeptId('');
    }
  });

  const revokePermMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: any }) => 
      api.permissions.revoke(id, params),
    onSuccess: () => {
      refetchPerms();
    }
  });

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;

    const payload: any = {
      access_type: accessType
    };

    if (grantType === 'user') {
      if (!targetUserId) return;
      payload.user_id = targetUserId;
    } else {
      if (!targetDeptId) return;
      payload.department_id = Number(targetDeptId);
    }

    grantPermMutation.mutate({ id: selectedDocId, payload });
  };

  const handleRevoke = (perm: any) => {
    if (!selectedDocId) return;
    const params: any = {};
    if (perm.user_id) params.user_id = perm.user_id;
    if (perm.department_id) params.department_id = perm.department_id;
    revokePermMutation.mutate({ id: selectedDocId, params });
  };

  return (
    <div className="space-y-6 relative font-sans">
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Access Control Manager</h1>
        <p className="text-slate-500 text-xs mt-0.5">Configure sharing policies, authorize specific organizational divisions, and define access controls.</p>
      </div>

      {/* Document Selector Header */}
      <div className="glass-card rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="h-9 w-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
            <FolderOpen className="h-4.5 w-4.5" />
          </div>
          <div className="w-full md:w-72">
            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1 tracking-widest">Select Target File</label>
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                setTargetUserId('');
                setTargetDeptId('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Choose a document from inventory --</option>
              {documents?.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name} (.{d.file_type})</option>
              ))}
            </select>
          </div>
        </div>

        {doc && (
          <div className="flex gap-4 items-center shrink-0 w-full md:w-auto justify-end border-t border-slate-100 md:border-0 pt-3.5 md:pt-0">
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1 tracking-widest">Global Policy Mode</label>
              <select
                value={doc.access_level}
                onChange={(e) => updateAccessLevelMutation.mutate({ id: doc.id, level: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none font-semibold"
              >
                <option value="private">Private (Owner only)</option>
                <option value="view_only">View Only (Org read-only)</option>
                <option value="edit">Edit (Org edit access)</option>
                <option value="department">Department (My dept only)</option>
                <option value="organization">Organization (Full Org access)</option>
                <option value="custom">Custom Configuration</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {selectedDocId ? (
        docLoading ? (
          <div className="flex h-48 items-center justify-center glass-card rounded-xl">
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing rules...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Custom Permissions List */}
            <div className="md:col-span-2 glass-card rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col h-fit">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-blue-650" />
                <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Explicit Access Rules</h2>
              </div>
              
              {permsLoading ? (
                <div className="p-8 text-center space-y-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading explicit sharing registry...</span>
                </div>
              ) : permissions && permissions.length > 0 ? (
                <div className="divide-y divide-slate-150 bg-white">
                  {permissions.map((perm: any) => {
                    const targetUser = users?.find((u: any) => u.id === perm.user_id);
                    const targetDept = departments?.find((d: any) => d.id === perm.department_id);
                    
                    return (
                      <div key={perm.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          {perm.user_id ? (
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block">{targetUser?.full_name || 'Loading member profile...'}</span>
                                <span className="text-[10px] text-slate-400 block">{targetUser?.email}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                <Building className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block">Division: {targetDept?.name || 'Loading dept structure...'}</span>
                                <span className="text-[10px] text-slate-400 block">Department-wide access rule</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[8px] font-bold border uppercase tracking-wider ${
                            perm.access_type === 'edit' 
                              ? 'bg-amber-50 border-amber-200 text-amber-700' 
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}>
                            {perm.access_type} Access
                          </span>
                          <button
                            onClick={() => handleRevoke(perm)}
                            className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Revoke Permission"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs italic flex flex-col items-center justify-center space-y-2 bg-white">
                  <HelpCircle className="h-8 w-8 text-slate-200" />
                  <span>
                    {doc?.access_level !== 'custom' 
                      ? "Permissions are governed by the Global Policy Mode dropdown on the right."
                      : "No explicit rules configured. Add a custom user/division rule on the right."}
                  </span>
                </div>
              )}
            </div>

            {/* Grant Permission Form */}
            <div className="glass-card rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-fit space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-1 shrink-0">
                <UserPlus className="h-4.5 w-4.5 text-blue-650" />
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Configure Access</h3>
              </div>

              {doc?.access_level === 'custom' ? (
                <form onSubmit={handleGrant} className="space-y-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 tracking-widest">Share Target</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={grantType === 'user'} 
                          onChange={() => setGrantType('user')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-bold text-slate-700">Specific Member</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={grantType === 'department'} 
                          onChange={() => setGrantType('department')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-bold text-slate-700">Division</span>
                      </label>
                    </div>
                  </div>

                  {grantType === 'user' ? (
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 tracking-widest">Select Target Member</label>
                      <select
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-blue-500"
                      >
                        <option value="">-- Select Corporate User --</option>
                        {users?.map((u: any) => (
                          <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 tracking-widest">Select Target Division</label>
                      <select
                        value={targetDeptId}
                        onChange={(e) => setTargetDeptId(e.target.value !== '' ? Number(e.target.value) : '')}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-blue-500"
                      >
                        <option value="">-- Select Division --</option>
                        {departments?.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 tracking-widest">Authorisation Scope</label>
                    <select
                      value={accessType}
                      onChange={(e) => setAccessType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-blue-500"
                    >
                      <option value="view">Read / View Only</option>
                      <option value="edit">Write / Edit Access</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="glow-btn w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Authorize Rule</span>
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 rounded-xl leading-relaxed space-y-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <p>Fine-grained sharing configurations are disabled when using preset policy rules. Change Global Policy Mode to "Custom Configuration" to manage sharing lists.</p>
                </div>
              )}
            </div>

          </div>
        )
      ) : (
        <div className="flex h-64 items-center justify-center border border-dashed border-slate-300 rounded-xl bg-white text-slate-450 p-8 text-center flex-col space-y-2">
          <Shield className="h-10 w-10 text-slate-250 animate-float" />
          <h3 className="font-extrabold text-slate-700 text-sm">Access Controller Dormant</h3>
          <p className="max-w-xs text-xs text-slate-400">Please select an information asset file from the top selection dropdown to examine sharing logs and modify authorizations.</p>
        </div>
      )}
    </div>
  );
}
