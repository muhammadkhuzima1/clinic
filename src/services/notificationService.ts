/**
 * Nowshera Family Clinic - Notification & n8n Automation Bridge
 *
 * Prepares standardized, clean notification payloads for:
 * 1. Appointment Confirmation Email (sent to patient when doctor confirms)
 * 2. Appointment Rejection Email (sent to patient with rejection reason)
 * 3. Day-Before Reminder Emails (batched daily for n8n webhook / automation workflows)
 */

import { Appointment, AppointmentStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface NotificationPayload {
  eventId: string;
  eventType: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_REJECTED' | 'APPOINTMENT_CANCELLED' | 'DAY_BEFORE_REMINDER';
  appointmentId: string;
  appointmentDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  doctor: {
    id: string;
    name: string;
    specialty: string;
    roomNumber: string;
    consultationFee: number;
  };
  clinic: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  subject: string;
  emailBody: string;
  smsBody: string;
  metadata: {
    reasonForVisit?: string;
    cancellationReason?: string;
    rejectionReason?: string;
    generatedAt: string;
    readyForN8N: boolean;
  };
}

const CLINIC_INFO = {
  name: 'Nowshera Family Clinic',
  phone: '+92 923 560123',
  email: 'appointments@nowsheraclinic.com',
  address: 'Main Grand Trunk Road, Near Cantt Plaza, Nowshera, Khyber Pakhtunkhwa',
};

/**
 * Builds a standardized email notification payload ready for n8n execution
 */
export function buildNotificationPayload(
  appointment: Appointment,
  eventType: NotificationPayload['eventType'],
  extra?: { reason?: string }
): NotificationPayload {
  const patientEmail = appointment.patientEmail || 'patient@example.com';
  const patientName = appointment.patientName || 'Valued Patient';
  const doctorName = appointment.doctorName || 'Doctor';
  const dateStr = appointment.date;
  const timeSlot = appointment.timeSlot;

  let subject = '';
  let emailBody = '';
  let smsBody = '';

  switch (eventType) {
    case 'APPOINTMENT_CONFIRMED':
      subject = `Appointment Confirmed: Dr. ${doctorName} at ${CLINIC_INFO.name}`;
      emailBody = `Dear ${patientName},\n\nYour consultation at ${CLINIC_INFO.name} has been CONFIRMED.\n\nDoctor: Dr. ${doctorName} (${appointment.doctorSpecialty})\nRoom: ${appointment.doctorRoom}\nDate: ${dateStr}\nTime Slot: ${timeSlot}\nFee: PKR ${appointment.fee}\nLocation: ${CLINIC_INFO.address}\n\nPlease arrive 10 minutes prior to your consultation.\n\nWarm regards,\nNowshera Family Clinic Team`;
      smsBody = `Nowshera Clinic: Your appointment with Dr. ${doctorName} on ${dateStr} at ${timeSlot} is CONFIRMED. Room: ${appointment.doctorRoom}. Tel: ${CLINIC_INFO.phone}`;
      break;

    case 'APPOINTMENT_REJECTED':
      subject = `Appointment Update: ${CLINIC_INFO.name}`;
      const reason = extra?.reason || appointment.cancellationReason || 'Doctor unavailable for the selected slot';
      emailBody = `Dear ${patientName},\n\nWe regret to inform you that your appointment request with Dr. ${doctorName} for ${dateStr} (${timeSlot}) could not be confirmed.\n\nReason: ${reason}\n\nYou may log in to select an alternative date or consultation slot, or call us at ${CLINIC_INFO.phone}.\n\nWarm regards,\nNowshera Family Clinic Team`;
      smsBody = `Nowshera Clinic: Your appointment request on ${dateStr} could not be confirmed (${reason}). Please visit our portal to choose an alternate time.`;
      break;

    case 'DAY_BEFORE_REMINDER':
      subject = `Reminder: Tomorrow's Consultation with Dr. ${doctorName} at ${CLINIC_INFO.name}`;
      emailBody = `Dear ${patientName},\n\nThis is a friendly reminder for your scheduled consultation TOMORROW at ${CLINIC_INFO.name}.\n\nDoctor: Dr. ${doctorName} (${appointment.doctorSpecialty})\nRoom: ${appointment.doctorRoom}\nDate: Tomorrow (${dateStr})\nTime Slot: ${timeSlot}\nClinic Address: ${CLINIC_INFO.address}\nReception: ${CLINIC_INFO.phone}\n\nIf you have any prior medical records, prescriptions, or lab reports, please bring them along.`;
      smsBody = `Reminder: You have an appointment tomorrow (${dateStr}) at ${timeSlot} with Dr. ${doctorName} at Nowshera Clinic (Room: ${appointment.doctorRoom}). Questions? Call ${CLINIC_INFO.phone}`;
      break;

    case 'APPOINTMENT_CANCELLED':
      subject = `Appointment Cancellation Notice: ${CLINIC_INFO.name}`;
      emailBody = `Dear ${patientName},\n\nYour appointment with Dr. ${doctorName} scheduled for ${dateStr} (${timeSlot}) has been CANCELLED.\n\nReason: ${extra?.reason || 'Cancelled by patient or clinic admin'}.\n\nIf you wish to reschedule, please visit our online portal.`;
      smsBody = `Nowshera Clinic: Your appointment with Dr. ${doctorName} on ${dateStr} has been cancelled.`;
      break;
  }

  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    eventType,
    appointmentId: appointment.id,
    appointmentDate: dateStr,
    timeSlot,
    status: appointment.status,
    patient: {
      id: appointment.patientId,
      name: patientName,
      email: patientEmail,
      phone: appointment.patientPhone || '',
    },
    doctor: {
      id: appointment.doctorId,
      name: doctorName,
      specialty: appointment.doctorSpecialty,
      roomNumber: appointment.doctorRoom,
      consultationFee: appointment.fee || 1500,
    },
    clinic: CLINIC_INFO,
    subject,
    emailBody,
    smsBody,
    metadata: {
      reasonForVisit: appointment.reasonForVisit,
      cancellationReason: appointment.cancellationReason,
      rejectionReason: extra?.reason,
      generatedAt: new Date().toISOString(),
      readyForN8N: true,
    },
  };
}

/**
 * Stores dispatched notification event in local audit log for n8n inspection
 */
export function queueNotification(payload: NotificationPayload): void {
  try {
    const existing = JSON.parse(localStorage.getItem('nfc_notification_queue') || '[]');
    existing.unshift(payload);
    localStorage.setItem('nfc_notification_queue', JSON.stringify(existing.slice(0, 100)));
  } catch (err) {
    console.warn('Could not persist notification payload to queue:', err);
  }
}

/**
 * Retrieves all pending notification payloads formatted for n8n
 */
export function getQueuedNotifications(): NotificationPayload[] {
  try {
    return JSON.parse(localStorage.getItem('nfc_notification_queue') || '[]');
  } catch {
    return [];
  }
}

/**
 * Fetches Day-Before Reminder candidates from Supabase.
 * Finds all Confirmed appointments scheduled for tomorrow (or specified date).
 * Formats each into an n8n-ready NotificationPayload.
 */
export async function getDayBeforeRemindersForN8N(
  targetDate?: string
): Promise<NotificationPayload[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    // If targetDate is not supplied, default to tomorrow's date YYYY-MM-DD
    let dateStr = targetDate;
    if (!dateStr) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateStr = tomorrow.toISOString().split('T')[0];
    }

    // Query all confirmed appointments for the target date
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', dateStr)
      .eq('status', 'Confirmed')
      .order('start_time', { ascending: true });

    if (error || !appointments || appointments.length === 0) {
      return [];
    }

    const docIds = Array.from(new Set(appointments.map((a: any) => a.doctor_id).filter(Boolean)));
    const patIds = Array.from(new Set(appointments.map((a: any) => a.patient_id).filter(Boolean)));
    const allIds = Array.from(new Set([...docIds, ...patIds]));

    const [profilesRes, doctorsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, phone, role, specialty, room_number, consultation_fee').in('id', allIds),
      supabase.from('doctors').select('id, specialty, room_number, consultation_fee').in('id', docIds),
    ]);

    const profileMap: Record<string, any> = {};
    (profilesRes.data || []).forEach((p: any) => {
      profileMap[p.id] = p;
    });

    const docMap: Record<string, any> = {};
    (doctorsRes.data || []).forEach((d: any) => {
      docMap[d.id] = d;
    });

    const payloads: NotificationPayload[] = appointments.map((apt: any) => {
      const docProf = profileMap[apt.doctor_id] || {};
      const docMeta = docMap[apt.doctor_id] || {};
      const patProf = profileMap[apt.patient_id] || {};

      const aptModel: Appointment = {
        id: apt.id,
        patientId: apt.patient_id,
        patientName: patProf.full_name || 'Patient',
        patientEmail: patProf.email || '',
        patientPhone: patProf.phone || '',
        doctorId: apt.doctor_id,
        doctorName: docProf.full_name || 'Doctor',
        doctorSpecialty: docMeta.specialty || docProf.specialty || 'General Practitioner',
        doctorRoom: docMeta.room_number || docProf.room_number || 'OPD-101',
        date: apt.appointment_date,
        timeSlot: apt.time_slot,
        reasonForVisit: apt.reason,
        status: 'Confirmed',
        fee: Number(apt.fee) || Number(docMeta.consultation_fee) || 1500,
        createdAt: apt.created_at || new Date().toISOString(),
      };

      return buildNotificationPayload(aptModel, 'DAY_BEFORE_REMINDER');
    });

    return payloads;
  } catch (err) {
    console.error('getDayBeforeRemindersForN8N error:', err);
    return [];
  }
}
