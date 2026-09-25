import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { Appointment, VisitNotes, Patient, Doctor } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  AlertTriangle,
  Stethoscope,
  Activity,
  Heart,
  Eye,
  Check,
  X,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user, activeDoctor } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(activeDoctor || null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load doctor profile if not already in context
  useEffect(() => {
    let isMounted = true;
    if (activeDoctor) {
      setDoctor(activeDoctor);
    } else if (user?.id) {
      supabaseService.getDoctors().then((allDocs) => {
        if (!isMounted) return;
        const matchingDoc =
          allDocs.find((d) => d.id === user.id || d.id === user.doctorId || d.email === user.email) || null;
        setDoctor(matchingDoc);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user, activeDoctor]);

  const loadAppointments = async () => {
    if (!doctor?.id && !user?.id) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const docId = doctor?.id || user?.id || '';
      const data = await supabaseService.getAppointments({
        doctorId: docId,
      });
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (doctor?.id || user?.id) {
      loadAppointments();
    }
  }, [doctor?.id, user?.id]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const pendingRequests = appointments.filter((a) => a.status === 'Pending');
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;

  // Modals
  const [rejectModalApt, setRejectModalApt] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [notesModalApt, setNotesModalApt] = useState<Appointment | null>(null);
  const [visitNotesData, setVisitNotesData] = useState<VisitNotes>({
    symptoms: '',
    diagnosis: '',
    prescription: '',
    vitalSigns: {
      bloodPressure: '120/80 mmHg',
      temperature: '98.6 F',
      pulse: '74 bpm',
      weightKg: 70,
    },
    followUpDate: '',
    addedAt: '',
  });

  const [patientModal, setPatientModal] = useState<Patient | null>(null);

  const handleConfirmAppointment = async (aptId: string) => {
    await supabaseService.updateAppointmentStatus(aptId, 'Confirmed');
    await loadAppointments();
  };

  const handleConfirmReject = async () => {
    if (!rejectModalApt) return;
    await supabaseService.updateAppointmentStatus(
      rejectModalApt.id,
      'Rejected',
      rejectReason || 'Doctor unavailable at requested slot'
    );
    setRejectModalApt(null);
    setRejectReason('');
    await loadAppointments();
  };

  const handleMarkNoShow = async (aptId: string) => {
    await supabaseService.updateAppointmentStatus(
      aptId,
      'No-show',
      'Patient did not arrive for scheduled slot'
    );
    await loadAppointments();
  };

  const handleSaveVisitNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesModalApt) return;
    const docId = doctor?.id || notesModalApt.doctorId;
    if (!docId) return;

    await supabaseService.addVisitNotes(
      notesModalApt.id,
      {
        ...visitNotesData,
        addedAt: new Date().toISOString(),
      },
      docId,
      notesModalApt.patientId
    );

    setNotesModalApt(null);
    await loadAppointments();
  };

  const handleViewPatient = async (patientId: string) => {
    const p = await supabaseService.getPatientById(patientId);
    if (p) {
      setPatientModal(p);
    }
  };

  return (
    <div className="space-y-6">
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center font-bold text-2xl shadow-sm text-white">
            {doctor?.avatar ? (
              <img
                src={doctor.avatar}
                alt={doctor.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              doctor?.name?.charAt(0) || 'D'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight">
                {doctor?.name || user?.name || 'Doctor OPD'}
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {doctor?.isActive ? 'Active on OPD' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              {doctor?.specialty || 'General Practice'} • {doctor?.qualification || 'MBBS'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
              <span>
                Chamber: <strong className="text-white">{doctor?.roomNumber || 'Room 101'}</strong>
              </span>
              <span>•</span>
              <span>
                Consultation Hours:{' '}
                <strong className="text-white">
                  {doctor?.availableHours?.start || '09:00'} - {doctor?.availableHours?.end || '17:00'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-semibold">
              Today's Date
            </span>
            <span className="text-xs font-bold text-white">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          id="doc-stat-today"
          title="Today's Appointments"
          value={todayAppointments.length}
          subtitle="Scheduled for today"
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          id="doc-stat-pending"
          title="Pending Requests"
          value={pendingRequests.length}
          subtitle="Awaiting doctor confirmation"
          icon={Clock}
          color="amber"
        />
        <StatCard
          id="doc-stat-completed"
          title="Completed Total"
          value={completedCount}
          subtitle="Visits treated & closed"
          icon={CheckCircle}
          color="teal"
        />
        <StatCard
          id="doc-stat-patients"
          title="Consultation Fee"
          value={`PKR ${doctor?.consultationFee || 1500}`}
          subtitle="Per 30-minute consultation"
          icon={Stethoscope}
          color="blue"
        />
      </div>

      {/* Pending Appointment Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
              <h3 className="text-base font-bold text-amber-950">
                Pending Patient Requests ({pendingRequests.length})
              </h3>
            </div>
            <span className="text-xs text-amber-800 font-medium">Please review & confirm slots</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{apt.patientName}</h4>
                      <span className="text-xs text-slate-500 font-mono">Tel: {apt.patientPhone}</span>
                    </div>
                    <StatusBadge status={apt.status} size="sm" />
                  </div>

                  <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      {apt.date}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-teal-700">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {apt.timeSlot}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600">
                    <strong className="text-slate-700">Complaint: </strong>
                    <span>{apt.reasonForVisit}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewPatient(apt.patientId)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Patient Profile</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectModalApt(apt);
                        setRejectReason('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmAppointment(apt.id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Request</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule & Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Appointment Queue</h3>
            <p className="text-xs text-slate-500">Patients booked for today ({todayStr})</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {todayAppointments.length} Patient{todayAppointments.length !== 1 ? 's' : ''} Today
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs text-slate-400">
            Loading appointments from database...
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200/70 p-4">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No appointments scheduled for today</p>
            <p className="text-xs text-slate-400 mt-1">
              New patient appointments booked for today will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Time Slot</th>
                  <th className="py-3.5 px-4">Patient Name & Phone</th>
                  <th className="py-3.5 px-4">Chief Complaint</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-teal-800">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {apt.timeSlot}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewPatient(apt.patientId)}
                          className="font-bold text-slate-900 hover:text-teal-700 text-left transition-colors"
                        >
                          {apt.patientName}
                        </button>
                      </div>
                      <span className="text-xs text-slate-400 block font-mono">{apt.patientPhone}</span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 text-xs">
                      {apt.reasonForVisit}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={apt.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleConfirmAppointment(apt.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectModalApt(apt);
                                setRejectReason('');
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {apt.status === 'Confirmed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setNotesModalApt(apt);
                                setVisitNotesData({
                                  symptoms: apt.reasonForVisit || '',
                                  diagnosis: '',
                                  prescription: '',
                                  vitalSigns: {
                                    bloodPressure: '120/80 mmHg',
                                    temperature: '98.6 F',
                                    pulse: '74 bpm',
                                    weightKg: 70,
                                  },
                                  followUpDate: '',
                                  addedAt: '',
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 flex items-center gap-1 shadow-xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Visit Notes / Complete</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkNoShow(apt.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                              title="Patient did not show up"
                            >
                              No-show
                            </button>
                          </>
                        )}

                        {apt.status === 'Completed' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setNotesModalApt(apt);
                                setVisitNotesData({
                                  symptoms: apt.visitNotes?.symptoms || apt.reasonForVisit || '',
                                  diagnosis: apt.visitNotes?.diagnosis || '',
                                  prescription: apt.visitNotes?.prescription || '',
                                  vitalSigns: apt.visitNotes?.vitalSigns || {
                                    bloodPressure: '120/80 mmHg',
                                    temperature: '98.6 F',
                                    pulse: '74 bpm',
                                    weightKg: 70,
                                  },
                                  followUpDate: apt.visitNotes?.followUpDate || '',
                                  addedAt: apt.visitNotes?.addedAt || '',
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 flex items-center gap-1 border border-teal-200 transition-colors"
                              title="Add or Edit clinical notes & prescription"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{apt.visitNotes ? 'Edit Notes' : 'Add Notes'}</span>
                            </button>
                            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          </div>
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

      {/* Modal: Add Visit Notes */}
      <Modal
        isOpen={!!notesModalApt}
        onClose={() => setNotesModalApt(null)}
        title="Patient Consultation & Visit Summary"
        subtitle={`Recording Visit Notes for ${notesModalApt?.patientName} (${notesModalApt?.date} - ${notesModalApt?.timeSlot})`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveVisitNotes} className="space-y-4 text-xs sm:text-sm">
          {/* Vitals Input Row */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Vital Signs Measurement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Blood Pressure</label>
                <input
                  type="text"
                  placeholder="e.g. 120/80 mmHg"
                  value={visitNotesData.vitalSigns?.bloodPressure}
                  onChange={(e) =>
                    setVisitNotesData({
                      ...visitNotesData,
                      vitalSigns: { ...visitNotesData.vitalSigns, bloodPressure: e.target.value },
                    })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Body Temp</label>
                <input
                  type="text"
                  placeholder="e.g. 98.6 F"
                  value={visitNotesData.vitalSigns?.temperature}
                  onChange={(e) =>
                    setVisitNotesData({
                      ...visitNotesData,
                      vitalSigns: { ...visitNotesData.vitalSigns, temperature: e.target.value },
                    })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Pulse Rate</label>
                <input
                  type="text"
                  placeholder="e.g. 74 bpm"
                  value={visitNotesData.vitalSigns?.pulse}
                  onChange={(e) =>
                    setVisitNotesData({
                      ...visitNotesData,
                      vitalSigns: { ...visitNotesData.vitalSigns, pulse: e.target.value },
                    })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Weight (Kg)</label>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  value={visitNotesData.vitalSigns?.weightKg || ''}
                  onChange={(e) =>
                    setVisitNotesData({
                      ...visitNotesData,
                      vitalSigns: { ...visitNotesData.vitalSigns, weightKg: Number(e.target.value) },
                    })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Presented Clinical Symptoms *
            </label>
            <textarea
              required
              rows={2}
              value={visitNotesData.symptoms}
              onChange={(e) => setVisitNotesData({ ...visitNotesData, symptoms: e.target.value })}
              placeholder="Detailed complaint as described by the patient..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Diagnosis / Assessment *
            </label>
            <input
              type="text"
              required
              value={visitNotesData.diagnosis}
              onChange={(e) => setVisitNotesData({ ...visitNotesData, diagnosis: e.target.value })}
              placeholder="e.g. Essential Hypertension Grade 1, Acute Bronchitis..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prescription & Treatment Advice *
            </label>
            <textarea
              required
              rows={4}
              value={visitNotesData.prescription}
              onChange={(e) => setVisitNotesData({ ...visitNotesData, prescription: e.target.value })}
              placeholder="Medication names, dosage, frequency, and lifestyle directions..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recommended Follow-Up Date (optional)
            </label>
            <input
              type="date"
              value={visitNotesData.followUpDate}
              onChange={(e) => setVisitNotesData({ ...visitNotesData, followUpDate: e.target.value })}
              className="w-full sm:w-64 p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNotesModalApt(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
            >
              Save Notes & Mark Completed
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reject Request */}
      <Modal
        isOpen={!!rejectModalApt}
        onClose={() => setRejectModalApt(null)}
        title="Reject Appointment Request"
        subtitle={`Patient: ${rejectModalApt?.patientName} (${rejectModalApt?.date} • ${rejectModalApt?.timeSlot})`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600">
            Please provide a polite reason for declining this consultation request:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for rejection:
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Doctor called for emergency surgery, clinic closing early for hospital rounds..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectModalApt(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Patient Details Card */}
      <Modal
        isOpen={!!patientModal}
        onClose={() => setPatientModal(null)}
        title="Patient Medical Profile"
        subtitle={`Records for ${patientModal?.name} (ID: ${patientModal?.id})`}
        maxWidth="lg"
      >
        {patientModal && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-lg border">
                {patientModal.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{patientModal.name}</h4>
                <p className="text-xs text-slate-500">Gender: {patientModal.gender} • DOB: {patientModal.dob}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
                    Blood: {patientModal.bloodGroup}
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono">
                    {patientModal.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Allergies banner */}
            {patientModal.allergies && patientModal.allergies.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-900">Drug Allergies Alert:</strong>
                  <span>{patientModal.allergies.join(', ')}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Address:</span>
                <span className="text-slate-800 font-medium">{patientModal.address || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Emergency Contact:</span>
                <span className="text-slate-800 font-medium">
                  {patientModal.emergencyContact?.name || 'N/A'}{' '}
                  {patientModal.emergencyContact?.relationship
                    ? `(${patientModal.emergencyContact.relationship})`
                    : ''}{' '}
                  {patientModal.emergencyContact?.phone ? `- ${patientModal.emergencyContact.phone}` : ''}
                </span>
              </div>
            </div>

            {/* Patient Consultation History */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                <span>Appointment History with Dr. {doctor?.name || 'You'}</span>
              </h5>
              {appointments.filter((a) => a.patientId === patientModal.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  No prior consultations recorded for this patient.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {appointments
                    .filter((a) => a.patientId === patientModal.id)
                    .map((apt) => (
                      <div key={apt.id} className="p-2.5 bg-white text-xs hover:bg-slate-50 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            <span>{apt.date}</span>
                            <span className="text-teal-700 font-mono text-[11px]">{apt.timeSlot}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            Complaint: {apt.reasonForVisit || 'General Consultation'}
                          </div>
                          {apt.visitNotes?.diagnosis && (
                            <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                              Diagnosis: {apt.visitNotes.diagnosis}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={apt.status} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPatientModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
