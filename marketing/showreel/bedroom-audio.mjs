// Synthesises the 15 s bedroom soundtrack (128 BPM, D major) with sound effects
// locked to the same beat grid as the animation. Writes out/bedroom-audio.wav.
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 48000, DUR = 15, N = SR * DUR, BEAT = 0.46875;
const b = (n) => n * BEAT;
const L = new Float32Array(N), R = new Float32Array(N);       // dry bus
const RL = new Float32Array(N), RR = new Float32Array(N);     // reverb send
const DL = new Float32Array(N), DR = new Float32Array(N);     // delay send
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 777;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function add(i, l, r, rev = 0, dly = 0) {
  if (i < 0 || i >= N) return;
  L[i] += l; R[i] += r;
  if (rev) { RL[i] += l * rev; RR[i] += r * rev; }
  if (dly) { DL[i] += l * dly; DR[i] += r * dly; }
}
const panLR = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];

/* ── sidechain: the pad and arp duck under each kick ─────────────── */
const kicks = [];
for (let n = 4; n < 27; n++) kicks.push(b(n));
kicks.push(b(27));
function duck(t) {
  let g = 1;
  for (const k of kicks) if (t >= k && t < k + .4) g = Math.min(g, 1 - .5 * Math.exp(-(t - k) * 9));
  return g;
}

/* ── instruments ─────────────────────────────────────────────────── */
function pad(notes, t0, t1, level, cutoffFrom = 1400, cutoffTo = 1400) {
  const atk = .22, rel = .5;
  const s0 = Math.floor(t0 * SR), s1 = Math.min(N, Math.floor((t1 + rel) * SR));
  notes.forEach((m, vi) => {
    const f = mtof(m), [pl, pr] = panLR(((vi % 2) ? .35 : -.35));
    const ph = [Math.random(), Math.random(), Math.random()], det = [-.0045, 0, .0045];
    let lp = 0;
    for (let i = s0; i < s1; i++) {
      const t = i / SR, u = t - t0;
      const env = Math.min(1, u / atk) * (t > t1 ? Math.exp(-(t - t1) / (rel / 4)) : 1);
      let v = 0;
      for (let k = 0; k < 3; k++) { ph[k] = (ph[k] + f * (1 + det[k]) / SR) % 1; v += 2 * ph[k] - 1; }
      const fc = cutoffFrom + (cutoffTo - cutoffFrom) * Math.min(1, u / Math.max(.01, t1 - t0));
      lp += (1 - Math.exp(-2 * Math.PI * fc / SR)) * (v / 3 - lp);
      const s = lp * env * level * duck(t);
      add(i, s * pl, s * pr, .35);
    }
  });
}
function bass(m, t0, len, level = .15) {
  const f = mtof(m); let ph = 0;
  for (let i = Math.floor(t0 * SR), e = Math.floor((t0 + len) * SR); i < e && i < N; i++) {
    const u = i / SR - t0;
    ph = (ph + f / SR) % 1;
    const env = Math.min(1, u / .008) * Math.exp(-u * 3.2) * Math.min(1, (len - u) / .03);
    const s = (Math.sin(2 * Math.PI * ph) + .25 * Math.sin(4 * Math.PI * ph)) * env * level;
    add(i, s, s);
  }
}
function kick(t0, level = .85) {
  let ph = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(.45 * SR); i < e && i < N; i++) {
    const u = i / SR - t0;
    ph += (46 + 120 * Math.exp(-u * 30)) / SR;
    const s = (Math.sin(2 * Math.PI * ph) * Math.exp(-u * 7) + (u < .004 ? rnd() * .3 : 0)) * level;
    add(i, s, s);
  }
}
function hat(t0, level = .05, pan = 0) {
  let lp = 0; const [pl, pr] = panLR(pan);
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(.08 * SR); i < e && i < N; i++) {
    const u = i / SR - t0, n = rnd();
    lp += .55 * (n - lp);
    const s = (n - lp) * Math.exp(-u * 60) * level;
    add(i, s * pl, s * pr, .1);
  }
}
function pluck(m, t0, level = .1, pan = 0, decay = 9, rev = .3, dly = .35) {
  const f = mtof(m), [pl, pr] = panLR(pan); let ph = 0, lp = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(.9 * SR); i < e && i < N; i++) {
    const u = i / SR - t0;
    ph = (ph + f / SR) % 1;
    const tri = 1 - 4 * Math.abs(ph - .5);
    lp += .35 * (tri - lp);
    const s = lp * Math.min(1, u / .003) * Math.exp(-u * decay) * level;
    add(i, s * pl, s * pr, rev, dly);
  }
}
function bell(m, t0, level = .1, pan = 0, decay = 2.2) {
  const f = mtof(m), [pl, pr] = panLR(pan);
  const parts = [[1, 1, 1], [2.0, .45, 1.6], [3.01, .25, 2.4], [4.2, .14, 3.4], [5.43, .07, 4.4]];
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(2.6 * SR); i < e && i < N; i++) {
    const u = i / SR - t0; let v = 0;
    for (const [r, a, d] of parts) v += Math.sin(2 * Math.PI * f * r * u) * a * Math.exp(-u * decay * d);
    const s = v * Math.min(1, u / .002) * level;
    add(i, s * pl, s * pr, .55);
  }
}
function blip(freq, t0, level = .12, pan = 0, len = .07) {
  const [pl, pr] = panLR(pan); let ph = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    const u = i / SR - t0;
    ph += freq * (1 + .25 * Math.exp(-u * 60)) / SR;
    const s = Math.sin(2 * Math.PI * ph) * Math.exp(-u * (5 / len)) * level;
    add(i, s * pl, s * pr, .15);
  }
}
// band-passed noise with a moving centre frequency, a hann envelope and a pan sweep
function whoosh(t0, len, fFrom, fTo, level = .2, panFrom = -.6, panTo = .6, rise = .5) {
  let lo = 0, bp = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    if (i < 0) continue;
    const x = (i / SR - t0) / len;
    const env = x < rise ? Math.sin((x / rise) * Math.PI / 2) ** 2 : Math.cos(((x - rise) / (1 - rise)) * Math.PI / 2) ** 2;
    const fc = fFrom * Math.pow(fTo / fFrom, x), g = 2 * Math.sin(Math.PI * fc / SR), q = .55;
    lo += g * bp; const hi = rnd() - lo - q * bp; bp += g * hi;
    const [pl, pr] = panLR(panFrom + (panTo - panFrom) * x);
    const s = bp * env * level;
    add(i, s * pl, s * pr, .25);
  }
}
function sweep(t0, len, fFrom, fTo, level = .05) {
  let ph = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    const x = (i / SR - t0) / len;
    ph += fFrom * Math.pow(fTo / fFrom, x) / SR;
    const s = Math.sin(2 * Math.PI * ph) * Math.sin(Math.PI * x) * level;
    add(i, s, s, .5);
  }
}

/* ── shared kitchen/bedroom instruments ────────────────────────────────────── */
// soft clap: two quick band-passed noise bursts
function clap(t0, level = .09) {
  for (const o of [0, .011, .022]) {
    let lo = 0, bp = 0; const g = 2 * Math.sin(Math.PI * 1500 / SR);
    for (let i = Math.floor((t0 + o) * SR), e = i + Math.floor(.12 * SR); i < e && i < N; i++) {
      const u = i / SR - t0 - o;
      lo += g * bp; const hi = rnd() - lo - .7 * bp; bp += g * hi;
      const s = bp * Math.exp(-u * (o < .02 ? 70 : 22)) * level;
      add(i, s, s, .3);
    }
  }
}
// low, woody thud for the cabinet doors meeting
function thud(t0, level = .5) {
  let ph = 0;
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(.35 * SR); i < e && i < N; i++) {
    const u = i / SR - t0;
    ph += (70 + 90 * Math.exp(-u * 40)) / SR;
    const s = (Math.sin(2 * Math.PI * ph) * Math.exp(-u * 14) + (u < .012 ? rnd() * .5 * (1 - u / .012) : 0)) * level;
    add(i, s, s, .2);
  }
}
// docket printer: noise chopped at 55 Hz with a short tail
function printer(t0, len = .26, level = .07) {
  let lo = 0, bp = 0; const g = 2 * Math.sin(Math.PI * 3200 / SR);
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    const u = i / SR - t0;
    lo += g * bp; const hi = rnd() - lo - .5 * bp; bp += g * hi;
    const chop = .5 + .5 * Math.sign(Math.sin(2 * Math.PI * 55 * u));
    const s = bp * chop * Math.min(1, u / .01) * Math.min(1, (len - u) / .04) * level;
    add(i, s * .8, s, .08);
  }
}

/* ── bedroom-only instruments ────────────────────────────────────── */
// camera shutter: two tight clicks
function shutter(t0, level = .22) {
  for (const o of [0, .055]) {
    let lp = 0;
    for (let i = Math.floor((t0 + o) * SR), e = i + Math.floor(.03 * SR); i < e && i < N; i++) {
      const u = i / SR - t0 - o, n = rnd();
      lp += .6 * (n - lp);
      const s = (n - lp * .5) * Math.exp(-u * 180) * level * (o ? .7 : 1);
      add(i, s, s, .1);
    }
  }
}
// soft brushed snare for the backbeat: low-passed noise with a slow swell
function brush(t0, level = .05) {
  let lp = 0, lp2 = 0;
  for (let i = Math.floor((t0 - .03) * SR), e = Math.floor((t0 + .22) * SR); i < e && i < N; i++) {
    if (i < 0) continue;
    const u = i / SR - t0, n = rnd();
    lp += .22 * (n - lp); lp2 += .5 * (lp - lp2);
    const env = u < 0 ? (1 + u / .03) * .4 : Math.exp(-u * 14);
    const s = (lp - lp2 * .6) * env * level;
    add(i, s * .85, s, .35);
  }
}
// switch flick: a tiny mechanical tick plus a soft pop
function flick(t0, level = .2) {
  blip(3400, t0, level * .35, .2, .012);
  blip(260, t0 + .004, level, .2, .05);
}
// fabric rattle for the roller blind landing
function rattle(t0, len = .18, level = .06) {
  for (let i = Math.floor(t0 * SR), e = i + Math.floor(len * SR); i < e && i < N; i++) {
    const u = i / SR - t0;
    const s = rnd() * Math.exp(-u * 22) * (.6 + .4 * Math.sin(2 * Math.PI * 38 * u)) * level;
    add(i, s, s * .9, .15);
  }
}

/* ── music (D major, dreamy I–iii–IV–iv) ─────────────────────────── */
const CH = {
  D:   { pad: [50, 54, 57, 62], root: 38, arp: [62, 66, 69, 74] },
  Fsm: { pad: [49, 54, 57, 61], root: 42, arp: [61, 66, 69, 73] },
  G:   { pad: [50, 55, 59, 62], root: 43, arp: [62, 67, 71, 74] },
  Gm:  { pad: [50, 55, 58, 62], root: 43, arp: [62, 67, 70, 74] },
  D9:  { pad: [50, 54, 57, 61, 64], root: 38, arp: [66, 69, 73, 76] },
};
const SEQ = [["D", 0, 4], ["Fsm", 4, 8], ["G", 8, 12], ["Gm", 12, 16], ["D", 16, 20], ["Fsm", 20, 24], ["G", 24, 27], ["D9", 27, 32]];
for (const [k, s, e] of SEQ) {
  const c = CH[k];
  pad(c.pad, b(s), b(e), k === "D9" ? .078 : .064, s === 0 ? 300 : 900, s === 0 ? 1200 : 1350);
  if (s >= 4 && s < 27) for (let n = s; n < e; n += 2) { bass(c.root, b(n), b(1.6), .16); bass(c.root + 7, b(n + 1.5), b(.45), .07); }
  if (k === "D9") bass(c.root, b(27), 2.3, .26);
  // sixteenth-note shimmer, soft and wide, in two-bar phrases
  if (s >= 4 && s < 27) for (let n = s * 2; n < e * 2; n++) {
    const pat = [0, 1, 2, 3, 1, 2, 3, 2][n % 8];
    pluck(c.arp[pat], b(n / 2), .058, n % 2 ? .55 : -.55, 7, .35, .42);
    if (n % 4 === 3) bell(c.arp[3] + 12, b(n / 2) + b(.25), .018, n % 8 === 3 ? .6 : -.6, 3.2);
  }
}
for (const k of kicks.slice(0, -1)) kick(k, .34);
kick(b(27), .58);
for (let n = 5; n < 27; n += 2) brush(b(n), .16);
for (let n = 8; n < 54; n++) if (n % 2) hat(b(n / 2), .02, n % 4 === 3 ? .35 : -.35);

/* ── sound design, locked to the animation ───────────────────────── */
whoosh(.15, .9, 250, 2200, .15, .7, .2, .6);              // phone rises in
pluck(74, .14, .05, -.3); pluck(78, .25, .05, .3);        // headline lines
for (let i = 0; i < 4; i++) blip(4200, .55 + i * .03, .025, .5, .015);   // camera frame corners
shutter(b(2.25) - .01, .24);                              // snap
sweep(b(2.25), .35, 2400, 600, .02);
whoosh(1.38, 1.0, 1800, 350, .13, .5, -.7, .45);          // phone slides across to the viewport
for (let i = 0; i < 4; i++) blip(mtof([74, 78, 81, 86][i]), b(4) + .2 + i * .05, .05, -.4 + i * .2, .06);   // pills
for (let i = 0; i < 3; i++) blip(mtof([78, 81, 85][i]), b(4) + .36 + i * .05, .045, .2, .06);
for (const t of [b(7), b(8), b(9)]) { blip(2600, t, .07, .2, .03); blip(180, t, .2, 0, .06); }   // cursor clicks
bell(81, b(8) + .02, .06, .3, 2.6); bell(88, b(8) + .07, .04, .4, 3);    // keep toggled on
sweep(b(9) + .1, .3, 900, 220, .03);                      // lights dim
flick(b(9) + .4, .22);                                    // …and switch on
bell(74, b(9) + .44, .07, -.2, 1.6); bell(81, b(9) + .47, .06, .1, 1.6); bell(86, b(9) + .5, .05, .3, 1.8); bell(90, b(9) + .56, .035, 0, 2);
whoosh(b(12) - .42, .48, 2600, 500, .14, 0, 0, .85);     // blind pulls down
rattle(b(12), .22, .07); thud(b(12), .32);
whoosh(b(12) + .2, .6, 400, 2400, .12, 0, 0, .55);       // blind rolls up
[b(12.75), b(13.375), b(14), b(14.625), b(15.25)].forEach((t, i) => blip(mtof(69 + [0, 2, 4, 7, 9][i]), t, .09, .25, .08));   // line items
blip(mtof(62), b(15.25) + .15, .1, 0, .16); blip(mtof(61), b(15.25) + .3, .09, 0, .2);     // over budget
flick(b(16.75), .26);                                     // keep switch
for (let i = 0; i < 5; i++) blip(mtof([81, 85, 88, 93, 97][i]), b(16.75) + .14 + i * .045, .04, -.3 + i * .15, .05);   // totals roll down
bell(81, b(16.75) + .34, .05, -.1); bell(88, b(16.75) + .43, .05, .2);   // within budget
bell(93, b(16.75) + .55, .035, .3, 2.4);                  // saved
sweep(b(19.5) - .48, .26, 90, 140, .05);                  // LED strip hum
whoosh(b(19.5) - .45, .5, 3000, 600, .12, -.8, .8, .5);
whoosh(b(19.5) - .02, .7, 250, 1800, .14, 0, 0, .25);     // slot opens
for (let i = 0; i < 3; i++) blip(mtof([78, 81, 85][i]), b(21.25) + i * .14, .08, -.2 + i * .25, .07); // builders tick
whoosh(b(22.25) - .2, .8, 250, 1400, .14, 0, 0, .3);      // phone lands
whoosh(b(24.25) - .5, 1.0, 900, 2400, .12, .7, -.7, .5);  // slider sweeps across
whoosh(b(27) - .75, .8, 300, 6000, .16, 0, 0, .94);       // reverse swell into the iris
bell(74, b(27) + .37, .09, -.15, 1.4); bell(81, b(27) + .37, .07, .15, 1.4); bell(86, b(27) + .4, .05, .3, 1.6); // logo tick lands
[b(29), b(29.5), b(30)].forEach((t, i) => pluck([74, 78, 81][i], t, .08, -.3 + i * .3, 5, .45, .3));
pluck(86, b(30) + .12, .05, 0, 3, .6, .3);

/* ── effects: dotted-eighth ping-pong delay, Schroeder reverb ─────── */
const dT = Math.floor(b(.75) * SR), fb = .38;
for (let i = dT; i < N; i++) { DL[i] += DR[i - dT] * fb; DR[i] += DL[i - dT] * fb; }
for (let i = dT; i < N; i++) { L[i] += DR[i - dT] * .5; R[i] += DL[i - dT] * .5; }

function reverb(src, offs) {
  const out = new Float32Array(N);
  for (const d of [1557, 1617, 1491, 1422, 1277, 1356].map((x) => x + offs)) {
    const buf = new Float32Array(d); let p = 0, lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[p]; lp = y * .7 + lp * .3;
      buf[p] = src[i] + lp * .82; p = (p + 1) % d; out[i] += y / 6;
    }
  }
  for (const d of [556, 441, 341].map((x) => x + offs)) {
    const buf = new Float32Array(d); let p = 0;
    for (let i = 0; i < N; i++) { const y = buf[p]; const x = out[i]; buf[p] = x + y * .5; out[i] = y - x * .5; p = (p + 1) % d; }
  }
  return out;
}
const wl = reverb(RL, 0), wr = reverb(RR, 23);

/* ── master: mix, gentle saturation, fades, normalise, write ──────── */
let peak = 0, sumsq = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = Math.min(1, t / .03) * Math.min(1, (DUR - t) / .45);
  L[i] = Math.tanh((L[i] + wl[i] * .9) * 1.1) * fade;
  R[i] = Math.tanh((R[i] + wr[i] * .9) * 1.1) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  sumsq += L[i] * L[i] + R[i] * R[i];
}
const gain = .89 / peak;   // -1 dBFS peak
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(L[i] * gain * 32767), i * 4);
  data.writeInt16LE(Math.round(R[i] * gain * 32767), i * 4 + 2);
}
const hdr = Buffer.alloc(44);
hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write("WAVE", 8);
hdr.write("fmt ", 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
hdr.write("data", 36); hdr.writeUInt32LE(data.length, 40);
mkdirSync("out", { recursive: true });
writeFileSync("out/bedroom-audio.wav", Buffer.concat([hdr, data]));
const rms = Math.sqrt(sumsq / (2 * N)) * gain;
console.log(`bedroom-audio.wav  peak -1.0 dBFS  rms ${(20 * Math.log10(rms)).toFixed(1)} dBFS`);
