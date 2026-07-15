import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import FloatingAIChat from './FloatingAIChat';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  LayoutDashboard,
  FolderTree,
  Users,
  LogOut,
  FileText,
  Activity,
  Layers,
  Search,
  Bell,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Folder,
  Plus,
  FolderPlus,
  Edit,
  Trash2
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const notifications = [
    { id: 1, text: "New document version uploaded by Riwitika", time: "5m ago" },
    { id: 2, text: "Access granted for Department SOP", time: "1h ago" }
  ];
  const [showNotifications, setShowNotifications] = useState(false);

  // Workspace Tree Sidebar Expanded states
  const [workspaceExpanded, setWorkspaceExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({
    0: true,
    1: true // Auto-expand "Company Knowledge" root folder on load!
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role?.name === 'super_admin' || user?.role?.name === 'admin';
  const isManager = user?.role?.name === 'department_manager';
  const canApprove = isAdmin || isManager;

  const queryClient = useQueryClient();

  const createFolderMutation = useMutation({
    mutationFn: api.folders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: api.documents.upload,
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      if (newDoc && newDoc.id) {
        navigate(`/documents?open=${newDoc.id}`);
      }
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId: string) => api.documents.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      const params = new URLSearchParams(location.search);
      if (params.get('open')) {
        navigate('/documents');
      }
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete document');
    }
  });

  const renameDocumentMutation = useMutation({
    mutationFn: (payload: { id: string; name: string }) => 
      api.documents.update(payload.id, { name: payload.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['document'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to rename document');
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: number) => api.folders.delete(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete folder');
    }
  });

  const renameFolderMutation = useMutation({
    mutationFn: (payload: { id: number; name: string }) => 
      api.folders.update(payload.id, { name: payload.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to rename folder');
    }
  });

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(docId);
    }
  };

  const handleRenameDocument = (doc: any) => {
    const name = prompt("Enter new document name:", doc.name);
    if (name && name.trim() && name.trim() !== doc.name) {
      renameDocumentMutation.mutate({ id: doc.id, name: name.trim() });
    }
  };

  const handleDeleteFolder = (folderId: number) => {
    if (window.confirm("Are you sure you want to delete this folder? All empty subdirectories will be cleared.")) {
      deleteFolderMutation.mutate(folderId);
    }
  };

  const handleRenameFolder = (folder: any) => {
    const name = prompt("Enter new folder name:", folder.name);
    if (name && name.trim() && name.trim() !== folder.name) {
      renameFolderMutation.mutate({ id: folder.id, name: name.trim() });
    }
  };

  const handleCreateFolder = (parentId: number) => {
    const name = prompt("Enter subfolder name:");
    if (name && name.trim()) {
      createFolderMutation.mutate({ name: name.trim(), parent_id: parentId });
    }
  };

  const handleCreateDocument = (folderId: number) => {
    const title = prompt("Enter document title:");
    if (title && title.trim()) {
      const dummyFile = new File(["<p>Start writing your enterprise document...</p>"], `${title.trim()}.txt`, { type: "text/plain" });
      const formData = new FormData();
      formData.append('file', dummyFile);
      formData.append('name', title.trim());
      formData.append('description', 'Draft document created in workspace');
      formData.append('category', 'Draft');
      formData.append('access_level', 'private');
      formData.append('folder_id', String(folderId));
      uploadDocMutation.mutate(formData);
    }
  };

  // Get recent files for the top bar quick selector
  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics-topbar'],
    queryFn: api.dashboard.metrics,
    enabled: !!user
  });

  // Get recursive folder tree for sidebar navigation
  const { data: folderTree } = useQuery({
    queryKey: ['folders-tree'],
    queryFn: api.folders.tree,
    enabled: !!user
  });

  const toggleFolder = (folderId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Recursive Sidebar Tree Renderer
  const renderSidebarTree = (nodes: any[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = !!expandedFolders[node.id];
      
      return (
        <div key={node.id} className="space-y-0.5 select-none">
          {/* Folder row container */}
          <div
            onClick={(e) => toggleFolder(node.id, e)}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-all text-left text-slate-600 hover:bg-slate-100/70 border-l-2 border-transparent min-w-0 group cursor-pointer ${
              isExpanded ? 'font-bold text-slate-900 bg-slate-50/40' : 'font-medium'
            }`}
          >
            <span className="flex items-center gap-1.5 min-w-0 text-[11px] flex-1">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-blue-500 shrink-0 font-bold" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0 hover:text-slate-850" />
              )}
              <Folder className={`h-3.5 w-3.5 shrink-0 ${isExpanded ? 'text-amber-500 fill-amber-500/10' : 'text-amber-600 fill-amber-600/5'}`} />
              <span className="truncate block min-w-0 flex-1">{node.name}</span>
            </span>

            {/* Folder Actions hover panel */}
            <div 
              className="hidden group-hover:flex items-center gap-1 shrink-0 pr-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleCreateFolder(node.id)}
                className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                title="Create Subfolder"
              >
                <FolderPlus className="h-3 w-3 text-amber-600" />
              </button>
              <button
                onClick={() => handleCreateDocument(node.id)}
                className="p-0.5 hover:bg-slate-200 rounded text-slate-550 transition-colors"
                title="Create Document"
              >
                <Plus className="h-3 w-3 text-blue-600" />
              </button>
              <button
                onClick={() => handleRenameFolder(node)}
                className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                title="Rename Folder"
              >
                <Edit className="h-2.5 w-2.5 text-slate-500" />
              </button>
              <button
                onClick={() => handleDeleteFolder(node.id)}
                className="p-0.5 hover:bg-slate-200 rounded text-red-500 transition-colors"
                title="Delete Folder"
              >
                <Trash2 className="h-2.5 w-2.5 text-red-600" />
              </button>
            </div>
          </div>

          {/* Children: Subfolders and Files */}
          {isExpanded && (
            <div className="space-y-0.5 border-l border-slate-200/50 ml-3 pl-1.5 transition-all duration-250 ease-in-out">
              {/* Recursive sub_folders */}
              {node.sub_folders && node.sub_folders.length > 0 && renderSidebarTree(node.sub_folders, depth + 1)}
              
              {/* Files nested inside folder */}
              {node.documents && node.documents.map((doc: any) => {
                const isActive = location.search.includes(`open=${doc.id}`);
                return (
                  <div
                    key={doc.id}
                    style={{ paddingLeft: `${14 + depth * 14}px` }}
                    className={`group flex items-center justify-between py-1 px-2 rounded-lg transition-all border-l-2 min-w-0 ${
                      isActive 
                        ? 'bg-blue-50/90 text-blue-600 border-blue-600 shadow-sm font-extrabold' 
                        : 'text-slate-500 hover:bg-slate-55/70 hover:text-slate-850 border-l-2 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <Link
                      to={`/documents?open=${doc.id}`}
                      title={doc.name}
                      className="flex items-center gap-1.5 min-w-0 flex-1 truncate pr-1"
                    >
                      <FileText className={`h-3 w-3 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="truncate block min-w-0 flex-1">{doc.name}</span>
                    </Link>

                    {/* Document Actions hover panel */}
                    <div 
                      className="hidden group-hover:flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleRenameDocument(doc)}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-550 transition-colors"
                        title="Rename Document"
                      >
                        <Edit className="h-2.5 w-2.5 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-0.5 hover:bg-slate-200 rounded text-red-500 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="h-2.5 w-2.5 text-red-650" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  const selectedDocId = new URLSearchParams(location.search).get('open');
  const { data: selectedDoc, isLoading: docLoading } = useQuery({
    queryKey: ['document', selectedDocId],
    queryFn: () => selectedDocId ? api.documents.get(selectedDocId) : null,
    enabled: !!selectedDocId
  });

  const isEditingDocument = location.pathname.startsWith('/documents') && selectedDocId && !docLoading && selectedDoc;

  if (isEditingDocument) {
    return (
      <div className="h-screen w-screen bg-slate-50 overflow-hidden font-sans">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans relative">
      
      {/* 1. Sidebar Nav (280px width or 68px collapsed) */}
      <aside className={`${isSidebarCollapsed ? 'w-[68px]' : 'w-[280px]'} border-r border-slate-200 bg-white flex flex-col shrink-0 relative z-20 shadow-sm transition-all duration-300`}>
        {/* Brand / Logo */}
        <div className={`h-16 flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center px-2' : 'px-6'} border-b border-slate-200 shrink-0 bg-slate-900 text-white`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black shadow-md shrink-0">
            <FileText className="h-4.5 w-4.5" />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight block">Fast Trade DMS</span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block -mt-0.5">Enterprise KMS</span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'} py-5 space-y-1.5 bg-white overflow-y-auto custom-scrollbar`}>
          
          {/* Dashboard Link */}
          <Link
            to="/"
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'} py-2.5 text-xs font-bold rounded-xl transition-all relative ${
              location.pathname === '/'
                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
            }`}
            title="Dashboard"
          >
            <LayoutDashboard className={`h-4.5 w-4.5 shrink-0 ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-400'}`} />
            {!isSidebarCollapsed && <span>Dashboard</span>}
            {location.pathname === '/' && !isSidebarCollapsed && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-sm" />
            )}
          </Link>

          {/* Expandable Document Workspace Menu Link */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setWorkspaceExpanded(!workspaceExpanded);
                if (location.pathname !== '/documents') {
                  navigate('/documents');
                }
              }}
              title="Document Workspace"
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} py-2.5 text-xs font-bold rounded-xl transition-all relative ${
                location.pathname === '/documents'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
              }`}
            >
              <span className={`flex items-center ${isSidebarCollapsed ? '' : 'gap-3'} min-w-0`}>
                <FolderTree className={`h-4.5 w-4.5 shrink-0 ${location.pathname === '/documents' ? 'text-blue-600' : 'text-slate-400'}`} />
                {!isSidebarCollapsed && <span>Document Workspace</span>}
              </span>
              {!isSidebarCollapsed && <ChevronDown className={`h-3.5 w-3.5 text-slate-450 transition-transform ${workspaceExpanded ? 'rotate-180' : ''}`} />}
            </button>

            {/* Document Tree Hierarchy underneath */}
            {workspaceExpanded && !isSidebarCollapsed && folderTree && folderTree.length > 0 && (
              <div className="pl-1 pr-0.5 py-1 space-y-0.5 border-l border-slate-100 ml-5 animate-in fade-in duration-200">
                {renderSidebarTree(folderTree)}
              </div>
            )}
            {workspaceExpanded && !isSidebarCollapsed && (!folderTree || folderTree.length === 0) && (
              <span className="text-[10px] text-slate-400 italic block pl-8 select-none py-1">No folders seeded</span>
            )}
          </div>

          {/* User Directory Link (Admins only) */}
          {isAdmin && (
            <Link
              to="/users"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'} py-2.5 text-xs font-bold rounded-xl transition-all relative ${
                location.pathname === '/users'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
              }`}
              title="User Directory"
            >
              <Users className={`h-4.5 w-4.5 shrink-0 ${location.pathname === '/users' ? 'text-blue-600' : 'text-slate-400'}`} />
              {!isSidebarCollapsed && <span>User Directory</span>}
              {location.pathname === '/users' && !isSidebarCollapsed && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-sm" />
              )}
            </Link>
          )}

          {/* Approval Dashboard Link (Admins & Managers) */}
          {canApprove && (
            <Link
              to="/approval"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'} py-2.5 text-xs font-bold rounded-xl transition-all relative ${
                location.pathname === '/approval'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
              }`}
              title="Approval Dashboard"
            >
              <Activity className={`h-4.5 w-4.5 shrink-0 ${location.pathname === '/approval' ? 'text-blue-600' : 'text-slate-400'}`} />
              {!isSidebarCollapsed && <span>Approval Dashboard</span>}
              {location.pathname === '/approval' && !isSidebarCollapsed && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-sm" />
              )}
            </Link>
          )}

        </nav>

        {/* User profile footer */}
        <div className={`border-t border-slate-200 ${isSidebarCollapsed ? 'p-2 justify-center' : 'p-4 justify-between'} shrink-0 bg-slate-50 flex items-center gap-3 relative`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-slate-250 border border-slate-350 flex items-center justify-center text-slate-750 shrink-0 font-extrabold text-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800 leading-none">{user?.full_name}</p>
                <span className="truncate text-[9px] font-bold text-slate-400 block uppercase tracking-wider mt-1">{user?.department?.name || 'KMS Operator'}</span>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* 2. Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 relative z-30 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
          {/* Logo & Section indicators */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-150 px-3 py-0.5 text-[9px] font-bold text-blue-700 uppercase tracking-wider select-none">
              <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
              {user?.role?.name?.replace('_', ' ') || 'employee'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <Layers className="h-3 w-3 text-slate-400" />
              RAG Vector Engine: Active
            </span>
          </div>

          {/* Quick Header Search input */}
          <div className="w-80 relative select-none">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search active repository..."
              onClick={() => navigate('/documents')}
              readOnly
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-100 transition-all"
            />
          </div>

          {/* Actions & telemetry dropdowns */}
          <div className="flex items-center gap-4">
            
            {/* Recent Documents Quick Access */}
            <div className="relative">
              <button
                onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors p-2 text-xs font-bold select-none"
              >
                <Clock className="h-4.5 w-4.5" />
                <span>Recent</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showRecentDropdown && metrics?.recent_uploads && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-slate-100 select-none">
                    Recently Ingested
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {metrics.recent_uploads.map((doc: any) => (
                      <Link
                        key={doc.id}
                        to={`/documents?open=${doc.id}`}
                        onClick={() => setShowRecentDropdown(false)}
                        className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-600 truncate transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-semibold">{doc.name}</span>
                      </Link>
                    ))}
                    {metrics.recent_uploads.length === 0 && (
                      <div className="px-4 py-3 text-slate-400 text-center italic select-none">No recent files.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notification triggers */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-all relative"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-slate-100 select-none">
                    Security Center
                  </div>
                  <div className="divide-y divide-slate-50">
                    {notifications.map((n) => (
                      <div key={n.id} className="px-3.5 py-2.5 hover:bg-slate-50/50">
                        <p className="text-slate-700 font-semibold leading-normal">{n.text}</p>
                        <span className="text-[9px] text-slate-400 block mt-1 select-none">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Account menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-1.5 hover:opacity-85 transition-opacity"
              >
                <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-600 font-extrabold text-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 text-xs text-left animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100 select-none">
                    <p className="font-extrabold text-slate-800 truncate">{user?.full_name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2.5 text-red-650 hover:bg-red-50 hover:text-red-700 font-extrabold flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Render Container */}
        <div className="flex-1 overflow-auto bg-slate-100/50 p-8 relative">
          <Outlet />
          <FloatingAIChat />
        </div>

      </div>
    </div>
  );
}
