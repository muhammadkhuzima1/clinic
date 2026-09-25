import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { Appointment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { checkTwoHourPolicy } from '../../utils/appointmentPolicy';
import {
  Calendar,
  Clock,
  User,
  PlusCircle,
  FileText,
  AlertCircle,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Stethoscope,
  ChevronRight,
  Pill,
} from 'lucide-react';

interface PatientDashboardProps {
  onNavigate: (view: string) => void;
  onBookWithDoctor?: (doctorId: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onNavigate,
}) => {
  const { user, activePatient } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleModalApt, setRescheduleModalApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [viewNotesApt, setViewNotesApt] = useState<Appointment | null>(null);
  const [policyNotice, setPolicyNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    apt?: Appointment;
  } | null>(null);
  const [availableRescheduleSlots, setAvailableRescheduleSlots] = useState<
    { slot: string; isAvailable: boolean }[]
  >([]);

  const loadAppointments = async () => {
    if (!user?.id) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await supabaseService.getAppointments({
        patientId: user.id,
      });
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  // Load available reschedule slots when modal opens and date changes
  useEffect(() => {
    if (rescheduleModalApt && rescheduleDate) {
      supabaseService
        .getAvailableSlots(rescheduleModalApt.doctorId, rescheduleDate)
        .then((slots) => {
          setAvailableRescheduleSlots(slots);
        });
    } else {
      setAvailableRescheduleSlots([]);
    }
  }, [rescheduleModalApt, rescheduleDate]);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'Pending' || a.status === 'Confirmed'
  );

  const completedAppointments = appointments.filter(
    (a) => a.status === 'Completed'
  );

  const handleConfirmCancel = async () => {
    if (!cancelModalApt) return;

    const policy = checkTwoHourPolicy(cancelModalApt.date, cancelModalApt.timeSlot);
    if (!policy.isAllowed) {
      setPolicyNotice({
        isOpen: true,
        title: 'Cancellation Restricted (2-Hour Rule)',
        message:
          policy.reason ||
          'Appointments cannot be cancelled within 2 hours of the scheduled time. Please call the clinic front desk.',
        apt: cancelModalApt,
      });
      setCancelModalApt(null);
      return;
    }

    try {
      await supabaseService.updateAppointmentStatus(
        cancelModalApt.id,
        'Cancelled',
        cancelReason || 'Patient cancelled'
      );
      setCancelModalApt(null);
      setCancelReason('');
      await loadAppointments();
    } catch (err) {
      console.error('Cancel appointment error:', err);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleModalApt || !rescheduleDate || !rescheduleSlot) return;

    const policy = checkTwoHourPolicy(rescheduleModalApt.date, rescheduleModalApt.timeSlot);
    if (!policy.isAllowed) {
      setRescheduleError(
        policy.reason ||
          'Rescheduling is restricted within 2 hours of the scheduled appointment time.'
      );
      return;
    }

    setRescheduleError('');
    try {
      await supabaseService.rescheduleAppointment(
        rescheduleModalApt.id,
        rescheduleDate,
        rescheduleSlot
      );
      setRescheduleModalApt(null);
      setRescheduleDate('');
      setRescheduleSlot('');
      await loadAppointments();
    } catch (err: any) {
      setRescheduleError(
        err.message || 'Double-booking: that slot is unavailable. Please choose another.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Welcome Hero Card */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {activePatient?.avatar ? (
              <img
                src={activePatient.avatar}
                alt={activePatient.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white text-2xl font-bold border border-white/30">
                {user?.name?.charAt(0) || 'P'}
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider block">
                Nowshera Family Clinic • Patient Portal
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {activePatient?.name || user?.name || 'Patient'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-teal-100">
                <span className="bg-teal-900/60 px-2.5 py-0.5 rounded-full border border-teal-600/60">
                  Blood Group: <strong>{activePatient?.bloodGroup || 'Not set'}</strong>
                </span>
                <span className="bg-teal-900/60 px-2.5 py-0.5 rounded-full border border-teal-600/60">
                  Phone: <strong>{activePatient?.phone || user?.email || 'N/A'}</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            id="dashboard-book-cta-btn"
            type="button"
            onClick={() => onNavigate('patient-book')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-teal-800 font-bold text-sm hover:bg-teal-50 shadow-md transition-all active:scale-98 self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-teal-600" />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          id="stat-upcoming"
          title="Upcoming Appointments"
          value={upcomingAppointments.length}
          subtitle="Confirmed & pending visits"
          icon={Calendar}
          color="teal"
        />
        <StatCard
          id="stat-completed"
          title="Completed Visits"
          value={completedAppointments.length}
          subtitle="Past consultations recorded"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          id="stat-prescriptions"
          title="Prescription History"
          value={completedAppointments.filter((a) => a.visitNotes).length}
          subtitle="Clinical diagnoses & advice"
          icon={Pill}
          color="blue"
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upcoming Appointments (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upcoming Appointments</h3>
                <p className="text-xs text-slate-500">Your scheduled doctor visits and status updates</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('patient-appointments')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Loading appointments from database...
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No upcoming appointments</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You do not have any pending or confirmed visits booked at this time.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('patient-book')}
                  className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Book an Appointment</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    id={`upcoming-apt-${apt.id}`}
                    className="p-4 rounded-xl border border-slate-200/90 hover:border-teal-300 hover:shadow-xs transition-all bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{apt.doctorName}</h4>
                          <span className="text-xs text-teal-700 font-medium block">{apt.doctorSpecialty}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">Chamber: {apt.doctorRoom}</span>
                        </div>
                      </div>

                      <StatusBadge status={apt.status} />
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3 text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          {apt.date}
                        </span>
                        <span className="flex items-center gap-1 text-slate-800 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          {apt.timeSlot}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const policy = checkTwoHourPolicy(apt.date, apt.timeSlot);
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!policy.isAllowed) {
                                    setPolicyNotice({
                                      isOpen: true,
                                      title: 'Rescheduling Restricted',
                                      message:
                                        policy.reason ||
                                        'Appointments cannot be rescheduled within 2 hours of the scheduled time.',
                                      apt,
                                    });
                                    return;
                                  }
                                  setRescheduleModalApt(apt);
                                  setRescheduleDate(apt.date);
                                  setRescheduleSlot(apt.timeSlot);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                                  policy.isAllowed
                                    ? 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                                    : 'text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100'
                                }`}
                                title={policy.isAllowed ? 'Change appointment time' : 'Locked (< 2 hours remaining)'}
                              >
                                {!policy.isAllowed ? <Lock className="w-3 h-3 text-amber-600" /> : <RotateCcw className="w-3 h-3" />}
                                <span>Reschedule</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!policy.isAllowed) {
                                    setPolicyNotice({
                                      isOpen: true,
                                      title: 'Cancellation Restricted',
                                      message:
                                        policy.reason ||
                                        'Appointments cannot be cancelled within 2 hours of the scheduled time.',
                                      apt,
                                    });
                                    return;
                                  }
                                  setCancelModalApt(apt);
                                  setCancelReason('');
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                                  policy.isAllowed
                                    ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                                    : 'text-slate-400 bg-slate-100 hover:bg-slate-200 cursor-not-allowed'
                                }`}
                                title={policy.isAllowed ? 'Cancel this visit' : 'Locked (< 2 hours remaining)'}
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Cancel</span>
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong className="text-slate-700">Reason: </strong>
                      <span>{apt.reasonForVisit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Past Visit Records & Notes (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Medical Notes</h3>
                <p className="text-xs text-slate-500">Doctor visit summaries & prescriptions</p>
              </div>
            </div>

            {completedAppointments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No past consultations recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {completedAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{apt.doctorName}</span>
                      <span className="text-[11px] text-slate-500">{apt.date}</span>
                    </div>

                    {apt.visitNotes ? (
                      <div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                          <p className="text-slate-700">
                            <strong>Diagnosis: </strong> {apt.visitNotes.diagnosis}
                          </p>
                          <p className="text-slate-600 line-clamp-2">
                            <strong>Rx: </strong> {apt.visitNotes.prescription}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setViewNotesApt(apt)}
                          className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-800 underline"
                        >
                          View Full Prescription & Vitals
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No notes attached.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Doctor Booking Card */}
          <div className="bg-gradient-to-tr from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 p-5">
            <h4 className="text-sm font-bold text-teal-900 mb-1">Need to see a specialist?</h4>
            <p className="text-xs text-teal-700 mb-3">
              Consult with board-certified doctors in Nowshera. Choose 30-minute OPD consultation slots.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('patient-book')}
              className="w-full py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold text-center transition-colors shadow-xs"
            >
              Browse Doctor Availability
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Cancel Appointment */}
      <Modal
        isOpen={!!cancelModalApt}
        onClose={() => setCancelModalApt(null)}
        title="Cancel Appointment"
        subtitle={`Booking Ref: ${cancelModalApt?.id} with ${cancelModalApt?.doctorName}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600">
            Are you sure you want to cancel your appointment on <strong>{cancelModalApt?.date}</strong> at <strong>{cancelModalApt?.timeSlot}</strong>?
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for cancellation (optional):
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Conflict with work schedule, feeling better, rescheduled elsewhere..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelModalApt(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Keep Appointment
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Reschedule Appointment */}
      <Modal
        isOpen={!!rescheduleModalApt}
        onClose={() => setRescheduleModalApt(null)}
        title="Reschedule Appointment"
        subtitle={`Select a new date and time slot with ${rescheduleModalApt?.doctorName}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Date:
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={rescheduleDate}
              onChange={(e) => {
                setRescheduleDate(e.target.value);
                setRescheduleSlot('');
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select New 30-Minute Slot:
            </label>
            {availableRescheduleSlots.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Doctor is not available or has no slots open on this date.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {availableRescheduleSlots.map(({ slot, isAvailable }) => (
                  <button
                    key={slot}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setRescheduleSlot(slot)}
                    className={`p-2 rounded-lg text-xs font-medium border ${
                      rescheduleSlot === slot
                        ? 'bg-teal-600 text-white border-teal-600 font-bold'
                        : isAvailable
                        ? 'bg-white hover:bg-teal-50 border-slate-200 text-slate-800'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {rescheduleError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {rescheduleError}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRescheduleModalApt(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!rescheduleDate || !rescheduleSlot}
              onClick={handleConfirmReschedule}
              className={`px-5 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${
                !rescheduleDate || !rescheduleSlot
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              Save New Slot
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: View Full Visit Notes */}
      <Modal
        isOpen={!!viewNotesApt}
        onClose={() => setViewNotesApt(null)}
        title="Consultation Visit Summary"
        subtitle={`${viewNotesApt?.doctorName} • ${viewNotesApt?.date}`}
        maxWidth="lg"
      >
        {viewNotesApt?.visitNotes && (
          <div className="space-y-4 text-xs sm:text-sm">
            {viewNotesApt.visitNotes.vitalSigns && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-700 block mb-2">Recorded Vital Signs:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">BP:</span>
                    <strong className="text-slate-800">{viewNotesApt.visitNotes.vitalSigns.bloodPressure || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Temperature:</span>
                    <strong className="text-slate-800">{viewNotesApt.visitNotes.vitalSigns.temperature || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pulse:</span>
                    <strong className="text-slate-800">{viewNotesApt.visitNotes.vitalSigns.pulse || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Weight:</span>
                    <strong className="text-slate-800">
                      {viewNotesApt.visitNotes.vitalSigns.weightKg ? `${viewNotesApt.visitNotes.vitalSigns.weightKg} kg` : 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Presented Symptoms:</span>
              <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                {viewNotesApt.visitNotes.symptoms}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Clinical Diagnosis:</span>
              <p className="text-xs text-teal-800 font-semibold bg-teal-50 p-2.5 rounded-lg border border-teal-200">
                {viewNotesApt.visitNotes.diagnosis}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Prescription & Treatment Advice:</span>
              <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed font-mono">
                {viewNotesApt.visitNotes.prescription}
              </p>
            </div>

            {viewNotesApt.visitNotes.followUpDate && (
              <div className="text-xs text-slate-500">
                <span>Recommended Follow-up: </span>
                <strong className="text-slate-800">{viewNotesApt.visitNotes.followUpDate}</strong>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: 2-Hour Policy Notice */}
      <Modal
        isOpen={!!policyNotice?.isOpen}
        onClose={() => setPolicyNotice(null)}
        title={policyNotice?.title || 'Policy Restriction'}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-amber-950 font-bold">2-Hour Cutoff Enforced</strong>
              <p className="leading-relaxed">{policyNotice?.message}</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
            <span className="font-semibold block text-slate-900">Clinic Front Desk Contact:</span>
            <div className="flex items-center justify-between">
              <span>Reception Hotline:</span>
              <strong className="font-mono text-teal-800">+92 923 560123</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>OPD Location:</span>
              <span className="text-slate-600">Main GT Road, Cantt Plaza, Nowshera</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setPolicyNotice(null)}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
