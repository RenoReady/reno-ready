-- ════════════════════════════════════════════════════════════════
-- Reno Ready — stored generations (run once in the Supabase SQL editor)
-- ════════════════════════════════════════════════════════════════
-- Every successful AI preview is uploaded to the private `generations`
-- bucket at <user_id>/<timestamp>-<id>.<ext> and recorded here, so the
-- admin dashboard can show each user's designs. Idempotent.

create table if not exists public.generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  room_type   text not null default 'bathroom'
              check (room_type in ('bathroom','kitchen','bedroom')),
  image_path  text not null,           -- object path inside the `generations` bucket
  prompt      text,
  had_photo   boolean not null default false,  -- generated from the user's own room photo
  created_at  timestamptz not null default now()
);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

-- RLS — users can read their own rows; writes happen server-side with
-- the service-role key, and the admin dashboard reads with it too.
alter table public.generations enable row level security;

drop policy if exists "users read own generations" on public.generations;
create policy "users read own generations"
  on public.generations for select
  using (auth.uid() = user_id);

-- The renders are of people's homes, so keep the bucket private and
-- serve them through short-lived signed URLs instead of public links.
insert into storage.buckets (id, name, public)
  values ('generations', 'generations', false)
  on conflict (id) do update set public = false;

drop policy if exists "public read generations" on storage.objects;

drop policy if exists "users read own generations files" on storage.objects;
create policy "users read own generations files"
  on storage.objects for select
  using (
    bucket_id = 'generations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
