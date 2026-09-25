import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { Appointment, AppointmentStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { checkTwoHourPolicy } from '../../utils/appointmentPolicy';
import {
  Calendar,
  Clock,
  Stethoscope,
  Search,
  PlusCircle,
  RotateCcw,
  XCircle,
  FileText,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface PatientAppointmentsProps {
  onNavigate: (view: string) => void;
}

export const PatientAppointments: React.FC<PatientAppointmentsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'All' | 'Upcoming' | 'Completed' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [availableRescheduleSlots, setAvailableRescheduleSlots] = useState<
    { slot: string; isAvailable: boolean }[]
  >([]);
  const [viewNotesApt, setViewNotesApt] = useState<Appointment | null>(null);
  const [policyNotice, setPolicyNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    apt?: Appointment;
  } | null>(null);

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
      console.error('Error loading patient appointments:', err);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  // Load available reschedule slots when reschedule modal is active
  useEffect(() => {
    if (rescheduleApt && rescheduleDate) {
      supabaseService.getAvailableSlots(rescheduleApt.doctorId, rescheduleDate).then((slots) => {
        setAvailableRescheduleSlots(slots);
      });
    } else {
      setAvailableRescheduleSlots([]);
    }
  }, [rescheduleApt, rescheduleDate]);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctorSpecialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.date.includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeTab === 'Upcoming') {
      return apt.status === 'Pending' || apt.status === 'Confirmed';
    }
    if (activeTab === 'Completed') {
      return apt.status === 'Completed';
    }
    if (activeTab === 'Cancelled') {
      return apt.status === 'Cancelled' || apt.status === 'Rejected';
    }
    return true;
  });

  const handleConfirmCancel = async () => {
    if (!cancelApt) return;

    const policy = checkTwoHourPolicy(cancelApt.date, cancelApt.timeSlot);
    if (!policy.isAllowed) {
      setPolicyNotice({
        isOpen: true,
        title: 'Cancellation Restricted (2-Hour Rule)',
        message:
          policy.reason ||
          'Appointments cannot be cancelled within 2 hours of the scheduled time. Please call the clinic front desk.',
        apt: cancelApt,
      });
      setCancelApt(null);
      return;
    }

    try {
      await supabaseService.updateAppointmentStatus(
        cancelApt.id,
        'Cancelled',
        cancelReason || 'Cancelled by patient'
      );
      setCancelApt(null);
      setCancelReason('');
      await loadAppointments();
    } catch (err) {
      console.error('Cancel appointment error:', err);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleSlot) return;

    const policy = checkTwoHourPolicy(rescheduleApt.date, rescheduleApt.timeSlot);
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
        rescheduleApt.id,
        rescheduleDate,
        rescheduleSlot
      );
      setRescheduleApt(null);
      setRescheduleDate('');
      setRescheduleSlot('');
      await loadAppointments();
    } catch (err: any) {
      setRescheduleError(
        err.message || 'Slot already booked or unavailable. Please choose another slot.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Booking CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Appointments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View booking status, request slot changes, or inspect prescriptions
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('patient-book')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-xs sm:text-sm hover:bg-teal-800 shadow-xs transition-all active:scale-98 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Upcoming', 'Completed', 'Cancelled'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by doctor or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 text-xs text-slate-400">
          Loading appointments from database...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No appointments found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No appointments matched your search query.'
              : 'You have no appointments recorded under this category.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('patient-book')}
            className="mt-4 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule a Visit</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const isUpcoming = apt.status === 'Pending' || apt.status === 'Confirmed';
            return (
              <div
                key={apt.id}
                id={`appointment-card-${apt.id}`}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-teal-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{apt.doctorName}</h3>
                        <span className="text-[11px] font-mono text-slate-400">#{apt.id}</span>
                      </div>
                      <span className="text-xs font-semibold text-teal-700 block">{apt.doctorSpecialty}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Chamber: <strong>{apt.doctorRoom}</strong> • Fee: PKR {apt.fee}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={apt.status} size="lg" />
                  </div>
                </div>

                {/* Date & Time Slot Row */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-700 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      {new Date(apt.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Clock className="w-4 h-4 text-teal-600" />
                      {apt.timeSlot}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isUpcoming && (() => {
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
                              setRescheduleApt(apt);
                              setRescheduleDate(apt.date);
                              setRescheduleSlot(apt.timeSlot);
                              setRescheduleError('');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                              policy.isAllowed
                                ? 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-100'
                                : 'text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100'
                            }`}
                            title={policy.isAllowed ? 'Change appointment time' : 'Locked (< 2 hours remaining)'}
                          >
                            {!policy.isAllowed ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <RotateCcw className="w-3.5 h-3.5" />}
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
                              setCancelApt(apt);
                              setCancelReason('');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                              policy.isAllowed
                                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                                : 'text-slate-400 bg-slate-100 hover:bg-slate-200 cursor-not-allowed'
                            }`}
                            title={policy.isAllowed ? 'Cancel this visit' : 'Locked (< 2 hours remaining)'}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </>
                      );
                    })()}

                    {apt.visitNotes && (
                      <button
                        type="button"
                        onClick={() => setViewNotesApt(apt)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Prescription</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Reason & Cancellation details */}
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-700">Reason for visit: </span>
                    <span>{apt.reasonForVisit}</span>
                  </div>
                  {apt.cancellationReason && (
                    <div className="text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      <strong>Cancellation note: </strong>
                      <span>{apt.cancellationReason}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Cancel Appointment */}
      <Modal
        isOpen={!!cancelApt}
        onClose={() => setCancelApt(null)}
        title="Cancel Appointment"
        subtitle={`Booking Ref: ${cancelApt?.id} with ${cancelApt?.doctorName}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600">
            Are you sure you want to cancel your appointment on <strong>{cancelApt?.date}</strong> at{' '}
            <strong>{cancelApt?.timeSlot}</strong>?
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for cancellation (optional):
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Health improved, emergency out of town..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelApt(null)}
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
        isOpen={!!rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        title="Reschedule Appointment"
        subtitle={`Select a new date and time slot with ${rescheduleApt?.doctorName}`}
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
              onClick={() => setRescheduleApt(null)}
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
                    <span className="text-slate-400 block">Blood Pressure:</span>
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
              <span className="text-xs font-bold text-slate-700 block mb-1">Prescription & Medication:</span>
              <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed font-mono">
                {viewNotesApt.visitNotes.prescription}
              </p>
            </div>

            {viewNotesApt.visitNotes.followUpDate && (
              <div className="text-xs text-slate-500">
                <span>Recommended Follow-up Date: </span>
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
