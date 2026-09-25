import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, Info, AlertTriangle } from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (view: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate }) => {
  const { signInWithPassword, isSupabaseActive } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your administrator email and password.');
      return;
    }

    setIsLoading(true);

    const res = await signInWithPassword(email, password, 'admin');
    setIsLoading(false);

    if (res.success) {
      onNavigate('admin-dashboard');
    } else {
      setError(res.error || 'Invalid administrator credentials or unauthorized account.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 text-white border border-white/20">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Admin & Management</h2>
          <p className="text-xs text-slate-300 mt-1">
            Nowshera Family Clinic Operations & Analytics Console
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Real Admin Security Guidance */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Clinic Administrator Security</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              To designate your Supabase Auth user as Admin, sign up through the portal or Auth dashboard, then designate your role in Supabase SQL editor:
            </p>
            <div className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-2 rounded-lg overflow-x-auto select-all">
              UPDATE public.profiles SET role = &apos;admin&apos; WHERE email = &apos;your-email&apos;;
            </div>
          </div>

          {!isSupabaseActive && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <strong className="font-bold block mb-0.5">Supabase Configuration Required:</strong>
              Please configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourclinic.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Verifying Administrator Privileges...</span>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigate('patient-login')}
              className="text-slate-500 hover:text-teal-700"
            >
              Patient Portal
            </button>
            <button
              type="button"
              onClick={() => onNavigate('doctor-login')}
              className="text-slate-500 hover:text-teal-700"
            >
              Doctor Portal
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-slate-400 hover:text-slate-600 underline"
            >
              Public Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
