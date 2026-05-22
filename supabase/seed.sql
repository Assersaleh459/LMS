-- ============================================================
-- Seed Data — Farabi Language School (مدرسة الفارابي للغات)
-- Development + testing use only
-- ============================================================

-- School
insert into schools (id, name_ar, name_en, school_type, governorate, moe_code)
values (
  '00000000-0000-0000-0000-000000000001',
  'مدرسة الفارابي للغات',
  'Farabi Language School',
  'private_language',
  'القاهرة',
  'CAI-FAR-001'
);

-- Academic term (Term 2, 2024-2025, active)
insert into academic_terms (id, school_id, name_ar, term_number, start_date, end_date, academic_year, is_active)
values (
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000001',
  'الفصل الدراسي الثاني',
  2,
  '2025-02-01',
  '2025-06-15',
  '2024-2025',
  true
);

-- Teacher
insert into users (id, school_id, first_name_ar, last_name_ar, role, phone, whatsapp_phone)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'نور', 'أحمد',
  'subject_teacher',
  '01012345678',
  '+201012345678'
);

-- Parent
insert into users (id, school_id, first_name_ar, last_name_ar, role, phone, whatsapp_phone)
values (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'محمد', 'علي',
  'parent',
  '01098765432',
  '+201098765432'
);

-- Admin
insert into users (id, school_id, first_name_ar, last_name_ar, role, phone, whatsapp_phone)
values (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'سارة', 'إبراهيم',
  'school_admin',
  '01111111111',
  '+201111111111'
);

-- 5 students (Grade 6, Section أ)
insert into users (id, school_id, first_name_ar, last_name_ar, role)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'أحمد',  'محمد علي',        'kg_primary_student'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'فاطمة', 'حسن إبراهيم',     'kg_primary_student'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'محمد',  'خالد السيد',      'kg_primary_student'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'نور',   'عبدالله محمود',   'kg_primary_student'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'يوسف', 'طارق منصور',       'kg_primary_student');

insert into student_profiles (user_id, student_code, grade_year, stage, section, enrollment_date)
values
  ('00000000-0000-0000-0000-000000000010', '2024/001', 6, 'primary', 'أ', '2024-09-01'),
  ('00000000-0000-0000-0000-000000000011', '2024/002', 6, 'primary', 'أ', '2024-09-01'),
  ('00000000-0000-0000-0000-000000000012', '2024/003', 6, 'primary', 'أ', '2024-09-01'),
  ('00000000-0000-0000-0000-000000000013', '2024/004', 6, 'primary', 'أ', '2024-09-01'),
  ('00000000-0000-0000-0000-000000000014', '2024/005', 6, 'primary', 'أ', '2024-09-01');

-- Math subject (Grade 6)
insert into subjects (id, school_id, name_ar, name_en, stage, grade_year, moe_subject_code, total_marks, written_marks, oral_marks, practical_marks, activity_marks)
values (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'الرياضيات', 'Mathematics',
  'primary', 6,
  'MATH-G6',
  100, 60, 20, 10, 10
);

-- Arabic subject (Grade 6)
insert into subjects (id, school_id, name_ar, name_en, stage, grade_year, moe_subject_code, total_marks, written_marks, oral_marks, practical_marks, activity_marks)
values (
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000001',
  'اللغة العربية', 'Arabic Language',
  'primary', 6,
  'ARAB-G6',
  100, 60, 20, 10, 10
);

-- Teacher assignment
insert into teacher_subjects (teacher_id, subject_id, grade_year, section)
values
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000020', 6, 'أ'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000021', 6, 'أ');

-- Parent-student link
insert into parent_student_links (parent_id, student_id, relationship, is_primary)
values
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', 'أب', true),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', 'أب', true);
