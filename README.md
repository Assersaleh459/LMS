<div align="center">

# 🏫 مدرستي — Madrasati LMS

**Arabic-first, mobile-first School Management System for Egyptian K-12 schools**

[Live → lms-egypt.vercel.app](https://lms-egypt.vercel.app)

</div>

---

## Overview

مدرستي is a complete LMS built for Egyptian schools — RTL Arabic interface, offline-capable attendance, Ministry-of-Education-compliant grading (KG descriptive grades, Thanawi 40/60 weighting), parent communication, and full role-based access control.

- **Live app:** https://lms-egypt.vercel.app
- **Stack:** React 18 · TypeScript · Vite 8 · Tailwind CSS · Supabase (Postgres + Auth + Storage + Edge Functions + Realtime) · Vercel
- **Pilot school:** مدرسة الفارابي للغات

## For developers / AI agents

👉 **Start with [CLAUDE.md](CLAUDE.md)** — stack, conventions, gotchas, and commands.
👉 **[docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)** — full inventory of every migration, edge function, and feature.

## Quick start

```bash
npm install
npm run dev          # local dev server
npm run build        # production build (run before any deploy)
```

Environment variables (`.env`):
```
VITE_SUPABASE_URL=https://mczvgjfreyvbcdypmjpb.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## Test accounts

All passwords: `Test@1234`

| Role | Email |
|------|-------|
| School Admin | `admin@farabi.edu.eg` |
| Subject Teacher | `teacher@farabi.edu.eg` |
| Homeroom Teacher | `homeroom@farabi.edu.eg` |
| Primary Student | `student.primary@farabi.edu.eg` |
| Secondary Student | `student.sec@farabi.edu.eg` |
| KG Student | `student.kg@farabi.edu.eg` |
| Parent | `parent@farabi.edu.eg` |
| IT Admin | `it@farabi.edu.eg` |
| Chain Admin | `chain@farabi.edu.eg` |
| MoE Supervisor | `moe@farabi.edu.eg` |

## Roles

Students (KG/Primary/Secondary) · Teachers (Subject/Homeroom) · Parent · School Admin · IT Admin · Chain Admin · MoE Supervisor — plus admin-defined **custom roles** per school.

## License

Private project.
