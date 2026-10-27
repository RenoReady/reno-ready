-- Visitor journey events for the admin dashboard (funnel, rooms, locations,
-- devices) and the daily health email. Written and read only by the server
-- with the service role: RLS is on with no policies, so the public anon key
-- can't read or write it.
--
-- Run once in the Supabase SQL editor.

create table if not exists public.funnel_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  visitor_id  text not null,                 -- anonymous first-party cookie (rr_vid), or "u:<user id>" for server-only events
  user_id     uuid references auth.users (id) on delete set null,
  step        text not null,                 -- visit, room, photo, style, generate, signin_shown, signed_in, preview, preview_failed, edit, paywall, checkout, paid, brief, postcode
  room        text,                          -- bathroom / kitchen / bedroom
  detail      text,                          -- e.g. the style picked, paywall reason, plan
  page        text,
  source      text,                          -- first-touch source (rr_src cookie)
  device      text,                          -- mobile / tablet / desktop
  is_returning boolean,
  city        text,                          -- approximate, from Vercel's IP location
  region      text,
  country     text,
  postcode    text                           -- only when they type one in
);

create index if not exists funnel_events_created_at_idx on public.funnel_events (created_at desc);
create index if not exists funnel_events_visitor_idx    on public.funnel_events (visitor_id);
create index if not exists funnel_events_user_idx       on public.funnel_events (user_id);

alter table public.funnel_events enable row level security;
