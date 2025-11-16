ALTER TABLE public.focus_users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
