"""Soundtrack for the Reno Ready ad: voiceover + synthesised SFX + music bed, mixed to 44.1 kHz stereo."""
import sys
import numpy as np
import soundfile as sf

SR = 44100
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
voice, vo_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]

def t_axis(d):
    return np.arange(int(SR * d)) / SR

def env(d, a=0.005, r=None):
    t = t_axis(d)
    e = np.minimum(1, t / max(a, 1e-4))
    if r is None:
        r = d
    return e * np.exp(-t / (r / 5))

def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i] * gain

def lowpass(x, cutoff):
    # one-pole lowpass, run forward then backward so the filter adds no lag
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc = (1 - a) * x[k] + a * acc
        y[k] = acc
    acc = 0.0
    for k in range(len(x) - 1, -1, -1):
        acc = (1 - a) * y[k] + a * acc
        y[k] = acc
    return y

def highpass(x, cutoff):
    return x - lowpass(x, cutoff)

# ── SFX ──────────────────────────────────────────────────────────
def thump():                       # headline hit
    t = t_axis(0.22)
    f = 140 * np.exp(-t * 18) + 45
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
    s += highpass(rng.standard_normal(len(t)), 2000) * np.exp(-t * 90) * 0.25
    return s

def swish(d=0.35, lo=600, hi=5000):  # paper / whoosh
    n = rng.standard_normal(int(SR * d))
    e = np.sin(np.linspace(0, np.pi, len(n))) ** 2
    return highpass(lowpass(n, hi), lo) * e

def tap(f=1800):                   # UI tap
    t = t_axis(0.05)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + highpass(rng.standard_normal(len(t)), 3000) * np.exp(-t * 200) * 0.3

def tick():
    t = t_axis(0.03)
    return highpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 300)

def bubble_pop():
    t = t_axis(0.12)
    f = 300 + 900 * (t / 0.12)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)

def imsg_sent():                   # rising two-note bloop
    a = t_axis(0.09); b = t_axis(0.14)
    s1 = np.sin(2 * np.pi * 1047 * a) * np.exp(-a * 25)
    s2 = np.sin(2 * np.pi * 1568 * b) * np.exp(-b * 22)
    return np.concatenate([s1, s2]) * 0.8

def imsg_recv():                   # falling, a little sad
    a = t_axis(0.12); b = t_axis(0.3)
    s1 = np.sin(2 * np.pi * 784 * a) * np.exp(-a * 18)
    s2 = np.sin(2 * np.pi * 523 * b) * np.exp(-b * 9)
    return np.concatenate([s1, s2])

def scribble(d=0.3):              # marker on paper
    n = rng.standard_normal(int(SR * d))
    t = t_axis(d)
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 14 * t + rng.uniform(0, 6)) * np.sin(2 * np.pi * 5 * t)
    return highpass(lowpass(n, 6000), 1500) * am * np.sin(np.linspace(0, np.pi, len(n))) ** 0.5

def rewind(d=0.7):                # tape rewind warble
    t = t_axis(d)
    f = 900 + 600 * np.sin(2 * np.pi * 9 * t) + 1400 * t / d
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return lowpass(saw, 3500) * 0.45 + highpass(rng.standard_normal(len(t)), 4000) * 0.12

def shutter():
    return np.concatenate([tick() * 1.2, np.zeros(int(SR * 0.06)), tick()])

def shimmer():                    # reveal sparkle
    s = np.zeros(int(SR * 1.2))
    for i, f in enumerate([1319, 1568, 2093, 2637]):
        t = t_axis(1.2 - i * 0.07)
        place(s, np.sin(2 * np.pi * f * t) * np.exp(-t * 4), i * 0.07, 0.5)
    return s

def stamp():                      # heavy thunk
    t = t_axis(0.4)
    f = 90 * np.exp(-t * 10) + 40
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 1.4
    s += lowpass(rng.standard_normal(len(t)), 1200) * np.exp(-t * 40) * 0.8
    return s

def boing():
    t = t_axis(0.35)
    f = 500 + 250 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)

def chime():
    s = np.zeros(int(SR * 1.6))
    for i, f in enumerate([523, 659, 784, 1047]):
        t = t_axis(1.6 - i * 0.09)
        place(s, (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 3), i * 0.09, 0.45)
    return s

sfx = np.zeros(N)
for at in (0.05, 0.3, 0.6): place(sfx, thump(), at, 0.55)
for at in (1.5, 2.3, 3.0):
    place(sfx, swish(0.45, 800, 6000), at, 0.22)
    place(sfx, tick(), at + 0.55, 0.5)
for k in range(8): place(sfx, tick(), 4.6 + k * 0.5, 0.18)          # wall clock
place(sfx, bubble_pop(), 4.95, 0.35); place(sfx, bubble_pop(), 6.6, 0.35)
place(sfx, swish(0.35, 400, 5000), 7.9, 0.3)                          # phone up
place(sfx, imsg_sent(), 8.35, 0.32); place(sfx, imsg_sent(), 9.1, 0.32)
place(sfx, scribble(0.32), 9.85, 0.18)
place(sfx, imsg_recv(), 10.35, 0.4)
place(sfx, swish(0.3, 400, 4000), 11.6, 0.25)
for at in (11.8, 12.15, 12.5, 12.85): place(sfx, scribble(0.28), at, 0.28)
place(sfx, scribble(0.15), 13.1, 0.25); place(sfx, scribble(0.35), 13.25, 0.3); place(sfx, scribble(0.32), 13.6, 0.3)
place(sfx, swish(0.4, 1000, 7000), 13.9, 0.2)
place(sfx, rewind(0.75), 14.2, 0.32)
place(sfx, swish(0.3, 300, 8000), 14.85, 0.35)
place(sfx, swish(0.3, 400, 5000), 15.1, 0.25)
place(sfx, tap(), 15.65, 0.4); place(sfx, shutter(), 15.85, 0.45)
place(sfx, swish(0.2, 1500, 8000), 16.45, 0.15)
for at in (16.9, 17.3, 17.7): place(sfx, tap(), at, 0.4)
place(sfx, swish(0.2, 1500, 8000), 17.95, 0.15)
place(sfx, shimmer(), 18.15, 0.3)
for k in range(10): place(sfx, tick(), 18.55 + k * 0.1, 0.12)          # counter ticking up
place(sfx, bubble_pop(), 20.55, 0.35); place(sfx, boing(), 21.0, 0.25); place(sfx, bubble_pop(), 21.75, 0.35)
place(sfx, swish(0.18, 300, 3000), 22.7, 0.3); place(sfx, stamp(), 22.86, 0.7)
place(sfx, swish(0.35, 400, 5000), 23.7, 0.25)
place(sfx, bubble_pop(), 24.85, 0.3); place(sfx, chime(), 25.0, 0.3)

# ── Music ────────────────────────────────────────────────────────
def note(f, d, kind="pluck"):
    t = t_axis(d)
    if kind == "pluck":
        s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
        return s * np.minimum(1, t / 0.004) * np.exp(-t * 7)
    s = sum(np.sin(2 * np.pi * f * (1 + dt) * t) for dt in (-0.004, 0, 0.004)) / 3   # pad
    a = np.minimum(1, t / 0.6); r = np.minimum(1, (d - t) / 0.6)
    return s * a * r

hz = lambda m: 440 * 2 ** ((m - 69) / 12)
music = np.zeros(N)

# problem: slow, minor, a bit uneasy (0 – 14.2s)
for i, chord in enumerate([[45, 52, 60, 64], [41, 48, 57, 60], [45, 52, 60, 64], [40, 47, 55, 59]]):
    for m in chord: place(music, note(hz(m), 3.9, "pad"), i * 3.55, 0.16)
for k in range(int(14.2 / 0.71)):                                     # soft heartbeat pulse
    t = t_axis(0.25); f = 60 * np.exp(-t * 8) + 38
    place(music, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14), k * 0.71, 0.35 if k % 2 == 0 else 0.2)
music[int(14.2 * SR):] = 0                                            # tape stop into the rewind

# solution: upbeat major, 116 bpm (15.1 – 30s)
beat = 60 / 116
prog_ = [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]]  # C G Am F
start = 15.1
for b in range(int((DUR - start) / beat) + 1):
    at = start + b * beat
    chord = prog_[(b // 4) % 4]
    place(music, note(hz(chord[0] - 12), beat * 0.95, "pluck"), at, 0.32)                 # bass
    for k, m in enumerate([chord[1], chord[2], chord[3], chord[2]]):                       # arpeggio 8ths→16ths
        place(music, note(hz(m + 12), beat * 0.5, "pluck"), at + k * beat / 4, 0.1)
    t = t_axis(0.16); f = 110 * np.exp(-t * 25) + 45                                       # kick
    place(music, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18), at, 0.5)
    place(music, highpass(rng.standard_normal(int(SR * 0.04)), 6000) * np.exp(-t_axis(0.04) * 120), at + beat / 2, 0.12)  # hat
    if b % 2 == 1:                                                                          # clap
        place(music, highpass(lowpass(rng.standard_normal(int(SR * 0.12)), 4000), 900) * np.exp(-t_axis(0.12) * 30), at, 0.18)
fade = np.ones(N); fs = int((DUR - 0.8) * SR); fade[fs:] = np.linspace(1, 0, N - fs)
music *= fade

# ── Voiceover ────────────────────────────────────────────────────
vo = np.zeros(N)
VO_AT = {"hook": 0.15, "table": 4.6, "texts": 8.05, "tally": 11.75, "runit": 14.3, "demo": 15.25, "win": 20.55, "cta": 23.9}
for key, at in VO_AT.items():
    s, sr = sf.read(f"{vo_dir}/{voice}_{key}_44.wav")
    assert sr == SR
    if s.ndim > 1: s = s.mean(axis=1)
    place(vo, s, at, 1.0)
vo /= np.max(np.abs(vo)) + 1e-9
vo *= 0.85

# duck the music under the voice
venv = lowpass(np.abs(vo), 6)
venv /= venv.max()
duck = 1 - 0.55 * np.clip(venv * 3, 0, 1)
mix = vo + music * 0.35 * duck + sfx * 0.45
mix /= max(1.0, np.max(np.abs(mix)) / 0.95)
stereo = np.stack([mix, mix], axis=1)
sf.write(out, stereo, SR, subtype="PCM_16")
print("wrote", out, "peak", round(float(np.max(np.abs(mix))), 3))
