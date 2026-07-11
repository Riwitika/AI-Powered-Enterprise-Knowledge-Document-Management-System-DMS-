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
  ChevronDown
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New document version uploaded by Riwitika", time: "5m ago" },
    { id: 2, text: "Access granted for Department SOP", time: "1h ago" }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Document Workspace', path: '/documents', icon: FolderTree },
  ];

  if (isAdmin) {
    menuItems.push({ name: 'User Directory', path: '/users', icon: Users });
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans relative">
      
      {/* 1. Sidebar Nav (20%) */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 relative z-20 shadow-sm">
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
        <nav className="flex-1 px-4 py-6 space-y-1 bg-white overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all relative ${isActive
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                  }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="border-t border-slate-200 p-4 shrink-0 bg-slate-50 flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 font-extrabold text-xs">
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-150 px-3 py-0.5 text-[9px] font-bold text-blue-700 uppercase tracking-wider">
              <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
              {user?.role?.name?.replace('_', ' ') || 'employee'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
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
                onClick={() => setShowRecentDropdown(prev => !prev)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-655 hover:text-slate-900 transition-all p-1"
                title="Recent Documents"
              >
                <Clock className="h-4 w-4 text-slate-500" />
                <span>Recent</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
              
              {showRecentDropdown && (
                <div className="absolute right-0 mt-2.5 bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 w-64 z-50 text-xs text-slate-750">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3.5 py-1.5 block border-b border-slate-100">Recently Ingested Documents</span>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {metrics?.recent_uploads && metrics.recent_uploads.length > 0 ? (
                      metrics.recent_uploads.map((doc: any) => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setShowRecentDropdown(false);
                            navigate(`/documents?open=${doc.id}`);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold truncate block"
                        >
                          {doc.name}
                        </button>
                      ))
                    ) : (
                      <span className="px-3.5 py-2 text-slate-400 italic block">No recent logs</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(prev => !prev)}
                className="relative p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-all"
                title="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 w-72 z-50 text-xs text-slate-750">
                  <div className="flex justify-between items-center px-3.5 py-1.5 border-b border-slate-100 shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Telemetry Notifications</span>
                    <button onClick={() => setNotifications([])} className="text-[9px] text-red-600 font-bold hover:underline">Clear all</button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-700">{n.text}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{n.time}</span>
                        </div>
                      ))
                    ) : (
                      <span className="px-3.5 py-3 text-slate-400 italic text-center block">No new alerts</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(prev => !prev)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-all"
              >
                <div className="h-7 w-7 rounded-full bg-blue-650 text-white flex items-center justify-center font-extrabold text-xs border border-blue-500">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <span className="text-xs font-bold text-slate-800 leading-none block">{user?.full_name}</span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider block mt-0.5">{user?.email}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 w-48 z-50 text-xs text-slate-750">
                  <div className="px-3.5 py-2 border-b border-slate-100 block">
                    <span className="font-bold text-slate-800 block">{user?.full_name}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{user?.email}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-650 hover:text-red-700 font-bold block"
                  >
                    Logout Account
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content View Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
