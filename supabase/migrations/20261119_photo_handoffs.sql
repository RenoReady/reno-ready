-- Phone → computer photo hand-off (the QR code on Step 1).
--
-- The computer opens a hand-off (a random token in its QR code), the phone
-- sends one photo to it, and the computer picks the photo up and the row is
-- deleted. Unclaimed rows are deleted after an hour. Written and read only by
-- the server with the service role: RLS is on with no policies.
--
-- Run once in the Supabase SQL editor.

create table if not exists public.photo_handoffs (
  token        text primary key,           -- random, in the QR code
  created_at   timestamptz not null default now(),
  visitor_id   text not null,              -- the computer's anonymous cookie (rr_vid)
  room         text,                       -- bathroom / kitchen / bedroom
  photo        text,                       -- JPEG data URL from the phone, until the computer picks it up
  received_at  timestamptz
);

create index if not exists photo_handoffs_created_at_idx on public.photo_handoffs (created_at);
create index if not exists photo_handoffs_visitor_idx    on public.photo_handoffs (visitor_id);

alter table public.photo_handoffs enable row level security;
