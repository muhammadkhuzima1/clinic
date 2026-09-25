import { supabase, isSupabaseConfigured } from '../lib/supabase';
export { supabase, isSupabaseConfigured };
import {
  Doctor,
  Patient,
  Appointment,
  AppointmentStatus,
  VisitNotes,
  ClinicStats,
} from '../types';
import { buildNotificationPayload, queueNotification } from './notificationService';

// Map database doctor + profile + availability + leaves to frontend Doctor model
function mapDbDoctor(
  doctorRow: any,
  availabilityList: any[] = [],
  leavesList: string[] = []
): Doctor {
  const profile = doctorRow.profiles || doctorRow;
  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const activeDays = availabilityList
    .filter((a) => a.is_available)
    .map((a) => a.day_of_week)
    .sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b));

  const firstAvail = availabilityList[0];
  const startTime = firstAvail?.start_time
    ? firstAvail.start_time.slice(0, 5)
    : '09:00';
  const endTime = firstAvail?.end_time
    ? firstAvail.end_time.slice(0, 5)
    : '15:00';

  const expYears = Number(doctorRow.experience_years) || Number(profile.experience_years) || 0;

  return {
    id: doctorRow.id,
    name: profile.full_name || doctorRow.full_name || 'Dr. Specialist',
    email: profile.email || doctorRow.email || '',
    phone: profile.phone || doctorRow.phone || '',
    specialty: doctorRow.specialty || profile.specialty || 'General Medicine',
    qualification: doctorRow.qualification || profile.qualification || 'MBBS',
    experienceYears: expYears,
    experience: `${expYears} Years`,
    consultationFee: Number(doctorRow.consultation_fee) || Number(profile.consultation_fee) || 1500,
    roomNumber: doctorRow.room_number || profile.room_number || 'OPD-101',
    bio: doctorRow.bio || profile.bio || '',
    avatar:
      profile.avatar ||
      profile.avatar_url ||
      doctorRow.avatar ||
      doctorRow.avatar_url ||
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    isActive: doctorRow.is_active ?? profile.is_active ?? true,
    availableDays: activeDays.length > 0 ? activeDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableHours: {
      start: startTime,
      end: endTime,
    },
    slotDurationMinutes: doctorRow.slot_duration_minutes || profile.slot_duration_minutes || 30,
    leaves: leavesList,
    leaveDays: leavesList,
  };
}

// Map database profile row to frontend Patient model
function mapProfileToPatient(profile: any): Patient {
  return {
    id: profile.id,
    name: profile.full_name || 'Patient',
    email: profile.email || '',
    phone: profile.phone || '',
    dob: profile.dob || '1995-01-01',
    gender: profile.gender || 'Male',
    bloodGroup: profile.blood_group || 'O+',
    address: profile.address || '',
    emergencyContact: {
      name: profile.emergency_contact_name || '',
      relationship: profile.emergency_contact_relationship || '',
      phone: profile.emergency_contact_phone || '',
    },
    allergies: profile.allergies || [],
    medicalHistory: profile.medical_history || [],
    avatar:
      profile.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  };
}

export const VALID_APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  'Pending',
  'Confirmed',
  'Rejected',
  'Cancelled',
  'Completed',
  'No-show',
] as const;

export function normalizeAppointmentStatus(status?: string | null): AppointmentStatus {
  if (!status) return 'Pending';
  const trimmed = status.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'pending') return 'Pending';
  if (lower === 'confirmed') return 'Confirmed';
  if (lower === 'rejected') return 'Rejected';
  if (lower === 'cancelled' || lower === 'canceled') return 'Cancelled';
  if (lower === 'completed') return 'Completed';
  if (lower === 'no-show' || lower === 'noshow' || lower === 'no_show') return 'No-show';
  return (VALID_APPOINTMENT_STATUSES.includes(trimmed as AppointmentStatus)
    ? trimmed
    : 'Pending') as AppointmentStatus;
}

// Map database appointment row to frontend Appointment model
function mapDbAppointment(apt: any, notes?: any): Appointment {
  let visitNotes: VisitNotes | undefined = undefined;
  if (notes) {
    visitNotes = {
      symptoms: notes.symptoms || '',
      diagnosis: notes.diagnosis || '',
      prescription: notes.prescription || '',
      vitalSigns: notes.vital_signs || {},
      followUpDate: notes.follow_up_date || undefined,
      addedAt: notes.created_at ? notes.created_at.split('T')[0] : '',
    };
  }

  const doctorProfile = apt.doctor?.profiles || apt.doctor || {};
  const patientProfile = apt.patient || {};

  return {
    id: apt.id,
    patientId: apt.patient_id,
    patientName: patientProfile.full_name || 'Patient',
    patientPhone: patientProfile.phone || '',
    patientEmail: patientProfile.email || '',
    doctorId: apt.doctor_id,
    doctorName: doctorProfile.full_name || 'Doctor',
    doctorSpecialty: apt.doctor?.specialty || doctorProfile.specialty || 'General Practitioner',
    doctorRoom: apt.doctor?.room_number || 'OPD-101',
    date: apt.appointment_date,
    timeSlot: apt.time_slot,
    reasonForVisit: apt.reason,
    status: normalizeAppointmentStatus(apt.status),
    createdAt: apt.created_at ? apt.created_at.split('T')[0] : '',
    notes: apt.cancellation_reason || undefined,
    visitNotes,
    cancellationReason: apt.cancellation_reason || undefined,
    fee: Number(apt.fee) || Number(apt.doctor?.consultation_fee) || 1500,
  };
}

export interface CreateDoctorInput {
  name: string;
  email: string;
  password?: string;
  phone: string;
  specialty: string;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  roomNumber?: string;
  bio?: string;
  avatar?: string;
  availableDays?: string[];
  availableHours?: { start: string; end: string };
}

export const supabaseService = {
  // ----------------------------------------------------
  // DOCTOR OPERATIONS (REAL SUPABASE DATA ONLY)
  // ----------------------------------------------------
  async getDoctors(): Promise<Doctor[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      // 1. Check profiles where role = 'doctor' (canonical doctor schema)
      const { data: profDocs, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .order('full_name', { ascending: true });

      if (!profErr && profDocs && profDocs.length > 0) {
        const docIds = profDocs.map((p) => p.id);
        const [availRes, leavesRes] = await Promise.all([
          supabase.from('doctor_availability').select('*').in('doctor_id', docIds),
          supabase.from('doctor_leaves').select('*').in('doctor_id', docIds),
        ]);

        const availMap: Record<string, any[]> = {};
        (availRes.data || []).forEach((a) => {
          if (!availMap[a.doctor_id]) availMap[a.doctor_id] = [];
          availMap[a.doctor_id].push(a);
        });

        const leavesMap: Record<string, string[]> = {};
        (leavesRes.data || []).forEach((l) => {
          if (!leavesMap[l.doctor_id]) leavesMap[l.doctor_id] = [];
          leavesMap[l.doctor_id].push(l.leave_date);
        });

        return profDocs.map((p) => mapDbDoctor(p, availMap[p.id] || [], leavesMap[p.id] || []));
      }

      // 2. Fallback: Check separate doctors table if existing
      const { data: doctorsData, error: docErr } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: true });

      if (docErr || !doctorsData || doctorsData.length === 0) {
        return [];
      }

      const docIds = doctorsData.map((d) => d.id);

      // Fetch profiles, availability schedules, and leaves in parallel
      const [profilesRes, availRes, leavesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, phone, avatar_url, avatar').in('id', docIds),
        supabase.from('doctor_availability').select('*').in('doctor_id', docIds),
        supabase.from('doctor_leaves').select('*').in('doctor_id', docIds),
      ]);

      const profileMap: Record<string, any> = {};
      (profilesRes.data || []).forEach((p) => {
        profileMap[p.id] = p;
      });

      const availMap: Record<string, any[]> = {};
      (availRes.data || []).forEach((a) => {
        if (!availMap[a.doctor_id]) availMap[a.doctor_id] = [];
        availMap[a.doctor_id].push(a);
      });

      const leavesMap: Record<string, string[]> = {};
      (leavesRes.data || []).forEach((l) => {
        if (!leavesMap[l.doctor_id]) leavesMap[l.doctor_id] = [];
        leavesMap[l.doctor_id].push(l.leave_date);
      });

      return doctorsData.map((d) => {
        const combined = { ...d, profiles: profileMap[d.id] || null };
        return mapDbDoctor(combined, availMap[d.id] || [], leavesMap[d.id] || []);
      });
    } catch (err) {
      console.error('getDoctors exception:', err);
      return [];
    }
  },

  async getDoctorById(id: string): Promise<Doctor | null> {
    if (!isSupabaseConfigured() || !id) return null;

    try {
      // 1. Try profiles where id = id
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      const [availRes, leavesRes] = await Promise.all([
        supabase.from('doctor_availability').select('*').eq('doctor_id', id),
        supabase.from('doctor_leaves').select('*').eq('doctor_id', id),
      ]);

      const leaves = (leavesRes.data || []).map((l) => l.leave_date);

      if (profData && (profData.role === 'doctor' || profData.specialty)) {
        return mapDbDoctor(profData, availRes.data || [], leaves);
      }

      // 2. Try doctors table
      const { data: docData } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (docData) {
        const combined = { ...docData, profiles: profData || null };
        return mapDbDoctor(combined, availRes.data || [], leaves);
      }

      if (profData) {
        return mapDbDoctor(profData, availRes.data || [], leaves);
      }

      return null;
    } catch (err) {
      console.error('getDoctorById exception:', err);
      return null;
    }
  },

  // Admin creates doctor via the secure 'create-doctor' Supabase Edge Function
  async addDoctor(data: CreateDoctorInput): Promise<{ success: boolean; doctorId?: string; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    const defaultPassword = data.password || 'Doctor123!#';

    try {
      // Invoke the 'create-doctor' Edge Function with the required payload
      const { data: funcData, error: funcError } = await supabase.functions.invoke(
        'create-doctor',
        {
          body: {
            full_name: data.name,
            email: data.email,
            password: defaultPassword,
            phone: data.phone,
            specialty: data.specialty,
          },
        }
      );

      if (funcError) {
        console.error('create-doctor function error:', funcError);
        return {
          success: false,
          error: funcError.message || 'Failed to create doctor via create-doctor function.',
        };
      }

      if (funcData?.error) {
        return {
          success: false,
          error: typeof funcData.error === 'string' ? funcData.error : JSON.stringify(funcData.error),
        };
      }

      const doctorId =
        funcData?.doctorId ||
        funcData?.user?.id ||
        funcData?.id ||
        funcData?.doctor?.id ||
        funcData?.data?.id;

      // If doctorId is returned, update optional medical profile fields in the doctors table
      if (doctorId) {
        try {
          const doctorUpdates: Record<string, any> = {};
          if (data.qualification) doctorUpdates.qualification = data.qualification;
          if (data.experienceYears) doctorUpdates.experience_years = data.experienceYears;
          if (data.consultationFee) doctorUpdates.consultation_fee = data.consultationFee;
          if (data.roomNumber) doctorUpdates.room_number = data.roomNumber;
          if (data.bio) doctorUpdates.bio = data.bio;

          if (Object.keys(doctorUpdates).length > 0) {
            await supabase.from('doctors').update(doctorUpdates).eq('id', doctorId);
          }
        } catch (updateErr) {
          console.warn('Optional doctor profile details update note:', updateErr);
        }
      }

      return { success: true, doctorId };
    } catch (err: any) {
      console.error('addDoctor error:', err);
      return { success: false, error: err?.message || 'Failed to create doctor account' };
    }
  },

  // Alias for createDoctor
  async createDoctor(data: CreateDoctorInput) {
    return this.addDoctor(data);
  },

  async updateDoctor(
    id: string,
    updates: {
      name?: string;
      email?: string;
      phone?: string;
      specialty?: string;
      qualification?: string;
      experienceYears?: number;
      consultationFee?: number;
      roomNumber?: string;
      bio?: string;
      avatar?: string;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

    try {
      // 1. Update profiles table with clinical and demographic fields
      const profileUpdates: any = {};
      if (updates.name) profileUpdates.full_name = updates.name;
      if (updates.phone) profileUpdates.phone = updates.phone;
      if (updates.avatar) {
        profileUpdates.avatar = updates.avatar;
        profileUpdates.avatar_url = updates.avatar;
      }
      if (updates.specialty) profileUpdates.specialty = updates.specialty;
      if (updates.qualification) profileUpdates.qualification = updates.qualification;
      if (updates.experienceYears !== undefined) profileUpdates.experience_years = updates.experienceYears;
      if (updates.consultationFee !== undefined) profileUpdates.consultation_fee = updates.consultationFee;
      if (updates.roomNumber) profileUpdates.room_number = updates.roomNumber;
      if (updates.bio !== undefined) profileUpdates.bio = updates.bio;
      if (updates.isActive !== undefined) profileUpdates.is_active = updates.isActive;

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from('profiles').update(profileUpdates).eq('id', id);
      }

      // 2. Also update doctors table if present in user DB
      try {
        const doctorUpdates: any = {};
        if (updates.specialty) doctorUpdates.specialty = updates.specialty;
        if (updates.qualification) doctorUpdates.qualification = updates.qualification;
        if (updates.experienceYears !== undefined) doctorUpdates.experience_years = updates.experienceYears;
        if (updates.consultationFee !== undefined) doctorUpdates.consultation_fee = updates.consultationFee;
        if (updates.roomNumber) doctorUpdates.room_number = updates.roomNumber;
        if (updates.bio !== undefined) doctorUpdates.bio = updates.bio;
        if (updates.isActive !== undefined) doctorUpdates.is_active = updates.isActive;

        if (Object.keys(doctorUpdates).length > 0) {
          await supabase.from('doctors').update(doctorUpdates).eq('id', id);
        }
      } catch (_) {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async toggleDoctorActive(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      // Check current is_active in profiles
      const { data: prof } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', id)
        .maybeSingle();

      let currentState = prof?.is_active;

      if (currentState === undefined) {
        const { data: current } = await supabase
          .from('doctors')
          .select('is_active')
          .eq('id', id)
          .maybeSingle();
        currentState = current?.is_active ?? true;
      }

      const nextState = !currentState;

      // Update both profiles and doctors table
      await supabase.from('profiles').update({ is_active: nextState }).eq('id', id);
      try {
        await supabase.from('doctors').update({ is_active: nextState }).eq('id', id);
      } catch (_) {}

      return nextState;
    } catch (err) {
      console.error('toggleDoctorActive error:', err);
      return false;
    }
  },

  async updateDoctorAvailability(
    id: string,
    config: {
      availableDays?: string[];
      availableHours?: { start: string; end: string };
      isActive?: boolean;
    }
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      if (config.isActive !== undefined) {
        await supabase.from('profiles').update({ is_active: config.isActive }).eq('id', id);
        try {
          await supabase.from('doctors').update({ is_active: config.isActive }).eq('id', id);
        } catch (_) {}
      }

      if (config.availableDays && config.availableHours) {
        // Replace existing availability
        await supabase.from('doctor_availability').delete().eq('doctor_id', id);

        const startTime = config.availableHours.start.length === 5 ? `${config.availableHours.start}:00` : config.availableHours.start;
        const endTime = config.availableHours.end.length === 5 ? `${config.availableHours.end}:00` : config.availableHours.end;

        const newRows = config.availableDays.map((day) => ({
          doctor_id: id,
          day_of_week: day,
          start_time: startTime,
          end_time: endTime,
          is_available: true,
        }));

        if (newRows.length > 0) {
          await supabase.from('doctor_availability').insert(newRows);
        }
      }
    } catch (err) {
      console.error('updateDoctorAvailability error:', err);
    }
  },

  async addDoctorLeave(id: string, leaveDate: string, reason?: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      await supabase.from('doctor_leaves').upsert({
        doctor_id: id,
        leave_date: leaveDate,
        reason: reason || 'Scheduled Leave',
      });
    } catch (err) {
      console.error('addDoctorLeave error:', err);
    }
  },

  async removeDoctorLeave(id: string, leaveDate: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      await supabase
        .from('doctor_leaves')
        .delete()
        .eq('doctor_id', id)
        .eq('leave_date', leaveDate);
    } catch (err) {
      console.error('removeDoctorLeave error:', err);
    }
  },

  // ----------------------------------------------------
  // PATIENT OPERATIONS (REAL SUPABASE DATA ONLY)
  // ----------------------------------------------------
  async getPatients(): Promise<Patient[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('created_at', { ascending: false });

      if (error || !profiles || profiles.length === 0) {
        return [];
      }

      return profiles.map(mapProfileToPatient);
    } catch (err) {
      console.error('getPatients error:', err);
      return [];
    }
  },

  async getPatientById(id: string): Promise<Patient | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !profile) return null;
      return mapProfileToPatient(profile);
    } catch (err) {
      console.error('getPatientById error:', err);
      return null;
    }
  },

  async updatePatientProfile(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.phone) dbUpdates.phone = updates.phone;
      if (updates.dob) dbUpdates.dob = updates.dob;
      if (updates.gender) dbUpdates.gender = updates.gender;
      if (updates.bloodGroup) dbUpdates.blood_group = updates.bloodGroup;
      if (updates.address) dbUpdates.address = updates.address;
      if (updates.emergencyContact) {
        dbUpdates.emergency_contact_name = updates.emergencyContact.name;
        dbUpdates.emergency_contact_relationship = updates.emergencyContact.relationship;
        dbUpdates.emergency_contact_phone = updates.emergencyContact.phone;
      }
      if (updates.allergies) dbUpdates.allergies = updates.allergies;
      if (updates.medicalHistory) dbUpdates.medical_history = updates.medicalHistory;

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return null;
      return mapProfileToPatient(data);
    } catch (err) {
      console.error('updatePatientProfile error:', err);
      return null;
    }
  },

  // ----------------------------------------------------
  // APPOINTMENT OPERATIONS & DOUBLE-BOOKING PREVENTION
  // ----------------------------------------------------
  async getAppointments(filter?: {
    patientId?: string;
    doctorId?: string;
    date?: string;
    status?: AppointmentStatus;
  }): Promise<Appointment[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (filter?.patientId) query = query.eq('patient_id', filter.patientId);
      if (filter?.doctorId) query = query.eq('doctor_id', filter.doctorId);
      if (filter?.date) query = query.eq('appointment_date', filter.date);
      if (filter?.status) query = query.eq('status', normalizeAppointmentStatus(filter.status));

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return [];
      }

      // Collect unique doctor IDs, patient IDs, and appointment IDs
      const doctorIds = Array.from(new Set(data.map((a: any) => a.doctor_id).filter(Boolean)));
      const patientIds = Array.from(new Set(data.map((a: any) => a.patient_id).filter(Boolean)));
      const allUserIds = Array.from(new Set([...doctorIds, ...patientIds]));
      const aptIds = data.map((a: any) => a.id);

      // Fetch doctors, profiles, and visit notes in parallel
      const [doctorsRes, profilesRes, notesRes] = await Promise.all([
        supabase.from('doctors').select('id, specialty, room_number, consultation_fee').in('id', doctorIds),
        supabase.from('profiles').select('id, full_name, phone, email').in('id', allUserIds),
        supabase.from('visit_notes').select('*').in('appointment_id', aptIds),
      ]);

      const docMap: Record<string, any> = {};
      (doctorsRes.data || []).forEach((d) => { docMap[d.id] = d; });

      const profileMap: Record<string, any> = {};
      (profilesRes.data || []).forEach((p) => { profileMap[p.id] = p; });

      const notesMap: Record<string, any> = {};
      (notesRes.data || []).forEach((n) => { notesMap[n.appointment_id] = n; });

      return data.map((item: any) => {
        const doctorMeta = docMap[item.doctor_id] || {};
        const doctorProfile = profileMap[item.doctor_id] || {};
        const patientProfile = profileMap[item.patient_id] || {};

        const combinedItem = {
          ...item,
          doctor: {
            ...doctorMeta,
            profiles: doctorProfile,
          },
          patient: patientProfile,
        };

        return mapDbAppointment(combinedItem, notesMap[item.id]);
      });
    } catch (err) {
      console.error('getAppointments error:', err);
      return [];
    }
  },

  // Computes 30-min available consultation slots
  async getAvailableSlots(
    doctorId: string,
    dateString: string
  ): Promise<{ slot: string; isAvailable: boolean }[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      // 1. Try server-side RPC get_available_doctor_slots
      const { data: rpcSlots, error: rpcErr } = await supabase.rpc(
        'get_available_doctor_slots',
        {
          p_doctor_id: doctorId,
          p_date: dateString,
        }
      );

      if (!rpcErr && rpcSlots && rpcSlots.length > 0) {
        return rpcSlots.map((s: any) => ({
          slot: s.time_slot,
          isAvailable: s.is_available,
        }));
      }

      // 2. Client-side database query computation fallback
      const doctor = await this.getDoctorById(doctorId);
      if (!doctor || !doctor.isActive) return [];

      // Check doctor leaves
      const { data: leaveData } = await supabase
        .from('doctor_leaves')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('leave_date', dateString);

      if (leaveData && leaveData.length > 0) return [];

      // Check day of week availability
      const dateObj = new Date(dateString + 'T00:00:00');
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const dayOfWeek = dayNames[dateObj.getDay()];

      const { data: avail } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .single();

      if (!avail) return [];

      // Fetch booked non-cancelled appointments
      const { data: booked } = await supabase
        .from('appointments')
        .select('start_time, time_slot, status')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', dateString)
        .not('status', 'in', '("cancelled","rejected","Cancelled","Rejected")');

      const bookedSlots = new Set((booked || []).map((b) => b.time_slot));

      const [startH, startM] = avail.start_time.split(':').map(Number);
      const [endH, endM] = avail.end_time.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      const slots: { slot: string; isAvailable: boolean }[] = [];
      const formatTime = (h: number, min: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayMin = min < 10 ? `0${min}` : `${min}`;
        return `${displayH}:${displayMin} ${period}`;
      };

      for (let m = startMin; m < endMin; m += 30) {
        const sH = Math.floor(m / 60);
        const sM = m % 60;
        const eH = Math.floor((m + 30) / 60);
        const eM = (m + 30) % 60;
        const slotString = `${formatTime(sH, sM)} - ${formatTime(eH, eM)}`;
        slots.push({
          slot: slotString,
          isAvailable: !bookedSlots.has(slotString),
        });
      }

      return slots;
    } catch (err) {
      console.error('getAvailableSlots error:', err);
      return [];
    }
  },

  // Books an appointment with double-booking prevention constraint checking
  async bookAppointment(data: {
    patientId: string;
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    doctorId: string;
    date: string;
    timeSlot: string;
    reasonForVisit: string;
    fee?: number;
  }): Promise<Appointment> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    // Parse 12-hour slot to 24-hour start_time and end_time
    // Format: "10:00 AM - 10:30 AM"
    const [startPart, endPart] = data.timeSlot.split(' - ');
    const parse12To24 = (timeStr: string, defaultTime = '09:00:00') => {
      if (!timeStr) return defaultTime;
      const parts = timeStr.trim().split(' ');
      if (parts.length < 2) return timeStr.includes(':') ? timeStr : defaultTime;
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours)) hours = 9;
      if (isNaN(minutes)) minutes = 0;
      if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    };

    const startTime24 = parse12To24(startPart, '09:00:00');
    const endTime24 = parse12To24(endPart, '09:30:00');

    // Verify doctor fee
    const doc = await this.getDoctorById(data.doctorId);
    const consultationFee = data.fee || doc?.consultationFee || 1500;

    // Insert into appointments table
    // idx_appointments_prevent_double_booking raises 23505 if slot is already reserved!
    const { data: newRow, error: insertErr } = await supabase
      .from('appointments')
      .insert({
        patient_id: data.patientId,
        doctor_id: data.doctorId,
        appointment_date: data.date,
        start_time: startTime24,
        end_time: endTime24,
        time_slot: data.timeSlot,
        status: 'Pending',
        reason: data.reasonForVisit,
        fee: consultationFee,
      })
      .select('*')
      .single();

    if (insertErr) {
      if (insertErr.code === '23505' || insertErr.message.includes('double_booking')) {
        throw new Error(
          'Double-booking prevented: This 30-minute consultation slot is already reserved for another patient. Please select a different time slot.'
        );
      }
      throw new Error(`Appointment booking failed: ${insertErr.message}`);
    }

    const combinedRow = {
      ...newRow,
      doctor: {
        id: doc?.id || data.doctorId,
        specialty: doc?.specialty || 'General Practitioner',
        room_number: doc?.roomNumber || 'OPD-101',
        consultation_fee: consultationFee,
        profiles: {
          full_name: doc?.name || 'Doctor',
          phone: doc?.phone || '',
          email: doc?.email || '',
        },
      },
      patient: {
        full_name: data.patientName,
        phone: data.patientPhone,
        email: data.patientEmail,
      },
    };

    return mapDbAppointment(combinedRow);
  },

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    cancellationReason?: string
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      const canonicalStatus = normalizeAppointmentStatus(status);
      const updatePayload: Record<string, any> = {
        status: canonicalStatus,
        updated_at: new Date().toISOString(),
      };

      if (cancellationReason !== undefined) {
        updatePayload.cancellation_reason = cancellationReason || null;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.error('updateAppointmentStatus error:', error);
        throw new Error(error.message);
      }

      // Notification Dispatch Pipeline for n8n
      if (canonicalStatus === 'Confirmed' || canonicalStatus === 'Rejected' || canonicalStatus === 'Cancelled') {
        try {
          const apts = await this.getAppointments();
          const target = apts.find((a) => a.id === id);
          if (target) {
            const eventType =
              canonicalStatus === 'Confirmed'
                ? 'APPOINTMENT_CONFIRMED'
                : canonicalStatus === 'Rejected'
                ? 'APPOINTMENT_REJECTED'
                : 'APPOINTMENT_CANCELLED';

            const payload = buildNotificationPayload(target, eventType, {
              reason: cancellationReason,
            });
            queueNotification(payload);
          }
        } catch (notifErr) {
          console.warn('Notification queuing note:', notifErr);
        }
      }
    } catch (err) {
      console.error('updateAppointmentStatus exception:', err);
      throw err;
    }
  },

  async rescheduleAppointment(
    id: string,
    newDate: string,
    newTimeSlot: string
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      const [startPart, endPart] = newTimeSlot.split(' - ');
      const parse12To24 = (timeStr: string, defaultTime = '09:00:00') => {
        if (!timeStr) return defaultTime;
        const parts = timeStr.trim().split(' ');
        if (parts.length < 2) return timeStr.includes(':') ? timeStr : defaultTime;
        const [time, modifier] = parts;
        let [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours)) hours = 9;
        if (isNaN(minutes)) minutes = 0;
        if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      };

      const startTime24 = parse12To24(startPart, '09:00:00');
      const endTime24 = parse12To24(endPart, '09:30:00');

      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDate,
          time_slot: newTimeSlot,
          start_time: startTime24,
          end_time: endTime24,
          status: 'Pending', // reset to Pending on reschedule (matches DB check constraint)
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        if (error.code === '23505') {
          throw new Error(
            'Double-booking prevented: That slot is already occupied. Please select an alternate time.'
          );
        }
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('rescheduleAppointment error:', err);
      throw err;
    }
  },

  // ----------------------------------------------------
  // VISIT NOTES (STRICT MEDICAL CONFIDENTIALITY)
  // Protected by RLS: Admins have NO read/write access
  // ----------------------------------------------------
  async addVisitNotes(
    appointmentId: string,
    visitNotes: VisitNotes,
    doctorId: string,
    patientId: string
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      // 1. Mark appointment Completed (matches DB check constraint)
      await supabase
        .from('appointments')
        .update({
          status: 'Completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      // 2. Upsert private clinical visit notes
      const { error } = await supabase.from('visit_notes').upsert({
        appointment_id: appointmentId,
        doctor_id: doctorId,
        patient_id: patientId,
        symptoms: visitNotes.symptoms,
        diagnosis: visitNotes.diagnosis,
        prescription: visitNotes.prescription,
        vital_signs: visitNotes.vitalSigns || {},
        follow_up_date: visitNotes.followUpDate || null,
      });

      if (error) {
        console.error('addVisitNotes database error:', error);
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('addVisitNotes error:', err);
      throw err;
    }
  },

  async updateVisitNotes(
    appointmentId: string,
    visitNotes: VisitNotes,
    doctorId: string,
    patientId: string
  ): Promise<void> {
    return this.addVisitNotes(appointmentId, visitNotes, doctorId, patientId);
  },

  async getVisitNotes(appointmentId: string): Promise<VisitNotes | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('visit_notes')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error || !data) return null;

      return {
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        prescription: data.prescription,
        vitalSigns: data.vital_signs,
        followUpDate: data.follow_up_date,
        addedAt: data.created_at ? data.created_at.split('T')[0] : '',
      };
    } catch (err) {
      return null;
    }
  },

  // Aggregated Analytics for Clinic Administration
  async getClinicStats(): Promise<ClinicStats> {
    if (!isSupabaseConfigured()) {
      return {
        totalPatients: 0,
        totalDoctors: 0,
        activeDoctors: 0,
        todayAppointments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        totalRevenue: 0,
      };
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      const [patientsRes, profDocsRes, docsRes, aptsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('profiles').select('id, is_active').eq('role', 'doctor'),
        supabase.from('doctors').select('id, is_active'),
        supabase.from('appointments').select('id, appointment_date, status, fee'),
      ]);

      const totalPatients = patientsRes.count || 0;
      const docList = (profDocsRes.data && profDocsRes.data.length > 0)
        ? profDocsRes.data
        : (docsRes.data || []);
      const totalDoctors = docList.length;
      const activeDoctors = docList.filter((d: any) => d.is_active !== false).length;

      const apts = aptsRes.data || [];
      const todayAppointments = apts.filter((a) => a.appointment_date === today).length;
      const pendingAppointments = apts.filter((a) => a.status === 'Pending' || a.status?.toLowerCase() === 'pending').length;
      const completedAppointments = apts.filter((a) => a.status === 'Completed' || a.status?.toLowerCase() === 'completed').length;
      const totalRevenue = apts
        .filter((a) => a.status === 'Completed' || a.status?.toLowerCase() === 'completed')
        .reduce((sum, a) => sum + (Number(a.fee) || 1500), 0);

      return {
        totalPatients,
        totalDoctors,
        activeDoctors,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        totalRevenue,
      };
    } catch (err) {
      console.error('getClinicStats error:', err);
      return {
        totalPatients: 0,
        totalDoctors: 0,
        activeDoctors: 0,
        todayAppointments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        totalRevenue: 0,
      };
    }
  },
};
