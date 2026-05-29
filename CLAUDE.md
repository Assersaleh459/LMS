# CLAUDE.md — مدرستي LMS Project Guide

> **Read this first.** It is the single source of truth for working on this codebase.
> Detailed feature/migration inventory lives in [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md).

> **⚠️ Precedence note.** Other `CLAUDE.md` files also load (your global `~/.claude/CLAUDE.md`
> and the `Documents/CLAUDE.md` "WAT framework"). Those describe a `workflows/` + `tools/` +
> `al_materi/` project structure — **this project does NOT use that structure.** It is a standard
> React + TypeScript + Supabase + Vercel app. For anything specific to this repo, **the conventions
> in THIS file take precedence.** General working style from the global files (autonomy, git
> discipline, the React+Supabase/Arabic-RTL deployment notes) still applies and is compatible.

## What this is

**مدرستي (Madrasati)** — an Arabic-first, mobile-first LMS / school-management system for Egyptian K-12 schools, built to comply with Egyptian Ministry of Education (MoE) rules.

- **Live:** https://lms-egypt.vercel.app
- **GitHub:** https://github.com/Assersaleh459/LMS.git
- **Stack:** React 18 + TypeScript + Vite 8 + Tailwind CSS + Supabase + Vercel
- **Supabase project ref:** `mczvgjfreyvbcdypmjpb`
- **Pilot school:** مدرسة الفارابي للغات (Al-Farabi Language School)

## Critical conventions — read before touching code

### Arabic-first / RTL
- All UI strings go through `t()` from `useLang()`. Keys live in [src/lib/i18n.ts](src/lib/i18n.ts) (600+ keys). **Never hardcode Arabic in JSX.**
- `useLang()` returns: `t` (translate), `lang`, `dir` ('rtl'/'ltr'), `ta` (text-align class), `fa` (font-arabic class), `toggleLang`.
- Put `dir="rtl"` on inputs holding Arabic, `dir="ltr"` on phone/email/code inputs.
- Display numbers via `toArabicNumerals()` from [src/lib/arabic.ts](src/lib/arabic.ts).

### Supabase type casts
The generated [src/types/database.ts](src/types/database.ts) was created early and is **stale**. Any table added after migration ~012 is NOT in it. Use `(supabase as any).from(...)` for these:
`timetable_slots`, `conduct_entries`, `academic_terms`, `school_settings_audit`, `notifications`, `messages`, `subject_enrollments`, `teacher_subjects` (updates), `grade_audit_log`, `question_bank`, `rubrics`, `rubric_criteria`, `rubric_scores`, `system_audit_log`, `role_permissions`, `custom_roles`, `custom_role_permissions`, and the `quizzes` columns `opens_at`/`closes_at`/`max_attempts`, and `users.custom_role_id`.

### Auth context shape
- Current user UUID: `auth?.profile?.id` (or `auth?.session?.user?.id` — same value).
- **Do NOT use `auth?.user?.id`** — it does not exist.
- `auth.role`, `auth.schoolId`, `auth.signOut` also available. See [src/app/providers/AuthProvider.tsx](src/app/providers/AuthProvider.tsx).

### ⚠️ Creating auth users — HARD-WON LESSON
**Inserting into `auth.users` via raw SQL does NOT produce a working login.** Supabase GoTrue also needs a matching `auth.identities` row whose `identity_data` contains `"email_verified": true`. The only reliable way to create login-capable users is the **Admin API** (`supabase.auth.admin.createUser`), which is what the `admin-create-user` Edge Function does. The seed file documents test accounts but they were ultimately (re)created via the Admin API. If logins fail after seeding, this is why.

### Grade save pattern
`enterGrade()` in [src/lib/supabase.ts](src/lib/supabase.ts) does **update-then-insert** (NOT upsert) because the unique index is expression-based and can't be a PostgREST conflict target.

## Commands

```bash
# Build (ALWAYS run before deploying — must be clean)
npm run build

# Deploy frontend
npx vercel --prod --yes

# Run a SQL migration / query against prod (NOT "db execute")
supabase db query --linked --file supabase/migrations/0XX_name.sql

# Deploy an edge function (NOT "--linked")
supabase functions deploy <name> --project-ref mczvgjfreyvbcdypmjpb --use-api

# Standard deploy chain
npm run build && npx vercel --prod --yes && git add -A && git commit && git push
```

## Working style
- Operate autonomously. On "continue" / "you do it", run the full chain (build → deploy → push) without pausing per step.
- Commit per logical unit. Push after every deploy.
- End commit messages with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Disposable debug SQL/scripts go in `.tmp/` (gitignored).

## Roles (user_role enum)
`kg_primary_student`, `prep_secondary_student`, `subject_teacher`, `homeroom_teacher`, `parent`, `school_admin`, `it_admin`, `chain_admin`, `moe_supervisor`. Custom named roles can be created per-school (see migration 024).

## Test credentials
All accounts: password `Test@1234`. Emails: `admin@`, `teacher@`, `homeroom@`, `student.primary@`, `student.sec@`, `student.kg@`, `parent@`, `it@`, `chain@`, `moe@` — all `@farabi.edu.eg`.

## Known remaining work
- **WhatsApp** — `notify-*` edge functions hit a placeholder URL; no real messages send. Needs n8n or WhatsApp Business API. (User asked to HOLD on this.)
- Several features (quiz test banks, rubric grading, course copy, at-risk warning) are built but **not yet tested by real users**.
- PWA push notifications only fire while app is open (Realtime), not when closed.

See [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) for the complete inventory.
