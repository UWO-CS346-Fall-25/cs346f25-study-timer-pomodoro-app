# Deliverable 2: Week 8 Plan (Interactive Prototype)

## Goals
- Make the FocusFlow pages feel alive with real data passed from Express to EJS.
- Add client-side JavaScript so the timer presets and forms respond immediately.
- Keep the code organized so adding persistence later will be easy.

## Task Split
- **Server & Data (Ab)**
  - Create `feature/week8-interactive` branch from updated `main`.
  - Define a temporary data store (JSON or in-memory) for study sessions and insights.
  - Update controllers to load data, apply validation, and handle a POST to add sessions.
  - Return success/error messages to the views so they render feedback.
- **Client Interactivity (Dasha)**
  - Add JS modules for preset buttons, countdown mock, and form validation.
  - Show inline messages on success/error and keep keyboard accessibility.
  - Refresh styling/animations to support the new interactions.
- **Shared**
  - Agree on the shape of session objects (fields, defaults).
  - Record verification steps (screenshots or 60s demo) for the PR.
  - Update README + PR template together before merging.

## Deliverable Checklist
- [ ] Express passes real data objects into each view.
- [ ] At least one POST route with server-side validation and feedback.
- [ ] Client JS updates the page state without refresh.
- [ ] README documents the new interactive flow and how to test it.
- [ ] PR titled following convention (e.g., `feat: add interactive focus sessions`).
