-- ============================================================
-- مدرسة الفارابي للغات — Pilot School Seed Data
-- ============================================================
-- Test credentials (password: Test@1234 for all accounts)
--
--   Role                  Email                           UUID suffix
--   ─────────────────── ──────────────────────────────── ───────────
--   school_admin          admin@farabi.edu.eg              ...0004
--   subject_teacher       teacher@farabi.edu.eg            ...0002
--   homeroom_teacher      homeroom@farabi.edu.eg           ...0005
--   kg_primary_student    student.primary@farabi.edu.eg    ...0010
--   prep_sec_student      student.sec@farabi.edu.eg        ...0015
--   kg_student            student.kg@farabi.edu.eg         ...0016
--   parent                parent@farabi.edu.eg             ...0003
--   it_admin              it@farabi.edu.eg                 ...0006
--   chain_admin           chain@farabi.edu.eg              ...0007
--   moe_supervisor        moe@farabi.edu.eg                ...0008
-- ============================================================

DO $$
DECLARE
  v_school_id   uuid := '00000000-0000-0000-0000-000000000001';
  v_term_id     uuid := '00000000-0000-0000-0000-000000000099';
  v_hash        text := crypt('Test@1234', gen_salt('bf'));
BEGIN

  -- ── 1. School ──────────────────────────────────────────────
  INSERT INTO public.schools (id, name_ar, name_en, school_type, governorate, moe_code, is_active)
  VALUES (v_school_id, 'مدرسة الفارابي للغات', 'Farabi Language School',
          'private_language', 'القاهرة', 'CAI-FAR-001', true)
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Academic term (Term 2, active) ─────────────────────
  INSERT INTO public.academic_terms (id, school_id, name_ar, term_number, start_date, end_date, academic_year, is_active)
  VALUES (v_term_id, v_school_id, 'الفصل الدراسي الثاني', 2, '2025-02-01', '2025-06-15', '2024-2025', true)
  ON CONFLICT (id) DO NOTHING;

  -- ── 3. Auth users (all roles) ─────────────────────────────
  INSERT INTO auth.users (id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, role, aud,
    raw_app_meta_data, raw_user_meta_data)
  VALUES
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'teacher@farabi.edu.eg',         v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'parent@farabi.edu.eg',          v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'admin@farabi.edu.eg',           v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'homeroom@farabi.edu.eg',        v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'it@farabi.edu.eg',              v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'chain@farabi.edu.eg',           v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'moe@farabi.edu.eg',             v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'student.primary@farabi.edu.eg', v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'student2@farabi.edu.eg',        v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'student3@farabi.edu.eg',        v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'student4@farabi.edu.eg',        v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'student5@farabi.edu.eg',        v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'student.sec@farabi.edu.eg',     v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', 'student.kg@farabi.edu.eg',      v_hash, now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}')
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. Public user profiles ───────────────────────────────
  -- Existing (add email col)
  INSERT INTO public.users (id, school_id, first_name_ar, last_name_ar, role, email, phone, whatsapp_phone, is_active)
  VALUES
    ('00000000-0000-0000-0000-000000000002', v_school_id, 'نور',    'أحمد',       'subject_teacher',       'teacher@farabi.edu.eg',         '01012345678', '+201012345678', true),
    ('00000000-0000-0000-0000-000000000003', v_school_id, 'محمد',   'علي',        'parent',                'parent@farabi.edu.eg',          '01098765432', '+201098765432', true),
    ('00000000-0000-0000-0000-000000000004', v_school_id, 'سارة',   'إبراهيم',   'school_admin',          'admin@farabi.edu.eg',           '01111111111', '+201111111111', true),
    -- New roles
    ('00000000-0000-0000-0000-000000000005', v_school_id, 'خالد',   'منصور',     'homeroom_teacher',      'homeroom@farabi.edu.eg',        '01022222222', '+201022222222', true),
    ('00000000-0000-0000-0000-000000000006', v_school_id, 'سامي',   'عبدالله',   'it_admin',              'it@farabi.edu.eg',              '01033333333', '+201033333333', true),
    ('00000000-0000-0000-0000-000000000007', v_school_id, 'ريم',    'الشيخ',     'chain_admin',           'chain@farabi.edu.eg',           '01044444444', '+201044444444', true),
    ('00000000-0000-0000-0000-000000000008', v_school_id, 'طارق',   'فهمي',      'moe_supervisor',        'moe@farabi.edu.eg',             '01055555555', '+201055555555', true),
    -- Students
    ('00000000-0000-0000-0000-000000000010', v_school_id, 'أحمد',   'محمد علي',  'kg_primary_student',    'student.primary@farabi.edu.eg', null, null, true),
    ('00000000-0000-0000-0000-000000000011', v_school_id, 'فاطمة',  'حسن إبراهيم','kg_primary_student',   'student2@farabi.edu.eg',        null, null, true),
    ('00000000-0000-0000-0000-000000000012', v_school_id, 'محمد',   'خالد السيد','kg_primary_student',    'student3@farabi.edu.eg',        null, null, true),
    ('00000000-0000-0000-0000-000000000013', v_school_id, 'نور',    'عبدالله محمود','kg_primary_student',  'student4@farabi.edu.eg',        null, null, true),
    ('00000000-0000-0000-0000-000000000014', v_school_id, 'يوسف',  'طارق منصور', 'kg_primary_student',    'student5@farabi.edu.eg',        null, null, true),
    ('00000000-0000-0000-0000-000000000015', v_school_id, 'ليلى',   'عمر فاروق', 'prep_secondary_student','student.sec@farabi.edu.eg',     null, null, true),
    ('00000000-0000-0000-0000-000000000016', v_school_id, 'زياد',   'رامي حسين', 'kg_primary_student',    'student.kg@farabi.edu.eg',      null, null, true)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, is_active = true;

  -- ── 5. Student profiles ───────────────────────────────────
  INSERT INTO public.student_profiles (user_id, student_code, grade_year, stage, section, enrollment_date)
  VALUES
    ('00000000-0000-0000-0000-000000000010', '2024/001', 6, 'primary',   'أ', '2024-09-01'),
    ('00000000-0000-0000-0000-000000000011', '2024/002', 6, 'primary',   'أ', '2024-09-01'),
    ('00000000-0000-0000-0000-000000000012', '2024/003', 6, 'primary',   'أ', '2024-09-01'),
    ('00000000-0000-0000-0000-000000000013', '2024/004', 6, 'primary',   'أ', '2024-09-01'),
    ('00000000-0000-0000-0000-000000000014', '2024/005', 6, 'primary',   'أ', '2024-09-01'),
    ('00000000-0000-0000-0000-000000000015', '2024/006', 10, 'secondary', 'أ', '2024-09-01'),
    ('00000000-0000-0000-0000-000000000016', '2024/007', 1,  'kg',        'أ', '2024-09-01')
  ON CONFLICT (user_id) DO NOTHING;

  -- ── 6. Subjects ───────────────────────────────────────────
  INSERT INTO public.subjects (id, school_id, name_ar, name_en, stage, grade_year, moe_subject_code, total_marks, written_marks, oral_marks, practical_marks, activity_marks, teacher_id, is_active)
  VALUES
    ('00000000-0000-0000-0000-000000000020', v_school_id, 'الرياضيات',        'Mathematics',      'primary',   6,  'MATH-G6',  100, 60, 20, 10, 10, '00000000-0000-0000-0000-000000000002', true),
    ('00000000-0000-0000-0000-000000000021', v_school_id, 'اللغة العربية',    'Arabic Language',  'primary',   6,  'ARAB-G6',  100, 60, 20, 10, 10, '00000000-0000-0000-0000-000000000002', true),
    ('00000000-0000-0000-0000-000000000022', v_school_id, 'اللغة الإنجليزية','English',          'primary',   6,  'ENG-G6',   100, 60, 20, 10, 10, '00000000-0000-0000-0000-000000000002', true),
    ('00000000-0000-0000-0000-000000000023', v_school_id, 'العلوم',           'Science',          'primary',   6,  'SCI-G6',   100, 60, 20, 10, 10, '00000000-0000-0000-0000-000000000002', true),
    ('00000000-0000-0000-0000-000000000024', v_school_id, 'الرياضيات',        'Mathematics',      'secondary', 10, 'MATH-G10', 100, 60, 20, 10, 10, '00000000-0000-0000-0000-000000000002', true),
    ('00000000-0000-0000-0000-000000000025', v_school_id, 'اللغة العربية',    'Arabic Language',  'secondary', 10, 'ARAB-G10', 100, 60, 20, 10, 10, '00000000-0000-0000-0000-000000000002', true)
  ON CONFLICT (id) DO NOTHING;

  -- ── 7. Teacher-subject assignments ───────────────────────
  INSERT INTO public.teacher_subjects (teacher_id, subject_id, grade_year, section, academic_year)
  VALUES
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000020', 6,  'أ', '2024-2025'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000021', 6,  'أ', '2024-2025'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000022', 6,  'أ', '2024-2025'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000023', 6,  'أ', '2024-2025'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000024', 10, 'أ', '2024-2025'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000025', 10, 'أ', '2024-2025')
  ON CONFLICT DO NOTHING;

  -- ── 8. Parent-student links ───────────────────────────────
  INSERT INTO public.parent_student_links (parent_id, student_id, relationship, is_primary)
  VALUES
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', 'أب', true),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', 'أب', true)
  ON CONFLICT DO NOTHING;

  -- ── 9. Grade entries (primary student ...0010, term 2) ────
  INSERT INTO public.grade_entries (student_id, subject_id, term_id, grade_type, total_grade, entered_by)
  VALUES
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', v_term_id, 'written',  52, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', v_term_id, 'oral',     17, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', v_term_id, 'activity',  9, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000021', v_term_id, 'written',  55, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000021', v_term_id, 'oral',     18, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000022', v_term_id, 'written',  48, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000022', v_term_id, 'oral',     15, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000023', v_term_id, 'written',  40, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000023', v_term_id, 'oral',     12, '00000000-0000-0000-0000-000000000002'),
    -- Secondary student ...0015
    ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000024', v_term_id, 'written',  58, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000024', v_term_id, 'oral',     19, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000025', v_term_id, 'written',  44, '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000025', v_term_id, 'oral',     16, '00000000-0000-0000-0000-000000000002')
  ON CONFLICT DO NOTHING;

  -- ── 10. Attendance records (last 14 days, primary student) ──
  INSERT INTO public.attendance_records (student_id, teacher_id, subject_id, status, attendance_date, period_number)
  SELECT
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000020',
    CASE WHEN gs.day IN (3, 7, 11) THEN 'absent'::attendance_status ELSE 'present'::attendance_status END,
    (CURRENT_DATE - gs.day * INTERVAL '1 day')::date,
    1
  FROM generate_series(1, 14) AS gs(day)
  ON CONFLICT DO NOTHING;

END $$;
