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

-- ── 2. generations storage bucket ───────────────────────────────
-- Stores the AI-generated images so they appear in the admin gallery.
-- Files should be uploaded with the path: <user_id>/<timestamp>.png
insert into storage.buckets (id, name, public)
  values ('generations', 'generations', true)
  on conflict (id) do nothing;

-- Public read (so the admin gallery's getPublicUrl works) but
-- authenticated-only writes scoped to the user's own folder.
drop policy if exists "public read generations" on storage.objects;
create policy "public read generations"
  on storage.objects for select
  using (bucket_id = 'generations');

drop policy if exists "users upload to own folder" on storage.objects;
create policy "users upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'generations'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
