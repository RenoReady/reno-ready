#!/bin/bash
# Rebuild the ad with a Gemini voiceover in an Australian accent.
#   GOOGLE_API_KEY=... ./rebuild.sh            → male (Puck) + female (Aoede) versions
#   GOOGLE_API_KEY=... ./rebuild.sh Orus Kore  → any Gemini voices
# Output: out/RenoReady-RunItBack-30s-aussie-<voice>.mp4
set -euo pipefail
cd "$(dirname "$0")"
if [ $# -gt 0 ]; then VOICES=("$@"); else VOICES=(Puck Aoede); fi
: "${GOOGLE_API_KEY:?Set GOOGLE_API_KEY to your Gemini key}"
for tool in node npm python3 ffmpeg ffprobe; do command -v $tool >/dev/null || { echo "Missing $tool"; exit 1; }; done

# Python for the mix, Playwright for the frames
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q numpy soundfile
[ -d node_modules/playwright ] || npm install --no-save --silent playwright@1
[ -e /opt/pw-browsers ] || npx playwright install chromium

# Frames only need rendering once (the voice doesn't change the picture)
if [ "$(ls frames 2>/dev/null | wc -l)" -lt 900 ]; then
  python3 -m http.server 8765 >/dev/null 2>&1 & SERVER=$!
  trap 'kill $SERVER 2>/dev/null' EXIT
  sleep 1
  node render.mjs http://localhost:8765/index.html frames all 30
fi

mkdir -p out vo
for v in "${VOICES[@]}"; do
  label="gemini_$(echo "$v" | tr 'A-Z' 'a-z')"
  python3 voiceover_gemini.py "$v" vo "$label"
  .venv/bin/python audio.py "$label" vo "vo/mix_$label.wav"
  ffmpeg -v error -y -i "vo/mix_$label.wav" -af loudnorm=I=-14:TP=-1:LRA=11 -ar 44100 "vo/mix_${label}_norm.wav"
  ./encode.sh "vo/mix_${label}_norm.wav" "out/RenoReady-RunItBack-30s-aussie-${v,,}.mp4"
  echo "✓ out/RenoReady-RunItBack-30s-aussie-${v,,}.mp4"
done
