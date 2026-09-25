export type Role = 'patient' | 'doctor' | 'admin';

export type AppointmentStatus = 
  | 'Pending' 
  | 'Confirmed' 
  | 'Rejected' 
  | 'Cancelled' 
  | 'Completed' 
  | 'No-show';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  qualification: string;
  experienceYears: number;
  experience?: string;
  consultationFee: number;
  roomNumber: string;
  bio: string;
  avatar: string;
  isActive: boolean;
  availableDays: string[]; // e.g. ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  availableHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  slotDurationMinutes: number; // 30
  leaves: string[]; // ['YYYY-MM-DD']
  leaveDays?: string[];
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  medicalHistory?: string[];
  avatar?: string;
}

export interface VisitNotes {
  symptoms: string;
  diagnosis: string;
  prescription: string;
  vitalSigns?: {
    bloodPressure?: string;
    temperature?: string;
    pulse?: string;
    weightKg?: number;
  };
  followUpDate?: string;
  addedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorRoom: string;
  date: string; // 'YYYY-MM-DD'
  timeSlot: string; // '10:00 - 10:30'
  reasonForVisit: string;
  status: AppointmentStatus;
  createdAt: string;
  notes?: string;
  visitNotes?: VisitNotes;
  cancellationReason?: string;
  fee: number;
}

export interface ClinicService {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  startingFee: number;
  icon: string;
}

export interface ClinicStats {
  totalPatients: number;
  totalDoctors: number;
  activeDoctors: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
}

export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar?: string;
    patientId?: string;
    doctorId?: string;
  } | null;
}
