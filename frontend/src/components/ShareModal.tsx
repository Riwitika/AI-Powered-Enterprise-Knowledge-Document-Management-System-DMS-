import React from 'react';
import { X, Share2, Lock, Check, Copy, Globe } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../api/client';

interface ShareModalProps {
  showShareModal: boolean;
  setShowShareModal: (show: boolean) => void;
  selectedDoc: any;
  shareUserId: string;
  setShareUserId: (id: string) => void;
  shareDeptId: number | "";
  setShareDeptId: (id: number | "") => void;
  shareAccessType: string;
  setShareAccessType: (type: string) => void;
  systemUsers: any[] | undefined;
  systemDepts: any[] | undefined;
  currentUser: any;
  docPermissions: any[] | undefined;
  handleGrantPermission: (e: React.FormEvent) => void;
  handleRevokePermission: (perm: any) => void;
  handleCopyShareLink: () => void;
  linkCopied: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  showShareModal,
  setShowShareModal,
  selectedDoc,
  shareUserId,
  setShareUserId,
  shareDeptId,
  setShareDeptId,
  shareAccessType,
  setShareAccessType,
  systemUsers,
  systemDepts,
  currentUser,
  docPermissions,
  handleGrantPermission,
  handleRevokePermission,
  handleCopyShareLink,
  linkCopied,
}) => {
  const queryClient = useQueryClient();

  const updateAccessMutation = useMutation({
    mutationFn: (level: string) => api.documents.update(selectedDoc.id, { access_level: level }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedDoc.id] });
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update document access level');
    }
  });

  if (!showShareModal || !selectedDoc) return null;

  const isPublic = selectedDoc.access_level === 'public';
  const shareUrl = isPublic 
    ? `${window.location.origin}/public/documents/${selectedDoc.id}`
    : `${window.location.origin}/documents/${selectedDoc.id}`;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 select-none">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
        <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-50 rounded-lg transition-colors"><X className="h-4.5 w-4.5" /></button>
        
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            <span>Share "{selectedDoc.name}"</span>
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Configure collaborative access privileges</p>
        </div>

        {/* General Access Public Toggle */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">General Access</span>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                {isPublic 
                  ? 'Anyone on the internet with this link can view this document.' 
                  : 'Only authorized corporate users can access.'}
              </p>
            </div>
            <select
              value={selectedDoc.access_level === 'public' ? 'public' : 'restricted'}
              onChange={(e) => {
                const newLevel = e.target.value === 'public' ? 'public' : 'private';
                updateAccessMutation.mutate(newLevel);
              }}
              disabled={updateAccessMutation.isPending}
              className="bg-white border border-slate-250 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none shrink-0"
            >
              <option value="restricted">Restricted (Corporate only)</option>
              <option value="public">Public (Anyone with link)</option>
            </select>
          </div>
        </div>

        {/* Grant Permission Form */}
        <form onSubmit={handleGrantPermission} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold text-slate-455 uppercase tracking-widest block mb-1.5">Add User Profile</label>
              <select
                value={shareUserId}
                onChange={(e) => {
                  setShareUserId(e.target.value);
                  if (e.target.value) setShareDeptId('');
                }}
                className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="">Select individual user...</option>
                {systemUsers?.filter((u: any) => u.id !== currentUser?.id).map((u: any) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-455 uppercase tracking-widest block mb-1.5">Add Department Group</label>
              <select
                value={shareDeptId}
                onChange={(e) => {
                  setShareDeptId(e.target.value !== '' ? Number(e.target.value) : '');
                  if (e.target.value) setShareUserId('');
                }}
                className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="">Select department...</option>
                {systemDepts?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name} Division</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-455 uppercase tracking-widest">Access Role:</span>
              <select
                value={shareAccessType}
                onChange={(e) => setShareAccessType(e.target.value)}
                className="bg-white border border-slate-250 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="view">Viewer</option>
                <option value="edit">Editor</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={!shareUserId && !shareDeptId}
              className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1.5 text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              Add Access
            </button>
          </div>
        </form>

        {/* List of active permissions */}
        <div className="space-y-2 border-t border-slate-150 pt-4">
          <span className="text-[10px] font-extrabold text-slate-455 uppercase tracking-widest block">Collaborators & Permissions</span>
          <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {/* Default owner */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{selectedDoc.owner?.full_name || 'System Administrator'}</span>
                <span className="text-[10px] text-slate-455 block">{selectedDoc.owner?.email || 'admin@enterprise.com'}</span>
              </div>
              <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Owner</span>
            </div>

            {docPermissions?.map((perm: any) => {
              const targetUser = systemUsers?.find((u: any) => u.id === perm.user_id);
              const targetDept = systemDepts?.find((d: any) => d.id === perm.department_id);

              return (
                <div key={perm.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs hover:bg-slate-100/70 transition-all">
                  <div>
                    {perm.user_id ? (
                      <>
                        <span className="font-bold text-slate-900 block">{targetUser?.full_name || 'Loading member profile...'}</span>
                        <span className="text-[10px] text-slate-500 block">{targetUser?.email}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900 block">{targetDept?.name || 'Loading department...'} Department</span>
                        <span className="text-[10px] text-slate-500 block">Division level access</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-550 capitalize">{perm.access_type}</span>
                    <button
                      onClick={() => handleRevokePermission(perm)}
                      className="text-[10px] text-red-600 hover:text-red-750 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sharing link generation */}
        <div className="border-t border-slate-150 pt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate flex-1">
            {isPublic ? (
              <Globe className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-slate-400 shrink-0" />
            )}
            <span className="truncate bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-650 font-mono text-[10px] flex-1">
              {shareUrl}
            </span>
          </div>
          <button
            onClick={() => {
              handleCopyShareLink(); // triggers copying and toast state in parent
            }}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition-all shrink-0 flex items-center gap-1.5 w-28 justify-center"
          >
            {linkCopied ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
            <span>{linkCopied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
