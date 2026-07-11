import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useQuery } from '@tanstack/react-query';
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
  Folder
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

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
    1: true // Auto-expand "Company Knowledge" root folder on load!
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role?.name === 'super_admin' || user?.role?.name === 'admin';

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
          {/* Folder row button */}
          <button
            onClick={(e) => toggleFolder(node.id, e)}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
            title={node.name}
            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-all text-left text-slate-600 hover:bg-slate-100/70 border-l-2 border-transparent min-w-0 ${
              isExpanded ? 'font-bold text-slate-900 bg-slate-50/40' : 'font-medium'
            }`}
          >
            <span className="flex items-center gap-1.5 min-w-0 text-[11px] flex-1">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-blue-500 shrink-0 font-bold" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0 hover:text-slate-800" />
              )}
              <Folder className={`h-3.5 w-3.5 shrink-0 ${isExpanded ? 'text-amber-500 fill-amber-500/10' : 'text-amber-600 fill-amber-600/5'}`} />
              <span className="truncate block min-w-0 flex-1">{node.name}</span>
            </span>
          </button>

          {/* Children: Subfolders and Files */}
          {isExpanded && (
            <div className="space-y-0.5 border-l border-slate-200/50 ml-3 pl-1.5 transition-all duration-250 ease-in-out">
              {/* Recursive sub_folders */}
              {node.sub_folders && node.sub_folders.length > 0 && renderSidebarTree(node.sub_folders, depth + 1)}
              
              {/* Files nested inside folder */}
              {node.documents && node.documents.map((doc: any) => {
                const isActive = location.search.includes(`open=${doc.id}`);
                return (
                  <Link
                    key={doc.id}
                    to={`/documents?open=${doc.id}`}
                    style={{ paddingLeft: `${14 + depth * 14}px` }}
                    title={doc.name}
                    className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition-all border-l-2 min-w-0 ${
                      isActive 
                        ? 'bg-blue-50/90 text-blue-600 border-blue-600 shadow-sm font-extrabold' 
                        : 'text-slate-500 hover:bg-slate-55/70 hover:text-slate-850 border-l-2 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <FileText className={`h-3 w-3 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate block min-w-0 flex-1">{doc.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans relative">
      
      {/* 1. Sidebar Nav (280px width) */}
      <aside className="w-[280px] border-r border-slate-200 bg-white flex flex-col shrink-0 relative z-20 shadow-sm">
        {/* Brand / Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 shrink-0 bg-slate-900 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black shadow-md">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="font-extrabold text-white text-sm tracking-tight block">Fast Trade DMS</span>
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block -mt-0.5">Enterprise KMS</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 bg-white overflow-y-auto custom-scrollbar">
          
          {/* Dashboard Link */}
          <Link
            to="/"
            className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all relative ${
              location.pathname === '/'
                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
            }`}
          >
            <LayoutDashboard className={`h-4.5 w-4.5 shrink-0 ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Dashboard</span>
            {location.pathname === '/' && (
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all relative ${
                location.pathname === '/documents'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <FolderTree className={`h-4.5 w-4.5 shrink-0 ${location.pathname === '/documents' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Document Workspace</span>
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-450 transition-transform ${workspaceExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Document Tree Hierarchy underneath */}
            {workspaceExpanded && folderTree && folderTree.length > 0 && (
              <div className="pl-1 pr-0.5 py-1 space-y-0.5 border-l border-slate-100 ml-5 animate-in fade-in duration-200">
                {renderSidebarTree(folderTree)}
              </div>
            )}
            {workspaceExpanded && (!folderTree || folderTree.length === 0) && (
              <span className="text-[10px] text-slate-400 italic block pl-8 select-none py-1">No folders seeded</span>
            )}
          </div>

          {/* User Directory Link (Admins only) */}
          {isAdmin && (
            <Link
              to="/users"
              className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all relative ${
                location.pathname === '/users'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
              }`}
            >
              <Users className={`h-4.5 w-4.5 shrink-0 ${location.pathname === '/users' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>User Directory</span>
              {location.pathname === '/users' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-sm" />
              )}
            </Link>
          )}

        </nav>

        {/* User profile footer */}
        <div className="border-t border-slate-200 p-4 shrink-0 bg-slate-50 flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-slate-250 border border-slate-350 flex items-center justify-center text-slate-750 shrink-0 font-extrabold text-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800 leading-none">{user?.full_name}</p>
              <span className="truncate text-[9px] font-bold text-slate-400 block uppercase tracking-wider mt-1">{user?.department?.name || 'KMS Operator'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 relative z-30 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
          {/* Logo & Section indicators */}
          <div className="flex items-center gap-4">
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
        <div className="flex-1 overflow-auto bg-slate-100/50 p-8">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
