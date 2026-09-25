import React from 'react';
import { MapPin, Clock, Phone, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CLINIC_INFO } from '../../data/mockData';

export const HoursLocationSection: React.FC = () => {
  return (
    <section id="hours-location-section" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200/60">
            Visit Our Clinic
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Location & Operating Hours
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Conveniently positioned on the main arterial G.T. Road in Nowshera with dedicated parking, ambulance drop-off, and wheelchair access.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Operating Hours Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Clinic Timings</h3>
                <p className="text-xs text-slate-500">Scheduled Outpatient Appointments</p>
              </div>
            </div>

            <div className="space-y-4">
              {CLINIC_INFO.workingHours.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 gap-1"
                >
                  <span className="font-semibold text-slate-800 text-sm">{item.days}</span>
                  <span className="text-teal-700 font-bold text-xs sm:text-sm bg-white px-2.5 py-1 rounded-md border border-slate-200/60">
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>

            {/* Emergency note */}
            <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">Emergency & Observation</h4>
                <p className="text-xs text-rose-700 mt-1">
                  Urgent wound dressing, nebulization, and emergency stabilizing care is available 24/7. Call our emergency direct line: <strong>{CLINIC_INFO.emergencyLine}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Location & Interactive Directions Card */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Find Us in Nowshera</h3>
                  <p className="text-xs text-slate-500">Prime location near Cantonment commercial area</p>
                </div>
              </div>

              {/* Styled Interactive Location Visual */}
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative mb-6">
                {/* Visual landmark representation */}
                <div className="p-6 bg-gradient-to-r from-teal-900 to-slate-900 text-white relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-teal-300 font-semibold uppercase tracking-wider block">Nowshera Center</span>
                      <h4 className="text-xl font-bold mt-1">Grand Trunk (G.T.) Road</h4>
                      <p className="text-xs text-slate-300 mt-1">Opposite Cantonment Hospital / Near City Police Station</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-400/30">
                      Open Today
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-400 block">From Motorway M1:</span>
                      <span className="font-semibold text-white">8 mins via Cantt Exit</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">From Railway Station:</span>
                      <span className="font-semibold text-white">4 mins drive</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Parking:</span>
                      <span className="font-semibold text-emerald-300">Dedicated Free Bay</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-teal-600" />
                    <span>GPS: 34.0153° N, 71.9813° E (Nowshera District, KPK)</span>
                  </div>
                  <span className="text-teal-700 font-semibold">Easy Landmark Access</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Spacious waiting lounge with air purification & chilled water dispensers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Wheelchair ramps and ground-floor accessibility for elderly & injured patients</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>On-premise pharmacy and pathology collection booth</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 mt-6">
              <div className="text-xs text-slate-500">
                <span>Direct Reception Line: </span>
                <strong className="text-slate-900 font-bold">{CLINIC_INFO.phone}</strong>
              </div>
              <div className="text-xs text-teal-700 font-medium">
                WhatsApp: <strong>{CLINIC_INFO.whatsapp}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
