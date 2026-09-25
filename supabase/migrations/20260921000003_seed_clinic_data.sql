-- Supabase Migration: 20260921000003_seed_clinic_data.sql
-- Description: Seed initial doctors, availability, demo patients, and appointments for Nowshera Family Clinic

-- Enable pgcrypto for password hashing if auth.users are directly seeded
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
  v_doc1_id UUID := '00000000-0000-0000-0000-000000000011';
  v_doc2_id UUID := '00000000-0000-0000-0000-000000000012';
  v_doc3_id UUID := '00000000-0000-0000-0000-000000000013';
  v_doc4_id UUID := '00000000-0000-0000-0000-000000000014';
  v_doc5_id UUID := '00000000-0000-0000-0000-000000000015';
  v_doc6_id UUID := '00000000-0000-0000-0000-000000000016';
  v_pat1_id UUID := '00000000-0000-0000-0000-000000000021';
  v_pat2_id UUID := '00000000-0000-0000-0000-000000000022';
  v_apt1_id UUID := '00000000-0000-0000-0000-000000000031';
  v_apt2_id UUID := '00000000-0000-0000-0000-000000000032';
  v_apt3_id UUID := '00000000-0000-0000-0000-000000000033';
BEGIN
  -- 1. Create Demo Users in auth.users if not existing
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, role)
  VALUES
    (v_admin_id, 'admin@nowsheraclinic.com', crypt('admin123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Clinic Operations Director","role":"admin"}', 'authenticated'),
    (v_doc1_id, 'dr.tariq@nowsheraclinic.com', crypt('doc123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Tariq Khan","role":"doctor"}', 'authenticated'),
    (v_doc2_id, 'dr.ayesha@nowsheraclinic.com', crypt('doc123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Ayesha Noor","role":"doctor"}', 'authenticated'),
    (v_doc3_id, 'dr.fatima@nowsheraclinic.com', crypt('doc123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Fatima Khattak","role":"doctor"}', 'authenticated'),
    (v_doc4_id, 'dr.salman@nowsheraclinic.com', crypt('doc123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Salman Farooqi","role":"doctor"}', 'authenticated'),
    (v_doc5_id, 'dr.zubair@nowsheraclinic.com', crypt('doc123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Zubair Ahmed","role":"doctor"}', 'authenticated'),
    (v_doc6_id, 'dr.sadia@nowsheraclinic.com', crypt('doc123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Sadia Rehman","role":"doctor"}', 'authenticated'),
    (v_pat1_id, 'patient@demo.com', crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Muhammad Asif","role":"patient"}', 'authenticated'),
    (v_pat2_id, 'zainab.bibi@example.com', crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zainab Bibi","role":"patient"}', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Upsert Profiles
  -- Admin
  INSERT INTO public.profiles (id, full_name, email, phone, role, is_active, avatar)
  VALUES (
    v_admin_id,
    'Clinic Operations Director',
    'admin@nowsheraclinic.com',
    '+92 923 560123',
    'admin',
    true,
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

  -- Doctor 1: Dr. Tariq Khan
  INSERT INTO public.profiles (
    id, full_name, email, phone, role, specialty, qualification, experience_years,
    consultation_fee, room_number, bio, avatar, is_active, slot_duration_minutes
  )
  VALUES (
    v_doc1_id,
    'Dr. Tariq Khan',
    'dr.tariq@nowsheraclinic.com',
    '+92 300 5551201',
    'doctor',
    'Family Medicine & Internal Medicine',
    'MBBS, FCPS (Internal Medicine), MRCP (UK)',
    16,
    1500.00,
    'OPD-101',
    'Senior Consultant with over 16 years of expertise in chronic illness management, diabetes, hypertension, and primary healthcare for families in Nowshera.',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    true,
    30
  )
  ON CONFLICT (id) DO UPDATE SET
    specialty = EXCLUDED.specialty,
    consultation_fee = EXCLUDED.consultation_fee;

  -- Doctor 2: Dr. Ayesha Noor
  INSERT INTO public.profiles (
    id, full_name, email, phone, role, specialty, qualification, experience_years,
    consultation_fee, room_number, bio, avatar, is_active, slot_duration_minutes
  )
  VALUES (
    v_doc2_id,
    'Dr. Ayesha Noor',
    'dr.ayesha@nowsheraclinic.com',
    '+92 300 5551202',
    'doctor',
    'Pediatrics & Child Healthcare',
    'MBBS, DCH, FCPS (Pediatrics)',
    11,
    1400.00,
    'OPD-104',
    'Dedicated pediatrician specializing in newborn screening, immunizations, childhood infections, nutritional guidance, and adolescent wellness.',
    'https://images.unsplash.com/photo-1594824813571-638f02636136?w=300&auto=format&fit=crop&q=80',
    true,
    30
  )
  ON CONFLICT (id) DO NOTHING;

  -- Doctor 3: Dr. Fatima Khattak
  INSERT INTO public.profiles (
    id, full_name, email, phone, role, specialty, qualification, experience_years,
    consultation_fee, room_number, bio, avatar, is_active, slot_duration_minutes
  )
  VALUES (
    v_doc3_id,
    'Dr. Fatima Khattak',
    'dr.fatima@nowsheraclinic.com',
    '+92 300 5551203',
    'doctor',
    'Obstetrics & Gynecology',
    'MBBS, FCPS (Gynecology & Obstetrics), MCPS',
    14,
    1800.00,
    'OPD-108',
    'Expert obstetrician providing comprehensive antenatal care, high-risk pregnancy management, hormonal disorders, ultrasound checkups, and fertility counseling.',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    true,
    30
  )
  ON CONFLICT (id) DO NOTHING;

  -- Doctor 4: Dr. Salman Farooqi
  INSERT INTO public.profiles (
    id, full_name, email, phone, role, specialty, qualification, experience_years,
    consultation_fee, room_number, bio, avatar, is_active, slot_duration_minutes
  )
  VALUES (
    v_doc4_id,
    'Dr. Salman Farooqi',
    'dr.salman@nowsheraclinic.com',
    '+92 300 5551204',
    'doctor',
    'Cardiology & Vascular Care',
    'MBBS, MD (Cardiology), Dip. Echo',
    18,
    2000.00,
    'OPD-202',
    'Specialist in non-invasive cardiac evaluation, ECG and echocardiogram interpretation, hypertension management, and post-cardiac rehabilitation.',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
    true,
    30
  )
  ON CONFLICT (id) DO NOTHING;

  -- Doctor 5: Dr. Zubair Ahmed
  INSERT INTO public.profiles (
    id, full_name, email, phone, role, specialty, qualification, experience_years,
    consultation_fee, room_number, bio, avatar, is_active, slot_duration_minutes
  )
  VALUES (
    v_doc5_id,
    'Dr. Zubair Ahmed',
    'dr.zubair@nowsheraclinic.com',
    '+92 300 5551205',
    'doctor',
    'Orthopedics & Joint Care',
    'MBBS, MS (Orthopedics), AO Fellow',
    12,
    1600.00,
    'OPD-205',
    'Orthopedic specialist in osteoarthritis, sports trauma, spinal posture disorders, fractures, and regenerative joint therapies.',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
    true,
    30
  )
  ON CONFLICT (id) DO NOTHING;

  -- Doctor 6: Dr. Sadia Rehman
  INSERT INTO public.profiles (
    id, full_name, email, phone, role, specialty, qualification, experience_years,
    consultation_fee, room_number, bio, avatar, is_active, slot_duration_minutes
  )
  VALUES (
    v_doc6_id,
    'Dr. Sadia Rehman',
    'dr.sadia@nowsheraclinic.com',
    '+92 300 5551206',
    'doctor',
    'Dermatology & Medical Cosmetology',
    'MBBS, FCPS (Dermatology)',
    9,
    1500.00,
    'OPD-112',
    'Clinical dermatologist addressing eczema, psoriasis, acne management, allergic skin disorders, and therapeutic laser care.',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=300&auto=format&fit=crop&q=80',
    true,
    30
  )
  ON CONFLICT (id) DO NOTHING;

  -- Patient 1: Muhammad Asif
  INSERT INTO public.profiles (
    id, full_name, email, phone, role, dob, gender, blood_group, address,
    emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
    allergies, medical_history, avatar
  )
  VALUES (
    v_pat1_id,
    'Muhammad Asif',
    'patient@demo.com',
    '+92 333 9123456',
    'patient',
    '1988-03-15',
    'Male',
    'B+',
    'House 42, Mohallah Kalan, Nowshera Cantt',
    'Shazia Asif',
    'Spouse',
    '+92 333 9123457',
    ARRAY['Penicillin', 'Sulfa drugs'],
    ARRAY['Mild Essential Hypertension diagnosed 2021', 'Seasonal Allergic Rhinitis'],
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Patient 2: Zainab Bibi
  INSERT INTO public.profiles (
    id, full_name, email, phone, role, dob, gender, blood_group, address,
    emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
    allergies, medical_history, avatar
  )
  VALUES (
    v_pat2_id,
    'Zainab Bibi',
    'zainab.bibi@example.com',
    '+92 345 8877665',
    'patient',
    '1994-08-22',
    'Female',
    'O+',
    'Mohallah Ziarat Kaka Sahib, Nowshera',
    'Tariq Mehmood',
    'Brother',
    '+92 345 8877660',
    ARRAY['Aspirin'],
    ARRAY['Gestational health checkups', 'Routine blood monitoring'],
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3. Seed Doctor Availability Schedules (Mon-Fri / Sat)
  -- Dr. Tariq (Mon-Sat 09:00 - 16:00)
  INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
  VALUES
    (v_doc1_id, 'Monday', '09:00:00', '16:00:00', true),
    (v_doc1_id, 'Tuesday', '09:00:00', '16:00:00', true),
    (v_doc1_id, 'Wednesday', '09:00:00', '16:00:00', true),
    (v_doc1_id, 'Thursday', '09:00:00', '16:00:00', true),
    (v_doc1_id, 'Friday', '09:00:00', '16:00:00', true),
    (v_doc1_id, 'Saturday', '09:00:00', '16:00:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

  -- Dr. Ayesha (Mon-Fri 10:00 - 17:00)
  INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
  VALUES
    (v_doc2_id, 'Monday', '10:00:00', '17:00:00', true),
    (v_doc2_id, 'Tuesday', '10:00:00', '17:00:00', true),
    (v_doc2_id, 'Wednesday', '10:00:00', '17:00:00', true),
    (v_doc2_id, 'Thursday', '10:00:00', '17:00:00', true),
    (v_doc2_id, 'Friday', '10:00:00', '17:00:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

  -- Dr. Fatima (Mon, Wed, Thu, Fri, Sat 11:00 - 18:00)
  INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
  VALUES
    (v_doc3_id, 'Monday', '11:00:00', '18:00:00', true),
    (v_doc3_id, 'Wednesday', '11:00:00', '18:00:00', true),
    (v_doc3_id, 'Thursday', '11:00:00', '18:00:00', true),
    (v_doc3_id, 'Friday', '11:00:00', '18:00:00', true),
    (v_doc3_id, 'Saturday', '11:00:00', '18:00:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

  -- Dr. Salman (Mon, Tue, Thu, Sat 12:00 - 18:00)
  INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
  VALUES
    (v_doc4_id, 'Monday', '12:00:00', '18:00:00', true),
    (v_doc4_id, 'Tuesday', '12:00:00', '18:00:00', true),
    (v_doc4_id, 'Thursday', '12:00:00', '18:00:00', true),
    (v_doc4_id, 'Saturday', '12:00:00', '18:00:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

  -- Dr. Zubair (Tue, Wed, Fri, Sat 09:00 - 15:00)
  INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
  VALUES
    (v_doc5_id, 'Tuesday', '09:00:00', '15:00:00', true),
    (v_doc5_id, 'Wednesday', '09:00:00', '15:00:00', true),
    (v_doc5_id, 'Friday', '09:00:00', '15:00:00', true),
    (v_doc5_id, 'Saturday', '09:00:00', '15:00:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

  -- Dr. Sadia (Mon, Wed, Fri 14:00 - 19:00)
  INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
  VALUES
    (v_doc6_id, 'Monday', '14:00:00', '19:00:00', true),
    (v_doc6_id, 'Wednesday', '14:00:00', '19:00:00', true),
    (v_doc6_id, 'Friday', '14:00:00', '19:00:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

  -- 4. Seed Sample Appointments
  -- Appointment 1: Completed consultation with Dr. Tariq
  INSERT INTO public.appointments (
    id, patient_id, doctor_id, appointment_date, start_time, end_time,
    time_slot, status, reason, fee, notes, created_at
  )
  VALUES (
    v_apt1_id,
    v_pat1_id,
    v_doc1_id,
    CURRENT_DATE - INTERVAL '3 days',
    '10:00:00',
    '10:30:00',
    '10:00 AM - 10:30 AM',
    'Completed',
    'Routine follow-up for blood pressure monitoring and dizziness upon exertion.',
    1500.00,
    'Completed consultation',
    now() - INTERVAL '5 days'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Appointment 2: Confirmed upcoming appointment with Dr. Tariq
  INSERT INTO public.appointments (
    id, patient_id, doctor_id, appointment_date, start_time, end_time,
    time_slot, status, reason, fee, notes, created_at
  )
  VALUES (
    v_apt2_id,
    v_pat1_id,
    v_doc1_id,
    CURRENT_DATE + INTERVAL '2 days',
    '11:00:00',
    '11:30:00',
    '11:00 AM - 11:30 AM',
    'Confirmed',
    'Follow-up blood pressure review and lab report discussion.',
    1500.00,
    'Patient confirmed via telephone',
    now() - INTERVAL '1 day'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Appointment 3: Pending appointment with Dr. Salman (Cardiology)
  INSERT INTO public.appointments (
    id, patient_id, doctor_id, appointment_date, start_time, end_time,
    time_slot, status, reason, fee, notes, created_at
  )
  VALUES (
    v_apt3_id,
    v_pat2_id,
    v_doc4_id,
    CURRENT_DATE + INTERVAL '4 days',
    '14:00:00',
    '14:30:00',
    '02:00 PM - 02:30 PM',
    'Pending',
    'Occasional palpitations and chest tightness after brisk walking.',
    2000.00,
    'Online booking request',
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 5. Seed Visit Note for Completed Appointment 1
  -- Attending: Dr. Tariq Khan, Patient: Muhammad Asif
  INSERT INTO public.visit_notes (
    appointment_id, doctor_id, patient_id, symptoms, diagnosis,
    prescription, vital_signs, follow_up_date, added_at
  )
  VALUES (
    v_apt1_id,
    v_doc1_id,
    v_pat1_id,
    'Occasional occipital headache in the morning, mild bilateral lower limb heaviness.',
    'Stage 1 Essential Hypertension with mild postural variation.',
    '1. Tab. Amlodipine 5mg - 1 tab once daily in morning (OD) x 30 days
2. Tab. Panadol 500mg - 1 tab SOS for headache
3. Dietary counseling: Low sodium intake (<2g/day), 30-min brisk morning walk.',
    '{"bloodPressure": "142/90 mmHg", "pulse": "74 bpm", "temperature": "98.4 F", "weightKg": 78}',
    CURRENT_DATE + INTERVAL '2 days',
    now() - INTERVAL '3 days'
  )
  ON CONFLICT (appointment_id) DO NOTHING;

END $$;
