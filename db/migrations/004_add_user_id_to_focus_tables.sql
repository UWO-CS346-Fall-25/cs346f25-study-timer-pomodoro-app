-- Attach focus sessions/goals to specific users

ALTER TABLE public.focus_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.focus_users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id_created
  ON public.focus_sessions (user_id, created_at DESC);

ALTER TABLE public.focus_goals
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.focus_users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_focus_goals_user_id_due
  ON public.focus_goals (user_id, due_date ASC);
