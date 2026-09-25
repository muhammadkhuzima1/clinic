import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { Appointment, AppointmentStatus, Doctor } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  XCircle,
  FileText,
  User,
  Stethoscope,
  Lock,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';

export const AdminAppointments: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Cancel modal
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [confidentialNoteModal, setConfidentialNoteModal] = useState<Appointment | null>(null);

  const loadData = async () => {
    try {
      const [docs, apts] = await Promise.all([
        supabaseService.getDoctors(),
        supabaseService.getAppointments(),
      ]);
      setDoctors(docs);
      setAppointments(apts);
    } catch (err) {
      console.error('Error loading admin appointments:', err);
      setDoctors([]);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(search.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      apt.id.toLowerCase().includes(search.toLowerCase()) ||
      apt.patientPhone.includes(search);

    const matchesDoctor = doctorFilter === 'All' || apt.doctorId === doctorFilter;
    const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
    const matchesDate = !dateFilter || apt.date === dateFilter;

    return matchesSearch && matchesDoctor && matchesStatus && matchesDate;
  });

  const handleAdminCancel = async () => {
    if (!cancelModalApt) return;
    await supabaseService.updateAppointmentStatus(
      cancelModalApt.id,
      'Cancelled',
      cancelReason || 'Cancelled by Clinic Administration'
    );
    setCancelModalApt(null);
    setCancelReason('');
    await loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDoctorFilter('All');
    setStatusFilter('All');
    setDateFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Appointments Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit, track, and manage all clinic consultations and booking allocations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-medium border border-slate-200">
            Total Records: <strong className="text-slate-900">{filteredAppointments.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, doctor, #ID, phone..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Doctor Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Stethoscope className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Doctors ({doctors.length})</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty.split('&')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
              <option value="No-show">No-show</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden"
            />
            {(search || doctorFilter !== 'All' || statusFilter !== 'All' || dateFilter) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading appointments from database...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No appointments match your filters</p>
            <p className="text-xs text-slate-400 mt-0.5">Try clearing your search keyword or selected date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor & Room</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">OPD Fee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      #{apt.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{apt.patientName}</div>
                      <div className="text-[11px] text-slate-400">{apt.patientPhone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-teal-800">{apt.doctorName}</div>
                      <div className="text-[11px] text-slate-400">
                        {apt.doctorSpecialty} • <span className="font-medium text-slate-700">{apt.doctorRoom}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{apt.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{apt.timeSlot}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="truncate text-slate-700" title={apt.reasonForVisit}>
                        {apt.reasonForVisit}
                      </p>
                      {apt.cancellationReason && (
                        <p className="text-[10px] text-rose-600 font-medium truncate mt-0.5">
                          Void note: {apt.cancellationReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={apt.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      PKR {apt.fee}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Confidential Doctor Notes indicator (Admin restricted by RLS) */}
                        {apt.status === 'Completed' && (
                          <button
                            type="button"
                            onClick={() => setConfidentialNoteModal(apt)}
                            className="p-1.5 rounded-lg text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                            title="Clinical Record: Confidential (Admins restricted)"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        )}

                        {apt.status !== 'Cancelled' && apt.status !== 'Rejected' && apt.status !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelModalApt(apt);
                              setCancelReason('');
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1"
                            title="Cancel this appointment"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
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

      {/* Modal: Admin Cancel Appointment */}
      <Modal
        isOpen={!!cancelModalApt}
        onClose={() => setCancelModalApt(null)}
        title="Admin Override: Cancel Appointment"
        subtitle={`Booking #${cancelModalApt?.id} • Patient: ${cancelModalApt?.patientName}`}
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600">
            Are you sure you want to cancel this appointment on <strong>{cancelModalApt?.date}</strong> at <strong>{cancelModalApt?.timeSlot}</strong>?
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason (logged in audit history):
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Clinic schedule overhaul, emergency power outage, patient request via reception..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelModalApt(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Keep
            </button>
            <button
              type="button"
              onClick={handleAdminCancel}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Void Appointment
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confidential Medical Record Notice */}
      <Modal
        isOpen={!!confidentialNoteModal}
        onClose={() => setConfidentialNoteModal(null)}
        title="Doctor-Patient Medical Confidentiality"
        subtitle={`Booking #${confidentialNoteModal?.id} • Attending: ${confidentialNoteModal?.doctorName}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">Protected Clinical Record (RLS Enforced)</h4>
              <p className="text-xs text-amber-800 mt-1">
                Under healthcare privacy policies and Row Level Security (RLS), clinic administrators do not have access to private clinical visit notes, physician diagnoses, or prescriptions.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Only the attending specialist (<strong>{confidentialNoteModal?.doctorName}</strong>) and the verified patient (<strong>{confidentialNoteModal?.patientName}</strong>) are permitted cryptographic and database-level access to this consultation record.
          </p>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setConfidentialNoteModal(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
