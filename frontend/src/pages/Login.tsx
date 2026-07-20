import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Globe, 
  HelpCircle, 
  ArrowLeft, 
  Shield, 
  Users, 
  Brain, 
  Database,
  Check,
  ShieldAlert,
  Headphones
} from 'lucide-react';

export default function Login() {
  const login = useAuthStore((state) => state.login);
  
  // View states: 'login' | 'forgot'
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  // Forgot password steps: 1 | 2 | 3
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // UI status states
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid work email.');
      return;
    }
    setError(null);
    setIsLoading(true);
    
    // Simulate API call to send reset link
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 800);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError(null);
    setIsLoading(true);

    // Simulate API call to save password
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Password has been reset successfully. Please sign in with your new password.');
      setView('login');
      setStep(1);
      // Clear form
      setPassword('');
      setConfirmPassword('');
    }, 800);
  };

  // Switch to forgot password flow
  const triggerForgotPassword = () => {
    setError(null);
    setSuccessMessage(null);
    setView('forgot');
    setStep(1);
  };

  // Switch back to login flow
  const triggerBackToSignIn = () => {
    setError(null);
    setView('login');
    setStep(1);
  };

  return (
    <div className="min-h-screen w-screen flex bg-slate-50 font-sans text-slate-800 antialiased overflow-x-hidden">
      
      {/* LEFT COLUMN: TECH FEATURE PANEL */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-r border-slate-200 relative overflow-hidden">
        {/* Decorative Grid and Background shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Ftt Brand Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <svg className="h-11 w-11 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="white" stroke="#E2E8F0" strokeWidth="3" />
            {/* Red paper-airplane-like arrow */}
            <path d="M68 28 L82 32 L72 44 L68 28 Z" fill="#DC2626" />
            <path d="M72 44 L82 32 L54 48" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />
            {/* Stylized blue Ftt text */}
            <text x="22" y="66" fill="#1E40AF" fontSize="38" fontWeight="900" fontFamily="'Outfit', 'Inter', sans-serif" letterSpacing="-3">F</text>
            <text x="44" y="66" fill="#2563EB" fontSize="35" fontWeight="800" fontFamily="'Outfit', 'Inter', sans-serif" letterSpacing="-2">t</text>
            <text x="60" y="66" fill="#3B82F6" fontSize="35" fontWeight="800" fontFamily="'Outfit', 'Inter', sans-serif" letterSpacing="-2">t</text>
          </svg>
          <div>
            <span className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight block">Fast Trade</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Technologies Pvt. Ltd.</span>
          </div>
        </div>

        {/* Center Showcase Area */}
        <div className="my-auto max-w-md w-full space-y-8 relative z-10">
          <div className="space-y-4">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              AI-Powered <br />
              Enterprise <span className="text-blue-600">Knowledge</span> &amp; <br />
              <span className="text-red-500">Document</span> Management
            </h1>
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
              Centralize. Collaborate. Secure. <br />
              Empower your organization with intelligent knowledge management.
            </p>
          </div>

          {/* Dynamic Graphic Mockup Panel */}
          <div className="transition-all duration-300 transform">
            {view === 'login' && (
              /* DMS Folder list mockup */
              <div className="w-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden relative aspect-[1.5] flex">
                <div className="absolute top-0 left-0 right-0 h-7 bg-slate-50 border-b border-slate-100 flex items-center px-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                  </div>
                  <div className="mx-auto w-1/3 h-3 bg-white rounded border border-slate-200" />
                </div>
                
                {/* Mock Sidebar */}
                <div className="w-1/4 bg-slate-50/50 border-r border-slate-100 pt-10 px-3 space-y-3">
                  <div className="h-2 bg-slate-250 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2 bg-yellow-400 rounded-sm" />
                      <div className="h-1.5 bg-slate-200 rounded w-1/2" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2 bg-yellow-400 rounded-sm" />
                      <div className="h-1.5 bg-slate-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>

                {/* Mock Main Area */}
                <div className="flex-1 pt-10 p-4 space-y-3">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-7 bg-white border border-slate-100 rounded-md w-full flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-sm bg-blue-50 flex items-center justify-center text-[10px] text-blue-600 font-bold">📄</span>
                          <div className="h-1.5 bg-slate-200 rounded w-24" />
                        </div>
                        <div className="w-6 h-1.5 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock AI assistant bubble */}
                <div className="absolute right-4 bottom-4 bg-blue-600 text-white rounded-lg px-3 py-2 shadow-lg flex items-center gap-1.5 text-xs font-semibold">
                  <span>AI</span>
                  <span className="text-[10px] opacity-80">✦</span>
                </div>
              </div>
            )}

            {view === 'forgot' && step === 1 && (
              /* Security Shield with key and Lock dots mockup */
              <div className="w-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden relative aspect-[1.5] flex flex-col items-center justify-center p-6">
                <div className="absolute top-0 left-0 right-0 h-7 bg-slate-50 border-b border-slate-100 flex items-center px-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 relative">
                    <Shield className="w-7 h-7 text-blue-600" />
                    <div className="absolute -bottom-1 -right-1 bg-white border border-slate-200 rounded p-1 shadow-sm">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-1.5 flex items-center gap-3">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600 font-mono text-sm tracking-widest">•••••</span>
                  </div>
                </div>
              </div>
            )}

            {view === 'forgot' && step >= 2 && (
              /* Shield, Envelope and flying plane mockup */
              <div className="w-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden relative aspect-[1.5] flex flex-col items-center justify-center p-6">
                <div className="w-28 h-28 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center relative">
                  <Shield className="w-12 h-12 text-blue-500" />
                  
                  <div className="absolute -bottom-3 bg-white border border-slate-200 rounded-xl p-2.5 shadow-md flex items-center gap-2 max-w-[120px]">
                    <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="h-1.5 bg-slate-200 rounded w-12" />
                      <div className="h-1 bg-slate-100 rounded w-8" />
                    </div>
                  </div>
                  
                  <div className="absolute top-2 -right-6 text-blue-500 animate-bounce">
                    <svg className="w-5 h-5 transform rotate-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {view === 'login' ? (
              <>
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Secure</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Enterprise grade security and role-based access</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Collaborate</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Work together seamlessly across teams</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">AI-Powered</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Intelligent search and document insights</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Centralized</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">All your knowledge in one secure place</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Secure</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Your account is protected with enterprise grade security.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Private</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">We never share your information with anyone.</p>
                  </div>
                </div>

                <div className="col-span-2 flex gap-3 items-start">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Quick</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Password reset link expires in 30 minutes.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-slate-400 relative z-10 flex items-center justify-between">
          <span>© 2024 Fast Trade Technologies Pvt. Ltd. All rights reserved.</span>
        </div>
      </div>


      {/* RIGHT COLUMN: AUTH INPUT PANEL */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-16 bg-white relative">
        
        {/* Top Navbar elements */}
        <div className="flex justify-end w-full relative z-25">
          {view === 'login' ? (
            /* Language Dropdown Selector as in Mockup */
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 transition-all font-semibold py-1.5 px-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100"
              >
                <Globe className="w-4 h-4 text-slate-500" />
                <span>{language}</span>
                <span className="text-[8px] opacity-70">▼</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md py-1 w-28 text-xs z-50">
                  {['English', 'Spanish', 'French', 'German'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => { setLanguage(lang); setShowLangMenu(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium transition-all"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Help Widget as in Mockup 1 or Back to Sign In as in Mockup 3 */
            <div className="flex items-center gap-4">
              {step === 1 ? (
                <button 
                  type="button" 
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                >
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>Help</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={triggerBackToSignIn}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-all hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to sign in</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Brand Header for Mobile Views */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          <svg className="h-8 w-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="white" stroke="#E2E8F0" strokeWidth="3" />
            <path d="M68 28 L82 32 L72 44 L68 28 Z" fill="#DC2626" />
            <text x="22" y="66" fill="#1E40AF" fontSize="38" fontWeight="900" fontFamily="sans-serif" letterSpacing="-3">F</text>
            <text x="44" y="66" fill="#2563EB" fontSize="35" fontWeight="800" fontFamily="sans-serif" letterSpacing="-2">t</text>
            <text x="60" y="66" fill="#3B82F6" fontSize="35" fontWeight="800" fontFamily="sans-serif" letterSpacing="-2">t</text>
          </svg>
          <span className="font-extrabold text-slate-900 text-sm">Fast Trade</span>
        </div>

        {/* Center Auth Form Container */}
        <div className="w-full max-w-[390px] mx-auto my-auto py-8">
          {view === 'login' ? (
            /* ==============================================
               LOGIN FORM VIEW
               ============================================== */
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight font-sans">Welcome back!</h2>
                <p className="text-xs text-slate-500">Sign in to continue to your workspace</p>
              </div>

              {/* Status alerts */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 leading-normal">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}
              {successMessage && (
                <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3.5 text-xs text-green-700 leading-normal">
                  <Check className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                  <div>{successMessage}</div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your work email"
                      className="block w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="block w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-5 w-5 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot actions */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 focus:outline-none"
                    />
                    <span className="text-slate-500 font-medium">Remember me</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={triggerForgotPassword}
                    className="text-blue-600 hover:text-blue-800 font-bold transition-all hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:opacity-50 mt-6"
                >
                  {isLoading ? 'Verifying...' : 'Sign in'}
                </button>
              </form>

              {/* or Divider */}
              <div className="flex items-center gap-3 text-xs text-slate-450 font-medium py-1">
                <div className="h-[1px] bg-slate-200 flex-1" />
                <span>or</span>
                <div className="h-[1px] bg-slate-200 flex-1" />
              </div>

              {/* Microsoft Button */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  setTimeout(() => {
                    setIsLoading(false);
                    // Mock auth signin
                    alert('Simulated Sign In with Microsoft Active Directory');
                  }, 800);
                }}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 bg-white"
              >
                {/* Microsoft grid icon */}
                <div className="grid grid-cols-2 gap-[1.5px] w-3 h-3 shrink-0">
                  <div className="bg-[#f25f22] w-1.5 h-1.5" />
                  <div className="bg-[#7fba00] w-1.5 h-1.5" />
                  <div className="bg-[#01a4ef] w-1.5 h-1.5" />
                  <div className="bg-[#ffb900] w-1.5 h-1.5" />
                </div>
                <span>Sign in with Microsoft</span>
              </button>

              <div className="text-center text-xs text-slate-500 font-medium pt-2">
                Need access?{' '}
                <button
                  type="button"
                  onClick={() => alert('Please contact Fast Trade Technologies IT Operations (it-support@efasttrade.com) for organization onboarding.')}
                  className="text-blue-600 hover:text-blue-800 font-bold transition-all hover:underline"
                >
                  Contact your administrator
                </button>
              </div>

              {/* Seeding Box - Hidden in clean UI but available on hover / tiny details */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1 text-[10px] text-slate-450 font-medium">
                <div className="flex justify-between font-mono">
                  <span>Demo: arun.goyal@fasttrade.com (Super Admin) / arnim.goyal@fasttrade.com (Admin) / riwitika.gupta@fasttrade.com (Manager/Employee)</span>
                </div>
              </div>
            </div>
          ) : (
            /* ==============================================
               FORGOT PASSWORD FLOWS (3 STEPS)
               ============================================== */
            <div className="space-y-6">
              
              {/* Stepper Header (as shown in Mockup 3) */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                {[
                  { num: 1, label: 'Verify Email' },
                  { num: 2, label: 'Check Email' },
                  { num: 3, label: 'Reset Password' }
                ].map((s) => (
                  <div key={s.num} className="flex flex-col items-center flex-1 relative">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s.num
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : step > s.num
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <span className={`text-[10px] font-bold mt-1.5 ${
                      step === s.num ? 'text-blue-600' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* STEP 1: VERIFY EMAIL */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Step 1 of 3</span>
                    <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Verify your work email</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Enter your registered work email address and we will send you password reset instructions.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 leading-normal">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleForgotSubmit}>
                    <div>
                      <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Work Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          id="reset-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your work email"
                          className="block w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:opacity-50 mt-4"
                    >
                      {isLoading ? 'Verifying...' : 'Send Reset Link'}
                    </button>
                  </form>

                  {/* or Divider */}
                  <div className="flex items-center gap-3 text-xs text-slate-450 font-medium py-1">
                    <div className="h-[1px] bg-slate-200 flex-1" />
                    <span>or</span>
                    <div className="h-[1px] bg-slate-200 flex-1" />
                  </div>

                  {/* Microsoft reset button */}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      setTimeout(() => {
                        setIsLoading(false);
                        alert('Connecting to Microsoft reset wizard...');
                      }, 800);
                    }}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 bg-white"
                  >
                    <div className="grid grid-cols-2 gap-[1.5px] w-3 h-3 shrink-0">
                      <div className="bg-[#f25f22] w-1.5 h-1.5" />
                      <div className="bg-[#7fba00] w-1.5 h-1.5" />
                      <div className="bg-[#01a4ef] w-1.5 h-1.5" />
                      <div className="bg-[#ffb900] w-1.5 h-1.5" />
                    </div>
                    <span>Use Microsoft account</span>
                  </button>

                  {/* Alert support box (as shown in Mockup 3) */}
                  <div className="rounded-lg bg-blue-50/40 border border-blue-100 p-3.5 flex gap-3 text-xs text-slate-600 leading-normal">
                    <Headphones className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Need help? </span>
                      Contact your administrator if you are unable to reset your password.
                    </div>
                  </div>

                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      onClick={triggerBackToSignIn}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-all font-bold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to sign in</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CHECK EMAIL */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Step 2 of 3</span>
                    <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Check your email</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      We sent a password reset link to your email address: <span className="font-semibold text-slate-800">{email}</span>. Please click the link inside the email to configure a new password.
                    </p>
                  </div>

                  {/* Simulated Mail verification box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Simulated Inbox</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-extrabold uppercase">New mail</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 space-y-2">
                      <div className="font-bold text-slate-800 text-[11px]">Subject: Reset your Fast Trade DMS password</div>
                      <p className="text-slate-500 text-[11px]">Hello employee, you requested a password reset. Click the button below to update your security credentials:</p>
                      
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] py-1.5 px-3 rounded shadow transition-all hover:scale-[1.02]"
                      >
                        Reset Password Link (Simulate)
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => {
                          setIsLoading(false);
                          alert('Reset link resent to email.');
                        }, 500);
                      }}
                      className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-all"
                    >
                      Resend reset link
                    </button>
                    
                    <button
                      type="button"
                      onClick={triggerBackToSignIn}
                      className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-bold py-2"
                    >
                      Cancel and back to sign in
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: RESET PASSWORD FORM */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Step 3 of 3</span>
                    <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Configure new password</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Please establish a strong password. Re-enter it below to confirm security validation.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 leading-normal">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleResetSubmit}>
                    <div>
                      <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          id="new-password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password (min. 8 chars)"
                          className="block w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          id="confirm-password"
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="block w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:opacity-50 mt-4"
                    >
                      {isLoading ? 'Saving Password...' : 'Reset Password'}
                    </button>
                  </form>

                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      onClick={triggerBackToSignIn}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-all font-bold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Cancel and back to sign in</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer info for Right Panel */}
        <div className="text-[11px] text-slate-400 text-center relative z-10 block md:hidden">
          <span>© 2024 Fast Trade Technologies Pvt. Ltd. All rights reserved.</span>
        </div>
        <div className="hidden md:block" /> {/* Dummy space holder for flex layout */}
      </div>

    </div>
  );
}
