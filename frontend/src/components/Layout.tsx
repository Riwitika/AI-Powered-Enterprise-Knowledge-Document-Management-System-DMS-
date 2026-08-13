import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import FloatingAIChat from './FloatingAIChat';

import {
  LayoutDashboard,
  Folder,
  Settings,
  Users,
  LogOut,
  Search,
  Bell,
  HelpCircle,
  Cloud,
  ChevronDown,
  User,
  Shield,
  History,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'folder' | 'file';
    target: any;
  } | null>(null);

  // Close context menu on any click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleExplorerAction = (action: string, target: any) => {
    setContextMenu(null);
    const event = new CustomEvent('kms-explorer-action', {
      detail: {
        action,
        folderId: contextMenu?.type === 'folder' ? target.id : undefined,
        fileId: contextMenu?.type === 'file' ? target.id : undefined,
        target
      }
    });
    window.dispatchEvent(event);
  };
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [docsNavExpanded, setDocsNavExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<string | number, boolean>>({});

  // Query folder tree & documents list for sidebar hierarchy
  const { data: rawTreeData } = useQuery({
    queryKey: ['folders-tree'],
    queryFn: api.folders.tree,
    enabled: !!user,
  });

  const { data: allDocs } = useQuery({
    queryKey: ['documents-list-workspace'],
    queryFn: api.documents.list,
    enabled: !!user,
  });

  const toggleFolderExpand = (id: string | number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getFolderFiles = (folderId: string | number) => {
    return allDocs ? allDocs.filter((d: any) => String(d.folder_id) === String(folderId) && d.status !== 'archived') : [];
  };

  const renderSidebarTree = (folders: any[], level = 0): React.ReactNode => {
    if (!folders || folders.length === 0) return null;
    return (
      <div className="space-y-0.5 select-none">
        {folders.map((folder: any) => {
          const isExpanded = !!expandedFolders[folder.id];
          const folderFiles = getFolderFiles(folder.id);
          const subFolders = folder.sub_folders || [];
          const hasChildren = subFolders.length > 0 || folderFiles.length > 0;

          return (
            <div key={folder.id} className="flex flex-col">
              <div
                onClick={() => navigate(`/documents?folder_id=${folder.id}`)}
                className="group/srow flex items-center gap-1.5 py-1 px-1.5 text-[11px] font-bold rounded-md text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
                style={{ paddingLeft: `${8 + level * 10}px` }}
              >
                <button
                  type="button"
                  onClick={(e) => hasChildren && toggleFolderExpand(folder.id, e)}
                  className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-slate-400 hover:text-slate-600"
                >
                  {hasChildren ? (
                    isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                  ) : null}
                </button>
                <Folder className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate flex-1 min-w-0">{folder.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      type: 'folder',
                      target: { id: String(folder.id), name: folder.name }
                    });
                  }}
                  className="opacity-0 group-hover/srow:opacity-100 p-0.5 hover:bg-slate-200 rounded shrink-0 text-slate-400 hover:text-slate-700"
                  title="Options"
                >
                  •••
                </button>
              </div>

              {isExpanded && (
                <div className="flex flex-col">
                  {subFolders.length > 0 && renderSidebarTree(subFolders, level + 1)}
                  {folderFiles.map((file: any) => (
                    <div
                      key={file.id}
                      onClick={() => navigate(`/documents/${file.id}`)}
                      className="group/sfile flex items-center gap-1.5 py-1 px-1.5 text-[11px] font-medium rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
                      style={{ paddingLeft: `${18 + level * 10}px` }}
                    >
                      <span className="text-[10px] shrink-0">📄</span>
                      <span className="truncate flex-1 min-w-0">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            type: 'file',
                            target: { id: String(file.id), name: file.name }
                          });
                        }}
                        className="opacity-0 group-hover/sfile:opacity-100 p-0.5 hover:bg-slate-200 rounded shrink-0 text-slate-400 hover:text-slate-700"
                        title="Options"
                      >
                        •••
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Load real notifications from backend
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.list,
    staleTime: 30_000,
    enabled: !!user,
    refetchInterval: 60_000, // Auto-refresh every 60s
  });
  const notifications: any[] = notificationsData || [];

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);


  // Notification mutations
  const readAllMutation = useMutation({
    mutationFn: api.notifications.readAll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const clearAllMutation = useMutation({
    mutationFn: api.notifications.clearAll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readOneMutation = useMutation({
    mutationFn: (id: number) => api.notifications.read(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close menus on page navigation
  useEffect(() => {
    setShowProfileDropdown(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // Click outside, Escape, and custom overlay close triggers
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowProfileDropdown(false);
        setShowNotifications(false);
      }
    }
    const handleCloseAll = () => {
      setShowProfileDropdown(false);
      setShowNotifications(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('kms-close-layout-dropdowns', handleCloseAll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kms-close-layout-dropdowns', handleCloseAll);
    };
  }, []);

  // Keyboard shortcut Ctrl+K / ⌘K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role?.name === 'super_admin' || user?.role?.name === 'admin';

  const getDisplayRole = (role?: string) => {
    if (!role) return 'Employee';
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Administrator';
      case 'manager':
      case 'department_manager':
        return 'Manager';
      case 'employee':
        return 'Employee';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getAvatarUrl = (name?: string) => {
    if (!name) return undefined;
    if (name.includes('Arnim')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
    if (name.includes('Arun')) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150';
    if (name.includes('Riwitika')) return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150';
    if (name.includes('Paras')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
    if (name.includes('Yukti')) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';
    if (name.includes('Uttam')) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150';
    return undefined;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unreadNotifsCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans relative select-none">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-[240px] border-r border-slate-200 bg-white flex flex-col shrink-0 relative z-35 transition-all duration-300">
        
        {/* Brand Ftt Logo Section - Height aligned with top navbar header (56px) and logo reduced another 20-25% */}
        <div className="h-[56px] flex items-center gap-2.5 px-4.5 border-b border-slate-100 shrink-0 bg-white">
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="white" stroke="#E2E8F0" strokeWidth="3" />
            <path d="M68 28 L82 32 L72 44 L68 28 Z" fill="#DC2626" />
            <text x="22" y="66" fill="#1E40AF" fontSize="38" fontWeight="900" fontFamily="sans-serif" letterSpacing="-3">F</text>
            <text x="44" y="66" fill="#2563EB" fontSize="35" fontWeight="800" fontFamily="sans-serif" letterSpacing="-2">t</text>
            <text x="60" y="66" fill="#3B82F6" fontSize="35" fontWeight="800" fontFamily="sans-serif" letterSpacing="-2">t</text>
          </svg>
          <div className="min-w-0 leading-none">
            <span className="font-bold text-slate-800 text-[13px] tracking-tight block">Fast Trade</span>
            <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider block mt-0.5 truncate">Technologies</span>
          </div>
        </div>

        {/* Sidebar Nav Links - Slimmer padding, text slightly smaller */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 bg-white overflow-y-auto">
          {/* Dashboard */}
          <Link
            to="/"
            className={`flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors relative ${
              location.pathname === '/'
                ? 'bg-blue-50/50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 shrink-0 ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Dashboard</span>
            {location.pathname === '/' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600" />
            )}
          </Link>

          {/* Documents */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                if (!location.pathname.startsWith('/documents')) {
                  navigate('/documents');
                }
                setDocsNavExpanded(!docsNavExpanded);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors relative ${
                location.pathname.startsWith('/documents')
                  ? 'bg-blue-50/50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Folder className={`h-4 w-4 shrink-0 ${location.pathname.startsWith('/documents') ? 'text-blue-600' : 'text-slate-550'}`} />
              <span className="flex-1 text-left">Documents</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${docsNavExpanded ? 'rotate-180' : ''}`} />
            </button>

            {docsNavExpanded && (
              <div className="pl-3.5 pr-1 py-1 space-y-1 text-[11px] font-semibold border-l border-slate-200 ml-4.5 mt-0.5 max-h-[350px] overflow-y-auto custom-scrollbar">
                {/* Workspace Root */}
                <div
                  onClick={() => navigate('/documents')}
                  className="group/srow flex items-center gap-1.5 py-1 px-1.5 text-[11px] font-extrabold rounded-md text-slate-800 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  <Folder className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate flex-1 min-w-0">Workspace Root</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        type: 'folder',
                        target: { id: '0', name: 'Workspace Root', isRoot: true }
                      });
                    }}
                    className="opacity-0 group-hover/srow:opacity-100 p-0.5 hover:bg-slate-200 rounded shrink-0 text-slate-400 hover:text-slate-700"
                    title="Options"
                  >
                    •••
                  </button>
                </div>

                {/* Folder/Document Hierarchy Tree */}
                {renderSidebarTree(
                  (rawTreeData || []).flatMap((node: any) =>
                    node.name === 'Workspace Root' || String(node.id) === '0' || String(node.id) === 'root'
                      ? (node.sub_folders || [])
                      : node
                  )
                )}
              </div>
            )}
          </div>

          {/* Users */}
          {isAdmin && (
            <Link
              to="/users"
              className={`flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors relative ${
                location.pathname.startsWith('/users')
                  ? 'bg-blue-50/50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className={`h-4 w-4 shrink-0 ${location.pathname.startsWith('/users') ? 'text-blue-600' : 'text-slate-550'}`} />
              <span>Users</span>
              {location.pathname.startsWith('/users') && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          )}

          {/* Settings */}
          <div className="space-y-0.5">
            <Link
              to="/settings"
              className={`flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors relative ${
                location.pathname.startsWith('/settings')
                  ? 'bg-blue-50/50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className={`h-4 w-4 shrink-0 ${location.pathname.startsWith('/settings') ? 'text-blue-600' : 'text-slate-555'}`} />
              <span>Settings</span>
              {location.pathname.startsWith('/settings') && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </Link>

            {location.pathname.startsWith('/settings') && (
              <div className="pl-6.5 pr-2 py-1.5 space-y-2 border-l border-slate-150 ml-5 mt-0.5">
                {[
                  { label: 'Profile', icon: User, tab: 'profile' },
                  { label: 'Notifications', icon: Bell, tab: 'notifications' },
                  { label: 'Security', icon: Shield, tab: 'security' },
                  { label: 'Integrations', icon: LayoutGrid, tab: 'integrations' },
                  { label: 'Audit Logs', icon: History, tab: 'system' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const event = new CustomEvent('change-settings-tab', { detail: item.tab });
                      window.dispatchEvent(event);
                    }}
                    className="w-full text-left flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Storage Widget */}
        <div className="px-3 mb-3 mt-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-700 font-semibold">
              <span>Storage Used</span>
              <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
            
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              2.45 GB <span className="text-slate-400 font-normal">of 10 GB</span>
            </div>
            
            <div className="h-1 bg-slate-200 rounded-full mt-2 overflow-hidden w-full">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '24.5%' }} />
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* TOP NAVBAR CONTAINER - REDESIGNED: height 56px, premium integrated style, vertically aligned */}
        <header className="h-[56px] border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 relative z-20">
            
            {/* Company Context Indicator */}
            <div className="flex items-center gap-2 select-none">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                FAST TRADE KMS
              </span>
            </div>

            {/* Search bar - integrated, cleaner border, 460px width */}
            <form onSubmit={handleSearchSubmit} className="w-[460px] relative select-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents, folders, people..."
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-14 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200 transition-all placeholder-slate-400 font-medium"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 border border-slate-205 rounded text-[8px] text-slate-400 font-bold font-mono bg-white select-none pointer-events-none">
                ⌘K
              </div>
            </form>

            {/* Actions & Profile grouped together with tighter spacing */}
            <div className="flex items-center gap-1.5">
              
              {/* Help circle icon */}
              <button 
                type="button"
                onClick={() => alert('Fast Trade DMS Knowledge Portal: For support contact corporate IT.')}
                className="p-1.5 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all border border-transparent"
                title="Help & Support"
              >
                <HelpCircle className="w-4.5 h-4.5 text-slate-500" />
              </button>

              {/* Notification triggers */}
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                    setShowProfileDropdown(false);
                  }}
                  className="p-1.5 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all relative flex items-center justify-center border border-transparent"
                  title="Notifications"
                >
                  <Bell className="h-4.5 w-4.5 text-slate-500" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-[8px] font-black h-3.5 w-3.5 flex items-center justify-center shadow-sm">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between select-none">
                      <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-slate-400">Notifications</span>
                      {notifications.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => readAllMutation.mutate()}
                            className="text-[9.5px] text-slate-500 hover:text-slate-700 font-extrabold"
                          >
                            Mark all read
                          </button>
                          <span className="text-slate-200">|</span>
                          <button
                            type="button"
                            onClick={() => clearAllMutation.mutate()}
                            className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold"
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 font-medium text-[11px]">
                          No new notifications.
                        </div>
                      ) : (
                        notifications.map((notif: any) => (
                          <div
                            key={notif.id}
                            onClick={() => !notif.read && readOneMutation.mutate(notif.id)}
                            className={`px-3.5 py-2.5 hover:bg-slate-50/50 flex gap-2.5 items-start cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-700 font-semibold leading-normal">{notif.title || notif.text}</p>
                              {notif.message && notif.message !== notif.title && (
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{notif.message}</p>
                              )}
                              <span className="text-[9px] text-slate-400 block mt-0.5">
                                {notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : notif.time}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Profile section - avatar at exactly 36px (h-9 w-9) */}
              <div className="relative border-l border-slate-200 pl-2.5 flex items-center" ref={profileRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileDropdown(!showProfileDropdown);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 py-0.5 px-1 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-all select-none group"
                >
                  <div className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-[10px] overflow-hidden shrink-0 shadow-sm">
                    {getAvatarUrl(user?.full_name) ? (
                      <img src={getAvatarUrl(user?.full_name)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user?.full_name)
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[11.5px] font-bold text-slate-800 leading-tight group-hover:text-slate-950 transition-colors">
                      {user?.full_name || 'Riwitika Gupta'}
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5 leading-none">
                      {getDisplayRole(user?.role?.name)}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-25 text-xs text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-2 border-b border-slate-100 select-none">
                      <p className="font-extrabold text-slate-800 truncate">{user?.full_name || 'Riwitika Gupta'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user?.email || 'riwitika@efasttrade.com'}</p>
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

        {/* Page Render Container - padding standard 24px (p-6) */}
        <div className={`flex-1 relative bg-slate-50 ${location.pathname.startsWith('/documents') ? 'p-0 overflow-hidden min-w-0' : 'p-6 overflow-auto'}`}>
          <Outlet />
          <FloatingAIChat />
        </div>

        {/* Custom Context Menu */}
        {contextMenu && (
          <div 
            className="fixed bg-white border border-slate-200 shadow-xl rounded-xl py-1 z-[9999] text-xs font-semibold text-slate-700 min-w-[170px] select-none pointer-events-auto"
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'folder' ? (
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleExplorerAction('new_folder', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  📁 Add Folder
                </button>
                <button
                  type="button"
                  onClick={() => handleExplorerAction('upload_file', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  📄 Add File / Upload
                </button>
                {!contextMenu.target?.isRoot && (
                  <>
                    <div className="h-[1px] bg-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={() => handleExplorerAction('rename_folder', contextMenu.target)}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                    >
                      ✏️ Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExplorerAction('permissions', contextMenu.target)}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                    >
                      🔒 Permissions
                    </button>
                    <div className="h-[1px] bg-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={() => handleExplorerAction('delete_folder', contextMenu.target)}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-600 hover:text-rose-700"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleExplorerAction('open_file', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  👁️ Open
                </button>
                <button
                  type="button"
                  onClick={() => handleExplorerAction('rename_file', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  ✏️ Rename
                </button>
                <button
                  type="button"
                  onClick={() => handleExplorerAction('favorite_file', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  ⭐ Favorite / Star
                </button>
                <button
                  type="button"
                  onClick={() => handleExplorerAction('download_file', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  ⬇️ Download
                </button>
                <button
                  type="button"
                  onClick={() => handleExplorerAction('move_file', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  📦 Move
                </button>
                <button
                  type="button"
                  onClick={() => handleExplorerAction('share_file', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  🔗 Share
                </button>
                <button
                  type="button"
                  onClick={() => handleExplorerAction('version_history', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  ⏳ Version History
                </button>
                <button
                  type="button"
                  onClick={() => handleExplorerAction('save_as_template', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  💾 Save as Template
                </button>
                <div className="h-[1px] bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => handleExplorerAction('delete_file', contextMenu.target)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-600 hover:text-rose-700"
                >
                  🗑️ Move to Recycle Bin
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
