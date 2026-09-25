import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { Doctor, Patient, Appointment } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  getQueuedNotifications,
  getDayBeforeRemindersForN8N,
  NotificationPayload,
} from '../../services/notificationService';
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Stethoscope,
  ArrowRight,
  Bell,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // n8n Notification inspection state
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [reminderPayloads, setReminderPayloads] = useState<NotificationPayload[]>([]);
  const [recentQueuedEvents, setRecentQueuedEvents] = useState<NotificationPayload[]>([]);
  const [isFetchingReminders, setIsFetchingReminders] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docs, pats, apts] = await Promise.all([
        supabaseService.getDoctors(),
        supabaseService.getPatients(),
        supabaseService.getAppointments(),
      ]);
      setDoctors(docs);
      setPatients(pats);
      setAppointments(apts);
      setRecentQueuedEvents(getQueuedNotifications());
    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
      setDoctors([]);
      setPatients([]);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNotifInspection = async () => {
    setIsNotifModalOpen(true);
    setIsFetchingReminders(true);
    try {
      const reminders = await getDayBeforeRemindersForN8N();
      setReminderPayloads(reminders);
      setRecentQueuedEvents(getQueuedNotifications());
    } catch (err) {
      console.error('Error fetching n8n reminders:', err);
    } finally {
      setIsFetchingReminders(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAppointments = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'Pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'Confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;
  const cancelledCount = appointments.filter(
    (a) => a.status === 'Cancelled' || a.status === 'Rejected'
  ).length;

  const totalRevenue = appointments
    .filter((a) => a.status === 'Completed')
    .reduce((acc, curr) => acc + (curr.fee || 0), 0);

  const activeDoctorsCount = doctors.filter((d) => d.isActive).length;

  return (
    <div className="space-y-6">
      {/* Admin Greeting Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Operations Center
            </span>
            <span className="text-xs text-slate-400">Nowshera Family Clinic</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Clinic Administration & Analytics
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time management for medical staff, patient registries, and OPD appointments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('admin-doctors')}
            className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Manage Doctors</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin-appointments')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-total-apts"
          title="Total Appointments"
          value={totalAppointments}
          subtitle={`${pendingCount} pending requests`}
          icon={Calendar}
          color="teal"
        />
        <StatCard
          id="stat-total-patients"
          title="Registered Patients"
          value={patients.length}
          subtitle="Electronic health profiles"
          icon={Users}
          color="blue"
        />
        <StatCard
          id="stat-total-doctors"
          title="Medical Specialists"
          value={`${activeDoctorsCount}/${doctors.length}`}
          subtitle="Active on clinical roster"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          id="stat-total-revenue"
          title="Completed OPD Volume"
          value={`PKR ${totalRevenue.toLocaleString()}`}
          subtitle={`${completedCount} visits finalized`}
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Middle Layout: Status Distribution & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Appointment Status Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">OPD Appointment Status Breakdown</h3>
            <span className="text-xs text-slate-400 font-mono">Live Database</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/70 text-center">
              <span className="text-xs text-amber-700 font-semibold block">Pending</span>
              <span className="text-xl font-extrabold text-amber-900 mt-1 block">{pendingCount}</span>
              <span className="text-[10px] text-amber-600">Awaiting doctor</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-center">
              <span className="text-xs text-emerald-700 font-semibold block">Confirmed</span>
              <span className="text-xl font-extrabold text-emerald-900 mt-1 block">{confirmedCount}</span>
              <span className="text-[10px] text-emerald-600">Ready for consult</span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/70 text-center">
              <span className="text-xs text-blue-700 font-semibold block">Completed</span>
              <span className="text-xl font-extrabold text-blue-900 mt-1 block">{completedCount}</span>
              <span className="text-[10px] text-blue-600">Rx recorded</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
              <span className="text-xs text-slate-600 font-semibold block">Cancelled</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">{cancelledCount}</span>
              <span className="text-[10px] text-slate-400">Voided</span>
            </div>
          </div>

          {/* Quick Recent Appointments Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recent Bookings
              </span>
              <button
                type="button"
                onClick={() => onNavigate('admin-appointments')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <span>View Full Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                No appointments booked yet. Patient bookings will appear here in real-time.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {appointments.slice(0, 4).map((apt) => (
                  <div key={apt.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">{apt.patientName}</span>
                      <span className="text-[11px] text-slate-500">
                        with {apt.doctorName} • {apt.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-slate-600 hidden sm:inline">{apt.timeSlot}</span>
                      <StatusBadge status={apt.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Doctors Overview (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Specialist Doctors Roster</h3>
            <button
              type="button"
              onClick={() => onNavigate('admin-doctors')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              Add / Edit Doctors
            </button>
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading doctors...</div>
          ) : doctors.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              No doctors created in Supabase yet. Click "Add / Edit Doctors" to create your first doctor account.
            </div>
          ) : (
            <div className="space-y-3">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl border border-slate-200/70 hover:border-teal-200 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center border border-slate-200 shrink-0 text-sm">
                      {doc.avatar ? (
                        <img src={doc.avatar} alt={doc.name} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        doc.name?.charAt(0) || 'D'
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name}</h4>
                      <span className="text-[11px] text-teal-700 block truncate">{doc.specialty}</span>
                      <span className="text-[10px] text-slate-400 block">{doc.roomNumber}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {doc.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 block mt-1">
                      PKR {doc.consultationFee}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Automated Patient Communications & n8n Automation Bridge */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 rounded-2xl p-6 text-white border border-teal-800/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
              <Mail className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-white">n8n Automation & Patient Notification Pipeline</h4>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Live notification payloads for doctor confirmations, rejections, cancellations, and daily automated
            day-before appointment reminders. Ready for n8n webhook triggers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNotifInspection}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Bell className="w-4 h-4" />
          <span>Inspect n8n Notification Feeds</span>
        </button>
      </div>

      {/* Modal: n8n Notification Feeds Inspection */}
      <Modal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        title="Automated Patient Notification & Reminder Feed"
        subtitle="Standardized payload structures ready for n8n webhook automation"
        maxWidth="xl"
      >
        <div className="space-y-5 text-xs">
          {/* Day Before Reminders section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>Day-Before Appointment Reminders (Tomorrow's OPD)</span>
              </h5>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200 text-[11px]">
                {reminderPayloads.length} Queued for Tomorrow
              </span>
            </div>

            {isFetchingReminders ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
                Querying Supabase for tomorrow's confirmed appointments...
              </div>
            ) : reminderPayloads.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                No confirmed visits scheduled for tomorrow yet. When patients book and doctors confirm visits for tomorrow, they will automatically appear here with their email and SMS dispatch templates.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {reminderPayloads.map((payload) => (
                  <div key={payload.eventId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>To: {payload.patient.name} ({payload.patient.email})</span>
                      <span className="text-[11px] font-mono text-teal-700">{payload.appointmentDate} @ {payload.timeSlot}</span>
                    </div>
                    <div className="text-slate-600">
                      Doctor: <strong>Dr. {payload.doctor.name}</strong> ({payload.doctor.specialty} • {payload.doctor.roomNumber})
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-100">
                      Subject: {payload.subject}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Event Dispatches section */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recent Confirmation / Rejection Events ({recentQueuedEvents.length})</span>
            </h5>

            {recentQueuedEvents.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                No recent confirmation or rejection events. Whenever a doctor confirms or rejects an appointment, the payload is captured here in real-time.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {recentQueuedEvents.slice(0, 5).map((ev) => (
                  <div key={ev.eventId} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ev.eventType}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{ev.metadata.generatedAt.slice(0, 16)}</span>
                    </div>
                    <div className="text-slate-600">
                      Patient: {ev.patient.name} • Dr. {ev.doctor.name} ({ev.appointmentDate} {ev.timeSlot})
                    </div>
                    <div className="text-[11px] text-teal-800 font-medium">
                      Subject: {ev.subject}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsNotifModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
