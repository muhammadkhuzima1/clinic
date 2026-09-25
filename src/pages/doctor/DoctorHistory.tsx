import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { Appointment, VisitNotes } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Calendar,
  Clock,
  FileText,
  User,
  Filter,
  Eye,
  Edit3,
  CheckCircle,
  Save,
  AlertCircle,
} from 'lucide-react';

export const DoctorHistory: React.FC = () => {
  const { user, activeDoctor } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  // Note editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [editNotesData, setEditNotesData] = useState({
    symptoms: '',
    diagnosis: '',
    prescription: '',
    bloodPressure: '120/80 mmHg',
    temperature: '98.6 F',
    pulse: '74 bpm',
    weightKg: 70,
    followUpDate: '',
  });

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const docId = activeDoctor?.id || user?.id || user?.doctorId;
      if (!docId) {
        setAppointments([]);
        setIsLoading(false);
        return;
      }

      const data = await supabaseService.getAppointments({
        doctorId: docId,
      });
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching doctor consultation history:', err);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id, activeDoctor?.id]);

  const openViewNotes = (apt: Appointment) => {
    setSelectedApt(apt);
    setIsEditingNotes(false);
    setNotesError('');
    setEditNotesData({
      symptoms: apt.visitNotes?.symptoms || apt.reasonForVisit || '',
      diagnosis: apt.visitNotes?.diagnosis || '',
      prescription: apt.visitNotes?.prescription || '',
      bloodPressure: apt.visitNotes?.vitalSigns?.bloodPressure || '120/80 mmHg',
      temperature: apt.visitNotes?.vitalSigns?.temperature || '98.6 F',
      pulse: apt.visitNotes?.vitalSigns?.pulse || '74 bpm',
      weightKg: apt.visitNotes?.vitalSigns?.weightKg || 70,
      followUpDate: apt.visitNotes?.followUpDate || '',
    });
  };

  const openEditNotes = (apt: Appointment) => {
    setSelectedApt(apt);
    setIsEditingNotes(true);
    setNotesError('');
    setEditNotesData({
      symptoms: apt.visitNotes?.symptoms || apt.reasonForVisit || '',
      diagnosis: apt.visitNotes?.diagnosis || '',
      prescription: apt.visitNotes?.prescription || '',
      bloodPressure: apt.visitNotes?.vitalSigns?.bloodPressure || '120/80 mmHg',
      temperature: apt.visitNotes?.vitalSigns?.temperature || '98.6 F',
      pulse: apt.visitNotes?.vitalSigns?.pulse || '74 bpm',
      weightKg: apt.visitNotes?.vitalSigns?.weightKg || 70,
      followUpDate: apt.visitNotes?.followUpDate || '',
    });
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;

    if (!editNotesData.symptoms.trim() || !editNotesData.diagnosis.trim() || !editNotesData.prescription.trim()) {
      setNotesError('Please provide symptoms, diagnosis, and prescription.');
      return;
    }

    setIsSavingNotes(true);
    setNotesError('');

    try {
      const docId = activeDoctor?.id || user?.id || selectedApt.doctorId;
      const notesPayload: VisitNotes = {
        symptoms: editNotesData.symptoms.trim(),
        diagnosis: editNotesData.diagnosis.trim(),
        prescription: editNotesData.prescription.trim(),
        vitalSigns: {
          bloodPressure: editNotesData.bloodPressure,
          temperature: editNotesData.temperature,
          pulse: editNotesData.pulse,
          weightKg: Number(editNotesData.weightKg) || 70,
        },
        followUpDate: editNotesData.followUpDate || undefined,
        addedAt: new Date().toISOString().split('T')[0],
      };

      await supabaseService.addVisitNotes(
        selectedApt.id,
        notesPayload,
        docId,
        selectedApt.patientId
      );

      // Update local state
      setSelectedApt((prev) => (prev ? { ...prev, status: 'Completed', visitNotes: notesPayload } : null));
      setIsEditingNotes(false);
      await loadHistory();
    } catch (err: any) {
      setNotesError(err?.message || 'Failed to save visit notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.patientPhone.includes(search) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.date.includes(search);

    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Consultation History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete archive of patient visits, clinical diagnoses, and prescriptions
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Completed', 'Confirmed', 'Pending', 'Cancelled', 'Rejected', 'No-show'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, phone, or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Loading consultation records from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No consultations found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Chief Complaint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Clinical Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
                      #{apt.id}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{apt.date}</div>
                      <span className="text-[11px] text-teal-700 font-bold">{apt.timeSlot}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{apt.patientName}</div>
                      <span className="text-xs text-slate-400 font-mono">{apt.patientPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 text-xs">
                      {apt.reasonForVisit}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.visitNotes ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openViewNotes(apt)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors inline-flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Rx</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditNotes(apt)}
                              className="p-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 transition-colors inline-flex items-center"
                              title="Edit Clinical Notes"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : apt.status === 'Completed' || apt.status === 'Confirmed' ? (
                          <button
                            type="button"
                            onClick={() => openEditNotes(apt)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Add Notes</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 italic">No notes</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: View / Edit Consultation Note */}
      <Modal
        isOpen={!!selectedApt}
        onClose={() => {
          setSelectedApt(null);
          setIsEditingNotes(false);
        }}
        title={isEditingNotes ? 'Edit Clinical Visit Notes' : 'Consultation Record & Clinical Summary'}
        subtitle={`Patient: ${selectedApt?.patientName} • Visit Date: ${selectedApt?.date}`}
        maxWidth="lg"
      >
        {selectedApt && (
          <div>
            {notesError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{notesError}</span>
              </div>
            )}

            {!isEditingNotes && selectedApt.visitNotes ? (
              <div className="space-y-4 text-xs sm:text-sm">
                {selectedApt.visitNotes.vitalSigns && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-1.5">Vital Signs</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">BP:</span>
                        <strong className="text-slate-800">{selectedApt.visitNotes.vitalSigns.bloodPressure || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Temp:</span>
                        <strong className="text-slate-800">{selectedApt.visitNotes.vitalSigns.temperature || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Pulse:</span>
                        <strong className="text-slate-800">{selectedApt.visitNotes.vitalSigns.pulse || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Weight:</span>
                        <strong className="text-slate-800">
                          {selectedApt.visitNotes.vitalSigns.weightKg
                            ? `${selectedApt.visitNotes.vitalSigns.weightKg} kg`
                            : 'N/A'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Symptoms:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 border border-slate-200 text-xs">
                    {selectedApt.visitNotes.symptoms}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Diagnosis:</span>
                  <p className="p-2.5 bg-emerald-50 rounded-lg text-emerald-900 font-semibold border border-emerald-200 text-xs">
                    {selectedApt.visitNotes.diagnosis}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Prescription & Advice:</span>
                  <p className="p-3 bg-slate-50 rounded-lg text-slate-800 border border-slate-200 text-xs font-mono whitespace-pre-line leading-relaxed">
                    {selectedApt.visitNotes.prescription}
                  </p>
                </div>

                {selectedApt.visitNotes.followUpDate && (
                  <div className="p-2.5 bg-teal-50 rounded-lg border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
                    <span className="font-semibold">Recommended Follow-up:</span>
                    <span className="font-bold">{selectedApt.visitNotes.followUpDate}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(true)}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Clinical Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedApt(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveNotes} className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chief Symptoms & Presentation *</label>
                  <textarea
                    rows={2}
                    value={editNotesData.symptoms}
                    onChange={(e) => setEditNotesData({ ...editNotesData, symptoms: e.target.value })}
                    required
                    placeholder="e.g., Persistent dry cough for 5 days, low-grade fever..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosis & Assessment *</label>
                  <input
                    type="text"
                    value={editNotesData.diagnosis}
                    onChange={(e) => setEditNotesData({ ...editNotesData, diagnosis: e.target.value })}
                    required
                    placeholder="e.g., Acute Upper Respiratory Tract Infection (URTI)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
                  />
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">BP</label>
                    <input
                      type="text"
                      value={editNotesData.bloodPressure}
                      onChange={(e) => setEditNotesData({ ...editNotesData, bloodPressure: e.target.value })}
                      placeholder="120/80 mmHg"
                      className="w-full p-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Temp</label>
                    <input
                      type="text"
                      value={editNotesData.temperature}
                      onChange={(e) => setEditNotesData({ ...editNotesData, temperature: e.target.value })}
                      placeholder="98.6 F"
                      className="w-full p-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Pulse</label>
                    <input
                      type="text"
                      value={editNotesData.pulse}
                      onChange={(e) => setEditNotesData({ ...editNotesData, pulse: e.target.value })}
                      placeholder="74 bpm"
                      className="w-full p-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Weight (kg)</label>
                    <input
                      type="number"
                      value={editNotesData.weightKg}
                      onChange={(e) => setEditNotesData({ ...editNotesData, weightKg: Number(e.target.value) })}
                      placeholder="70"
                      className="w-full p-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prescription & Medical Regimen *</label>
                  <textarea
                    rows={4}
                    value={editNotesData.prescription}
                    onChange={(e) => setEditNotesData({ ...editNotesData, prescription: e.target.value })}
                    required
                    placeholder="1. Tab Panadol 500mg 1 tab TDS after meals&#10;2. Syp Hydryllin 2 tsp BD x 5 days&#10;3. Steam inhalation twice daily"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recommended Follow-Up Date (Optional)</label>
                  <input
                    type="date"
                    value={editNotesData.followUpDate}
                    onChange={(e) => setEditNotesData({ ...editNotesData, followUpDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedApt.visitNotes) {
                        setIsEditingNotes(false);
                      } else {
                        setSelectedApt(null);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNotes}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingNotes ? 'Saving Notes...' : 'Save Clinical Record'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
