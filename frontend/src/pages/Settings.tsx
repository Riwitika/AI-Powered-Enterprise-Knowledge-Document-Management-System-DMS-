import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  User, 
  Bell, 
  Shield, 
  Settings as SettingsIcon,
  HelpCircle,
  Building2, 
  Sparkles, 
  Database, 
  History, 
  Upload,
  Globe,
  Calendar,
  Sun,
  LayoutGrid,
  Trash2,
  Lock,
  ArrowRight,
  ExternalLink,
  Laptop,
  Smartphone,
  Info
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
  const displayRole = isAdmin ? 'Administrator' : 'Employee';

  const [activeTab, setActiveTab] = useState('profile');

  // Listen to Quick Links navigation events from sidebar
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('change-settings-tab', handleTabChange);
    return () => window.removeEventListener('change-settings-tab', handleTabChange);
  }, []);

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || 'Arnim Goyal');
  const [email, setEmail] = useState(user?.email || 'arnim.goyal@ftt.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [jobTitle, setJobTitle] = useState(displayRole);
  const [dept, setDept] = useState('Information Technology');

  // Toggle Switches
  const [themeMode, setThemeMode] = useState<'light' | 'system'>('light');
  const [twoFactor, setTwoFactor] = useState(true);

  // Horizontal Tab Items
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: LayoutGrid },
    { id: 'system', label: 'System', icon: SettingsIcon },
    { id: 'billing', label: 'Billing', icon: Info }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-800 pb-12 select-none">
      
      {/* 1. TOP HEADER SECTION */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-[11px] font-semibold">Manage your account, preferences and system configurations</p>
      </div>

      {/* 2. HORIZONTAL NAVIGATION TAB BAR */}
      <div className="border-b border-slate-200 bg-white rounded-xl p-2 shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-50/70 text-blue-600 border border-blue-100' 
                  : 'text-slate-550 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <IconComp className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TWO-COLUMN CONTENT GRID */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT WIDE COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Information details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
              <h2 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">Profile Information</h2>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Photo uploader */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                    <img 
                      src={user?.full_name?.includes('Arnim') ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => alert('Photo upload clicked')}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-[10.5px] font-extrabold text-slate-700 bg-white rounded-lg transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Change Photo</span>
                  </button>
                  <span className="text-[9.5px] text-slate-400 font-bold">JPG, PNG or GIF. Max 2MB.</span>
                </div>

                {/* Form fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-750 w-full">
                  <div className="space-y-1.5">
                    <label className="text-slate-450 block text-[10.5px]">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-450 block text-[10.5px]">Work Email</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-455 block text-[10.5px]">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-455 block text-[10.5px]">Job Title</label>
                    <input 
                      type="text" 
                      value={jobTitle} 
                      onChange={(e) => setJobTitle(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" 
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-slate-455 block text-[10.5px]">Department</label>
                    <select 
                      value={dept} 
                      onChange={(e) => setDept(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold cursor-pointer"
                    >
                      <option>Information Technology</option>
                      <option>Finance</option>
                      <option>Sales & Marketing</option>
                      <option>Human Resources</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 select-none">
                <button 
                  type="button" 
                  onClick={() => alert('Profile changes discarded')} 
                  className="px-4 py-2 border border-transparent hover:bg-slate-50 text-xs font-bold text-slate-550 rounded-lg transition-colors"
                >
                  Discard Changes
                </button>
                <button 
                  type="button" 
                  onClick={() => alert('Profile successfully saved (Mock)')} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Preferences configurations card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">Preferences</h2>

              <div className="space-y-4 text-xs font-semibold text-slate-700 select-none">
                {/* Row 1: Language */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-slate-800 font-extrabold block">Language</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Select your preferred language.</span>
                  </div>
                  <select className="bg-white border border-slate-200 hover:border-slate-350 rounded-xl px-3.5 py-1.8 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer w-full sm:w-48 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <option>English (US)</option>
                    <option>English (IN)</option>
                    <option>Spanish</option>
                  </select>
                </div>

                {/* Row 2: Date Format */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-slate-800 font-extrabold block">Date Format</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Choose how dates are displayed.</span>
                  </div>
                  <select className="bg-white border border-slate-200 hover:border-slate-350 rounded-xl px-3.5 py-1.8 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer w-full sm:w-48 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <option>DD MMM YYYY</option>
                    <option>YYYY-MM-DD</option>
                    <option>MM/DD/YYYY</option>
                  </select>
                </div>

                {/* Row 3: Time Zone */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-slate-800 font-extrabold block">Time Zone</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Select your current time zone.</span>
                  </div>
                  <select className="bg-white border border-slate-200 hover:border-slate-350 rounded-xl px-3.5 py-1.8 text-xs text-slate-750 font-bold focus:outline-none cursor-pointer w-full sm:w-60 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <option>(GMT+05:30) Asia/Kolkata</option>
                    <option>(GMT-05:00) America/New_York</option>
                    <option>(GMT+00:00) Europe/London</option>
                  </select>
                </div>

                {/* Row 4: Theme Mode */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-slate-800 font-extrabold block">Theme</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Choose your preferred theme.</span>
                  </div>
                  <div className="flex items-center gap-4.5 select-none font-bold text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="themeRadio" 
                        checked={themeMode === 'light'} 
                        onChange={() => setThemeMode('light')} 
                        className="h-3.5 w-3.5 border-slate-300 text-blue-600 focus:ring-blue-600/20" 
                      />
                      <span>Light</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="themeRadio" 
                        checked={themeMode === 'system'} 
                        onChange={() => setThemeMode('system')} 
                        className="h-3.5 w-3.5 border-slate-300 text-blue-600 focus:ring-blue-600/20" 
                      />
                      <span>System</span>
                    </label>
                  </div>
                </div>

                {/* Row 5: Items per page */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-slate-800 font-extrabold block">Items per page</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Set default number of items in tables.</span>
                  </div>
                  <select className="bg-white border border-slate-200 hover:border-slate-350 rounded-xl px-3.5 py-1.8 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer w-full sm:w-48 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Danger Zone card */}
            <div className="bg-red-50/20 border border-red-200/80 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-none">
              <div>
                <span className="text-xs font-extrabold text-red-600 block">Danger Zone</span>
                <span className="text-[10px] text-slate-455 font-bold block mt-1 leading-normal">Irreversible and destructive actions for your account.</span>
              </div>
              
              <button 
                type="button" 
                onClick={() => {
                  if (confirm('Are you absolutely sure you want to delete your work profile? This cannot be undone.')) {
                    alert('Profile deletion bypass requested (Mock)');
                  }
                }}
                className="px-4 py-2 border border-red-200 text-red-650 hover:bg-red-50 text-xs font-extrabold rounded-xl transition-all bg-white flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete Account</span>
              </button>
            </div>

          </div>

          {/* RIGHT NARROW COLUMN */}
          <div className="space-y-6">
            
            {/* Account Overview widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <span className="font-extrabold text-xs text-slate-900 block border-b border-slate-100 pb-2.5">Account Overview</span>
              
              <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Role</span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-150">{displayRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Member Since</span>
                  <span className="text-slate-800 font-extrabold">12 Jan 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455">Last Login</span>
                  <span className="text-slate-800 font-extrabold">19 May 2024, 10:30 AM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-455">Account Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-800 font-extrabold">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Summary widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <span className="font-extrabold text-xs text-slate-900 block border-b border-slate-100 pb-2.5">Security Summary</span>
              
              <div className="p-3 bg-blue-50/40 border border-blue-150/60 rounded-xl flex gap-3 select-none shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                <div className="w-8 h-8 rounded-full bg-white border border-blue-150 flex items-center justify-center shrink-0 text-blue-600 shadow-sm mt-0.5">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10.5px] font-extrabold text-slate-900 block leading-tight">Your account is secure</span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5 leading-none">No security issues found</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-700 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-450">Two-factor authentication</span>
                  <span className="text-emerald-600 font-extrabold">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Password</span>
                  <span className="text-emerald-600 font-extrabold">Strong</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455">Active sessions</span>
                  <span className="text-slate-500 font-extrabold">3</span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setActiveTab('security')}
                className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 w-full"
              >
                <span>Manage Security</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Recent Activity Timeline widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="font-extrabold text-xs text-slate-900">Recent Activity</span>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('system')}
                  className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold uppercase tracking-wider"
                >
                  View all
                </button>
              </div>

              <div className="space-y-4 relative pl-3.5 border-l border-slate-200 mt-2 py-0.5">
                {[
                  { title: 'Signed in from Chrome on Windows', time: '19 May 2024, 10:30 AM', badge: 'New', color: 'bg-emerald-500' },
                  { title: 'Uploaded Q2 Budget Report.docx', time: '19 May 2024, 10:28 AM', color: 'bg-blue-500' },
                  { title: 'Shared Sales Report - April.xlsx', time: '19 May 2024, 09:45 AM', color: 'bg-orange-500' },
                  { title: 'Password changed successfully', time: '18 May 2024, 04:20 PM', color: 'bg-purple-500' }
                ].map((item, idx) => (
                  <div key={idx} className="relative text-xs font-semibold leading-relaxed">
                    <div className="absolute -left-[20.5px] top-1 h-2.5 w-2.5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0">
                      <span className={`h-1 w-1 rounded-full ${item.color}`} />
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 items-baseline">
                      <span className="text-slate-800 font-extrabold leading-tight">{item.title}</span>
                      {item.badge && (
                        <span className="px-1 py-0.1 rounded text-[7.5px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-150 leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-slate-400 block mt-0.5 select-none font-bold leading-none">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* PLACHOLDER PANELS FOR OTHER TABS */}
      {activeTab === 'notifications' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center py-24 select-none">
          <Bell className="w-10 h-10 text-slate-400 mx-auto animate-pulse mb-3" />
          <h2 className="text-base font-extrabold text-slate-800">Notification Preferences Center</h2>
          <p className="text-xs text-slate-455 font-semibold mt-1">Configure real-time approval digests, email reports, security pushes, and workspace activities alerts.</p>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center py-24 select-none">
          <Shield className="w-10 h-10 text-slate-400 mx-auto animate-pulse mb-3" />
          <h2 className="text-base font-extrabold text-slate-800">Security & Sign-ins Center</h2>
          <p className="text-xs text-slate-455 font-semibold mt-1">Verify two-factor parameters, configure password credentials, and revoke active login tokens.</p>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center py-24 select-none">
          <LayoutGrid className="w-10 h-10 text-slate-400 mx-auto animate-pulse mb-3" />
          <h2 className="text-base font-extrabold text-slate-800">Workspace Integrations</h2>
          <p className="text-xs text-slate-455 font-semibold mt-1">Connect corporate directories (Google Workspace, Slack, Microsoft 365, Atlassian, Jira) to index metadata.</p>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center py-24 select-none">
          <SettingsIcon className="w-10 h-10 text-slate-400 mx-auto animate-pulse mb-3" />
          <h2 className="text-base font-extrabold text-slate-800">System Logs & Storage Center</h2>
          <p className="text-xs text-slate-455 font-semibold mt-1">Monitor server storage distributions, inspect company audits timeline, and clear indexing cache database files.</p>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center py-24 select-none">
          <Info className="w-10 h-10 text-slate-400 mx-auto animate-pulse mb-3" />
          <h2 className="text-base font-extrabold text-slate-800">Billing & Licenses Center</h2>
          <p className="text-xs text-slate-455 font-semibold mt-1">View corporate DMS terms of service, active license keys validation, and app version specifications.</p>
        </div>
      )}

    </div>
  );
}
