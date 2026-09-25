import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Mail, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';

interface PatientLoginProps {
  onNavigate: (view: string) => void;
}

export const PatientLogin: React.FC<PatientLoginProps> = ({ onNavigate }) => {
  const { signInWithPassword, isSupabaseActive } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);

    const res = await signInWithPassword(email, password, 'patient');
    setIsLoading(false);

    if (res.success) {
      onNavigate('patient-dashboard');
    } else {
      setError(res.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 text-white border border-white/20">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Patient Portal Login</h2>
          <p className="text-xs text-teal-100 mt-1">
            Sign in with your registered account to manage appointments and records
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {!isSupabaseActive && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <strong className="font-bold block mb-0.5">Supabase Configuration:</strong>
              Backend credentials (<code>VITE_SUPABASE_URL</code> & <code>VITE_SUPABASE_ANON_KEY</code>) must be configured in your environment to authenticate real patients.
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating with Supabase...</span>
              ) : (
                <>
                  <span>Sign In as Patient</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Prompt */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-600">
              Don&apos;t have a patient portal account yet?
            </p>
            <button
              type="button"
              onClick={() => onNavigate('patient-register')}
              className="w-full py-2.5 px-4 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Patient Account</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-xs text-slate-400 hover:text-slate-600 underline block mx-auto pt-1"
            >
              Back to Clinic Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
