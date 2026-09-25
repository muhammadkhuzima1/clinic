import React from 'react';
import { ShieldCheck, Heart, Award, Users, CheckCircle2 } from 'lucide-react';
import { CLINIC_INFO } from '../../data/mockData';

export const AboutSection: React.FC = () => {
  return (
    <section id="about-section" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Column */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80"
                  alt="Modern Clinic Interior"
                  className="w-full h-[420px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 bg-teal-800 text-white p-5 rounded-2xl shadow-xl max-w-[220px]">
                <span className="text-3xl font-extrabold block">15+</span>
                <span className="text-xs text-teal-200 font-medium">
                  Years serving families across Nowshera & surrounding districts
                </span>
              </div>
            </div>
          </div>

          {/* Text Content Column */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
                About Our Clinic
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                Dedicated to Compassionate Community Healthcare
              </h2>
            </div>

            <p className="text-base text-slate-600 leading-relaxed">
              Founded with the objective of making quality specialist healthcare accessible and timely, 
              <strong> Nowshera Family Clinic</strong> has grown into a cornerstone medical institution along the Grand Trunk Road. We eliminate crowded, chaotic waiting rooms by introducing structured 30-minute appointments, digital patient records, and compassionate patient advocacy.
            </p>

            {/* Core Values / Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {CLINIC_INFO.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Patient First</span>
                  <span className="text-xs text-slate-500">Zero rushed visits</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Rigorous Hygiene</span>
                  <span className="text-xs text-slate-500">Sterile equipment</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Certified Faculty</span>
                  <span className="text-xs text-slate-500">Verified degrees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
