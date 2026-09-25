-- Supabase Migration: 20260921000002_create_rls_policies.sql
-- Description: Row Level Security (RLS) policies and security functions for Nowshera Family Clinic Portal

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_notes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- HELPER FUNCTIONS FOR ROLE-BASED ACCESS CONTROL (RBAC)
-- ----------------------------------------------------

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checks if current user is an active administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checks if current user is a doctor
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'doctor' AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ----------------------------------------------------
-- 1. PROFILES RLS POLICIES
-- ----------------------------------------------------

-- SELECT: Public can view active doctor profiles (needed for directory & booking)
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

-- INSERT: Authenticated user can create their own profile during signup, or Admin can create any profile
DROP POLICY IF EXISTS "Users can insert own profile or admin can insert" ON public.profiles;
CREATE POLICY "Users can insert own profile or admin can insert"
ON public.profiles FOR INSERT
WITH CHECK (
  id = auth.uid() OR public.is_admin()
);

-- UPDATE: User can update own profile, or Admin can update any profile (e.g. toggle active, edit doctor specs)
DROP POLICY IF EXISTS "Users can update own profile or admin can update" ON public.profiles;
CREATE POLICY "Users can update own profile or admin can update"
ON public.profiles FOR UPDATE
USING (
  id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  id = auth.uid() OR public.is_admin()
);

-- DELETE: Admins only can delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (
  public.is_admin()
);

-- ----------------------------------------------------
-- 2. DOCTOR AVAILABILITY RLS POLICIES
-- ----------------------------------------------------

-- SELECT: Everyone can read availability schedules (needed to select appointment slots)
DROP POLICY IF EXISTS "Anyone can view doctor availability" ON public.doctor_availability;
CREATE POLICY "Anyone can view doctor availability"
ON public.doctor_availability FOR SELECT
USING (true);

-- INSERT / UPDATE / DELETE: Doctors can manage their own schedule, or Admin can manage
DROP POLICY IF EXISTS "Doctors or admins can manage availability" ON public.doctor_availability;
CREATE POLICY "Doctors or admins can manage availability"
ON public.doctor_availability FOR ALL
USING (
  doctor_id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  doctor_id = auth.uid() OR public.is_admin()
);

-- ----------------------------------------------------
-- 3. DOCTOR LEAVES RLS POLICIES
-- ----------------------------------------------------

-- SELECT: Everyone can read leaves (needed to hide slots for doctor vacation/absent days)
DROP POLICY IF EXISTS "Anyone can view doctor leaves" ON public.doctor_leaves;
CREATE POLICY "Anyone can view doctor leaves"
ON public.doctor_leaves FOR SELECT
USING (true);

-- INSERT / UPDATE / DELETE: Doctors can manage their own leaves, or Admin can manage
DROP POLICY IF EXISTS "Doctors or admins can manage leaves" ON public.doctor_leaves;
CREATE POLICY "Doctors or admins can manage leaves"
ON public.doctor_leaves FOR ALL
USING (
  doctor_id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  doctor_id = auth.uid() OR public.is_admin()
);

-- ----------------------------------------------------
-- 4. APPOINTMENTS RLS POLICIES
-- ----------------------------------------------------

-- SELECT:
-- - Patients can access their own appointments
-- - Doctors can access appointments assigned to them
-- - Admins can access all appointments
DROP POLICY IF EXISTS "Role-based appointment viewing" ON public.appointments;
CREATE POLICY "Role-based appointment viewing"
ON public.appointments FOR SELECT
USING (
  patient_id = auth.uid()
  OR doctor_id = auth.uid()
  OR public.is_admin()
);

-- INSERT:
-- - Patient can insert appointments for themselves
-- - Admins can insert appointments for any patient
DROP POLICY IF EXISTS "Patients or admins can book appointments" ON public.appointments;
CREATE POLICY "Patients or admins can book appointments"
ON public.appointments FOR INSERT
WITH CHECK (
  patient_id = auth.uid()
  OR public.is_admin()
);

-- UPDATE:
-- - Patients can cancel or modify their own appointment
-- - Doctors can update status (Confirm, Reject, Complete) of their own appointments
-- - Admins can manage all appointments (reschedule, cancel, update notes)
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

-- DELETE:
-- Only admins can delete appointment records
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
USING (
  public.is_admin()
);

-- ----------------------------------------------------
-- 5. VISIT NOTES RLS POLICIES (STRICT MEDICAL PRIVACY)
-- CRITICAL REQUIREMENT: "Admins must not access private doctor visit notes."
-- ----------------------------------------------------

-- SELECT:
-- ONLY the attending doctor and the patient can view consultation notes.
-- Admins are NOT granted SELECT permissions on visit_notes.
DROP POLICY IF EXISTS "Doctor and patient only can view visit notes" ON public.visit_notes;
CREATE POLICY "Doctor and patient only can view visit notes"
ON public.visit_notes FOR SELECT
USING (
  doctor_id = auth.uid()
  OR patient_id = auth.uid()
);

-- INSERT:
-- Attending doctor only can create consultation notes
DROP POLICY IF EXISTS "Doctors only can insert visit notes" ON public.visit_notes;
CREATE POLICY "Doctors only can insert visit notes"
ON public.visit_notes FOR INSERT
WITH CHECK (
  doctor_id = auth.uid()
);

-- UPDATE:
-- Attending doctor only can update consultation notes
DROP POLICY IF EXISTS "Doctors only can update visit notes" ON public.visit_notes;
CREATE POLICY "Doctors only can update visit notes"
ON public.visit_notes FOR UPDATE
USING (
  doctor_id = auth.uid()
)
WITH CHECK (
  doctor_id = auth.uid()
);

-- DELETE:
-- Attending doctor only can delete visit notes
DROP POLICY IF EXISTS "Doctors only can delete visit notes" ON public.visit_notes;
CREATE POLICY "Doctors only can delete visit notes"
ON public.visit_notes FOR DELETE
USING (
  doctor_id = auth.uid()
);

-- ----------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ----------------------------------------------------

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

-- ----------------------------------------------------
-- DATABASE FUNCTION: RPC FOR COMPUTING AVAILABLE 30-MIN SLOTS
-- ----------------------------------------------------

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
  -- 1. Check if doctor is active
  SELECT is_active, COALESCE(slot_duration_minutes, 30)
  INTO v_is_doc_active, v_slot_duration
  FROM public.profiles
  WHERE id = p_doctor_id AND role = 'doctor';

  IF v_is_doc_active IS NOT TRUE THEN
    RETURN;
  END IF;

  -- 2. Check if doctor is on leave on this date
  SELECT EXISTS (
    SELECT 1 FROM public.doctor_leaves
    WHERE doctor_id = p_doctor_id AND leave_date = p_date
  ) INTO v_is_on_leave;

  IF v_is_on_leave THEN
    RETURN;
  END IF;

  -- 3. Determine day of week
  v_day_name := trim(to_char(p_date, 'Day'));

  -- 4. Check doctor availability for this day
  SELECT start_time, end_time
  INTO v_start, v_end
  FROM public.doctor_availability
  WHERE doctor_id = p_doctor_id AND day_of_week = v_day_name AND is_available = true;

  IF v_start IS NULL THEN
    RETURN;
  END IF;

  -- 5. Iterate through slots from start_time to end_time
  v_curr := v_start;
  WHILE v_curr + (v_slot_duration || ' minutes')::INTERVAL <= v_end LOOP
    v_next := (v_curr + (v_slot_duration || ' minutes')::INTERVAL)::TIME;
    
    -- Format readable slot string (e.g. 09:00 AM - 09:30 AM)
    v_slot_text := to_char(v_curr, 'HH12:MI AM') || ' - ' || to_char(v_next, 'HH12:MI AM');

    -- Check if slot is already booked and not cancelled/rejected
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
