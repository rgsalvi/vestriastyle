-- Supabase initial schema for vestriastyle
-- Run via psql or Supabase SQL editor

-- Users table mirrors Firebase UID (string) to allow phased auth migration.
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  display_name text,
  is_onboarded boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Wardrobe items belong to users.
create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  category text not null,
  color text,
  image_url text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Optional style profile (if you want to separate growing profile fields)
create table if not exists public.style_profile (
  user_id text primary key references public.users(id) on delete cascade,
  body_type text,
  style_goals text[],
  preferences jsonb,
  updated_at timestamptz default now() not null
);

-- Row Level Security (RLS) policies (enable RLS first)
alter table public.users enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.style_profile enable row level security;

-- Assuming we'll use Firebase UID presented via a JWT you validate server-side for now.
-- If later using Supabase Auth, you can map auth.uid() directly.
-- Placeholder policies (adjust once JWT integration decided):
create policy "Users self access" on public.users
  for select using (true) -- temporarily open for read; tighten later
  with check (true);

create policy "Wardrobe self access" on public.wardrobe_items
  for select using (true)
  with check (true);

create policy "Style profile self access" on public.style_profile
  for select using (true)
  with check (true);

-- TODO: Replace 'true' with user_id = auth.uid() after adopting Supabase Auth, or
-- implement a Postgres JWT claim mapping if using Firebase tokens.

-- Triggers to keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

create trigger touch_users before update on public.users
  for each row execute procedure public.touch_updated_at();

create trigger touch_wardrobe before update on public.wardrobe_items
  for each row execute procedure public.touch_updated_at();

create trigger touch_style_profile before update on public.style_profile
  for each row execute procedure public.touch_updated_at();
