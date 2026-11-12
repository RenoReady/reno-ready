-- One free preview before signing in.
--
-- Each row is one attempt by a signed-out visitor. The server checks this
-- table before generating, so nobody can run up the AI bill:
--   - 1 successful preview per browser (visitor cookie), ever
--   - 3 attempts per browser and 6 per internet connection in 24 hours
--   - a site-wide cap per 24 hours (ANON_PREVIEW_DAILY_CAP, default 60)
-- When they later sign in, their preview is claimed by the account and counts
-- as the free one.
--
-- The internet connection is stored only as a salted hash, never the address.
-- Written and read only by the server with the service role: RLS is on with
-- no policies, so the public anon key can't read or write it.
--
-- Run once in the Supabase SQL editor.

create table if not exists public.anon_previews (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  visitor_id  text not null,                -- anonymous first-party cookie (rr_vid)
  ip_hash     text not null,                -- salted hash of the connection, for the per-connection limit
  room        text,                         -- bathroom / kitchen / bedroom
  succeeded   boolean not null default false,
  claimed_by  uuid references auth.users (id) on delete set null   -- the account it counted against after sign-in
);

create index if not exists anon_previews_created_at_idx on public.anon_previews (created_at desc);
create index if not exists anon_previews_visitor_idx    on public.anon_previews (visitor_id);
create index if not exists anon_previews_ip_idx         on public.anon_previews (ip_hash);
create index if not exists anon_previews_claimed_idx    on public.anon_previews (claimed_by);

alter table public.anon_previews enable row level security;
