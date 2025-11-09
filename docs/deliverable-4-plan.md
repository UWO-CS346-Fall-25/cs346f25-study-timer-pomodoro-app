# Deliverable 4 Plan (Week 10)

## Goals
- Connect FocusFlow to Supabase-hosted PostgreSQL (service role key + anon key in `.env`).
- Create two tables via SQL migration: `focus_sessions` (id uuid, title, focus/break minutes, cycles, mood, created_at) and `focus_goals` (id uuid, title, target minutes, priority enum, due_date, set_reminder, notes, created_at).
- Replace the in-memory stores with Supabase repositories (list/insert + summary helpers) powering the Focus forms and Insights dashboard.
- Update controllers/API routes to await Supabase results; preserve validation and flash messaging.
- Document setup in README (Supabase env vars, running the SQL migration, proof assets).

## Split
**Ab Emmanuel (backend/data)**
- Provision Supabase project & table(s) (`focus_sessions`, `focus_goals`).
- Add Supabase client config (`supabaseClient.js`), manage env vars.
- Replace goal/session store with DB-backed repository (services). Build migrations & seed scripts.
- Update controllers to call new services; ensure server flashes/validation still work.
- Write verification steps, update README with setup instructions (Supabase login, env vars).

**Dasha Coates (front-end/data binding)**
- Adjust client components to reflect data (goal list, insights, session queue).
- Ensure form states reflect DB (loading states/toasts).
- Add UI cues for empty states when DB returns no results.
- Capture demo screenshots/recording for PR.
- PR summary and verification.

## Shared
- Run end-to-end tests (manual) verifying DB writes and reads.
- Collaborate on PR description referencing specific files & DB schema.
