import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { Patient, Appointment } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Users,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  Eye,
} from 'lucide-react';

export const AdminPatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pats, apts] = await Promise.all([
        supabaseService.getPatients(),
        supabaseService.getAppointments(),
      ]);
      setPatients(pats);
      setAllAppointments(apts);
    } catch (err) {
      console.error('Error loading patients from Supabase:', err);
      setPatients([]);
      setAllAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.bloodGroup.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const patientAppointments = selectedPatient
    ? allAppointments.filter(
        (a) => a.patientId === selectedPatient.id || a.patientEmail === selectedPatient.email
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Registry & Clinical Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search registered clinic patients, check contact info, and inspect medical consultation records
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or blood group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          {filteredPatients.length} Patient{filteredPatients.length !== 1 ? 's' : ''} Listed
        </span>
      </div>

      {/* Patient Cards Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          Loading registered patients from Supabase...
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No patients found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search
              ? 'No patients matched your search query.'
              : 'No patient accounts exist yet in Supabase. Real patients appear here when they register.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const apts = allAppointments.filter(
              (a) => a.patientId === patient.id || a.patientEmail === patient.email
            );
            const completedCount = apts.filter((a) => a.status === 'Completed').length;

            return (
              <div
                key={patient.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-base border border-slate-200 shrink-0">
                      {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{patient.name}</h3>
                        <span className="text-[10px] font-mono text-slate-400">
                          #{patient.id.slice(0, 6)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block truncate">{patient.email}</span>
                      <span className="text-xs text-slate-700 font-mono block mt-0.5">{patient.phone}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
                      Blood: {patient.bloodGroup || 'N/A'}
                    </span>
                    <span className="text-slate-500">
                      Gender: <strong>{patient.gender}</strong>
                    </span>
                    <span className="text-slate-500">
                      Visits: <strong>{apts.length}</strong> ({completedCount} done)
                    </span>
                  </div>

                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Allergies: {patient.allergies.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    DOB: {patient.dob || 'N/A'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(patient)}
                    className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View History</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Detailed History Modal */}
      <Modal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title="Patient Dossier & Consultation History"
        subtitle={`Patient: ${selectedPatient?.name} (ID: ${selectedPatient?.id})`}
        maxWidth="2xl"
      >
        {selectedPatient && (
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Demographic header */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedPatient.name}</h4>
                <p className="text-xs text-slate-500">
                  {selectedPatient.email} • {selectedPatient.phone}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Address: {selectedPatient.address || 'N/A'}
                </p>
              </div>
              <div className="text-right sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-800 font-bold text-xs">
                  Blood Group: {selectedPatient.bloodGroup || 'N/A'}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Emergency: {selectedPatient.emergencyContact?.name || 'N/A'}{' '}
                  {selectedPatient.emergencyContact?.relationship
                    ? `(${selectedPatient.emergencyContact.relationship})`
                    : ''}{' '}
                  {selectedPatient.emergencyContact?.phone ? `- ${selectedPatient.emergencyContact.phone}` : ''}
                </p>
              </div>
            </div>

            {/* Consultations history */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Appointment History ({patientAppointments.length} records)
              </h5>

              {patientAppointments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 bg-white border border-slate-200 rounded-xl">
                  No appointments registered for this patient.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {patientAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{apt.doctorName}</span>
                          <span className="text-teal-700 font-medium">({apt.doctorSpecialty})</span>
                        </div>
                        <StatusBadge status={apt.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-3 text-slate-600 font-medium bg-slate-50 p-2 rounded-lg">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          {apt.date}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          {apt.timeSlot}
                        </span>
                        <span className="text-slate-400 ml-auto">OPD Fee: PKR {apt.fee}</span>
                      </div>

                      <p className="text-slate-600">
                        <strong>Reason: </strong> {apt.reasonForVisit}
                      </p>

                      {apt.status === 'Completed' && (
                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-[11px] flex items-center justify-between">
                          <span>Clinical Visit Summary:</span>
                          <span className="font-semibold text-teal-800">Protected Clinical Record (Attending Doctor & Patient Only)</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close Record
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
