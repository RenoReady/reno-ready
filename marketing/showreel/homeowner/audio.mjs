// Synthesises the 30 s homeowner reel soundtrack (120 BPM, G major) as two stems, built from the same
// instruments as the contractor cut (runitback-audio.mjs) so the two ads sound like a pair:
//   out/homeowner-music.wav — muted groove → tape stop after the faceplant (11.15 s) → bright drop at 11.95 s → outro
//   out/homeowner-sfx.wav   — sound effects locked to homeowner.html
//   node homeowner/audio.mjs   (run from marketing/showreel)
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 48000, DUR = 30, N = SR * DUR, BEAT = 0.5;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7171;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const panLR = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N), RL: new Float32Array(N), RR: new Float32Array(N) });

const A = bus(), B = bus(), FX = bus();   // music before the tape stop, music after it, sound effects
let cur = A;
function add(i, l, r, rev = 0) {
  if (i < 0 || i >= N) return;
  cur.L[i] += l; cur.R[i] += r;
  if (rev) { cur.RL[i] += l * rev; cur.RR[i] += r * rev; }
}

/* ── instruments ─────────────────────────────────────────────────── */
// Karplus–Strong string: `damp` < 1 shortens it into a palm-muted chop
function string(m, t0, level = .1, pan = 0, ring = 1.6, damp = 1, bright = .5) {
  const f = mtof(m), p = Math.max(2, Math.round(SR / f)), buf = new Float32Array(p);
  let sm = 0; for (let k = 0; k < p; k++) { const n = rnd(); sm += (.25 + bright * .5) * (n - sm); buf[k] = sm * 1.6; }
  const [pl, pr] = panLR(pan), fb = Math.pow(.001, 1 / (f * ring)) * damp;
  let idx = 0, prev = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(ring * SR); i < e && i < N; i++) {
    const y = buf[idx], nxt = buf[(idx + 1) % p];
    buf[idx] = ((y + nxt) / 2) * fb; idx = (idx + 1) % p;
    const s = (y * .7 + prev * .3) * level; prev = y;
    add(i, s * pl, s * pr, .22);
  }
}
const strum = (notes, t0, level, opts = {}) => notes.forEach((m, k) =>
  string(m, t0 + (opts.up ? notes.length - 1 - k : k) * (opts.gap ?? .011), level * (opts.up ? .7 : 1), (k / (notes.length - 1)) * .8 - .4, opts.ring ?? 1.6, opts.damp ?? 1, opts.bright ?? .5));

function bass(m, t0, len, level = .16) {
  const f = mtof(m); let ph = 0;
  for (let i = Math.floor(t0 * SR), e = Math.floor((t0 + len) * SR); i < e && i < N; i++) {
    const u = i / SR - t0; ph = (ph + f / SR) % 1;
    const env = Math.min(1, u / .008) * Math.exp(-u * 2.6) * Math.min(1, (len - u) / .03);
    const s = (Math.sin(2 * Math.PI * ph) + .3 * Math.sin(4 * Math.PI * ph)) * env * level;
    add(i, s, s);
  }
}
function kick(t0, level = .5) {
  let ph = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(.4 * SR); i < e && i < N; i++) {
    const u = i / SR - t0; ph += (48 + 110 * Math.exp(-u * 32)) / SR;
    const s = (Math.sin(2 * Math.PI * ph) * Math.exp(-u * 8) + (u < .003 ? rnd() * .25 : 0)) * level;
    add(i, s, s);
  }
}
function noiseHit(t0, len, fc, q, decay, level, pan = 0, rev = .2) {
  let lo = 0, bp = 0; const g = 2 * Math.sin(Math.PI * Math.min(fc, SR / 3) / SR), [pl, pr] = panLR(pan);
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    const u = i / SR - t0;
    lo += g * bp; const hi = rnd() - lo - q * bp; bp += g * hi;
    const s = bp * Math.exp(-u * decay) * Math.min(1, u / .001) * level;
    add(i, s * pl, s * pr, rev);
  }
}
const shaker = (t0, level = .03, pan = .3) => blip(3100, t0, level * .35, pan, .018, 0);   // soft tonal tick in place of a noise shaker
const clap = (t0, level = .09) => { blip(820, t0, level * 1.1, -.1, .07, .5); blip(1240, t0 + .004, level * .6, .1, .05, .5); };   // woody knock
const snap = (t0, level = .06) => blip(1700, t0, level * .8, -.2, .035, .3);

function pad(notes, t0, t1, level, fc = 1200) {
  const s0 = Math.floor(t0 * SR), s1 = Math.min(N, Math.floor((t1 + .6) * SR));
  notes.forEach((m, vi) => {
    const f = mtof(m), [pl, pr] = panLR(vi % 2 ? .4 : -.4), ph = [rnd(), rnd()].map(Math.abs);
    let lp = 0;
    for (let i = s0; i < s1; i++) {
      const t = i / SR, u = t - t0;
      const env = Math.min(1, u / .3) * (t > t1 ? Math.exp(-(t - t1) * 8) : 1);
      ph[0] = (ph[0] + f * .997 / SR) % 1; ph[1] = (ph[1] + f * 1.003 / SR) % 1;
      lp += (1 - Math.exp(-2 * Math.PI * fc / SR)) * ((ph[0] + ph[1] - 1) - lp);
      const s = lp * env * level;
      add(i, s * pl, s * pr, .4);
    }
  });
}
function bell(m, t0, level = .08, pan = 0, decay = 2.2) {
  const f = mtof(m), [pl, pr] = panLR(pan);
  const parts = [[1, 1, 1], [2.0, .45, 1.6], [3.01, .25, 2.4], [4.2, .14, 3.4]];
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(2.2 * SR); i < e && i < N; i++) {
    const u = i / SR - t0; let v = 0;
    for (const [r, a, d] of parts) v += Math.sin(2 * Math.PI * f * r * u) * a * Math.exp(-u * decay * d);
    add(i, v * Math.min(1, u / .002) * level * pl, v * Math.min(1, u / .002) * level * pr, .5);
  }
}
function blip(freq, t0, level = .1, pan = 0, len = .07, bend = .25) {
  const [pl, pr] = panLR(pan); let ph = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    const u = i / SR - t0; ph += freq * (1 + bend * Math.exp(-u * 60)) / SR;
    const s = Math.sin(2 * Math.PI * ph) * Math.exp(-u * (5 / len)) * level;
    add(i, s * pl, s * pr, .15);
  }
}
function whoosh(t0, len, fFrom, fTo, level = .18, panFrom = -.6, panTo = .6, rise = .5) {
  const ph = [0, 0, 0], det = [.985, 1, 1.017];
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    const x = (i / SR - t0) / len;
    const env = x < rise ? Math.sin((x / rise) * Math.PI / 2) ** 2 : Math.cos(((x - rise) / (1 - rise)) * Math.PI / 2) ** 2;
    const f = Math.min(1600, fFrom * Math.pow(fTo / fFrom, x)) * .35;
    let v = 0; for (let k = 0; k < 3; k++) { ph[k] = (ph[k] + f * det[k] / SR) % 1; v += Math.sin(2 * Math.PI * ph[k]); }
    const [pl, pr] = panLR(panFrom + (panTo - panFrom) * x), s = v / 3 * env * level * .55;
    add(i, s * pl, s * pr, .2);
  }
}
function sweep(t0, len, fFrom, fTo, level = .04) {
  let ph = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    const x = (i / SR - t0) / len; ph += fFrom * Math.pow(fTo / fFrom, x) / SR;
    const s = Math.sin(2 * Math.PI * ph) * Math.sin(Math.PI * x) * level;
    add(i, s, s, .5);
  }
}
// felt-tip marker: squeaky band-passed noise with a wobbling centre frequency
function marker(t0, len, level = .05, pan = .2, base = 2400) {
  const [pl, pr] = panLR(pan); let ph = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    const u = i / SR - t0, x = u / len;
    ph += base * .45 * (1 + .12 * Math.sin(2 * Math.PI * 9 * u) + .05 * Math.sin(2 * Math.PI * 23 * u)) / SR;
    const strokes = Math.max(0, Math.sin(2 * Math.PI * 6.5 * u)) ** 2;
    const s = Math.sin(2 * Math.PI * ph) * strokes * Math.sqrt(Math.max(0, Math.sin(Math.PI * x))) * level * .5;
    add(i, s * pl, s * pr, .05);
  }
}
function thud(t0, level = .5, f0 = 70) {
  let ph = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(.4 * SR); i < e && i < N; i++) {
    const u = i / SR - t0; ph += (f0 + 90 * Math.exp(-u * 40)) / SR;
    const s = (Math.sin(2 * Math.PI * ph) * Math.exp(-u * 12) + (u < .015 ? rnd() * .6 * (1 - u / .015) : 0)) * level;
    add(i, s, s, .2);
  }
}
// paper sheet: airy flutter, then a soft slap on the floor
function paper(t0, pan) {
  blip(420, t0 + .28, .09, pan, .09, .4);
  thud(t0 + .28, .12, 120);
}


/* ── music ───────────────────────────────────────────────────────── */
// G major, vi–IV–I–V, 120 BPM. Guitar voicings (low → high) and bass roots.
const CH = {
  Em: { g: [52, 59, 64, 67, 71, 76], root: 40 },
  C:  { g: [48, 55, 60, 64, 67, 72], root: 36 },
  G:  { g: [43, 50, 55, 59, 62, 67], root: 43 },
  D:  { g: [50, 57, 62, 66, 69, 74], root: 38 },
};
const PROG = ["Em", "C", "G", "D"];

// Section A: 0–11.2 s, the late-night muddle. Palm-muted eighths, soft kick, ticks.
cur = A;
for (let bar = 0; bar < 6; bar++) {
  const c = CH[PROG[bar % 4]], t = bar * 2;
  for (let e = 0; e < 8; e++) {
    const accent = e === 0 || e === 3 || e === 6;
    strum(c.g.slice(0, 4), t + e * BEAT / 2, accent ? .07 : .045, { ring: .35, damp: .985, bright: .35, gap: .007, up: e % 2 === 1 });
    shaker(t + e * BEAT / 2, e % 2 ? .028 : .016);
  }
  if (bar > 0) { kick(t, .42); kick(t + 1, .36); }
  bass(c.root, t, 1.4, bar > 0 ? .15 : .08); bass(c.root, t + 1.5, .45, bar > 0 ? .1 : 0);
  if (bar > 0) { snap(t + .5); snap(t + 1.5); }
}

// Section B: drop at 11.95 s ("Stop guessing"), open strums, four-on-the-floor, claps, pad. Runs to 23.5 s.
cur = B;
const B0 = 11.95;
for (let bar = 0; bar < 6; bar++) {
  const c = CH[PROG[bar % 4]], t = B0 + bar * 2;
  if (t >= 23.5) break;
  const pattern = [[0, 1], [.75, .6], [1.25, .7], [1.5, .8]];
  for (const half of [0, 1]) for (const [o, v] of pattern) {
    const tt = t + half * 1 + o * BEAT;
    if (tt < 23.45) strum(c.g, tt, .085 * v, { ring: 1.1, bright: .6, up: o % .5 !== 0 || o === .75 });
  }
  for (let q = 0; q < 4; q++) if (t + q * BEAT < 23.45) kick(t + q * BEAT, .5);
  if (t + 1.5 < 23.45) { clap(t + .5); clap(t + 1.5); }
  for (let e = 0; e < 8; e++) if (t + e * BEAT / 2 < 23.45) shaker(t + e * BEAT / 2, e % 2 ? .035 : .02, e % 2 ? .35 : -.35);
  for (const o of [0, .75, 1, 1.5]) if (t + o < 23.4) bass(c.root + (o === .75 ? 12 : 0), t + o, o === .75 ? .2 : .45, o === .75 ? .08 : .17);
  pad(c.g.slice(1, 5).map((m) => m + 12), t, Math.min(t + 2, 23.45), .022, 1500);
}
kick(B0, .75); bell(79, B0, .05, -.2, 1.2); bell(86, B0 + .02, .04, .2, 1.2);   // the drop

// Outro under the call to action: 23.5–30 s, pad + gentle strums, final ring-out.
const O0 = 23.5;
pad([55, 59, 62, 67], O0, 27.6, .03, 1300);
kick(O0, .55); bass(43, O0, 1.6, .18);
[[0, "C"], [2, "D"]].forEach(([o, k]) => { strum(CH[k].g, O0 + 1 + o, .06, { ring: 2, bright: .45, gap: .02 }); bass(CH[k].root, O0 + 1 + o, 1.6, .13); });
for (let e = 0; e < 16; e++) shaker(O0 + 1 + e * .25, e % 2 ? .02 : .012);
strum(CH.G.g, 28.0, .09, { ring: 2, bright: .5, gap: .03 }); bass(43, 28.0, 2, .18); kick(28.0, .4);
bell(83, 28.03, .035, .3, 1.2);

/* ── sound effects ───────────────────────────────────────────────── */
cur = FX;
const tap = (t) => { blip(2600, t, .06, .2, .03, .1); blip(180, t, .15, 0, .06); };
blip(mtof(72), .45, .07, -.3, .1, .6); blip(mtof(79), .5, .05, -.35, .08, .6);     // dream bubble
blip(mtof(67), 1.55, .05, -.3, .08, -.3);                                           // bubble pops away
for (let i = 0; i < 14; i++) paper(1.65 + i * .11 - .28, (i % 5) / 2.5 - .8);      // saved ideas land
sweep(3.22, .45, 420, 190, .035);                                                   // the frown
[3.3, 3.42, 3.54].forEach((t, i) => blip(mtof(76 + i * 3), t, .05, -.3 + i * .3, .08, .6));   // question marks
whoosh(5.25, .4, 600, 3400, .14, -.6, .6, .6);                                      // cut to the laptop
blip(1900, 5.7, .035, .2, .05, .2);                                                 // tooltip
[6.0, 6.4, 6.9].forEach((t) => blip(3200, t, .05, .3, .02, 0));                     // trackpad clicks
blip(230, 6.65, .2, 0, .18, .9); blip(150, 6.7, .16, 0, .22, .6);                   // error "bonk"
whoosh(6.95, .3, 1800, 500, .08, .4, -.4, .4);                                      // the box flips
whoosh(7.35, .4, 2800, 500, .14, .7, -.7, .4);                                      // back to the desk
for (let k = 0; k < 24; k++) blip(2900 + (k % 2) * 300, 7.58 + k * .038, .018, .4, .02, 0);   // clock spins
thud(10.82, .6, 60); blip(140, 10.82, .22, 0, .14, .8);                             // faceplant
[10.86, 10.9].forEach((t, i) => paper(t - .2, i ? .4 : -.3));
whoosh(11.8, .3, 400, 2600, .12, 0, 0, .7);                                         // pop up: "Stop guessing"
blip(mtof(84), 13.0, .06, .3, .1, .6); blip(mtof(91), 13.04, .04, .35, .08, .6);    // phone up
[96, 100, 103].forEach((m, i) => bell(m, 13.66 + i * .05, .02, .3, 3));             // sparkle
whoosh(14.15, .4, 300, 3000, .14, -.5, .5, .7);                                     // into the phone
tap(14.5); noiseHit(14.72, .05, 4000, .5, 90, .12, 0, .1); noiseHit(14.8, .07, 2500, .5, 60, .1, 0, .15);   // shutter
for (const t of [15.34, 16.06, 16.44]) { tap(t); bell(88, t + .03, .025, .3, 4); }   // tile, tapware, vanity
tap(16.8); sweep(16.82, .45, 500, 2000, .025);                                      // Generate preview
[84, 88, 91, 96].forEach((m, i) => bell(m, 16.86 + i * .05, .03, -.3 + i * .2, 3)); // shimmer
whoosh(17.15, .7, 900, 2000, .05, .6, -.6, .5);                                     // before/after wipe
for (let k = 0; k < 18; k++) blip(1800 + (k % 3) * 220, 17.32 + k * .04, .022, .2, .02, 0);   // counter ticks up
bell(84, 18.05, .055, .1, 2.4); bell(91, 18.1, .04, .25, 2.6);                      // "Priced."
whoosh(18.4, .4, 3000, 400, .14, -.7, .7, .45);                                     // daytime
blip(mtof(79), 18.7, .07, -.3, .1, .6); blip(mtof(86), 18.75, .05, -.35, .08, .6);  // the real bubble
whoosh(19.5, .3, 500, 2400, .08, .4, .6, .7);                                       // phone close-up
tap(20.0); bell(88, 20.06, .04, .3, 2.4); bell(93, 20.12, .03, .35, 2.4);           // brief sent
whoosh(20.4, .35, 2600, 500, .12, .6, -.6, .4);                                     // cut to the hand-over
for (let k = 0; k < 4; k++) thud(20.6 + k * .19, .07, 110);                         // footsteps
blip(420, 21.4, .07, .1, .09, .4);                                                  // the brief changes hands
blip(520, 21.68, .05, .2, .06, .4); blip(460, 21.82, .05, .2, .06, .4);             // page flick
blip(mtof(81), 21.9, .07, .25, .1, .6);                                             // "When d'you want me to start?"
whoosh(23.35, .5, 300, 3000, .15, 0, 0, .7);                                        // into the brand card
whoosh(24.15, .9, 900, 2000, .06, .6, -.6, .5);                                    // before → after wipe
[86, 91, 95].forEach((m, i) => bell(m, 24.98 + i * .06, .028, -.2 + i * .2, 3));    // the after lands
blip(mtof(84), 26.85, .06, 0, .1, .6); blip(mtof(88), 26.9, .045, .1, .08, .6);     // the button

/* ── mixdown helpers ─────────────────────────────────────────────── */
function reverb(src, offs) {
  const out = new Float32Array(N);
  for (const d of [1557, 1617, 1491, 1422, 1277, 1356].map((x) => x + offs)) {
    const buf = new Float32Array(d); let p = 0, lp = 0;
    for (let i = 0; i < N; i++) { const y = buf[p]; lp = y * .7 + lp * .3; buf[p] = src[i] + lp * .8; p = (p + 1) % d; out[i] += y / 6; }
  }
  for (const d of [556, 441, 341].map((x) => x + offs)) {
    const buf = new Float32Array(d); let p = 0;
    for (let i = 0; i < N; i++) { const y = buf[p]; const x = out[i]; buf[p] = x + y * .5; out[i] = y - x * .5; p = (p + 1) % d; }
  }
  return out;
}
const lowpass = (ch, hz) => { let a = 0; const k = 1 - Math.exp(-2 * Math.PI * hz / SR); for (let i = 0; i < N; i++) { a += k * (ch[i] - a); ch[i] = a; } return ch; };
const wet = (b) => { const wl = lowpass(reverb(b.RL, 0), 4500), wr = lowpass(reverb(b.RR, 23), 4500); for (let i = 0; i < N; i++) { b.L[i] += wl[i] * .8; b.R[i] += wr[i] * .8; } };
[A, B, FX].forEach(wet);

// Section A sits behind a low-pass so the drop feels like the lights coming on
for (const ch of [A.L, A.R]) { let lp = 0; const k = 1 - Math.exp(-2 * Math.PI * 2200 / SR); for (let i = 0; i < N; i++) { lp += k * (ch[i] - lp); ch[i] = lp; } }

// tape stop after the faceplant: from 11.15 s the playback speed of section A falls to zero by 11.8 s
const T0 = 11.15, T1 = 11.8, music = { L: new Float32Array(N), R: new Float32Array(N) };
let pos = T0 * SR;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  if (t < T0) { music.L[i] = A.L[i]; music.R[i] = A.R[i]; }
  else if (t < T1) {
    const x = (t - T0) / (T1 - T0), speed = Math.pow(1 - x, 1.6);
    pos += speed; const j = Math.floor(pos), fr = pos - j;
    const g = Math.min(1, (1 - x) * 3);
    music.L[i] = (A.L[j] * (1 - fr) + A.L[j + 1] * fr) * g;
    music.R[i] = (A.R[j] * (1 - fr) + A.R[j + 1] * fr) * g;
  }
  music.L[i] += B.L[i]; music.R[i] += B.R[i];
}

function write(name, L, R, target, lpHz = 0) {
  let peak = 0;
  if (lpHz) for (const ch of [L, R]) { let a = 0, b2 = 0; const k = 1 - Math.exp(-2 * Math.PI * lpHz / SR); for (let i = 0; i < N; i++) { a += k * (ch[i] - a); b2 += k * (a - b2); ch[i] = b2; } }
  for (const ch of [L, R]) for (let i = 0; i < N; i++) if (!Number.isFinite(ch[i])) throw new Error(`${name}: non-finite sample at ${(i / SR).toFixed(3)} s`);
  for (let i = 0; i < N; i++) {
    const t = i / SR, fade = Math.min(1, t / .02) * Math.min(1, (DUR - t) / .6);
    L[i] = Math.tanh(L[i] * 1.1) * fade; R[i] = Math.tanh(R[i] * 1.1) * fade;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const gain = target / peak, data = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) { data.writeInt16LE(Math.round(L[i] * gain * 32767), i * 4); data.writeInt16LE(Math.round(R[i] * gain * 32767), i * 4 + 2); }
  const hdr = Buffer.alloc(44);
  hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write("WAVE", 8);
  hdr.write("fmt ", 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
  hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
  hdr.write("data", 36); hdr.writeUInt32LE(data.length, 40);
  writeFileSync(`out/${name}`, Buffer.concat([hdr, data]));
  console.log(`${name}  peak ${(20 * Math.log10(target)).toFixed(1)} dBFS`);
}
mkdirSync("out", { recursive: true });
write("homeowner-music.wav", music.L, music.R, .89, 7000);
write("homeowner-sfx.wav", FX.L, FX.R, .89, 8000);
