-- ════════════════════════════════════════════════════════════════
-- Reno Ready — Supabase schema
-- ════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL editor (or via the CLI) once per
-- project. Idempotent — safe to re-run.
-- ────────────────────────────────────────────────────────────────

-- ── 1. profiles table ───────────────────────────────────────────
-- One row per signed-up user, mirroring auth.users.id. The Admin
-- Dashboard reads from this table.
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  created_at          timestamptz not null default now(),
  subscription_plan   text not null default 'free'
                      check (subscription_plan in ('free','paid','day_pass','monthly','annual')),
  generation_count    integer not null default 0
);

-- Auto-populate from auth.users on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS — users can read/update only their own row
alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- The admin dashboard uses the SERVICE_ROLE key which bypasses RLS,
-- so no admin-specific policy is required.

-- Subscription expiry (day_pass / monthly / annual)
alter table public.profiles
  add column if not exists subscription_expires_at timestamptz;

-- Stripe customer ID — stored on first purchase for future subscription management
alter table public.profiles
  add column if not exists stripe_customer_id text;

-- Helper RPC: increment generation_count atomically
create or replace function public.increment_generation_count(uid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set generation_count = generation_count + 1
   where id = uid;
$$;

-- ── 2. generations: stored AI previews ──────────────────────────
-- Every successful preview is uploaded to the private `generations`
-- bucket at <user_id>/<timestamp>-<id>.<ext> by /api/generate and
-- recorded in this table. The admin dashboard lists them per user
-- through short-lived signed URLs.
-- (Also shipped as supabase/migrations/20261008_generations.sql.)
create table if not exists public.generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  room_type   text not null default 'bathroom'
              check (room_type in ('bathroom','kitchen','bedroom')),
  image_path  text not null,
  prompt      text,
  had_photo   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

alter table public.generations enable row level security;

drop policy if exists "users read own generations" on public.generations;
create policy "users read own generations"
  on public.generations for select
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
  values ('generations', 'generations', false)
  on conflict (id) do update set public = false;

-- Renders are of people's homes: no public read. Users may read their
-- own folder; the server writes and the admin reads with the service role.
drop policy if exists "public read generations" on storage.objects;

drop policy if exists "users read own generations files" on storage.objects;
create policy "users read own generations files"
  on storage.objects for select
  using (
    bucket_id = 'generations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users upload to own folder" on storage.objects;
create policy "users upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'generations'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 3. anon_previews: one free preview without an account ───────
-- Visitors who aren't signed in get one AI preview. Each one claims a
-- row keyed by a keyed hash of their IP address (the raw IP is never
-- stored). Only the server's service-role key can read or write it.
-- (Also shipped as supabase/migrations/20261010_anon_previews.sql.)
create table if not exists public.anon_previews (
  ip_hash     text primary key,
  created_at  timestamptz not null default now()
);

alter table public.anon_previews enable row level security;
