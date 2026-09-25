import React, { useState, useEffect, useMemo } from 'react';
import { Doctor } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
} from 'lucide-react';

interface PatientBookAppointmentProps {
  initialDoctorId?: string;
  onAppointmentBooked: (appointmentId: string) => void;
  onNavigate: (view: string) => void;
}

export const PatientBookAppointment: React.FC<PatientBookAppointmentProps> = ({
  initialDoctorId,
  onAppointmentBooked,
  onNavigate,
}) => {
  const { user, activePatient } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  // Selected doctor
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || '');

  // Form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>(activePatient?.phone || '');
  const [patientName, setPatientName] = useState<string>(activePatient?.name || user?.name || '');
  const [patientEmail, setPatientEmail] = useState<string>(activePatient?.email || user?.email || '');

  // Available slots state
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; isAvailable: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Search doctors
  const [doctorSearch, setDoctorSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successApt, setSuccessApt] = useState<any>(null);

  // Load active doctors from Supabase backend
  useEffect(() => {
    let isMounted = true;
    setIsLoadingDoctors(true);
    supabaseService
      .getDoctors()
      .then((allDocs) => {
        if (isMounted) {
          const active = allDocs.filter((d) => d.isActive);
          setDoctors(active);
          if (!selectedDoctorId && active.length > 0) {
            setSelectedDoctorId(active[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching doctors:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDoctors(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update patient defaults when auth loads
  useEffect(() => {
    if (activePatient) {
      if (!patientName) setPatientName(activePatient.name);
      if (!patientPhone && activePatient.phone) setPatientPhone(activePatient.phone);
      if (!patientEmail && activePatient.email) setPatientEmail(activePatient.email);
    } else if (user) {
      if (!patientName && user.name) setPatientName(user.name);
      if (!patientEmail && user.email) setPatientEmail(user.email);
    }
  }, [activePatient, user]);

  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  }, [doctors, selectedDoctorId]);

  // Compute 30-min available slots for selected doctor and date asynchronously from database
  useEffect(() => {
    let isMounted = true;
    if (!selectedDoctor || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    supabaseService
      .getAvailableSlots(selectedDoctor.id, selectedDate)
      .then((slots) => {
        if (isMounted) {
          setAvailableSlots(slots);
          setIsLoadingSlots(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching available slots:', err);
        if (isMounted) {
          setAvailableSlots([]);
          setIsLoadingSlots(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDoctor, selectedDate]);

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.specialty.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.id) {
      setError('You must be signed in to book an appointment.');
      return;
    }
    if (!selectedDoctor) {
      setError('Please select a specialist doctor.');
      return;
    }
    if (!selectedDate) {
      setError('Please choose an appointment date.');
      return;
    }
    if (!selectedTimeSlot) {
      setError('Please select an available 30-minute consultation slot.');
      return;
    }
    if (!reasonForVisit.trim()) {
      setError('Please specify the primary symptom or reason for visit.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newApt = await supabaseService.bookAppointment({
        patientId: user.id,
        patientName: patientName.trim() || user.name || 'Patient',
        patientPhone: patientPhone.trim() || 'N/A',
        patientEmail: user.email || patientEmail,
        doctorId: selectedDoctor.id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        reasonForVisit: reasonForVisit.trim(),
        fee: selectedDoctor.consultationFee,
      });

      setSuccessApt(newApt);
      onAppointmentBooked(newApt.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to place appointment booking. Please check for conflicting slots.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successApt) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Booking Request Placed
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-3">Appointment Booked Successfully!</h2>
          <p className="text-sm text-slate-600 mt-1">
            Your appointment has been registered with status: <strong className="text-amber-700">Pending</strong> confirmation by the doctor.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 text-left text-xs sm:text-sm space-y-2.5 max-w-md mx-auto">
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Appointment ID:</span>
            <span className="font-mono font-bold text-slate-800">{successApt.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Doctor:</span>
            <span className="font-semibold text-slate-800">
              {successApt.doctorName} ({successApt.doctorSpecialty})
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">OPD Chamber:</span>
            <span className="font-semibold text-teal-700">{successApt.doctorRoom}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Date & Slot:</span>
            <span className="font-bold text-slate-900">
              {successApt.date} • {successApt.timeSlot}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Consultation Fee:</span>
            <span className="font-bold text-slate-900">PKR {successApt.fee} (Payable at OPD Counter)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('patient-appointments')}
            className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-xs sm:text-sm hover:bg-teal-800 transition-colors shadow-xs"
          >
            View in My Appointments
          </button>
          <button
            type="button"
            onClick={() => {
              setSuccessApt(null);
              setSelectedTimeSlot('');
              setReasonForVisit('');
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-200 transition-colors"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Book Specialist Appointment</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select your specialist, date, and guaranteed 30-minute consultation slot.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoadingDoctors ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          Loading doctors from database...
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Doctors Registered Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The clinic database does not have any active doctor profiles created yet. The administrator can add real doctors via the Admin Dashboard.
          </p>
        </div>
      ) : (
        <form onSubmit={handleBookSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Doctor Selection & Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>1. Choose Specialist Doctor</span>
              </h3>

              {/* Quick Search */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter doctors..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Doctors list selection */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredDoctors.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        setSelectedDoctorId(doc.id);
                        setSelectedTimeSlot('');
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 border border-teal-200 text-sm">
                        {doc.avatar ? (
                          <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          doc.name.replace('Dr. ', '').charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate block">{doc.name}</span>
                          <span className="text-[11px] font-bold text-teal-700 shrink-0">PKR {doc.consultationFee}</span>
                        </div>
                        <span className="text-[11px] text-teal-700 block truncate">{doc.specialty}</span>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">{doc.roomNumber}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Doctor Summary Card */}
            {selectedDoctor && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 border border-teal-200">
                    {selectedDoctor.avatar ? (
                      <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      selectedDoctor.name.replace('Dr. ', '').charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedDoctor.name}</h4>
                    <p className="text-xs text-teal-700 font-medium">{selectedDoctor.specialty}</p>
                    <p className="text-[11px] text-slate-500">{selectedDoctor.qualification}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chamber:</span>
                    <span className="font-semibold text-slate-800">{selectedDoctor.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Regular OPD Hours:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedDoctor.availableHours?.start || '09:00'} - {selectedDoctor.availableHours?.end || '17:00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-bold text-teal-700">PKR {selectedDoctor.consultationFee}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Date, Slot & Patient Info */}
          <div className="lg:col-span-7 space-y-5">
            {/* Date & Time Slot Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>2. Select Consultation Date & 30-Minute Slot</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    required
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTimeSlot('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="flex items-end">
                  <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-[11px] text-teal-800 w-full">
                    <span>Showing slots for </span>
                    <strong className="block text-teal-900">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Slots Grid */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Available 30-Minute Slots ({availableSlots.filter((s) => s.isAvailable).length} slots open)
                </label>

                {isLoadingSlots ? (
                  <div className="p-6 bg-teal-50/50 border border-teal-100 rounded-xl text-center text-xs text-teal-700 font-medium">
                    Checking doctor availability & real-time slots...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    Doctor is not scheduled on this day or is on leave. Please select another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                    {availableSlots.map(({ slot, isAvailable }) => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs font-bold'
                              : isAvailable
                              ? 'bg-white hover:bg-teal-50 border-slate-200 hover:border-teal-400 text-slate-800'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Reason for Visit & Patient Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                <span>3. Patient Details & Reason For Visit</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Patient Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number for Contact *
                  </label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+92 3xx xxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Visit / Primary Symptoms *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="e.g. Follow-up for chest tightness, pediatric vaccination booster, skin allergy rash on hands..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span>Total Fee: </span>
                  <strong className="text-slate-900 font-bold">PKR {selectedDoctor?.consultationFee || 1500}</strong>
                </div>

                <button
                  id="submit-book-appointment-btn"
                  type="submit"
                  disabled={isSubmitting || !selectedTimeSlot}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-sm transition-all ${
                    isSubmitting || !selectedTimeSlot
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-teal-700 hover:bg-teal-800 active:scale-98'
                  }`}
                >
                  <span>{isSubmitting ? 'Confirming Booking...' : 'Confirm Appointment Request'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
