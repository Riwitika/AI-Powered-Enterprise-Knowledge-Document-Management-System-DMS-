import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { UploadModal } from '../components/UploadModal';
import { ShareModal } from '../components/ShareModal';
import DocEditor from '../components/DocEditor';
import { 
  ChevronRight, 
  Send,
  Loader2,
  FileText,
  X,
  Share2,
  Save,
  Plus,
  Folder,
  FolderPlus,
  Upload,
  MoreVertical,
  Trash2,
  Edit,
  ArrowUpRight,
  Archive,
  RefreshCw,
  Lock,
  FileDown
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id: string | null): boolean => {
  if (!id) return false;
  return UUID_REGEX.test(id);
};

export default function DocumentTree() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Selected Document ID derived from URL params for single source of truth
  const selectedDocId = searchParams.get('open');
  const setSelectedDocId = (id: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set('open', id);
    } else {
      params.delete('open');
    }
    setSearchParams(params);
  };

  // Current folder ID derived from URL params
  const folderParam = searchParams.get('folder');
  const activeFolderId = folderParam ? Number(folderParam) : 0;
  const setActiveFolderId = (id: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('folder', String(id));
    setSearchParams(params);
  };

  // View archived files toggle
  const viewArchived = searchParams.get('archived') === 'true';
  const setViewArchived = (val: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set('archived', 'true');
    } else {
      params.delete('archived');
    }
    setSearchParams(params);
  };

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'folder' | 'file';
    id: number | string;
  } | null>(null);

  // Folder creation states
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Document creation from template states
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [newDocCat, setNewDocCat] = useState('');
  const [newDocTemplateId, setNewDocTemplateId] = useState('');

  // Upload modal states
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCat, setUploadCat] = useState('');
  const [uploadAccess, setUploadAccess] = useState('private');

  // Share Dialog States
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUserId, setShareUserId] = useState('');
  const [shareDeptId, setShareDeptId] = useState<number | ''>('');
  const [shareAccessType, setShareAccessType] = useState('view');
  const [linkCopied, setLinkCopied] = useState(false);

  // Rename modal states
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'folder' | 'file'; id: number | string; name: string } | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  // Move document/folder modal states
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ type: 'folder' | 'file'; id: number | string } | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<number | ''>('');

  // Queries
  const { data: folderTree, isLoading: treeLoading } = useQuery({
    queryKey: ['folders-tree'],
    queryFn: api.folders.tree
  });

  const { data: allDocs, refetch: refetchDocs } = useQuery({
    queryKey: ['documents-list-workspace'],
    queryFn: api.documents.list
  });

  const { data: selectedDoc } = useQuery({
    queryKey: ['document', selectedDocId],
    queryFn: () => selectedDocId ? api.documents.get(selectedDocId) : null,
    enabled: isValidUuid(selectedDocId)
  });

  const { data: systemUsers } = useQuery({
    queryKey: ['system-users-directory'],
    queryFn: api.users.list
  });

  const { data: systemDepts } = useQuery({
    queryKey: ['system-depts-directory'],
    queryFn: api.departments.list
  });

  const { data: docPermissions, refetch: refetchPermissionsList } = useQuery({
    queryKey: ['document-permissions', selectedDocId],
    queryFn: () => selectedDocId ? api.permissions.list(selectedDocId) : [],
    enabled: isValidUuid(selectedDocId) && showShareModal
  });

  // Recursive helpers to search folders-tree
  const findFolderNode = (nodes: any[] | undefined, targetId: number): any | null => {
    if (!nodes) return null;
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.sub_folders && node.sub_folders.length > 0) {
        const found = findFolderNode(node.sub_folders, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const getFolderBreadcrumbs = (nodes: any[] | undefined, targetId: number, path: any[] = []): any[] | null => {
    if (!nodes) return null;
    for (const node of nodes) {
      const currentPath = [...path, { id: node.id, name: node.name }];
      if (node.id === targetId) return currentPath;
      if (node.sub_folders && node.sub_folders.length > 0) {
        const found = getFolderBreadcrumbs(node.sub_folders, targetId, currentPath);
        if (found) return found;
      }
    }
    return null;
  };

  // Compile active node and breadcrumbs path
  const currentFolderNode = findFolderNode(folderTree, activeFolderId) || (folderTree ? folderTree[0] : null);
  const breadcrumbs = getFolderBreadcrumbs(folderTree, activeFolderId) || [{ id: 0, name: "Workspace Root" }];

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: api.folders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      setNewFolderName('');
      setShowNewFolder(false);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create folder");
    }
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => api.folders.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      setShowRenameModal(false);
      setShowMoveModal(false);
      setMoveTarget(null);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update folder");
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: api.folders.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      // If deleted folder was active, go back to parent
      if (activeFolderId !== 0) {
        const parentId = currentFolderNode?.parent_id || 0;
        setActiveFolderId(parentId);
      }
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete folder. Make sure the folder is completely empty first.");
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: api.documents.upload,
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      
      setUploadFile(null);
      setUploadName('');
      setUploadDesc('');
      setUploadCat('');
      setShowUpload(false);
      setShowNewDocModal(false);
      setNewDocTitle('');
      setNewDocDesc('');
      setNewDocCat('');
      setNewDocTemplateId('');

      if (newDoc && newDoc.id) {
        setSelectedDocId(newDoc.id);
      }
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create/upload document");
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: api.documents.delete,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      if (selectedDocId === deletedId) {
        setSelectedDocId(null);
      }
      localStorage.removeItem(`doc_content_${deletedId}`);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete document");
    }
  });

  const archiveDocMutation = useMutation({
    mutationFn: api.documents.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to archive document");
    }
  });

  const saveDocMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      api.documents.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      localStorage.removeItem(`doc_content_${variables.id}`);
      setShowRenameModal(false);
      setShowMoveModal(false);
      setMoveTarget(null);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update document");
    }
  });

  const grantPermissionMutation = useMutation({
    mutationFn: ({ docId, payload }: { docId: string; payload: any }) => api.permissions.grant(docId, payload),
    onSuccess: () => {
      refetchPermissionsList();
      setShareUserId('');
      setShareDeptId('');
    }
  });

  const revokePermissionMutation = useMutation({
    mutationFn: ({ docId, params }: { docId: string; params: any }) => api.permissions.revoke(docId, params),
    onSuccess: () => {
      refetchPermissionsList();
    }
  });

  // Action helpers
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate({
      name: newFolderName,
      parent_id: activeFolderId !== 0 ? activeFolderId : null
    });
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName || uploadFile.name);
    formData.append('description', uploadDesc);
    formData.append('category', uploadCat);
    formData.append('access_level', uploadAccess);
    if (activeFolderId !== 0) {
      formData.append('folder_id', String(activeFolderId));
    }
    uploadDocMutation.mutate(formData);
  };

  const handleCreateDocFromDialog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    
    let content = "<p>Start writing your enterprise document...</p>";
    if (newDocTemplateId) {
      const templateDoc = allDocs?.find((d: any) => d.id === newDocTemplateId);
      if (templateDoc) {
        content = templateDoc.content || content;
      }
    }

    const dummyFile = new File([content], `${newDocTitle.trim()}.txt`, { type: "text/plain" });
    const formData = new FormData();
    formData.append('file', dummyFile);
    formData.append('name', newDocTitle.trim());
    formData.append('description', newDocDesc);
    formData.append('category', newDocCat || 'General');
    formData.append('access_level', 'private');
    if (activeFolderId !== 0) {
      formData.append('folder_id', String(activeFolderId));
    }
    
    uploadDocMutation.mutate(formData);
  };

  const handleDuplicateDocument = (doc: any) => {
    const defaultContent = doc.content || "<p>Blank document copy</p>";
    const dummyFile = new File([defaultContent], `${doc.name} (Copy).txt`, { type: "text/plain" });
    const formData = new FormData();
    formData.append('file', dummyFile);
    formData.append('name', `${doc.name} (Copy)`);
    formData.append('description', doc.description || '');
    formData.append('category', doc.category || '');
    formData.append('access_level', 'private');
    if (doc.folder_id !== null) {
      formData.append('folder_id', String(doc.folder_id));
    }
    uploadDocMutation.mutate(formData);
  };

  const handleMoveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveTarget) return;
    
    const destFolderId = moveTargetFolderId !== '' ? Number(moveTargetFolderId) : null;

    if (moveTarget.type === 'file') {
      saveDocMutation.mutate({
        id: String(moveTarget.id),
        payload: { folder_id: destFolderId }
      });
    } else {
      updateFolderMutation.mutate({
        id: Number(moveTarget.id),
        payload: { parent_id: destFolderId, name: currentFolderNode?.sub_folders?.find((f: any) => f.id === Number(moveTarget.id))?.name || "Folder" }
      });
    }
  };

  const handleRenameTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameNewName.trim()) return;

    if (renameTarget.type === 'folder') {
      updateFolderMutation.mutate({
        id: Number(renameTarget.id),
        payload: { name: renameNewName }
      });
    } else {
      saveDocMutation.mutate({
        id: String(renameTarget.id),
        payload: { name: renameNewName }
      });
    }
  };

  const handleGrantPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;
    if (!shareUserId && !shareDeptId) return;

    grantPermissionMutation.mutate({
      docId: selectedDocId,
      payload: {
        user_id: shareUserId || null,
        department_id: shareDeptId !== '' ? Number(shareDeptId) : null,
        access_type: shareAccessType
      }
    });
  };

  const handleRevokePermission = (perm: any) => {
    if (!selectedDocId) return;
    revokePermissionMutation.mutate({
      docId: selectedDocId,
      params: {
        user_id: perm.user_id || undefined,
        department_id: perm.department_id || undefined
      }
    });
  };

  const handleDownload = async (doc: any) => {
    try {
      const blob = await api.documents.download(doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.name}.${doc.file_type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to download file');
    }
  };

  const handleCopyShareLink = () => {
    if (!selectedDoc) return;
    const origin = window.location.origin;
    const shareLink = selectedDoc.access_level === 'public' 
      ? `${origin}/public/documents/${selectedDoc.id}`
      : `${origin}/documents?open=${selectedDoc.id}`;
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Three dots menu click helper
  const openActionsMenu = (e: React.MouseEvent, type: 'folder' | 'file', id: number | string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const container = document.getElementById('workspace-panel-container');
    const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
    setContextMenu({
      x: rect.left - containerRect.left - 130, // shift slightly left of the three dots
      y: rect.bottom - containerRect.top + 5,
      type,
      id
    });
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pending' || s === 'draft') return 'bg-slate-100 text-slate-700 border-slate-200';
    if (s === 'active' || s === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s === 'pending_approval') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (s === 'archived') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-50 text-slate-655 border-slate-200';
  };

  // Close context menu on window click
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Sync folder expansion in sidebar layout when folder param changes
  useEffect(() => {
    if (activeFolderId !== 0) {
      // Dispatch custom expansion event if the tree sidebar expansions are synced locally
      window.dispatchEvent(new CustomEvent('folder-opened', { detail: activeFolderId }));
    }
  }, [activeFolderId]);

  const isEditing = selectedDocId && isValidUuid(selectedDocId);

  // Compile active folder subfolders & documents
  const subFolders = currentFolderNode?.sub_folders || [];
  
  // Filter documents in current folder by archived status
  const displayedDocuments = (currentFolderNode?.documents || []).filter((doc: any) => {
    const isArchived = doc.status === 'archived';
    return viewArchived ? isArchived : !isArchived;
  });

  // Extract all folders list for moving target selects
  const getFlattenedFolders = (nodes: any[] | undefined, list: any[] = []): any[] => {
    if (!nodes) return list;
    for (const node of nodes) {
      list.push({ id: node.id, name: node.name });
      if (node.sub_folders && node.sub_folders.length > 0) {
        getFlattenedFolders(node.sub_folders, list);
      }
    }
    return list;
  };
  const allFoldersList = getFlattenedFolders(folderTree);

  // Suppress cyclic moves
  const isMoveOptionValid = (optionFolderId: number) => {
    if (!moveTarget) return true;
    if (moveTarget.type === 'file') return true;
    
    const targetFolderId = Number(moveTarget.id);
    if (optionFolderId === targetFolderId) return false;

    // Check if optionFolderId is a descendant of targetFolderId
    const isDescendant = (nodes: any[], parentId: number, childId: number): boolean => {
      const parentNode = findFolderNode(nodes, parentId);
      if (!parentNode) return false;
      const childNode = findFolderNode(parentNode.sub_folders, childId);
      if (childNode) return true;
      return false;
    };

    if (folderTree && isDescendant(folderTree, targetFolderId, optionFolderId)) {
      return false;
    }

    return true;
  };

  return (
    <div className="h-full w-full bg-[#f9fbfd] font-sans overflow-hidden flex flex-col">
      {isEditing ? (
        <DocEditor
          selectedDocId={selectedDocId!}
          onBackToCatalog={() => setSelectedDocId(null)}
          allDocs={allDocs || []}
          refetchDocs={refetchDocs}
        />
      ) : (
        <div id="workspace-panel-container" className="flex-1 flex flex-col h-full overflow-hidden relative p-8 bg-slate-50">
          
          {/* Invalid UUID link alert banner */}
          {selectedDocId && !isValidUuid(selectedDocId) && (
            <div className="mb-5 bg-rose-50 border border-rose-150 p-4 rounded-xl flex items-center justify-between text-xs text-rose-800 shadow-sm animate-in fade-in slide-in-from-top duration-200">
              <span className="flex items-center gap-2 font-semibold">
                <Lock className="h-4.5 w-4.5 text-rose-550" />
                Invalid Link Format: The URL contains an invalid document ID structure. Please choose another document.
              </span>
              <button 
                onClick={() => setSelectedDocId(null)} 
                className="text-rose-500 hover:text-rose-700 font-extrabold uppercase text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Breadcrumbs Trail */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0 select-none">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={bc.id}>
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-350" />}
                    <button 
                      onClick={() => { setActiveFolderId(bc.id); setViewArchived(false); }}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {bc.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Folder className="h-5.5 w-5.5 text-blue-600 fill-blue-50" />
                <span>{currentFolderNode?.name || "Workspace Root"}</span>
                {viewArchived && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    Archive Bin
                  </span>
                )}
              </h1>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewArchived(!viewArchived)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold transition-all shadow-sm ${
                  viewArchived 
                    ? 'bg-purple-50 border-purple-250 text-purple-700 hover:bg-purple-100' 
                    : 'bg-white border-slate-200 hover:bg-slate-55 text-slate-600'
                }`}
                title="View Archived Documents"
              >
                <Archive className="h-4 w-4" />
                <span>{viewArchived ? "Hide Archived" : "View Archive"}</span>
              </button>

              <button 
                onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
              >
                <FolderPlus className="h-4 w-4 text-amber-500" />
                <span>New Folder</span>
              </button>

              <button 
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
              >
                <Upload className="h-4 w-4 text-blue-500" />
                <span>Upload File</span>
              </button>

              <button 
                onClick={() => setShowNewDocModal(true)}
                className="flex items-center gap-1.5 bg-blue-655 hover:bg-blue-700 border border-blue-600 hover:border-blue-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>New Document</span>
              </button>
            </div>
          </div>

          {/* Directory Listings Explorer */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            
            {treeLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Catalog Directory...</span>
              </div>
            ) : (subFolders.length === 0 && displayedDocuments.length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none space-y-4">
                <div className="h-16 w-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shadow-sm">
                  {viewArchived ? <Archive className="h-7 w-7" /> : <Folder className="h-7 w-7 text-amber-400" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {viewArchived ? "No Archived Documents" : "This Folder is Empty"}
                  </h3>
                  <p className="text-[11px] text-slate-455 mt-1.5 leading-relaxed max-w-sm">
                    {viewArchived 
                      ? "There are no archived version logs inside this folder node database register."
                      : "Create a new subfolder, draft a blank document, or drag and drop files here to begin corporate ingestion."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50/50 text-[9px] uppercase tracking-wider font-extrabold text-slate-455 select-none">
                      <th className="py-3.5 px-6 font-extrabold w-2/5">Name</th>
                      <th className="py-3.5 px-4 font-extrabold">Category</th>
                      <th className="py-3.5 px-4 font-extrabold">Owner</th>
                      <th className="py-3.5 px-4 font-extrabold">Status</th>
                      <th className="py-3.5 px-4 font-extrabold">Last Modified</th>
                      <th className="py-3.5 px-6 font-extrabold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    
                    {/* Render Subfolders */}
                    {!viewArchived && subFolders.map((sub: any) => (
                      <tr 
                        key={sub.id} 
                        className="hover:bg-slate-55/50 transition-colors group cursor-pointer"
                        onDoubleClick={() => setActiveFolderId(sub.id)}
                      >
                        <td className="py-3 px-6 font-semibold text-slate-800">
                          <button 
                            onClick={() => setActiveFolderId(sub.id)}
                            className="flex items-center gap-3 text-left w-full focus:outline-none"
                          >
                            <Folder className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10 shrink-0" />
                            <span className="truncate hover:text-blue-600 transition-colors">{sub.name}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-450">-</td>
                        <td className="py-3 px-4 text-slate-450">-</td>
                        <td className="py-3 px-4 text-slate-450">-</td>
                        <td className="py-3 px-4 text-slate-455">-</td>
                        <td className="py-3 px-6 text-right relative">
                          <button 
                            onClick={(e) => openActionsMenu(e, 'folder', sub.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors inline-flex"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Render Documents */}
                    {displayedDocuments.map((doc: any) => (
                      <tr 
                        key={doc.id} 
                        className="hover:bg-slate-55/50 transition-colors group cursor-pointer"
                        onDoubleClick={() => { if (doc.status !== 'archived') setSelectedDocId(doc.id); }}
                      >
                        <td className="py-3 px-6 font-semibold text-slate-800">
                          {doc.status === 'archived' ? (
                            <div className="flex items-center gap-3 text-left w-full">
                              <FileText className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                              <span className="truncate text-slate-450">{doc.name}</span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setSelectedDocId(doc.id)}
                              className="flex items-center gap-3 text-left w-full focus:outline-none"
                            >
                              <FileText className="h-4.5 w-4.5 text-blue-600 fill-blue-50 shrink-0" />
                              <span className="truncate hover:text-blue-600 transition-colors">{doc.name}</span>
                              {doc.is_template && (
                                <span className="text-[8px] bg-sky-100 border border-sky-200 text-sky-805 font-extrabold uppercase px-1.5 py-0.2 rounded-full shrink-0 tracking-wider">
                                  Template
                                </span>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-50 border border-slate-200/60 text-slate-600 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                            {doc.category || "General"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{doc.owner?.full_name || "Enterprise KMS"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wide ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{new Date(doc.updated_at).toLocaleString()}</td>
                        <td className="py-3 px-6 text-right relative">
                          <button 
                            onClick={(e) => openActionsMenu(e, 'file', doc.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors inline-flex"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* 4. CONTEXT / DROPDOWN ACTION MENU */}
      {contextMenu && (
        <div 
          className="absolute bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 w-48 z-50 text-xs text-slate-700 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' ? (
            <>
              <button 
                onClick={() => {
                  setActiveFolderId(Number(contextMenu.id));
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold flex items-center gap-2"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-450" />
                <span>Open Folder</span>
              </button>
              <button 
                onClick={() => {
                  const targetFolder = currentFolderNode?.sub_folders?.find((f: any) => f.id === Number(contextMenu.id));
                  setRenameTarget({ type: 'folder', id: contextMenu.id, name: targetFolder?.name || '' });
                  setRenameNewName(targetFolder?.name || '');
                  setShowRenameModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold flex items-center gap-2"
              >
                <Edit className="h-3.5 w-3.5 text-slate-450" />
                <span>Rename Folder</span>
              </button>
              <button 
                onClick={() => {
                  setMoveTarget({ type: 'folder', id: contextMenu.id });
                  setMoveTargetFolderId('');
                  setShowMoveModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold flex items-center gap-2"
              >
                <Folder className="h-3.5 w-3.5 text-slate-450" />
                <span>Move Folder</span>
              </button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this folder? All empty subdirectories will be cleared.")) {
                    deleteFolderMutation.mutate(Number(contextMenu.id));
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold text-red-655 hover:text-red-750 flex items-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                <span>Delete Folder</span>
              </button>
            </>
          ) : (
            <>
              {displayedDocuments.find((d: any) => d.id === contextMenu.id)?.status !== 'archived' ? (
                <>
                  <button 
                    onClick={() => {
                      setSelectedDocId(String(contextMenu.id));
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold flex items-center gap-2"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 text-blue-500" />
                    <span>Open Workspace</span>
                  </button>
                  <button 
                    onClick={() => {
                      const targetDoc = displayedDocuments.find((d: any) => d.id === String(contextMenu.id));
                      if (targetDoc) handleDownload(targetDoc);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold flex items-center gap-2"
                  >
                    <FileDown className="h-3.5 w-3.5 text-slate-450" />
                    <span>Download File</span>
                  </button>
                  <button 
                    onClick={() => {
                      const targetDoc = displayedDocuments.find((d: any) => d.id === String(contextMenu.id));
                      if (targetDoc) handleDuplicateDocument(targetDoc);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold flex items-center gap-2"
                  >
                    <Save className="h-3.5 w-3.5 text-slate-450" />
                    <span>Duplicate File</span>
                  </button>
                  <button 
                    onClick={() => {
                      setMoveTarget({ type: 'file', id: contextMenu.id });
                      setMoveTargetFolderId('');
                      setShowMoveModal(true);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold flex items-center gap-2"
                  >
                    <Folder className="h-3.5 w-3.5 text-slate-450" />
                    <span>Move To Folder</span>
                  </button>
                  <button 
                    onClick={() => {
                      const targetDoc = displayedDocuments.find((d: any) => d.id === String(contextMenu.id));
                      setRenameTarget({ type: 'file', id: contextMenu.id, name: targetDoc?.name || '' });
                      setRenameNewName(targetDoc?.name || '');
                      setShowRenameModal(true);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold flex items-center gap-2"
                  >
                    <Edit className="h-3.5 w-3.5 text-slate-450" />
                    <span>Rename File</span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedDocId(String(contextMenu.id));
                      setShowShareModal(true);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold flex items-center gap-2"
                  >
                    <Share2 className="h-3.5 w-3.5 text-slate-450" />
                    <span>Share / Permissions</span>
                  </button>

                  <div className="h-[1px] bg-slate-100 my-1" />

                  {/* Workflow approvals actions context */}
                  {(() => {
                    const targetDoc = displayedDocuments.find((d: any) => d.id === String(contextMenu.id));
                    if (!targetDoc) return null;

                    const isAdmin = user?.role?.name === 'super_admin' || user?.role?.name === 'admin' || user?.role?.name === 'department_manager';
                    const isOwner = targetDoc.owner_id === user?.id;

                    return (
                      <>
                        {(targetDoc.status === 'pending' || targetDoc.status === 'draft') && isOwner && (
                          <button 
                            onClick={() => {
                              api.documents.submitApproval(targetDoc.id).then(() => {
                                queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
                                alert("Document submitted successfully for approval.");
                              });
                              setContextMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold text-amber-600 flex items-center gap-2"
                          >
                            <Send className="h-3.5 w-3.5 text-amber-500" />
                            <span>Submit Approval</span>
                          </button>
                        )}
                        {targetDoc.status === 'pending_approval' && isAdmin && (
                          <>
                            <button 
                              onClick={() => {
                                api.documents.approve(targetDoc.id).then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
                                  alert("Approved successfully.");
                                });
                                setContextMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold text-emerald-650 flex items-center gap-2"
                            >
                              <Plus className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Approve Document</span>
                            </button>
                            <button 
                              onClick={() => {
                                const rem = prompt("Enter rejection remarks:");
                                if (rem) {
                                  api.documents.reject(targetDoc.id, rem).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
                                    alert("Rejected.");
                                  });
                                }
                                setContextMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold text-rose-600 flex items-center gap-2"
                            >
                              <X className="h-3.5 w-3.5 text-rose-500" />
                              <span>Reject Document</span>
                            </button>
                          </>
                        )}
                        {targetDoc.status === 'rejected' && isOwner && (
                          <button 
                            onClick={() => {
                              api.documents.submitApproval(targetDoc.id).then(() => {
                                queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
                                alert("Resubmitted for approval.");
                              });
                              setContextMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold text-slate-800 flex items-center gap-2"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Resubmit Approval</span>
                          </button>
                        )}
                      </>
                    );
                  })()}

                  <div className="h-[1px] bg-slate-100 my-1" />

                  <button 
                    onClick={() => {
                      archiveDocMutation.mutate(String(contextMenu.id));
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold text-purple-600 flex items-center gap-2"
                  >
                    <Archive className="h-3.5 w-3.5 text-purple-500" />
                    <span>Archive Document</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to permanently delete this document file? This cannot be undone.")) {
                        deleteDocMutation.mutate(String(contextMenu.id));
                      }
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold text-red-655 hover:text-red-750 flex items-center gap-2"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    <span>Delete File</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      saveDocMutation.mutate({
                        id: String(contextMenu.id),
                        payload: { status: 'active' }
                      });
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold text-emerald-650 flex items-center gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Restore Document</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to permanently delete this document file? This cannot be undone.")) {
                        deleteDocMutation.mutate(String(contextMenu.id));
                      }
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 font-bold text-red-655 hover:text-red-750 flex items-center gap-2"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    <span>Delete File</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* 5. SEVERAL DIALOG MODALS */}

      {/* Share dialog modal container */}
      <ShareModal
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        selectedDoc={selectedDoc}
        shareUserId={shareUserId}
        setShareUserId={setShareUserId}
        shareDeptId={shareDeptId}
        setShareDeptId={setShareDeptId}
        shareAccessType={shareAccessType}
        setShareAccessType={setShareAccessType}
        systemUsers={systemUsers}
        systemDepts={systemDepts}
        currentUser={user}
        docPermissions={docPermissions}
        handleGrantPermission={handleGrantPermission}
        handleRevokePermission={handleRevokePermission}
        handleCopyShareLink={handleCopyShareLink}
        linkCopied={linkCopied}
      />

      {/* Rename modal dialog */}
      {showRenameModal && renameTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form onSubmit={handleRenameTarget} className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base">Rename {renameTarget.type === 'folder' ? 'Folder' : 'Document'}</h3>
            <div>
              <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">New Name</label>
              <input 
                type="text" 
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                placeholder="Finance SOP, Legal Contract..."
                required
                className="w-full bg-slate-55 border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Move Document/Folder Modal Dialog */}
      {showMoveModal && moveTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form onSubmit={handleMoveTarget} className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base">Move {moveTarget.type === 'folder' ? 'Folder' : 'Document'}</h3>
            <div>
              <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">Target Destination Folder</label>
              <select
                value={moveTargetFolderId}
                onChange={(e) => setMoveTargetFolderId(e.target.value !== '' ? Number(e.target.value) : '')}
                className="w-full bg-slate-55 border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-700"
              >
                <option value="">Root Catalog (No Folder)</option>
                {allFoldersList.filter(f => isMoveOptionValid(f.id)).map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => { setShowMoveModal(false); setMoveTarget(null); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-655 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Move {moveTarget.type === 'folder' ? 'Folder' : 'Document'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form onSubmit={handleCreateFolder} className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-955 text-base">Create New Folder</h3>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Folder Name</label>
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Finance SOP, Technical Specs..."
                required
                className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowNewFolder(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Document Modal (Unified template & creation selector) */}
      {showNewDocModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form onSubmit={handleCreateDocFromDialog} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-955 text-base">Create New Document</h3>
            
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Document Title</label>
              <input 
                type="text" 
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Employee Handbook, Security Policy..."
                required
                className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Abstract Description</label>
              <textarea 
                value={newDocDesc}
                onChange={(e) => setNewDocDesc(e.target.value)}
                placeholder="Brief description of document content scope..."
                className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 h-16 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Category Tag</label>
                <input 
                  type="text" 
                  value={newDocCat}
                  onChange={(e) => setNewDocCat(e.target.value)}
                  placeholder="SOP, Manual, Policy"
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Starting Template Layout</label>
                <select
                  value={newDocTemplateId}
                  onChange={(e) => setNewDocTemplateId(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 font-semibold"
                >
                  <option value="">Blank Document (None)</option>
                  {allDocs?.filter(d => d.is_template).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowNewDocModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Create Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload File Modal */}
      <UploadModal
        showUpload={showUpload}
        setShowUpload={setShowUpload}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        uploadName={uploadName}
        setUploadName={setUploadName}
        uploadDesc={uploadDesc}
        setUploadDesc={setUploadDesc}
        uploadCat={uploadCat}
        setUploadCat={setUploadCat}
        uploadAccess={uploadAccess}
        setUploadAccess={setUploadAccess}
        onSubmit={handleUploadDocument}
      />
    </div>
  );
}
