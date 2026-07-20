import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  User, 
  Settings as SettingsIcon,
  Shield, 
  Bell, 
  Palette, 
  Building2, 
  Sparkles, 
  Database, 
  History, 
  Info,
  Laptop,
  Smartphone,
  CheckCircle,
  HelpCircle,
  KeyRound,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
  
  const [activeTab, setActiveTab] = useState('profile');

  // Input states
  const [fullName, setFullName] = useState(user?.full_name || 'Riwitika Gupta');
  const [email, setEmail] = useState(user?.email || 'riwitika.gupta@fasttrade.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [location, setLocation] = useState('Mumbai, India');
  const [empId, setEmpId] = useState(isAdmin ? 'FT-2024-ADM' : 'FT-2024-EMP');

  // Toggle States
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [aiAlerts, setAiAlerts] = useState(false);
  const [sharingAlerts, setSharingAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const [twoFactor, setTwoFactor] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [fontSize, setFontSize] = useState('medium');
  const [accentColor, setAccentColor] = useState('blue');

  const [aiModel, setAiModel] = useState('gemini-pro');
  const [citationMode, setCitationMode] = useState('semantic');

  // Submenu tabs list
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    // Organization visible to admins only
    ...(isAdmin ? [{ id: 'organization', label: 'Organization', icon: Building2 }] : []),
    { id: 'ai', label: 'AI Preferences', icon: Sparkles },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'about', label: 'About', icon: Info }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto font-sans text-slate-800 pb-12 select-none">
      
      {/* 1. LEFT SUBMENU NAVIGATION */}
      <div className="w-full lg:w-[240px] shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.015)] h-fit space-y-1">
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block px-2 pb-2 border-b border-slate-100 mb-2">
          System Preferences
        </span>
        
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-50/70 text-blue-600' 
                  : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconComp className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-350 transition-transform ${isActive ? 'translate-x-0.5 text-blue-400' : ''}`} />
            </button>
          );
        })}
      </div>

      {/* 2. RIGHT CONFIGURATION PANELS (MAIN CONTENT) */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[500px]">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">Profile Details</h2>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-slate-100 pb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-2xl overflow-hidden shrink-0 shadow-sm">
                {fullName.split(' ').map(n => n.charAt(0)).join('')}
              </div>
              
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs font-extrabold text-slate-900 block">{fullName}</span>
                <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block">{isAdmin ? 'Administrator' : 'Employee'} &bull; {empId}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => alert('Photo upload requires backend logic (Bypassed)')} className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.015)]">Upload Photo</button>
                  <button type="button" onClick={() => alert('Editing profile data')} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm">Edit Profile</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-bold text-slate-750">
              <div className="space-y-2">
                <label className="text-slate-450 block text-[10.5px]">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-450 block text-[10.5px]">Employee ID</label>
                <input type="text" value={empId} readOnly className="w-full bg-[#f8fafc]/50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-slate-400 font-semibold cursor-default" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-455 block text-[10.5px]">Phone Number</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-455 block text-[10.5px]">Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" />
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">Account Administration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-bold text-slate-750">
              <div className="space-y-2">
                <label className="text-slate-450 block text-[10.5px]">Work Email</label>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-450 block text-[10.5px]">Language</label>
                <select className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold cursor-pointer">
                  <option>English (United States)</option>
                  <option>English (India)</option>
                  <option>Spanish</option>
                  <option>German</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-slate-455 block text-[10.5px]">Timezone</label>
                <select className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold cursor-pointer">
                  <option>IST (UTC+5:30) - Mumbai</option>
                  <option>EST (UTC-5:00) - New York</option>
                  <option>GMT (UTC+0:00) - London</option>
                </select>
              </div>
            </div>

            {/* Session Info card */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 mt-6">
              <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2">Active Session parameters</h4>
              <div className="space-y-1.5 text-xs font-semibold text-slate-655 leading-relaxed">
                <p>Client Browser: <span className="text-slate-900 font-extrabold">Chrome (Macintosh)</span></p>
                <p>Current IP Address: <span className="text-slate-900 font-extrabold">192.168.1.104</span></p>
                <p>Session State: <span className="text-emerald-600 font-extrabold">Authenticated (Bypass Active)</span></p>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">Notification Routing</h2>
            
            <div className="space-y-4">
              {[
                { title: 'Email Notifications', desc: 'Receive activity digests and reports on email.', state: emailNotifs, setter: setEmailNotifs },
                { title: 'Push Notifications', desc: 'Display real-time desktop popups.', state: pushNotifs, setter: setPushNotifs },
                { title: 'Approval Alerts', desc: 'Notify immediately when document approvals are requested.', state: approvalAlerts, setter: setApprovalAlerts },
                { title: 'AI Notifications', desc: 'Alert when summaries and suggestions are generated.', state: aiAlerts, setter: setAiAlerts },
                { title: 'Document Sharing', desc: 'Notify when other team members share documents with you.', state: sharingAlerts, setter: setSharingAlerts },
                { title: 'Security Alerts', desc: 'Immediate notification on login shifts or password edits.', state: securityAlerts, setter: setSecurityAlerts }
              ].map((notif, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 border border-slate-200/80 rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block leading-tight">{notif.title}</span>
                    <span className="text-[10px] text-slate-455 font-medium block mt-1 leading-normal">{notif.desc}</span>
                  </div>
                  
                  {/* Stylized toggle slider switch */}
                  <button
                    type="button"
                    onClick={() => notif.setter(!notif.state)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 focus:outline-none ${
                      notif.state ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${
                      notif.state ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">Identity & Security</h2>

            {/* 2FA Toggle card */}
            <div className="flex justify-between items-center p-4 bg-blue-50/40 border border-blue-150/60 rounded-xl select-none shadow-[0_1px_2.5px_rgba(0,0,0,0.01)]">
              <div className="flex gap-3 items-start">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block leading-tight">Two-Factor Authentication (2FA)</span>
                  <span className="text-[9.5px] text-slate-455 font-bold block mt-1 leading-normal">Require security prompts on Work email to authenticate.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactor(!twoFactor)}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 focus:outline-none ${
                  twoFactor ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${
                  twoFactor ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Password input card */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Change Security Password</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 text-xs font-bold text-slate-750">
                <input type="password" placeholder="Current Password" className="bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" />
                <input type="password" placeholder="New Password" className="bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold" />
              </div>
              <button type="button" onClick={() => alert('Password edited (Mock)')} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm self-start flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Update Password</span>
              </button>
            </div>

            {/* Trusted devices list */}
            <div className="space-y-3.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Active Devices Session Logs</span>
              <div className="space-y-2.5">
                {[
                  { name: 'ThinkPad Windows 11', desc: 'Mumbai, India &bull; Chrome &bull; Active', icon: Laptop },
                  { name: 'iPhone 15 Pro', desc: 'Mumbai, India &bull; Corporate iOS App &bull; Active', icon: Smartphone }
                ].map((dev, idx) => {
                  const DeviceIcon = dev.icon;
                  return (
                    <div key={idx} className="flex justify-between items-center p-3 border border-slate-200/80 rounded-xl bg-slate-50/40">
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 shadow-sm">
                          <DeviceIcon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[10.5px] font-extrabold text-slate-850 block leading-tight">{dev.name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5 leading-none" dangerouslySetInnerHTML={{ __html: dev.desc }} />
                        </div>
                      </div>
                      <button type="button" onClick={() => alert('Terminating session log')} className="text-[9.5px] text-red-500 hover:text-red-700 font-extrabold">Revoke</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">Appearance & Styles</h2>
            
            {/* Theme cards selectors */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Theme Palette</span>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', name: 'Light Mode', bg: 'bg-white border-slate-200 text-slate-800' },
                  { id: 'dark', name: 'Dark Mode', bg: 'bg-slate-950 border-slate-900 text-slate-300' },
                  { id: 'system', name: 'System Default', bg: 'bg-gradient-to-r from-white to-slate-950 border-slate-200 text-slate-800' }
                ].map((th) => (
                  <div
                    key={th.id}
                    onClick={() => setActiveTheme(th.id as any)}
                    className={`p-4 border rounded-xl cursor-pointer flex flex-col justify-between h-20 transition-all select-none ${th.bg} ${
                      activeTheme === th.id ? 'ring-2 ring-blue-600 scale-[0.98]' : 'hover:scale-[0.99] hover:border-slate-350'
                    }`}
                  >
                    <span className="text-[11px] font-extrabold block leading-none">{th.name}</span>
                    {activeTheme === th.id && (
                      <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 self-end mt-2 fill-white" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Accent color pills */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Accent Color</span>
              <div className="flex gap-3 select-none">
                {[
                  { id: 'blue', color: 'bg-blue-600 border-blue-500' },
                  { id: 'emerald', color: 'bg-emerald-600 border-emerald-500' },
                  { id: 'purple', color: 'bg-purple-600 border-purple-500' },
                  { id: 'rose', color: 'bg-rose-600 border-rose-500' }
                ].map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => setAccentColor(acc.id)}
                    className={`w-7 h-7 rounded-full cursor-pointer flex items-center justify-center border-2 transition-all hover:scale-105 ${acc.color} ${
                      accentColor === acc.id ? 'ring-2 ring-slate-400 border-white' : 'border-transparent'
                    }`}
                  >
                    {accentColor === acc.id && (
                      <CheckCircle className="w-3.5 h-3.5 text-white shrink-0 fill-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Font size and compact controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-bold text-slate-750">
              <div className="space-y-2">
                <label className="text-slate-450 block text-[10.5px]">Default Font Size</label>
                <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold cursor-pointer">
                  <option value="small">Small (11px)</option>
                  <option value="medium">Medium (12px)</option>
                  <option value="large">Large (14px)</option>
                </select>
              </div>

              <div className="flex justify-between items-center p-3.5 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)] self-end h-fit">
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block leading-tight">Compact Mode</span>
                  <span className="text-[9.5px] text-slate-455 font-semibold block mt-0.5">Reduce listing padding heights.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCompactMode(!compactMode)}
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 focus:outline-none ${
                    compactMode ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${
                    compactMode ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ORGANIZATION TAB (Admin only) */}
        {activeTab === 'organization' && isAdmin && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">Organization Preferences</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-bold text-slate-750">
              <div className="space-y-2">
                <label className="text-slate-450 block text-[10.5px]">Company Name</label>
                <input type="text" value="Fast Trade Technologies Pvt. Ltd." readOnly className="w-full bg-[#f8fafc]/50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-slate-450 font-semibold cursor-default" />
              </div>

              <div className="space-y-2">
                <label className="text-slate-450 block text-[10.5px]">Working Hours Range</label>
                <select className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold cursor-pointer">
                  <option>09:00 AM to 06:00 PM (Standard)</option>
                  <option>08:00 AM to 05:00 PM</option>
                  <option>Flexible hours (24h scope)</option>
                </select>
              </div>
            </div>

            {/* Division list counts */}
            <div className="space-y-3.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Division Roles & Rights Mapping</span>
              <div className="space-y-2">
                {[
                  { name: 'Super Administrator', desc: 'Arun Goyal &bull; Full structural read/write rights' },
                  { name: 'Administrator', desc: 'Arnim Goyal &bull; Accounts and metadata management' },
                  { name: 'Department Manager', desc: 'Riwitika Gupta &bull; Approval metrics controller' }
                ].map((roleItem, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10.5px] font-extrabold text-slate-900 block leading-tight">{roleItem.name}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5 leading-none" dangerouslySetInnerHTML={{ __html: roleItem.desc }} />
                    </div>
                    <button type="button" onClick={() => alert('Opening permissions module')} className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold">Config</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI PREFERENCES TAB */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">AI Copilot Parameters</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-bold text-slate-750">
              <div className="space-y-2">
                <label className="text-slate-450 block text-[10.5px]">Preferred Model Configuration</label>
                <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold cursor-pointer">
                  <option value="gemini-pro">Gemini 1.5 Pro (Workspace scope)</option>
                  <option value="gemini-flash">Gemini 1.5 Flash (Performance focus)</option>
                  <option value="gpt-4">GPT-4o Mock Integration</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-455 block text-[10.5px]">Default Citation Scope</label>
                <select value={citationMode} onChange={(e) => setCitationMode(e.target.value)} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold cursor-pointer">
                  <option value="semantic">Semantic Search (Highest similarity)</option>
                  <option value="literal">Literal Pattern Matching</option>
                  <option value="hybrid">Hybrid Search Index</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-455 block text-[10.5px]">Default Summary Length</label>
                <select className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold cursor-pointer">
                  <option>Medium (Bullet highlights &bull; Standard)</option>
                  <option>Short (Quick description paragraph)</option>
                  <option>Detailed (Section breakdown)</option>
                </select>
              </div>
            </div>

            {/* Conversation History details */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 mt-6 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Clear AI conversation history</span>
                <span className="text-[9.5px] text-slate-500 font-semibold block leading-normal">Delete cached queries and custom pinned history threads.</span>
              </div>
              
              <button 
                type="button" 
                onClick={() => {
                  if (confirm('Delete cached vector search history?')) {
                    alert('AI caches cleared successfully.');
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-extrabold text-red-500 hover:text-red-700 bg-white border border-red-200 hover:border-red-300 rounded-lg transition-colors shadow-sm shrink-0"
              >
                Clear History
              </button>
            </div>
          </div>
        )}

        {/* STORAGE TAB */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">Storage Diagnostics</h2>

            {/* Storage Progress bars list */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 space-y-4">
              <div>
                <div className="flex justify-between font-extrabold text-xs text-slate-900">
                  <span>Workspace Storage</span>
                  <span>245.6 GB / 500 GB (49% Used)</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-blue-600 rounded-full shadow-sm" style={{ width: '49%' }} />
                </div>
              </div>

              {/* Department breakdown storage bars */}
              <div className="space-y-2 text-[10.5px] text-slate-655 font-bold pt-2 border-t border-slate-200">
                <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Division Storage Details</span>
                <div className="flex justify-between">
                  <span>Sales & Marketing:</span>
                  <span className="text-slate-800">128.4 GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Finance:</span>
                  <span className="text-slate-800">54.2 GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Operations:</span>
                  <span className="text-slate-800">31.8 GB</span>
                </div>
              </div>
            </div>

            {/* Cleanup suggestions */}
            <div className="space-y-3.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Cleanup Recommendations</span>
              <div className="p-3.5 bg-amber-50/40 border border-amber-150/60 rounded-xl flex gap-3 text-xs font-semibold select-none leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-amber-800 font-extrabold block">Storage optimization available</span>
                  <span className="text-slate-500 font-medium block mt-0.5">Found **14 duplications** and outdated SOW drafts taking **2.8 GB**. Clear caches to optimize indexing speeds.</span>
                  <button type="button" onClick={() => alert('Caches clean complete (Mock)')} className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold mt-1.5 block">Run Cleanup &rarr;</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">System Audit Logs</h2>

            <div className="relative pl-4 border-l border-slate-200 space-y-5 py-2">
              {[
                { event: 'Workstation Login Session Initiated', detail: 'IP Address: 192.168.1.104 &bull; Chrome (macOS)', time: 'Today, 10:30 AM' },
                { event: 'AI Assistant Query Triggered', detail: '"Q2 vs Q1 budget comparison query requested"', time: 'Today, 10:32 AM' },
                { event: 'Document Upload completed', detail: '"Client Onboarding Process.docx" uploaded to /Sales & Marketing/', time: 'Yesterday, 10:30 AM' },
                { event: 'Security Settings Updated', detail: '2-Factor Authentication configuration set to active', time: '14 May 2024, 04:15 PM' }
              ].map((log, idx) => (
                <div key={idx} className="relative text-xs font-semibold">
                  <div className="absolute -left-[22.5px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white border border-slate-200 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  </div>
                  <span className="text-slate-800 font-extrabold block leading-tight">{log.event}</span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-normal" dangerouslySetInnerHTML={{ __html: log.detail }} />
                  <span className="text-[9.5px] text-slate-400 font-bold block mt-0.2 select-none leading-none">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">System Information</h2>

            <div className="space-y-4.5 text-xs font-semibold text-slate-700 leading-relaxed select-text">
              <div className="grid grid-cols-3 gap-y-3 bg-[#f8fafc] border border-slate-200 p-4 rounded-xl">
                <span className="text-slate-450 font-bold text-[10.5px]">App Version</span>
                <span className="col-span-2 text-slate-900 font-extrabold">v2.4.21 Enterprise Edition</span>

                <span className="text-slate-455 font-bold text-[10.5px]">License Holder</span>
                <span className="col-span-2 text-slate-850 font-semibold">Fast Trade Technologies Pvt. Ltd.</span>

                <span className="text-slate-455 font-bold text-[10.5px]">License Term</span>
                <span className="col-span-2 text-slate-800 font-semibold">Standard Corporate License (Valid till Dec 2026)</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Support & Help Center</span>
                <p>For operations assistance or support requests, please contact corporate IT support at <span className="text-blue-600 font-bold font-mono">support@fasttrade.com</span> or open a support ticket.</p>
                <div className="flex gap-4 pt-1 text-[11px] font-extrabold text-blue-600">
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Terms of Service opened (Mock)'); }} className="hover:underline flex items-center gap-1">
                    <span>Terms of Service</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Privacy Policy opened (Mock)'); }} className="hover:underline flex items-center gap-1">
                    <span>Privacy Policy</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
