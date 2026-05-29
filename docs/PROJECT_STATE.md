# مدرستي LMS — Project State Inventory

_Last updated: milestone v1.0.0. This is the complete record of what exists. For conventions and commands see the root [CLAUDE.md](../CLAUDE.md)._

---

## 1. Database migrations (`supabase/migrations/`)

| # | File | What it does |
|---|------|--------------|
| 001 | grade_audit_log | Audit log + trigger on every grade change |
| 002 | conduct_log | `conduct_entries` table (behavior notes) |
| 003 | school_settings | School profile/settings columns |
| 004 | school_settings_audit | Audit trail for settings changes |
| 005 | timetable | `timetable_slots` table |
| 006 | submission_files | File columns on assignment submissions |
| 007 | notifications_messages | `notifications` + `messages` tables |
| 008 | subject_enrollment | `subject_enrollments` table |
| 009 | notification_triggers | Triggers: absence→parent, assignment publish→students, announcement→all |
| 010 | submissions_bucket | Storage bucket `submissions` (10MB, image/PDF/video) |
| 011 | fix_grade_trigger | Bugfix on grade audit trigger |
| 012 | subjects_teacher_id | `subjects.teacher_id` + sync with `teacher_subjects` |
| 013 | realtime_publications | Realtime replication for messages/notifications |
| 014 | grade_entries_unique | Expression-based unique index (student, subject, type, term) |
| 015 | ensure_audit_trigger | Re-assert grade audit trigger |
| 016 | quiz_availability | `quizzes.opens_at`, `closes_at`, `max_attempts` |
| 017 | at_risk_view | `v_at_risk_students` view (absence ≥20% / avg <50% / overdue HW ≥2) |
| 018 | question_bank | `question_bank` table (reusable quiz questions per subject) |
| 019 | rubrics | `rubrics`, `rubric_criteria`, `rubric_scores` |
| 020 | assignment_auto_late | Trigger: pending submissions → `late` after due date |
| 021 | auto_enroll | Trigger: auto-enroll grade students when a subject is created |
| 022 | system_audit_log | `system_audit_log` + triggers on users, assignments, conduct, schools |
| 023 | role_permissions | `role_permissions` (14 features × 9 roles) + default seed |
| 024 | custom_roles | `custom_roles`, `custom_role_permissions`, `users.custom_role_id` |

`supabase/seed.sql` seeds مدرسة الفارابي للغات with all roles, subjects, a term, sample grades + attendance.

## 2. Edge functions (`supabase/functions/`)

| Function | Purpose | Auth |
|----------|---------|------|
| `admin-create-user` | Create login-capable user via Admin API; optional password (default `Madrasati@2025`); requires email | school_admin/it_admin/chain_admin |
| `admin-reset-password` | Reset a user's password; logs to audit | school_admin/it_admin only |
| `emergency-broadcast` | Send message to all parents | admin |
| `notify-absence` | WhatsApp alert for absent students | ⚠️ placeholder URL |
| `notify-assignment` | WhatsApp alert on assignment publish | ⚠️ placeholder URL |
| `notify-grade` | WhatsApp alert on grade entry | ⚠️ placeholder URL |

## 3. Features by role

**School Admin** (`/admin`): dashboard with school-health score + at-risk panel, user management (create/edit/CSV import/password reset/custom-role assign), class roster, teacher-subject assignment, timetable editor, academic-year/term rollover, absence report, emergency broadcast, school settings, **system audit log** (`/admin/audit`), **roles & permissions** (`/admin/permissions`, incl. custom role creation).

**Teacher** (`/teacher`): dashboard (class count, absent today, ungraded subs), attendance (offline queue + WhatsApp), grade entry (written/oral/practical/activity; KG = descriptive ممتاز/جيد/يحتاج تحسين; Excel import/export; audit; analytics), assignments (6 types + rubric builder), submissions grading (rubric scorer), courses→units→lessons→quizzes (+ question bank + course copy), conduct log, profile.

**Students** — Primary (`/student/primary`), Secondary (`/student/secondary`, Thanawi 40/60 weighted), KG (`/student/kg`, descriptive only): grades view, timetable, assignments (submit text/photo), courses, quizzes (with availability window + attempt limit).

**Parent** (`/parent`): child switcher, grades, 90-day attendance calendar, upcoming assignments, teacher messaging (realtime), printable report card (logo + MoE code + signatures), logout in header.

**Chain Admin** (`/chain`) / **MoE Supervisor** (read-only nav): cross-school stats.
**IT Admin** (`/it-admin`): system health overview.

## 4. Key file map

| Area | Files |
|------|-------|
| Auth | `src/app/providers/AuthProvider.tsx`, `src/features/auth/LoginPage.tsx`, `ResetPasswordPage.tsx` (self-service reset is BLOCKED — contact admin) |
| i18n | `src/lib/i18n.ts` |
| Permissions | `src/hooks/usePermissions.ts`, `src/features/admin/PermissionsPage.tsx` |
| Audit | `src/features/admin/SystemAuditPage.tsx` |
| Users | `src/features/admin/UserManagementPage.tsx` |
| Grade logic | `src/lib/supabase.ts` (`enterGrade`), `src/lib/moe.ts` (letter grades, KG grades, Thanawi calc) |
| Nav | `src/components/layout/{SideNav,BottomNav,AppBar}.tsx` (AppBar has logout + lang toggle for all pages) |
| Routes | `src/app/Router.tsx` |

## 5. Auth / login decisions
- Google sign-in: **removed**.
- Self-service "forgot password": **removed/blocked** — only school_admin & it_admin reset passwords (via `admin-reset-password`).
- Logout: shown on every page (AppBar reads `auth.session`; ParentDashboard has its own header button).

## 6. Remaining / untested work
1. **WhatsApp integration** (ON HOLD per user) — wire `notify-*` to real n8n or WhatsApp Business API.
2. Real-user testing pass — test banks, rubrics, course copy, at-risk, quiz availability are built but unverified in real use.
3. PWA push when app closed.
4. Regenerate `src/types/database.ts` to drop the `(supabase as any)` casts (optional cleanup).

## 7. Recent milestone commits
- `a731160` professional user management redesign + admin password reset
- `15e14e9` custom roles + full i18n on permissions page
- `77c32fe` system audit log + role permissions
- `7f82fe8` parent portal logout
- `2e90e54` logout on every page
- `7e460f3` remove Google sign-in + block self-service password reset
