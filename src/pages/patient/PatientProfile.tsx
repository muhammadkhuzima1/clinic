import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { User, Phone, Mail, MapPin, Heart, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const { user, activePatient } = useAuth();

  const [formData, setFormData] = useState({
    name: activePatient?.name || user?.name || '',
    email: activePatient?.email || user?.email || '',
    phone: activePatient?.phone || '',
    dob: activePatient?.dob || '1995-01-01',
    gender: activePatient?.gender || 'Male',
    bloodGroup: activePatient?.bloodGroup || 'B+',
    address: activePatient?.address || '',
    emergencyName: activePatient?.emergencyContact?.name || '',
    emergencyRelationship: activePatient?.emergencyContact?.relationship || '',
    emergencyPhone: activePatient?.emergencyContact?.phone || '',
    allergies: (activePatient?.allergies || []).join(', '),
  });

  useEffect(() => {
    if (activePatient) {
      setFormData({
        name: activePatient.name || '',
        email: activePatient.email || '',
        phone: activePatient.phone || '',
        dob: activePatient.dob || '1995-01-01',
        gender: activePatient.gender || 'Male',
        bloodGroup: activePatient.bloodGroup || 'B+',
        address: activePatient.address || '',
        emergencyName: activePatient.emergencyContact?.name || '',
        emergencyRelationship: activePatient.emergencyContact?.relationship || '',
        emergencyPhone: activePatient.emergencyContact?.phone || '',
        allergies: (activePatient.allergies || []).join(', '),
      });
    }
  }, [activePatient]);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSaving(true);
    setError('');

    try {
      await supabaseService.updatePatientProfile(user.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRelationship,
          phone: formData.emergencyPhone,
        },
        allergies: formData.allergies
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Profile & Health File</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Keep your contact information and emergency health details up to date
        </p>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile changes saved successfully in Nowshera Family Clinic records.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Profile Card Header */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xl border-2 border-white shadow-sm">
            {formData.name ? formData.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{formData.name || 'Patient'}</h3>
            <span className="text-xs text-slate-500">
              Account ID: <strong className="font-mono">{user?.id?.slice(0, 8)}...</strong>
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                Blood Group: {formData.bloodGroup || 'Not specified'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Section 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Personal & Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 3xx xxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
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
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Sector / Tehsil / Nowshera"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Section 2 */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Emergency Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  placeholder="e.g. Asma Khan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.emergencyRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                  placeholder="e.g. Spouse / Brother"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="+92 3xx xxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Clinical Notes & Drug Allergies
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Known Drug Allergies (comma separated)
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Aspirin, Sulfa drugs"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              id="save-patient-profile-btn"
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 disabled:bg-teal-400 shadow-xs transition-all active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
