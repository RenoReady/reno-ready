# Reno Ready: "Show Your Space" (homeowner cut)

30 seconds, 1080×1920 vertical, 30 fps. The companion to the contractor video ("Show them the reno before they sign").

## Matching the contractor video

| Element | Same as the contractor cut |
|---|---|
| Background | Warm sand paper, a single charcoal ground line about two-thirds down |
| Figures | Hand-drawn charcoal stick figures with slightly wobbly lines and dot eyes. The builder wears the terracotta hard hat. The homeowner has the messy-hair, gender-neutral head from the contractor cut |
| Set | The same desk-at-night scene: pendant lamp with a warm glow, navy window with a moon, wall clock, coffee mug |
| Headlines | Condensed bold caps in the top third. Setup line in charcoal, punchline in terracotta. Words pop in one at a time on the VO beat |
| Speech bubbles | White rounded bubble, charcoal outline, italic handwritten script |
| Phone | Same rounded phone mock-up, showing the real Reno Ready screens (Upload photo, Choose style, Get estimate) |
| Transitions | Hard cuts on the beat, plus one quick zoom into the phone |
| Sound | Same light acoustic bed, ducked under the VO. Tonal SFX only (pops, paper flicks, a phone tap, a soft "ding"), with no white-noise whooshes |
| Voice | Same Gemini Aussie voice: dry, warm, a bit cheeky, quick but never rushed |

The homeowner is never named or given a pronoun. The VO talks straight to the viewer as "you".

## Script and storyboard

| Time | Visual | On-screen text | VO (Aussie) | SFX |
|---|---|---|---|---|
| **0.0–2.6** | Night desk scene. The homeowner is slumped at the desk, chin in hand, with the lamp glowing. Above their head is a thought bubble showing a dreamy finished bathroom. | **DREAMING OF A RENO?** | "Dreaming of a reno?" | Soft music in, a pop on the bubble |
| **2.6–6.2** | Screenshots and magazine cutouts flutter down and pile up around the desk: tile swatches, a vanity torn from a mag, a Pinterest grid. A counter in the corner ticks 1 → 50. The homeowner's head swivels between them. | **50 SAVED IDEAS.** / *(terracotta)* **ZERO CLUE HOW IT ALL FITS TOGETHER.** | "Fifty saved ideas… and zero clue how any of it fits together." | Paper flicks, one per cutout, speeding up |
| **6.2–9.2** | Push in on a laptop. A 3D floor-plan program shows a grey box room, rotating wildly, with a wall clipping through the floor and tooltips everywhere. The homeowner pokes the trackpad; a wall flips upside down. | **3D PLANNERS** / *(terracotta)* **TOO HARD?** | "Tried one of those 3D planners?" | Clunky clicks, an error "bonk" |
| **9.2–12.0** | The wall clock spins forward. The homeowner faceplants onto the pile of cutouts. The laptop still shows the grey box. | *(none, let the gag land)* | "Three hours later… it's still a grey box." | Clock tick-whirr, a soft paper thud |
| **12.0–14.0** | Hard cut. Clean sand background. The homeowner pops upright and holds up a phone. | **STOP GUESSING.** / *(terracotta)* **SHOW YOUR SPACE.** | "Stop guessing. Show us your space." | A bright pop on "space" |
| **14.0–15.3** | Zoom into the phone. **Step 1 of 3: Upload photo.** The camera snaps their real, dated bathroom, which drops into the "Your bathroom" card. | **1. SNAP YOUR ROOM** *(small step label above the phone)* | "Snap your room…" | Camera shutter |
| **15.3–16.7** | **Step 2 of 3: Choose style.** A finger taps Zellige tiles, then Brushed gold tapware, then a vanity, and each chip ticks terracotta. | **2. TAP YOUR FINISHES** | "…tap your tiles, tapware, vanity…" | Three quick taps, rising in pitch |
| **16.7–18.0** | **Step 3 of 3: Get estimate.** The before/after slider wipes across to the new bathroom. The estimate card counts up from $0 to **$30,800**, and the line items drop in: Floor & wall tiles $8,400, Vanity & tapware $4,900, Waterproofing $2,600, Plumbing $5,200, Labour $9,700. | **3. SEE IT + THE PRICE** | "…and there it is. Priced." | Wipe swoosh (tonal), register ticks, "ding" on $30,800 |
| **18.0–21.0** | Back at the desk, now in the daytime: the window is blue, the cutout pile is gone. The homeowner grins at the phone. A thought bubble shows the finished bathroom, the same shot as the opening dream bubble, but real now. | *(terracotta)* **$30,800. ITEMISED.** | "Your actual room. Your actual budget." | Music lifts |
| **21.0–23.6** | Close on the phone. A thumb taps **Connect with a Builder**. A PDF brief slides out of the phone and lands in the homeowner's hand, showing a mini render and a cost table. | **CONNECT WITH A BUILDER** | "Then send the brief straight to a builder." | Tap, then paper slide |
| **23.6–26.0** | The homeowner walks right and hands the PDF to the hard-hat builder (the same figure as the contractor cut). The builder flicks through it and their eyebrows go up. A speech bubble appears: *"When do you want me to start?"* | *(speech bubble only)* | *(builder, a second Aussie voice, gruff and friendly)* "When d'you want me to start?" | Page flick, a happy "pop" on the bubble |
| **26.0–30.0** | **End card.** The Reno Ready logo on top, then the headline, then the before/after slider gently wiping back and forth. Below is the terracotta **Try a free preview →** pill with "No card needed · renoready.com.au", and the small homeowner figure waving beside it. | **RENO READY** / **DESIGN YOUR DREAM RENO** / *(terracotta)* **IN SECONDS.** / pill: **Try a free preview →** / **No card needed · renoready.com.au** | "Reno Ready. Design your dream reno in seconds." *(beat)* "Try it free, no card needed." | Music button-ending on the last word |

## The VO as built

Each line is its own Gemini take with the same narrator as the contractor cut: voice **Orus** on `gemini-3.8-flash-tts`, with the same Brisbane ex-tradie direction (`homeowner/direction.txt`, changed only to address homeowners). The takes are trimmed, internal pauses squeezed, then placed on their cue. The timings below are the cues in `homeowner/vo.mjs`. To fit 30 seconds, "Your actual room. Your actual budget." was cut (the on-screen "$30,800. ITEMISED." carries it), and the three phone steps became one flowing take.

```
0.15   A-01  Dreaming of a reno?
1.60   A-02  Fifty saved ideas. Zero clue how it all fits together.
5.40   A-03  Tried one of those 3D planners?
8.40   A-04  Three hours later, still a grey box.
11.95  A-05  Stop guessing. Show us your space.
14.28  A-06  Snap your room, tap your tiles, tapware, vanity, and there it is. Priced.
18.65  A-10  Then send the brief straight to a builder.
21.85  B-11  When do you want me to start?          (same voice, in character as the tradie)
23.55  A-12  Reno Ready. Design your dream reno in seconds.
26.90  A-13  Try it free at renoready dot com dot AU.
```

To rebuild (from `marketing/showreel`):

```
node homeowner/vo.mjs            # record takes (REDO=A-03 to re-record one)
node homeowner/vo-process.mjs    # clean + measure
node homeowner/audio.mjs         # music + SFX stems
PAGE=homeowner.html SIZE=1080x1920 DUR=30 FPS=30 SUB=2 node render.mjs
node homeowner/mix.mjs           # → out/RenoReady-ShowYourSpace-30s-aussie.mp4
```

Gemini voice direction: *"Relaxed Australian accent, friendly and a little cheeky, like a mate who's renovated before. Conversational, not salesy. Slight dry pause before punchlines. Quick, but give 'Priced.' and 'in seconds' a beat."*

The VO comes to about 70 words in 30 seconds, which is the same density as the contractor cut and leaves room for the gag beats at 9–12s and 24–26s.

## Notes

- **The callback:** in the contractor cut, the *homeowner* asks "When can you start?". Here the *builder* says "When do you want me to start?". Same set, same figures, flipped around, so if both ads run, they read as a pair.
- **Dream bubble to real bubble:** the 0s thought bubble (a vague Pinterest bathroom) and the 18s bubble (their own room, renovated) should sit in exactly the same spot, so the change is obvious.
- **"Hand-delivering" the PDF** is a visual shorthand. In the product, Connect with a Builder emails the brief, so the VO says "send" to stay accurate.
- **Spelling:** on-screen text uses "itemised", in Australian spelling to match the app. The brief's "itemized" stays only in the site's meta description, where you asked for it.
- **Estimate figures:** these reuse the exact $30,800 breakdown from the contractor cut and the real Get estimate screen, so there's nothing new to fake.
- **CTA wording:** the brief's "Try a free preview at renoready.com.au (No card needed)" is set in the same pill-plus-caption layout as the contractor end card, so the two videos finish identically.
