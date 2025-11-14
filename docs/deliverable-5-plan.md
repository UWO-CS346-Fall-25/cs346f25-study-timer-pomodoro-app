# Deliverable 5 Plan (Week 11)

## Goals
- Add full-stack authentication so users can register, log in, and maintain sessions while using FocusFlow.
- Store user accounts in Supabase with bcrypt-hashed passwords and enforce validation for username/email/password per Deliverable 5 spec.
- Implement Express-session (or Supabase Auth) to persist sessions, expose route guards, and surface login state in the UI (username banner, protected routes).
- Provide logout + cookie (httpOnly, secure in prod) and sanitize inputs to meet security checklist.

## Split
**Ab Emmanuel (backend/auth)**
- Finalize Supabase auth schema: `users` table (id UUID, username, email, password_hash, created_at) plus helper queries.
- Add registration route/controller that validates inputs, hashes passwords with bcrypt, stores the record, and returns structured success/error responses for the front end.
- Build login route/controller that verifies credentials, make the session via `express-session`, and redirects/returns dashboard loads.
- Implement session middleware (`requireAuth`, `attachUser`) and logout handler that destroys sessions, clears cookies, and prevents protected route access for anonymous users.
- Update README/setup docs with `.env` auth keys, Supabase migration notes, and developer verification steps; add in-line comments only where logic is non-obvious.

**Dasha Coates (frontend/auth UX)**
- Design & implement registration and login forms with client-side validation (required fields, password length, password confirmation), error states, and success redirects.
- Integrate the forms with the new API endpoints (fetch), handle response messages, and show loading indicators/toasts.
- Update navigation/layout to reflect auth state (welcome message, logout link, hide protected pages when logged out) and ensure redirects work.
- Deliver optional enhancement (e.g., “Remember Me” persistent cookie toggle or password strength meter(if you can-not neccessary)) and update screenshots/demo assets for the PR.
- Contribute README/PR notes covering the user journey and UX decisions tied to auth.
