-- Supabase Migration: 20260921000001_create_clinic_schema.sql
-- Description: Core Schema for Nowshera Family Clinic Portal
-- Includes: profiles, doctor_availability, doctor_leaves, appointments, visit_notes, double-booking prevention

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
-- Extends Supabase auth.users with medical clinic roles and clinical demographics
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  specialty TEXT,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  consultation_fee NUMERIC(10, 2) DEFAULT 0.00,
  room_number TEXT,
  bio TEXT,
  avatar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  dob DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  allergies TEXT[] DEFAULT '{}',
  medical_history TEXT[] DEFAULT '{}',
  slot_duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index profiles by role and activity
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- 2. DOCTOR AVAILABILITY TABLE
-- Configures weekly recurring schedules for each doctor
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_doctor_day UNIQUE (doctor_id, day_of_week),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_doctor ON public.doctor_availability(doctor_id);

-- 3. DOCTOR LEAVES TABLE
-- Tracks scheduled time-off, holidays, or emergency absences
CREATE TABLE IF NOT EXISTS public.doctor_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_doctor_leave UNIQUE (doctor_id, leave_date)
);

CREATE INDEX IF NOT EXISTS idx_leaves_doctor_date ON public.doctor_leaves(doctor_id, leave_date);

-- 4. APPOINTMENTS TABLE
-- Tracks patient bookings with 30-min slots and status lifecycles
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Rejected', 'Cancelled', 'Completed', 'No-show')),
  reason TEXT NOT NULL,
  fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_appointment_time_range CHECK (start_time < end_time)
);

-- DOUBLE-BOOKING PREVENTION CONSTRAINT / INDEX
-- Enforces that no doctor can be booked twice for the same date and start_time unless the existing booking was Cancelled or Rejected
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_prevent_double_booking
ON public.appointments (doctor_id, appointment_date, start_time)
WHERE status NOT IN ('Cancelled', 'Rejected');

-- Performance indexes for appointment querying
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);

-- 5. VISIT NOTES (CLINICAL CONSULTATION RECORDS)
-- Segregated table for doctor consultation notes, symptoms, diagnosis, and prescriptions
-- Allows strict Row Level Security so only the attending doctor and the patient can access them;
-- Clinic Admins are strictly forbidden from viewing private medical notes
CREATE TABLE IF NOT EXISTS public.visit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  prescription TEXT NOT NULL,
  vital_signs JSONB DEFAULT '{}'::jsonb,
  follow_up_date DATE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_visit_notes_doctor ON public.visit_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visit_notes_patient ON public.visit_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_notes_appointment ON public.visit_notes(appointment_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_appointments_updated_at ON public.appointments;
CREATE TRIGGER set_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_visit_notes_updated_at ON public.visit_notes;
CREATE TRIGGER set_visit_notes_updated_at
BEFORE UPDATE ON public.visit_notes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
