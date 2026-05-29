-- Custom roles: admins can create named sub-roles with custom permission sets
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  uuid        NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name_ar    text        NOT NULL,
  name_en    text,
  base_role  user_role   NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_role_permissions (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_role_id uuid    NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  feature        text    NOT NULL,
  can_access     boolean NOT NULL DEFAULT true,
  UNIQUE (custom_role_id, feature)
);

-- Add custom_role_id to users (nullable — most users won't have one)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS custom_role_id uuid REFERENCES public.custom_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_custom_roles_school ON public.custom_roles(school_id);
CREATE INDEX IF NOT EXISTS idx_custom_role_perms   ON public.custom_role_permissions(custom_role_id);
