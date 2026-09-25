-- ==============================================================================
-- NOWSHERA FAMILY CLINIC - COMPLETE SUPABASE BACKEND MASTER SCHEMA & POLICIES
-- ==============================================================================
-- Tables Created:
--   1. public.profiles (Users, Doctors, Patients, Admins, Clinical Demographics)
--   2. public.doctor_availability (Weekly schedule hours per doctor)
--   3. public.doctor_leaves (Leaves & holiday absence dates)
--   4. public.appointments (Patient booking ledger with 30-min slots)
--   5. public.visit_notes (Private consultation records: symptoms, diagnosis, Rx)
--
-- Security & Integrity Features:
--   - PostgreSQL Partial Unique Index for DOUBLE-BOOKING PREVENTION
--   - Row Level Security (RLS) enabled on all tables
--   - Strict Medical Confidentiality: Admins are DENIED access to private visit_notes
--   - Stored Procedure RPC for calculating available 30-min slots
--   - Auto-provisioning trigger on auth.users signup
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- ------------------------------------------------------------------------------
-- 2. DOCTOR AVAILABILITY TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. DOCTOR LEAVES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_doctor_leave UNIQUE (doctor_id, leave_date)
);

CREATE INDEX IF NOT EXISTS idx_leaves_doctor_date ON public.doctor_leaves(doctor_id, leave_date);

-- ------------------------------------------------------------------------------
-- 4. APPOINTMENTS TABLE & DOUBLE-BOOKING PREVENTION
-- ------------------------------------------------------------------------------
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

-- STRICT DOUBLE-BOOKING PREVENTION INDEX
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_prevent_double_booking
ON public.appointments (doctor_id, appointment_date, start_time)
WHERE status NOT IN ('Cancelled', 'Rejected');

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);

-- ------------------------------------------------------------------------------
-- 5. VISIT NOTES (PRIVATE MEDICAL RECORDS)
-- ------------------------------------------------------------------------------
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

-- Updated_at triggers
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

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_notes ENABLE ROW LEVEL SECURITY;

-- Helper security definer functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'doctor' AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Public can view active doctors" ON public.profiles;
CREATE POLICY "Public can view active doctors"
ON public.profiles FOR SELECT
USING (
  (role = 'doctor' AND is_active = true)
  OR id = auth.uid()
  OR public.is_admin()
  OR (
    public.is_doctor() AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.doctor_id = auth.uid() AND a.patient_id = public.profiles.id
    )
  )
);

DROP POLICY IF EXISTS "Users can insert own profile or admin can insert" ON public.profiles;
CREATE POLICY "Users can insert own profile or admin can insert"
ON public.profiles FOR INSERT
WITH CHECK (
  id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can update own profile or admin can update" ON public.profiles;
CREATE POLICY "Users can update own profile or admin can update"
ON public.profiles FOR UPDATE
USING (
  id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (
  public.is_admin()
);

-- Doctor Availability Policies
DROP POLICY IF EXISTS "Anyone can view doctor availability" ON public.doctor_availability;
CREATE POLICY "Anyone can view doctor availability"
ON public.doctor_availability FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Doctors or admins can manage availability" ON public.doctor_availability;
CREATE POLICY "Doctors or admins can manage availability"
ON public.doctor_availability FOR ALL
USING (
  doctor_id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  doctor_id = auth.uid() OR public.is_admin()
);

-- Doctor Leaves Policies
DROP POLICY IF EXISTS "Anyone can view doctor leaves" ON public.doctor_leaves;
CREATE POLICY "Anyone can view doctor leaves"
ON public.doctor_leaves FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Doctors or admins can manage leaves" ON public.doctor_leaves;
CREATE POLICY "Doctors or admins can manage leaves"
ON public.doctor_leaves FOR ALL
USING (
  doctor_id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  doctor_id = auth.uid() OR public.is_admin()
);

-- Appointments Policies
DROP POLICY IF EXISTS "Role-based appointment viewing" ON public.appointments;
CREATE POLICY "Role-based appointment viewing"
ON public.appointments FOR SELECT
USING (
  patient_id = auth.uid()
  OR doctor_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Patients or admins can book appointments" ON public.appointments;
CREATE POLICY "Patients or admins can book appointments"
ON public.appointments FOR INSERT
WITH CHECK (
  patient_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Role-based appointment updates" ON public.appointments;
CREATE POLICY "Role-based appointment updates"
ON public.appointments FOR UPDATE
USING (
  patient_id = auth.uid()
  OR doctor_id = auth.uid()
  OR public.is_admin()
)
WITH CHECK (
  patient_id = auth.uid()
  OR doctor_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
USING (
  public.is_admin()
);

-- Visit Notes Policies (Strict Medical Privacy: NO Admin access)
DROP POLICY IF EXISTS "Doctor and patient only can view visit notes" ON public.visit_notes;
CREATE POLICY "Doctor and patient only can view visit notes"
ON public.visit_notes FOR SELECT
USING (
  doctor_id = auth.uid()
  OR patient_id = auth.uid()
);

DROP POLICY IF EXISTS "Doctors only can insert visit notes" ON public.visit_notes;
CREATE POLICY "Doctors only can insert visit notes"
ON public.visit_notes FOR INSERT
WITH CHECK (
  doctor_id = auth.uid()
);

DROP POLICY IF EXISTS "Doctors only can update visit notes" ON public.visit_notes;
CREATE POLICY "Doctors only can update visit notes"
ON public.visit_notes FOR UPDATE
USING (
  doctor_id = auth.uid()
)
WITH CHECK (
  doctor_id = auth.uid()
);

DROP POLICY IF EXISTS "Doctors only can delete visit notes" ON public.visit_notes;
CREATE POLICY "Doctors only can delete visit notes"
ON public.visit_notes FOR DELETE
USING (
  doctor_id = auth.uid()
);

-- ------------------------------------------------------------------------------
-- 7. AUTH TRIGGER ON USER REGISTRATION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Registered User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 8. RPC FOR 30-MIN AVAILABLE SLOTS CALCULATION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_available_doctor_slots(
  p_doctor_id UUID,
  p_date DATE
)
RETURNS TABLE (
  time_slot TEXT,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  v_day_name TEXT;
  v_start TIME;
  v_end TIME;
  v_slot_duration INT;
  v_curr TIME;
  v_next TIME;
  v_slot_text TEXT;
  v_is_on_leave BOOLEAN;
  v_is_doc_active BOOLEAN;
BEGIN
  SELECT is_active, COALESCE(slot_duration_minutes, 30)
  INTO v_is_doc_active, v_slot_duration
  FROM public.profiles
  WHERE id = p_doctor_id AND role = 'doctor';

  IF v_is_doc_active IS NOT TRUE THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.doctor_leaves
    WHERE doctor_id = p_doctor_id AND leave_date = p_date
  ) INTO v_is_on_leave;

  IF v_is_on_leave THEN
    RETURN;
  END IF;

  v_day_name := trim(to_char(p_date, 'Day'));

  SELECT start_time, end_time
  INTO v_start, v_end
  FROM public.doctor_availability
  WHERE doctor_id = p_doctor_id AND day_of_week = v_day_name AND is_available = true;

  IF v_start IS NULL THEN
    RETURN;
  END IF;

  v_curr := v_start;
  WHILE v_curr + (v_slot_duration || ' minutes')::INTERVAL <= v_end LOOP
    v_next := (v_curr + (v_slot_duration || ' minutes')::INTERVAL)::TIME;
    
    v_slot_text := to_char(v_curr, 'HH12:MI AM') || ' - ' || to_char(v_next, 'HH12:MI AM');

    SELECT NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.doctor_id = p_doctor_id
        AND a.appointment_date = p_date
        AND a.start_time = v_curr
        AND a.status NOT IN ('Cancelled', 'Rejected')
    ) INTO is_available;

    time_slot := v_slot_text;
    start_time := v_curr;
    end_time := v_next;

    RETURN NEXT;

    v_curr := v_next;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
