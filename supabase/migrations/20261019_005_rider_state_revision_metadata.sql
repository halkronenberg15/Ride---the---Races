alter table public.rider_state
  add column if not exists client_revision text,
  add column if not exists client_saved_at timestamptz;
