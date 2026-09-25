import React from 'react';
import { Calendar, ShieldCheck, Clock, Award, ChevronRight, Stethoscope, Users } from 'lucide-react';

interface HeroProps {
  onBookClick: () => void;
  onExploreDoctors: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBookClick, onExploreDoctors }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-white to-slate-50 py-16 lg:py-24 border-b border-slate-200/60">
      {/* Subtle decorative background circles */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-200/80 text-teal-800 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Compassionate Family Healthcare in Nowshera</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight lg:leading-tight">
              Quality Healthcare for You & Your <span className="text-teal-700">Family</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Book guaranteed 30-minute consultations with top medical specialists. From pediatric vaccinations and maternal health to family medicine and computerized pathology testing.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-book-btn"
                type="button"
                onClick={onBookClick}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-700 text-white font-semibold text-base hover:bg-teal-800 shadow-md shadow-teal-700/20 active:scale-98 transition-all"
              >
                <Calendar className="w-5 h-5" />
                <span>Book Doctor Appointment</span>
              </button>

              <button
                id="hero-doctors-btn"
                type="button"
                onClick={onExploreDoctors}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-base border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
              >
                <span>Find a Doctor</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Micro proof points */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/70 max-w-lg">
              <div>
                <span className="text-2xl font-bold text-slate-900 block">30 Min</span>
                <span className="text-xs text-slate-500 font-medium">Guaranteed Slots</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-teal-700 block">6+</span>
                <span className="text-xs text-slate-500 font-medium">Specialist Doctors</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-900 block">4.9 / 5</span>
                <span className="text-xs text-slate-500 font-medium">Patient Satisfaction</span>
              </div>
            </div>
          </div>

          {/* Right visual card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80"
                  alt="Nowshera Family Clinic Doctor consultation"
                  className="w-full h-80 object-cover"
                />
              </div>

              {/* Floating feature badge 1 */}
              <div className="absolute -top-4 -left-4 bg-white/95 backdrop-blur-xs p-3.5 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Minimal Wait Time</span>
                  <span className="text-sm font-bold text-slate-900 block">Scheduled OPD Slots</span>
                </div>
              </div>

              {/* Floating feature badge 2 */}
              <div className="absolute -bottom-5 -right-4 bg-white/95 backdrop-blur-xs p-3.5 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Experienced Doctors</span>
                  <span className="text-sm font-bold text-slate-900 block">Certified FCPS / MRCP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
