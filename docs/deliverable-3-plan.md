# Deliverable 3 Plan (Week 9)

## What we already cover
- Focus session form already meets the 3+ input types + validation requirement (`src/views/focus.ejs`, `src/public/js/main.js`, `POST /focus/sessions`).
- Routes/controllers already capture submissions and return JSON (`src/controllers/indexController.js`).
- Base UI has gradients, active states, and responsive grids from Deliverable 2 (`src/public/css/style.css`).

## What we still need to do this week
- Add three fresh, visible UI upgrades (animation, spacing/typography tweaks, tighter mobile layout).
- Pick two "choice" enhancements from the list (we will go with Toastify notifications + Lucide icons unless we change our mind together).
- Update README and PR proof with new screenshots + short description.

## Split
**Ab**
- Keep `feature/week9-ui-enhancements` in sync with `main`
- Build the goal endpoints (`POST /focus/goals`, `/api/goals`) plus the supporting model `src/models/goalStore.js`; continue to expose any extra data modifications Dasha needs.
- Wire any additional template placeholders or partials needed for the UI polish (e.g., hero copy, modals) and keep MVC tidy.
- Refresh README once Dasha finishes visuals and drop the proof assets into `docs/` before the PR.

**Dasha**
- Does the front-end polish: integrate the selected UI improvements (animations, spacing, responsive adjustments) in `src/public/css/style.css` and `src/public/js/main.js`.
- Pull in Lucide icons and Toastify (or the final two choices) and apply them to the focus/insights pages.
- Capture the Week 9 screenshots or a short clip for the PR + README.

## Shared checkpoints
- Quick sync after the first UI pass to verify validation + toasts look right.
- Full browser walkthrough before opening the PR (desktop + mobile viewport).
- Fill out the Deliverable 3 PR template, cite where older work already meets requirements, and link the Teams handoff post.
