-- Where an email lead came from: "design" (emailed their preview) or
-- "finish_later" (Step 1: email me a link to finish later).
--
-- Run once in the Supabase SQL editor.

alter table public.email_leads add column if not exists source text;
