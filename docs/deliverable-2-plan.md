# Week 8 Plan – Deliverable 2

## What we’re trying to ship
- Pages show real data that comes from Express (not hard-coded placeholders).
- The Focus page has a form that adds sessions and gives success/error feedback.
- Client-side JavaScript keeps the timer presets and lists feeling interactive.

## Who does what
- **Ab (server & data)**
  - Keep working on `feature/week8-interactive`.
  - Hold session data in memory (or seed JSON) and pass it to EJS.
  - Handle POST `/focus/sessions`, validate input, and set flash messages.
  - Return a JSON API (`/api/sessions`) that Dasha’s JS can call.
- **Dasha (client experience)**
  - Write front-end JS to wire preset buttons, form validation, and live updates.
  - Show inline success/error states and keep everything keyboard friendly.
  - Polish styling/animations so the new interactions feel smooth.
- **Together**
  - Agree on the session object shape (`title`, `focusMinutes`, `breakMinutes`, `cycles`, `mood`).
  - Capture screenshots or a 60s clip for the PR.
  - Update README + PR template before requesting review.

## Quick checklist
- [ ] Express passes real session data into Focus and Insights.
- [ ] POST route validates and shows feedback.
- [ ] Client JS updates the DOM without a full refresh.
- [ ] README and PR explain the new interactive flow (with proof).
- [ ] PR uses the standard title format (`feat: ...`).
