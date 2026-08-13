import { useState } from 'react';
import { 
  X, 
  Download, 
  FileText
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

interface RightInformationPanelProps {
  item: any; // The active workspace document
  onClose: () => void;
  allDocs?: any[];
}

export default function RightInformationPanel({
  item,
  onClose,
  allDocs = []
}: RightInformationPanelProps) {
  const queryClient = useQueryClient();

  // Tab states: 'properties' | 'comments' | 'versions' | 'activity'
  const [activeTab, setActiveTab] = useState<'properties' | 'comments' | 'versions' | 'activity'>('properties');

  // State for posting new comments
  const [commentVal, setCommentVal] = useState('');

  // Fetch comments for the document from the database
  const { data: comments = [] } = useQuery({
    queryKey: ['documentComments', item?.id],
    queryFn: async () => {
      return api.comments.list(item.id);
    },
    enabled: !!item?.id
  });

  // Post comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.comments.create(item.id, { content });
    },
    onSuccess: () => {
      setCommentVal('');
      queryClient.invalidateQueries({ queryKey: ['documentComments', item.id] });
    }
  });

  // Fetch document versions from the database
  const { data: versions = [] } = useQuery({
    queryKey: ['documentVersions', item?.id],
    queryFn: async () => {
      return api.documents.versions(item.id);
    },
    enabled: !!item?.id
  });

  // Fetch document permissions rules
  const { data: permissions = [] } = useQuery({
    queryKey: ['documentPermissions', item?.id],
    queryFn: async () => {
      return api.permissions.list(item.id);
    },
    enabled: !!item?.id
  });

  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none text-slate-400">
        <span className="text-2xl mb-3">📁</span>
        <p className="text-xs font-bold text-slate-700">No Document Selected</p>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
          Select an item from the workspace tree to view properties and metadata.
        </p>
      </div>
    );
  }

  // Filter allDocs list for related documents (same category or folder)
  const relatedDocs = allDocs.filter(
    (d: any) => d.id !== item.id && d.status !== 'archived' && (d.folder_id === item.folder_id || d.category === item.category)
  ).slice(0, 5);

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentVal.trim()) {
      addCommentMutation.mutate(commentVal.trim());
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden select-none font-sans text-slate-800 w-[300px]">
      
      {/* Inspector Top Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
        <div className="min-w-0 pr-2">
          <span className="font-extrabold text-xs text-slate-900 tracking-tight block truncate" title={item.name}>
            {item.name}
          </span>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wider uppercase">
            Document Inspector
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Notion / VS Code Style Horizontal Tabs */}
      <div className="flex border-b border-slate-200/80 bg-slate-50/50 text-xs font-bold text-slate-500 select-none shrink-0">
        {[
          { id: 'properties', label: 'Properties' },
          { id: 'comments', label: `Comments (${comments.length})` },
          { id: 'versions', label: `Versions (${versions.length || 1})` },
          { id: 'activity', label: 'Activity' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all truncate px-1 text-[11px] ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Single Clean Surface Content Area (No nested cards inside cards) */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">

        {/* ── TAB 1: PROPERTIES (Grouped by whitespace & subtle dividers) ── */}
        {activeTab === 'properties' && (
          <div className="space-y-5 text-xs font-semibold animate-in fade-in duration-150">
            
            {/* Group 1: Document Details */}
            <div className="space-y-3">
              <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 block">
                Document Details
              </span>
              <div className="space-y-2.5 text-[11.5px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Name</span>
                  <span className="text-slate-900 font-bold truncate max-w-[170px]" title={item.name}>{item.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Type</span>
                  <span className="text-slate-700 font-extrabold uppercase">{item.fileType || item.file_type || 'DOCX'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Owner</span>
                  <span className="text-slate-900 font-bold">{item.ownerName || item.owner?.full_name || 'System'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Version</span>
                  <span className="font-mono text-slate-800 font-bold">{item.version || 'v1.0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Status</span>
                  <span className="text-[9.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                    {item.status === 'archived' ? 'Archived' : 'Approved'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Size</span>
                  <span className="text-slate-700 font-medium">{item.size || '12.4 KB'}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Group 2: Description */}
            <div className="space-y-2">
              <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 block">
                Description
              </span>
              <p className="text-[11.5px] text-slate-650 font-medium leading-relaxed">
                {item.description || 'Standard corporate operational policy guidelines cataloged under Knowledge Management System rules.'}
              </p>
            </div>

            <div className="border-t border-slate-100" />

            {/* Group 3: Tags */}
            <div className="space-y-2">
              <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 block">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['KMS', 'Policy', 'Enterprise', item.department || 'Operations'].map((tag) => (
                  <span key={tag} className="text-[10px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Group 4: Permissions */}
            <div className="space-y-2.5">
              <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 block">
                Permissions
              </span>
              <div className="space-y-2 text-[11.5px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Super Admin (Arun)</span>
                  <span className="text-[9.5px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-extrabold">OWNER</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Manager (Riwitika)</span>
                  <span className="text-[9.5px] text-slate-500 font-bold">EDITOR</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Employee (Paras)</span>
                  <span className="text-[9.5px] text-slate-500 font-bold">VIEWER</span>
                </div>
                {permissions.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center pt-1 border-t border-slate-50">
                    <span className="font-bold text-slate-700">{p.user?.full_name || p.department?.name || 'Custom'}</span>
                    <span className="text-[9.5px] text-slate-500 font-bold capitalize">{p.role || 'Viewer'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary (if present) */}
            {item.ai_summary && (
              <>
                <div className="border-t border-slate-100" />
                <div className="space-y-2">
                  <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 block">
                    ✨ AI Summary
                  </span>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium bg-blue-50/40 border border-blue-100/60 rounded-xl p-3">
                    {item.ai_summary}
                  </p>
                </div>
              </>
            )}

            {/* Related Documents */}
            {relatedDocs.length > 0 && (
              <>
                <div className="border-t border-slate-100" />
                <div className="space-y-2">
                  <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 block">
                    Related Documents
                  </span>
                  <div className="space-y-1">
                    {relatedDocs.map((doc: any) => (
                      <a
                        key={doc.id}
                        href={`/documents/${doc.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/documents/${doc.id}`;
                        }}
                        className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg select-none group text-xs font-bold text-slate-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                        <span className="truncate flex-1 group-hover:text-blue-600 transition-colors">{doc.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB 2: COMMENTS ── */}
        {activeTab === 'comments' && (
          <div className="space-y-4 animate-in fade-in duration-150 flex flex-col h-full justify-between">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {comments.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 font-bold uppercase">No comments posted yet</div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="flex gap-2.5 p-3 border border-slate-100 rounded-xl bg-slate-50/50 text-xs">
                    <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-extrabold text-[9px] text-blue-700 shrink-0">
                      {getInitials(c.user?.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center select-none">
                        <span className="font-extrabold text-slate-900">{c.user?.full_name || 'User'}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {new Date(c.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-655 font-medium text-xs mt-1 leading-normal break-words">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-3 border-t border-slate-100">
              <input
                type="text"
                value={commentVal}
                onChange={(e) => setCommentVal(e.target.value)}
                placeholder="Type a comment..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 font-medium"
              />
              <button
                type="submit"
                disabled={!commentVal.trim() || addCommentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 3: VERSIONS ── */}
        {activeTab === 'versions' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            {versions.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-extrabold text-slate-900">v1.0</span>
                  <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">Initial version upload</span>
                </div>
                <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-extrabold uppercase">Active</span>
              </div>
            ) : (
              versions.map((v: any, index: number) => (
                <div key={v.id} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">v{v.version_number || index + 1}.0</span>
                      {index === 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 uppercase select-none">Latest</span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5">
                      {v.uploaded_at ? new Date(v.uploaded_at).toLocaleDateString() : 'Unknown date'} &bull; by {v.uploader?.full_name || 'Owner'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Downloading version file...')}
                    className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-100 transition-colors"
                    title="Download version file"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB 4: ACTIVITY ── */}
        {activeTab === 'activity' && (
          <div className="relative pl-3.5 border-l border-slate-200 ml-2 space-y-4 py-2 animate-in fade-in duration-150">
            <div className="relative text-xs font-semibold select-none">
              <div className="absolute -left-[20.5px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white border border-blue-500 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              </div>
              <p className="text-slate-900 font-bold text-xs">Document updated</p>
              <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5">
                {item.updated_at ? new Date(item.updated_at).toLocaleString() : 'Today'}
              </span>
            </div>
            <div className="relative text-xs font-semibold select-none">
              <div className="absolute -left-[20.5px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white border border-slate-300 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              </div>
              <p className="text-slate-900 font-bold text-xs">Document cataloged in KMS</p>
              <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5">
                {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently'}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
