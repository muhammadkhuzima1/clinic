import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, ArrowLeft, Lock, ShieldCheck, CheckCircle } from 'lucide-react';

interface PatientRegisterProps {
  onNavigate: (view: string) => void;
}

export const PatientRegister: React.FC<PatientRegisterProps> = ({ onNavigate }) => {
  const { signUpPatient } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    dob: '1995-01-01',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodGroup: 'B+',
    address: '',
    emergencyName: '',
    emergencyRelationship: 'Family Member',
    emergencyPhone: '',
    allergies: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all mandatory fields (Name, Email, Phone, Password).');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    const res = await signUpPatient({
      email: formData.email,
      password: formData.password,
      fullName: formData.name,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      address: formData.address,
    });

    setIsLoading(false);

    if (res.success) {
      onNavigate('patient-dashboard');
    } else {
      setError(res.error || 'Could not complete registration. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider block">New Patient Registration</span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-0.5">Nowshera Family Clinic</h2>
            <p className="text-xs text-teal-100 mt-1">Create your digital healthcare file to book specialist appointments</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('patient-login')}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Login</span>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Credentials */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                1. Account Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. farhan@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Create Password * (min. 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                2. Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Farhan Ali Khan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +92 333 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street / Tehsil / Nowshera"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact & Medical Info */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                3. Emergency Contact & Clinical Notes (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Asma Khan"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse / Sibling"
                    value={formData.emergencyRelationship}
                    onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+92 3xx xxxxxxx"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Known Drug Allergies (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Aspirin (comma separated)"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Data saved in Supabase database patient registry.
              </span>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'Creating Patient Account...' : 'Complete Registration'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
