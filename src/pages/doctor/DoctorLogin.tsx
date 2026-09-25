import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, Info } from 'lucide-react';

interface DoctorLoginProps {
  onNavigate: (view: string) => void;
}

export const DoctorLogin: React.FC<DoctorLoginProps> = ({ onNavigate }) => {
  const { signInWithPassword, isSupabaseActive } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your clinic email address and password.');
      return;
    }

    setIsLoading(true);

    const res = await signInWithPassword(email, password, 'doctor');
    setIsLoading(false);

    if (res.success) {
      onNavigate('doctor-dashboard');
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials or contact clinic management.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 text-white border border-white/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Doctor Clinical Portal</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Review appointments, confirm patient requests, and record private visit notes
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Information regarding doctor account provisioning */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Medical Staff Provisioning Notice</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Doctor accounts are created exclusively by clinic administration. Use the credentials assigned by clinic management to access your OPD dashboard.
            </p>
          </div>

          {!isSupabaseActive && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <strong className="font-bold block mb-0.5">Supabase Configuration Required:</strong>
              Please configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Doctor Clinic Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@nowsheraclinic.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating Doctor Profile...</span>
              ) : (
                <>
                  <span>Access Doctor Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
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
              Patient Login
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-slate-400 hover:text-slate-600 underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
