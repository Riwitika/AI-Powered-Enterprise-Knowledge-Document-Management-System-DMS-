import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { FileText, ShieldAlert, Lock, Mail, ChevronRight, Server, ArrowRight } from 'lucide-react';

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [departmentId, setDepartmentId] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    if (isRegisterMode && !email.toLowerCase().endsWith('@efasttrade.com')) {
      setError('Only corporate email addresses ending in @efasttrade.com are allowed to register.');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegisterMode) {
        await register({
          email,
          password,
          full_name: fullName,
          department_id: Number(departmentId),
          role_name: 'employee'
        });
        // Auto-login after registration
        await login(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err?.message || (isRegisterMode ? 'Failed to create account' : 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-950 overflow-hidden font-sans relative">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Main Glassmorphic Wrapper */}
      <div className="w-full max-w-[950px] mx-4 grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-10">
        
        {/* Left Side: Tech Feature Panel */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-r border-white/[0.06] relative overflow-hidden">
          <div className="absolute top-10 right-10 w-32 h-32 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-emerald-600/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Logo brand */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">Fast Trade DMS</span>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block -mt-0.5">Enterprise Knowledge System</span>
            </div>
          </div>

          {/* Center Showcase */}
          <div className="my-auto relative z-10 space-y-6 max-w-sm">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                <Server className="h-3 w-3" />
                <span>Enterprise Core Directory Node</span>
              </span>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
                Global Trade <br />
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Knowledge Hub
                </span>
              </h1>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The secure digital depository for Fast Trade Technologies. Search tariff procedures, compliance SOPs, legal templates, and exchange regulations.
              </p>
            </div>

            {/* Core Features */}
            <div className="space-y-4 pt-4 border-t border-white/[0.05]">
              {[
                { title: 'Compliance & Tariffs SOPs', desc: 'Instant search over customs checklists and regulatory guides.', badge: 'Compliance' },
                { title: 'Isolated Brokerage Clearances', desc: 'Secure folder permissions mapped by business division.', badge: 'RBAC Active' },
                { title: 'Document RAG Intelligence', desc: 'Context-aware semantic summaries and prompt assistants.', badge: 'AI Powered' }
              ].map((f, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/[0.03] text-blue-400 border border-white/[0.08]">
                    <ChevronRight className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200">{f.title}</h3>
                      <span className="text-[8px] font-extrabold text-blue-400/80 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10 uppercase tracking-widest">{f.badge}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-500">
            <span>© 2026 Fast Trade Technologies</span>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Secured Connection
            </span>
          </div>
        </div>

        {/* Right Side: Auth Inputs Panel */}
        <div className="p-8 md:p-12 bg-slate-950/80 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {isRegisterMode ? 'Create Corporate Account' : 'System Gateway'}
              </h2>
              <p className="mt-1 text-[11px] text-slate-500 leading-normal max-w-[280px]">
                {isRegisterMode ? 'Register access to your department\'s isolated document workspace' : 'Provide authorized efasttrade.com credentials to enter'}
              </p>
            </div>

            {/* Premium Tab Swapper */}
            <div className="flex p-1 bg-slate-900/60 border border-slate-800 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setError(null); }}
                className={`flex-1 py-1.5 text-[10px] font-extrabold text-center rounded-md transition-all ${
                  !isRegisterMode 
                    ? 'bg-blue-600 border border-blue-500 text-white shadow-lg shadow-blue-600/15' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setError(null); }}
                className={`flex-1 py-1.5 text-[10px] font-extrabold text-center rounded-md transition-all ${
                  isRegisterMode 
                    ? 'bg-blue-600 border border-blue-500 text-white shadow-lg shadow-blue-600/15' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                Register Access
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-[10px] text-red-400 leading-normal">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-3.5">
                {isRegisterMode && (
                  <div>
                    <label htmlFor="full-name" className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:bg-slate-900/80 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
                      placeholder="Jane Doe"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email-address" className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-slate-800 bg-slate-900/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-650 focus:bg-slate-900/80 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
                      placeholder="you@efasttrade.com"
                    />
                  </div>
                </div>

                {isRegisterMode && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Corporate Department
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="block w-full rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-xs text-white focus:bg-slate-900/80 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
                    >
                      <option className="bg-slate-950 text-white" value="1">Corporate</option>
                      <option className="bg-slate-950 text-white" value="2">Engineering</option>
                      <option className="bg-slate-950 text-white" value="3">Human Resources</option>
                      <option className="bg-slate-950 text-white" value="4">Finance</option>
                      <option className="bg-slate-950 text-white" value="5">Legal</option>
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Security Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isRegisterMode ? "new-password" : "current-password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-800 bg-slate-900/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-650 focus:bg-slate-900/80 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="glow-btn w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(37,99,235,0.15)] hover:shadow-[0_0_25px_rgba(37,99,235,0.3)] mt-6 disabled:opacity-50"
              >
                {isLoading ? (isRegisterMode ? 'Creating Account...' : 'Verifying Credentials...') : (isRegisterMode ? 'Register Access' : 'Sign in')}
                {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </form>
            
            {/* Developer Seeding Box */}
            {!isRegisterMode && (
              <div className="rounded-xl bg-slate-950/60 border border-slate-900 p-4 space-y-1.5 text-[10px] text-slate-500">
                <span className="font-extrabold text-slate-450 uppercase tracking-widest block text-[9px] mb-1">Developer Seeding Info</span>
                <div className="flex justify-between">
                  <span>Super Admin Email:</span>
                  <span className="font-mono text-blue-400">admin@enterprise.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Default Password:</span>
                  <span className="font-mono text-blue-400">adminpassword</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
