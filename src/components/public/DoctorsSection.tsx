import React, { useState } from 'react';
import { Doctor } from '../../types';
import { Stethoscope, Calendar, Clock, MapPin, CheckCircle, Search, Award } from 'lucide-react';

interface DoctorsSectionProps {
  doctors: Doctor[];
  onBookWithDoctor: (doctorId: string) => void;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({ doctors, onBookWithDoctor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const specialties = ['All', ...Array.from(new Set(doctors.map(d => d.specialty)))];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.qualification.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <section id="doctors-section" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200/60">
            Medical Faculty & Specialists
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Consult With Our Qualified Doctors
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Every specialist at Nowshera Family Clinic brings extensive hospital experience and board certifications to deliver patient-centered diagnostics and treatment.
          </p>
        </div>

        {/* Search & Specialty Filter */}
        <div className="max-w-2xl mx-auto mb-10 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Specialties' : s}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              id={`doctor-card-${doc.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Doctor Card Top Banner */}
                <div className="p-6 pb-4 flex gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        doc.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={doc.isActive ? 'Active & Available' : 'Currently On Leave'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-xs text-teal-700 font-semibold mb-1">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span className="truncate">{doc.specialty}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 truncate">{doc.name}</h3>

                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{doc.qualification}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Award className="w-3 h-3 text-slate-500" />
                        {doc.experienceYears} Years Exp
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3 h-3" />
                        {doc.roomNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio text */}
                <div className="px-6 py-2">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{doc.bio}</p>
                </div>

                {/* Available Days Schedule */}
                <div className="px-6 py-3 bg-slate-50/70 border-t border-b border-slate-100 mt-3 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Available Hours:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {doc.availableHours.start} - {doc.availableHours.end}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                      const fullDay = {
                        Mon: 'Monday',
                        Tue: 'Tuesday',
                        Wed: 'Wednesday',
                        Thu: 'Thursday',
                        Fri: 'Friday',
                        Sat: 'Saturday',
                      }[day]!;
                      const isAvailable = doc.availableDays.includes(fullDay);
                      return (
                        <span
                          key={day}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            isAvailable
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-slate-200/50 text-slate-400'
                          }`}
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer: Fee & Action */}
              <div className="p-6 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-medium block">Consultation Fee</span>
                  <span className="text-base font-bold text-slate-900">PKR {doc.consultationFee}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onBookWithDoctor(doc.id)}
                  disabled={!doc.isActive}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                    doc.isActive
                      ? 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{doc.isActive ? 'Book Slot' : 'Unavailable'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm">No doctors match your search or specialty criteria.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('All');
              }}
              className="mt-3 text-xs font-semibold text-teal-700 underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
