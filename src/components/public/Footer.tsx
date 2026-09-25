import React from 'react';
import { Stethoscope, Phone, Mail, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';
import { CLINIC_INFO } from '../../data/mockData';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight block">
                  Nowshera Family Clinic
                </span>
                <span className="text-xs text-teal-400 font-medium">
                  Compassionate Patient Care
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Providing trusted, community-focused healthcare in Nowshera. Dedicated to reliable outpatient consultations, pediatric wellness, maternal health, and computerized laboratory diagnostics.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Registered Healthcare Facility • KPK Healthcare Commission</span>
            </div>
          </div>

          {/* Col 2: Quick Links & Portals */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('public-home')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Home & Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('public-about')}
                  className="hover:text-teal-400 transition-colors"
                >
                  About Our Medical Mission
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('public-doctors')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Specialist Doctors Directory
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('public-services')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Clinical Services & Labs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('patient-book')}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  Book 30-Min Appointment
                </button>
              </li>
            </ul>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-3">Staff & User Portals</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('patient-login')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
              >
                Patient Login
              </button>
              <button
                type="button"
                onClick={() => onNavigate('doctor-login')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
              >
                Doctor Login
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin-login')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
              >
                Admin Login
              </button>
            </div>
          </div>

          {/* Col 3: Working Hours */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>OPD & Clinic Hours</span>
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              {CLINIC_INFO.workingHours.map((item, idx) => (
                <div key={idx} className="border-b border-slate-800/80 pb-2">
                  <span className="text-slate-300 font-medium block">{item.days}</span>
                  <span className="text-teal-300 font-semibold">{item.hours}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-400 pt-1">
              <span className="text-rose-400 font-semibold block">Emergency First-Aid:</span>
              <span>Available 24/7 with emergency resident doctor on call.</span>
            </div>
          </div>

          {/* Col 4: Location & Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>Location & Contact</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {CLINIC_INFO.address}
            </p>
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>OPD Reception: <strong className="text-white">{CLINIC_INFO.phone}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Emergency: <strong className="text-white">{CLINIC_INFO.emergencyLine}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Email: <strong className="text-white">{CLINIC_INFO.email}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Nowshera Family Clinic. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for the families of Nowshera
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
