import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard,
  FolderTree,
  MessageSquare,
  Search,
  ShieldCheck,
  Users,
  LogOut,
  FileText,
  User,
  Activity,
  Layers
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role?.name === 'super_admin' || user?.role?.name === 'admin';

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Document Tree', path: '/documents', icon: FolderTree },
    { name: 'AI Assistant', path: '/chat', icon: MessageSquare },
    { name: 'Knowledge Search', path: '/search', icon: Search },
    { name: 'Sharing Rules', path: '/permissions', icon: ShieldCheck },
  ];

  if (isAdmin) {
    menuItems.push({ name: 'User Directory', path: '/users', icon: Users });
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans relative">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 relative z-10">
        {/* Brand/Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight block">Enterprise KMS</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block -mt-0.5">Secure Document AI</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-lg transition-all relative ${isActive
                  ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
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
        <div className="border-t border-slate-200 p-4 shrink-0 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-slate-200 p-0.5 flex items-center justify-center shrink-0 text-slate-600 border border-slate-350">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800">{user?.full_name}</p>
              <span className="truncate text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{user?.department?.name || 'No Dept'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            {user?.role && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-[9px] font-bold text-blue-700 capitalize tracking-wider">
                <Activity className="h-3 w-3 text-blue-600" />
                {user.role.name.replace('_', ' ')}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-[9px] font-bold text-slate-500 tracking-wider">
              <Layers className="h-3 w-3 text-slate-400" />
              API: Mock Fallback Active
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
            Active Account: <span className="font-bold text-slate-700">{user?.email}</span>
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
