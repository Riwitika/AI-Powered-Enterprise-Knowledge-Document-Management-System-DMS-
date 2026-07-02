import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { FileText, ShieldAlert, Lock, Mail, ChevronRight, Server, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Left side: Classy Corporate Identity Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 p-16 flex-col justify-between overflow-hidden">
        {/* Subtle geometric line patterns */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Top brand details */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block">Enterprise KMS</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block -mt-0.5">Secure Knowledge & Document Management</span>
          </div>
        </div>

        {/* Informative Showcase */}
        <div className="my-auto relative z-10 space-y-8 max-w-md">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-500/20">
              <Server className="h-3.5 w-3.5" />
              <span>Standalone Mock Enabled</span>
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
              Professional <br />
              <span className="text-blue-400">
                Document AI Hub
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Consolidate corporate intelligence, administer sharing rules with RBAC access control guidelines, and query files directly using RAG AI.
            </p>
          </div>

          {/* Core Features */}
          <div className="space-y-3.5">
            {[
              { title: 'Vector RAG Search', desc: 'Secure semantic search over indexed documents.' },
              { title: 'Granular Access Policies', desc: 'Custom department and user sharing rules.' },
              { title: 'Isolated Document AI', desc: 'Ask questions locked to specific document contexts.' }
            ].map((f, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="mt-1 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded bg-slate-800 text-blue-400 border border-slate-700/60">
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">{f.title}</h3>
                  <p className="text-[11px] text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500">
          <span>© 2026 Kamakhya Aerospace</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> AES-256 Bit Encryption Active
          </span>
        </div>
      </div>

      {/* Right side: Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-slate-50 relative">
        <div className="w-full max-w-md space-y-8 bg-white border border-slate-200/80 p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="lg:hidden flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm mb-4">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              System Gateway
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Provide corporate credentials to access the knowledge base
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="glow-btn flex w-full justify-center items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors mt-6"
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign in'}
              {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </form>
          
          {/* Seed accounts reference panel */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-4 space-y-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 uppercase tracking-wider block text-[9px] mb-1">Developer Seeding Info</span>
            <div className="flex justify-between">
              <span>Super Admin Email:</span>
              <span className="font-mono text-blue-600">admin@enterprise.com</span>
            </div>
            <div className="flex justify-between">
              <span>Default Password:</span>
              <span className="font-mono text-blue-600">adminpassword</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
