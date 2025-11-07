-- FocusFlow Supabase tables

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  focus_minutes integer NOT NULL CHECK (focus_minutes BETWEEN 10 AND 90),
  break_minutes integer NOT NULL CHECK (break_minutes BETWEEN 3 AND 30),
  cycles integer NOT NULL CHECK (cycles BETWEEN 1 AND 8),
  mood text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.focus_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_focus_minutes integer NOT NULL CHECK (target_focus_minutes BETWEEN 30 AND 600),
  priority text NOT NULL CHECK (priority IN ('High','Medium','Low')),
  due_date date NOT NULL,
  set_reminder boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_created_at
  ON public.focus_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_focus_goals_due_date
  ON public.focus_goals (due_date ASC);
