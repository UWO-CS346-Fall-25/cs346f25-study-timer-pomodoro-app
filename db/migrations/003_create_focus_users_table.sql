-- FocusFlow auth tables for Supabase

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS public.focus_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username citext NOT NULL UNIQUE,
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  last_login_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_focus_users_email
  ON public.focus_users (email);

CREATE INDEX IF NOT EXISTS idx_focus_users_username
  ON public.focus_users (username);

CREATE OR REPLACE FUNCTION public.set_focus_users_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_focus_users_updated_at ON public.focus_users;

CREATE TRIGGER trg_focus_users_updated_at
  BEFORE UPDATE ON public.focus_users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_focus_users_updated_at();
