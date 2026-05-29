-- ── Role-based feature permissions per school ──────────────────────────────
-- Admins can toggle which features each role can access within their school.

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id         uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  uuid      NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role       user_role NOT NULL,
  feature    text      NOT NULL,
  can_access boolean   NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, role, feature)
);

CREATE INDEX IF NOT EXISTS idx_perms_school_role ON public.role_permissions(school_id, role);

-- ── Seed default permissions for every school that exists ──────────────────
INSERT INTO public.role_permissions (school_id, role, feature, can_access)
SELECT
  s.id,
  r.role::user_role,
  f.feature,
  CASE
    -- school_admin: everything
    WHEN r.role = 'school_admin' THEN true

    -- subject_teacher
    WHEN r.role = 'subject_teacher' AND f.feature IN
      ('attendance','grades','assignments','courses','conduct','timetable','announcements','messages','notifications') THEN true
    WHEN r.role = 'subject_teacher' THEN false

    -- homeroom_teacher: same as subject teacher
    WHEN r.role = 'homeroom_teacher' AND f.feature IN
      ('attendance','grades','assignments','courses','conduct','timetable','announcements','messages','notifications') THEN true
    WHEN r.role = 'homeroom_teacher' THEN false

    -- kg_primary_student
    WHEN r.role = 'kg_primary_student' AND f.feature IN
      ('courses','timetable','announcements','assignments','grades','messages','notifications') THEN true
    WHEN r.role = 'kg_primary_student' THEN false

    -- prep_secondary_student
    WHEN r.role = 'prep_secondary_student' AND f.feature IN
      ('courses','timetable','announcements','assignments','grades','messages','notifications') THEN true
    WHEN r.role = 'prep_secondary_student' THEN false

    -- parent
    WHEN r.role = 'parent' AND f.feature IN
      ('grades','attendance','announcements','messages','notifications') THEN true
    WHEN r.role = 'parent' THEN false

    -- it_admin: everything
    WHEN r.role = 'it_admin' THEN true

    -- chain_admin
    WHEN r.role = 'chain_admin' AND f.feature IN
      ('analytics','announcements','notifications') THEN true
    WHEN r.role = 'chain_admin' THEN false

    -- moe_supervisor: read-only subset
    WHEN r.role = 'moe_supervisor' AND f.feature IN
      ('analytics','announcements','notifications') THEN true
    WHEN r.role = 'moe_supervisor' THEN false

    ELSE false
  END AS can_access
FROM public.schools s
CROSS JOIN (
  VALUES
    ('school_admin'),('subject_teacher'),('homeroom_teacher'),
    ('kg_primary_student'),('prep_secondary_student'),('parent'),
    ('it_admin'),('chain_admin'),('moe_supervisor')
) AS r(role)
CROSS JOIN (
  VALUES
    ('attendance'),('grades'),('assignments'),('courses'),('conduct'),
    ('timetable'),('announcements'),('messages'),('notifications'),
    ('analytics'),('user_management'),('settings'),('audit_log'),('permissions')
) AS f(feature)
ON CONFLICT (school_id, role, feature) DO NOTHING;
