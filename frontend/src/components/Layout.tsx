import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
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
  ChevronDown
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Roles checking
  const isAdmin = user?.role?.name === 'super_admin' || user?.role?.name === 'admin';



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

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans relative">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-[260px] border-r border-slate-200/80 bg-white flex flex-col shrink-0 relative z-20 transition-all duration-300">
        
        {/* Brand Ftt Logo Section */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-100 shrink-0 bg-white">
          <svg className="h-8.5 w-8.5 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="white" stroke="#E2E8F0" strokeWidth="3" />
            <path d="M68 28 L82 32 L72 44 L68 28 Z" fill="#DC2626" />
            <text x="22" y="66" fill="#1E40AF" fontSize="38" fontWeight="900" fontFamily="sans-serif" letterSpacing="-3">F</text>
            <text x="44" y="66" fill="#2563EB" fontSize="35" fontWeight="800" fontFamily="sans-serif" letterSpacing="-2">t</text>
            <text x="60" y="66" fill="#3B82F6" fontSize="35" fontWeight="800" fontFamily="sans-serif" letterSpacing="-2">t</text>
          </svg>
          <div>
            <span className="font-extrabold text-slate-900 text-sm leading-tight tracking-tight block">Fast Trade</span>
            <span className="text-[9px] font-semibold text-slate-455 uppercase tracking-wider block">Technologies Pvt. Ltd.</span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 bg-white overflow-y-auto">
          {/* Dashboard */}
          <Link
            to="/"
            className={`flex items-center gap-3 px-3.5 py-2.5 text-[11.5px] font-bold rounded-xl transition-all relative ${
              location.pathname === '/'
                ? 'bg-blue-50/70 text-blue-600'
                : 'text-slate-550 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`h-4.5 w-4.5 shrink-0 ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Dashboard</span>
            {location.pathname === '/' && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600" />
            )}
          </Link>

          {/* Documents */}
          <Link
            to="/documents"
            className={`flex items-center gap-3 px-3.5 py-2.5 text-[11.5px] font-bold rounded-xl transition-all relative ${
              location.pathname.startsWith('/documents')
                ? 'bg-blue-50/70 text-blue-600'
                : 'text-slate-550 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Folder className={`h-4.5 w-4.5 shrink-0 ${location.pathname.startsWith('/documents') ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Documents</span>
            {location.pathname.startsWith('/documents') && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600" />
            )}
          </Link>

          {/* Users (Show only for Administrators as per overview) */}
          {isAdmin && (
            <Link
              to="/users"
              className={`flex items-center gap-3 px-3.5 py-2.5 text-[11.5px] font-bold rounded-xl transition-all relative ${
                location.pathname.startsWith('/users')
                  ? 'bg-blue-50/70 text-blue-600'
                  : 'text-slate-550 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className={`h-4.5 w-4.5 shrink-0 ${location.pathname.startsWith('/users') ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Users</span>
              {location.pathname.startsWith('/users') && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          )}

          {/* Settings */}
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3.5 py-2.5 text-[11.5px] font-bold rounded-xl transition-all relative ${
              location.pathname.startsWith('/settings')
                ? 'bg-blue-50/70 text-blue-600'
                : 'text-slate-550 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className={`h-4.5 w-4.5 shrink-0 ${location.pathname.startsWith('/settings') ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Settings</span>
            {location.pathname.startsWith('/settings') && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600" />
            )}
          </Link>
        </nav>

        {/* Sidebar Storage Widget (at the bottom) */}
        <div className="px-4 mb-4 mt-auto">
          <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between text-xs text-slate-800 font-bold">
              <span>Storage Used</span>
              <Cloud className="w-4 h-4 text-slate-400" />
            </div>
            
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              2.45 GB <span className="text-slate-400 font-normal">of 10 GB used</span>
            </div>
            
            {/* Progress Bar (24%) */}
            <div className="h-1.5 bg-slate-200 rounded-full mt-2.5 overflow-hidden w-full">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '24.5%' }} />
            </div>
            
            <Link
              to="/settings"
              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold mt-3 block transition-colors hover:underline"
            >
              View storage &rarr;
            </Link>
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* TOP NAVBAR CONTAINER */}
        <header className="h-16 border-b border-slate-200/80 bg-white flex items-center justify-between px-8 shrink-0 relative z-30 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
          {/* Section Indicator or Blank space */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 select-none uppercase tracking-widest">
              Fast Trade DMS
            </span>
          </div>

          {/* Search bar inside header (matching reference mockup) */}
          <form onSubmit={handleSearchSubmit} className="w-[380px] relative select-none">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents, folders, people..."
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-10 pr-16 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-600 transition-all placeholder-slate-400 font-medium"
            />
            <div className="absolute right-3 top-2 px-1.5 py-0.5 border border-slate-200 rounded text-[9px] text-slate-400 font-extrabold font-mono bg-white">
              Ctrl + K
            </div>
          </form>

          {/* Actions panel */}
          <div className="flex items-center gap-4">
            
            {/* Notification triggers */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 hover:bg-slate-105 rounded-lg text-slate-500 hover:text-slate-800 transition-all relative flex items-center justify-center border border-transparent hover:border-slate-100"
              >
                <Bell className="h-4.5 w-4.5 text-slate-600" />
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full text-[8px] font-extrabold h-4 w-4 flex items-center justify-center shadow-sm">
                  3
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-slate-100 select-none">
                    Notifications
                  </div>
                  <div className="divide-y divide-slate-50">
                    <div className="px-3.5 py-2.5 hover:bg-slate-50/50">
                      <p className="text-slate-700 font-bold leading-normal">Amit Verma shared a document</p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">5 minutes ago</span>
                    </div>
                    <div className="px-3.5 py-2.5 hover:bg-slate-50/50">
                      <p className="text-slate-700 font-bold leading-normal">Your pending task is due tomorrow</p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">1 hour ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help circle icon */}
            <button 
              type="button"
              onClick={() => alert('Fast Trade DMS Knowledge Portal: For support contact corporate IT.')}
              className="p-1.5 hover:bg-slate-105 rounded-lg text-slate-550 hover:text-slate-800 transition-all border border-transparent hover:border-slate-100"
            >
              <HelpCircle className="w-4.5 h-4.5 text-slate-600" />
            </button>

            {/* User Profile avatar dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 py-1 px-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
              >
                {/* Riwitika profile picture or mockup fallback */}
                <div className="h-7.5 w-7.5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-[10px] overflow-hidden">
                  {getInitials(user?.full_name)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">{user?.full_name || 'Riwitika Gupta'}</p>
                  <span className="text-[9px] text-slate-455 font-bold block mt-0.5">Employee</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 text-xs text-left animate-in fade-in slide-in-from-top-2 duration-150">
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

        {/* Page Render Container */}
        <div className="flex-1 relative overflow-auto bg-slate-50 p-8">
          <Outlet />
          <FloatingAIChat />
        </div>

      </div>
    </div>
  );
}
