"""
Voiceover with Gemini text-to-speech, in an Australian accent.

    GOOGLE_API_KEY=... python3 voiceover_gemini.py <gemini-voice> <out-dir> [label]

Writes <out-dir>/<label>_<line>_44.wav for each line — the files audio.py mixes.
Each line is trimmed of silence and, if it runs past its slot in the ad, sped up
(at most 1.2x) to fit. Needs only Python 3 and ffmpeg.

Gemini voices to try: Puck (upbeat male), Orus (firm male), Fenrir (excitable male),
Aoede (breezy female), Kore (firm female), Leda (youthful female).
"""

import base64, json, os, subprocess, sys, tempfile, urllib.request, urllib.error, wave

API = "https://generativelanguage.googleapis.com/v1beta"
KEY = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")

# How the narrator should sound — Gemini follows plain-language direction
DIRECTION = (
    "Read this as a voiceover for a 30-second Australian TV ad. Speak with a natural, "
    "broad-but-friendly Australian accent, like a confident tradie mate: relaxed, warm, "
    "punchy, a little cheeky. Keep the pace brisk. Say only the line, nothing else:"
)

LINES = [
    ("hook",  "Last month you quoted a hundred and eighteen grand in bathrooms. Signed? Zero."),
    ("table", "Because all she can picture is the bathroom she's already got."),
    ("texts", "Just checking in. Any questions? Read. We went with someone else."),
    ("tally", "That's one month. A hundred and eighteen grand."),
    ("runit", "Run it back."),
    ("demo",  "Snap her bathroom. Pick the finishes. Her new bathroom, fully costed, in seconds."),
    ("win",   "Now she's not thinking about it. She's asking when you can start."),
    ("cta",   "Reno Ready. Show them the reno before they sign. Try it free at Reno Ready dot com dot A U."),
]

# Longest each line can run before it collides with the next one (see VO_AT in audio.py)
SLOT = {"hook": 4.3, "table": 3.3, "texts": 3.5, "tally": 2.4, "runit": 0.95,
        "demo": 5.1, "win": 3.1, "cta": 5.9}
MAX_SPEEDUP = 1.2


def call(path, body=None):
    url = f"{API}/{path}{'&' if '?' in path else '?'}key={KEY}"
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Gemini API error {e.code}: {e.read().decode()[:400]}")


def pick_model():
    """Newest text-to-speech model this key can use."""
    models = call("models?pageSize=200").get("models", [])
    tts = [m["name"].split("/")[-1] for m in models
           if "tts" in m["name"] and "generateContent" in m.get("supportedGenerationMethods", [])]
    if not tts:
        raise SystemExit("No Gemini text-to-speech model is available to this API key.")
    # prefer pro, then flash; within each, the highest version
    tts.sort(key=lambda n: ("pro" in n, n), reverse=True)
    return os.environ.get("GEMINI_TTS_MODEL") or tts[0]


def speak(model, voice, text):
    body = {
        "contents": [{"parts": [{"text": f"{DIRECTION} {text}"}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }
    data = call(f"models/{model}:generateContent", body)
    part = data["candidates"][0]["content"]["parts"][0]["inlineData"]
    rate = 24000
    if "rate=" in part.get("mimeType", ""):
        rate = int(part["mimeType"].split("rate=")[1].split(";")[0])
    return base64.b64decode(part["data"]), rate   # 16-bit mono PCM


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def main():
    if not KEY:
        raise SystemExit("Set GOOGLE_API_KEY (your Gemini key) first.")
    voice, out_dir = sys.argv[1], sys.argv[2]
    label = sys.argv[3] if len(sys.argv) > 3 else f"gemini_{voice.lower()}"
    os.makedirs(out_dir, exist_ok=True)
    model = pick_model()
    print(f"model: {model}  voice: {voice}")
    trim = ("silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
            "silenceremove=start_periods=1:start_threshold=-45dB,areverse")
    for key, text in LINES:
        pcm, rate = speak(model, voice, text)
        with tempfile.TemporaryDirectory() as tmp:
            raw = os.path.join(tmp, "raw.wav")
            with wave.open(raw, "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
            trimmed = os.path.join(tmp, "trim.wav")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", trim, "-ar", "44100", "-ac", "1", trimmed], check=True)
            length = duration(trimmed)
            speed = min(MAX_SPEEDUP, max(1.0, length / SLOT[key]))
            out = os.path.join(out_dir, f"{label}_{key}_44.wav")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", trimmed, "-af", f"atempo={speed:.3f}",
                            "-ar", "44100", "-ac", "1", out], check=True)
        final = duration(out)
        flag = "  ⚠ still too long for its slot" if final > SLOT[key] + 0.05 else ""
        print(f"  {key:6s} {length:5.2f}s → {final:5.2f}s (slot {SLOT[key]}s, x{speed:.2f}){flag}")
    print(f"wrote {len(LINES)} lines to {out_dir} as {label}_*_44.wav")


if __name__ == "__main__":
    main()
