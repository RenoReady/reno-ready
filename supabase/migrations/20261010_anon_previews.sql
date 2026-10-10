-- ════════════════════════════════════════════════════════════════
-- Reno Ready — free preview without an account (run once in the Supabase SQL editor)
-- ════════════════════════════════════════════════════════════════
-- Visitors who aren't signed in get one AI preview. Each one claims a
-- row keyed by a keyed hash of their IP address (the raw IP is never
-- stored), so clearing cookies or opening a private window doesn't
-- reset it. Idempotent.

create table if not exists public.anon_previews (
  ip_hash     text primary key,
  created_at  timestamptz not null default now()
);

-- RLS on with no policies: only the server (service-role key) can read
-- or write this table.
alter table public.anon_previews enable row level security;
