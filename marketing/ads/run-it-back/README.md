# "Run It Back" — 30s vertical ad (1080×1920, 30fps)

Stick-figure ad: lost quotes → ghosted texts → "Run it back" → Reno Ready demo → signed → CTA.
The finished MP4s were delivered separately; this folder rebuilds them.

## Files
- `index.html` + `ad.js` — the whole animation. `renderFrame(t)` draws the frame at `t` seconds; scene timings are in `T` in `ad.js`.
- `assets/` — before/after bathroom photos (from `public/`), logo, and fonts (Anton, Caveat, Permanent Marker — SIL Open Font License).
- `render.mjs` — captures every frame with Playwright/Chromium into `frames/`.
- `voiceover.py` — the voiceover lines and the text-to-speech call (Kokoro, open-source). The line start times are in `VO_AT` in `audio.py`.
- `audio.py` — synthesises the sound effects and music, mixes them under the voiceover, ducks music under speech.
- `encode.sh` — frames + soundtrack → MP4.

## Rebuild
```bash
cd marketing/ads/run-it-back
python3 -m http.server 8765 &                       # serve the page
node render.mjs http://localhost:8765/index.html frames all 30
python audio.py <voice> <dir-with-voice-lines> mix.wav
ffmpeg -i mix.wav -af loudnorm=I=-14:TP=-1:LRA=11 mix_norm.wav
./encode.sh mix_norm.wav RenoReady-RunItBack-30s.mp4
```
`audio.py` expects one trimmed 44.1 kHz mono WAV per line, named `<voice>_<line>_44.wav`
(lines: hook, table, texts, tally, runit, demo, win, cta). To swap in a new voice
(e.g. an Australian one), produce those eight files and re-run the last three steps —
if a line runs longer, adjust its start in `VO_AT` and the matching scene time in `ad.js`.
