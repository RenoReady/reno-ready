-- "Email it to me": signed-out visitors who asked for their design by email.
--
-- They typed their email to receive their before-and-after, and agreed (on
-- the form) to a couple of follow-ups about it. Shown in the daily health
-- email so they can be followed up. Written and read only by the server with
-- the service role: RLS is on with no policies.
--
-- Run once in the Supabase SQL editor.

create table if not exists public.email_leads (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  email         text not null,
  room          text,                      -- bathroom / kitchen / bedroom
  estimate      text,                      -- the estimate shown with their design, if any
  visitor_id    text not null,             -- anonymous first-party cookie (rr_vid)
  unsubscribed  boolean not null default false
);

create index if not exists email_leads_created_at_idx on public.email_leads (created_at desc);
create index if not exists email_leads_visitor_idx    on public.email_leads (visitor_id);
create index if not exists email_leads_email_idx      on public.email_leads (lower(email));

alter table public.email_leads enable row level security;
