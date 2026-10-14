#!/bin/bash
# encode.sh <mix.wav> <out.mp4> — frames/ + a mixed soundtrack → 1080×1920 H.264 MP4
cd "$(dirname "$0")"
ffmpeg -v error -y -framerate 30 -i "frames/f%04d.jpg" -i "$1" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.2 \
  -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart "$2"
