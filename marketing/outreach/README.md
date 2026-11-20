# Builder outreach: how it works

Goal: a first Reno Ready Pro sale (founding member, $29/month) before the end of 2026.

## Who we email (ICP, RIPE)
- **R — Revenue:** about $300k–$5M a year.
- **I — Industry:** bathroom and kitchen renovators first; then renovation builders and kitchen/cabinet makers.
- **P — Prospect:** posts before/afters, sells straight to homeowners, quotes in person, already uses some software.
- **E — Employees:** 1–15 (smaller is fine: the price is low).
- Area: Brisbane, Logan, Redlands, Ipswich, Gold Coast (estimates use QLD pricing).
- Skip: volume/new-home builders, commercial fit-outs, subcontract-only trades, franchises, anyone outside Australia.

The list: `brisbane-gold-coast-builders.csv` (A = core, B = secondary).

## Email style (Braiden's feedback)
- Open with one line about the business itself, from their website or listing (what they offer, family-run, design in-house). Not "I saw your post".
- Then: "I've been speaking with a few renovators/builders lately, and they all say the same thing: ..." with a pain that fits the business. (True: Braiden has had these conversations.)
- Then the solution in Braiden's words: "I'm a local founder and built Reno Ready to solve exactly that. Upload a photo of the room, select the features your client wants, and you get a before-and-after of their room in seconds, with a cost estimate for the whole project."
- Ask: reply with a photo of a room they're quoting, and Braiden mocks it up for free.
- No "quick question" openers (too salesy). No "with your logo on it". No price in the first email (the $29 founder offer goes in the second message).
- Always end with: Not for you? Just reply "no thanks" and I won't email again. (Spam Act opt-out.)
- Bold two phrases for skimmers, no more: the pain point and the free mock-up ask.
- Sign off "Cheers, Braiden", then the opt-out line. Create Gmail drafts with includeSignature: true so Gmail adds the saved signature (checked 11 Nov: it has the logo and no stray text). Don't paste the signature HTML into the draft: the Gmail tool strips external images, so the logo goes missing (batch 1 went out without it).

## Tracking link
- One link per email, in the solution paragraph: "You can see how it works at www.renoready.com.au/b/<business-code>" (e.g. /b/tpk-bathrooms). Clicks show in admin as source "outreach-<business-code>".
- The Gmail tool wraps every link in a google.com redirect (recipients outside Gmail can see a "Redirect notice" page). Before scheduling, Braiden clicks the link in the draft, chooses Change, and pastes the clean https://www.renoready.com.au/b/<code> address.

## Sending
- 5 a day, from braiden@renoready.com.au in Gmail. Not through Resend: Resend is for the site's own emails and doesn't allow cold email.
- With the Gmail connector: Claude creates the drafts; Braiden uses Schedule send.
- Time: weekdays 6:45–7:15am Brisbane time, a few minutes apart. (Gmail uses the laptop's time zone: NZ is 3 hours ahead of Brisbane in November.)
- Log each send in the CSV; follow up once after 4 days.

## Batches
- `batch-1.md`: the first 5 (style approved, waiting on email addresses).

## Template v2 (from batch 5): image in the email
No replies after ~17 businesses and 15 follow-ups with v1, so v2 shows the result inside the email.
- Subject: "Clients going quiet after the quote?"
- Opening line about the business, then: "I've been speaking with a few renovators lately, and the same thing keeps coming up: **clients go quiet after the quote because they can't picture the finished room.**"
- "So I built Reno Ready. Here's a real bathroom: the photo before, its Reno Ready preview, and the finished job:" then the inline image `proof-bathroom.jpg` (attach inline, `cid:att0`).
- "You upload a photo of the room, pick the finishes with your client, and they see their own room transformed in seconds, with an itemised cost estimate."
- "**Send me a photo of a room you're quoting and I'll mock it up for free.** Or try it yourself at www.renoready.com.au/b/<code>"
- Then sign-off, signature (includeSignature), opt-out line.
- `proof-bathroom.jpg` is before / preview / finished job (1220×540). The preview is a real Reno Ready render, with the rug changed to a plain teal mat in AI Studio (20 Nov). It matches the finished job: stone tiles, blue feature wall, gold-framed screen. The render on its own: `marketing/showreel/assets/preview-teal.jpg` (also on the home page slider).
- Prestige (info@prestigetilinganddesign.com.au) bounced: no such mailbox.
