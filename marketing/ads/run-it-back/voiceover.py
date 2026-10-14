import sys, json, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
voice, speed = sys.argv[1], float(sys.argv[2])
LINES = [
 ("hook",   "Last month you quoted a hundred and eighteen grand in bathrooms. Signed? Zero."),
 ("table",  "Because all she can picture is the bathroom she's already got."),
 ("texts",  "Just checking in. Any questions? Read. We went with someone else."),
 ("tally",  "That's one month. A hundred and eighteen grand."),
 ("runit",  "Run it back."),
 ("demo",   "Snap her bathroom. Pick the finishes. Her new bathroom, fully costed, in seconds."),
 ("win",    "Now she's not thinking about it. She's asking when you can start."),
 ("cta",    "Reno Ready. Show them the reno before they sign. Try it free at Reno Ready dot com dot A U."),
]
out = {}
for key, text in LINES:
    s, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    sf.write(f"{voice}_{key}.wav", s, sr)
    out[key] = round(len(s)/sr, 2)
print(json.dumps(out), "total", round(sum(out.values()),2))
