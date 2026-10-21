// Homeowner reel — Aussie VO mix (same chain as runitback-mix.mjs). Run from marketing/showreel:
//   node homeowner/mix.mjs   → out/RenoReady-ShowYourSpace-30s-aussie.mp4
// Takes come pre-cleaned from homeowner/vo-process.mjs; each is placed at its cue in homeowner/vo.mjs.
//  1. Every VO segment is stripped of leading/trailing silence + noise (-40 dB), processed on its own, and faded.
//  2. Segments are written into a zero-filled buffer: every pause is explicit zero-amplitude samples.
//  3. A master noise gate over the final mix mutes anything below -60 dBFS to exact zero.
// VO, music and SFX stay isolated stems until the final sum.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { LINES } from "./vo.mjs";
const FF = "node_modules/ffmpeg-static/ffmpeg.exe", W0 = "homeowner/mixwork", SR = 48000, LEN = 30 * SR;
const plan = LINES.map(([take, s, e]) => [take, s, e]);
const run = (args) => execFileSync(FF, ["-hide_banner", "-y", "-loglevel", "error", ...args], { stdio: "inherit" });
const probe = (args) => String(spawnSync(FF, ["-hide_banner", ...args], { encoding: "utf8" }).stderr);
const readF32 = (f) => { const b = fs.readFileSync(f), di = b.indexOf("data") + 8; return new Float32Array(b.buffer.slice(b.byteOffset + di, b.byteOffset + b.length - ((b.length - di) % 4))); };
const writeF32 = (f, chans) => {   // interleaved float32 wav
  const n = chans[0].length, c = chans.length, data = Buffer.alloc(n * c * 4);
  for (let i = 0; i < n; i++) for (let k = 0; k < c; k++) data.writeFloatLE(chans[k][i], (i * c + k) * 4);
  const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(3, 20); h.writeUInt16LE(c, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * c * 4, 28); h.writeUInt16LE(c * 4, 32); h.writeUInt16LE(32, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40); fs.writeFileSync(f, Buffer.concat([h, data]));
};
const deinterleave = (a, c) => Array.from({ length: c }, (_, k) => { const o = new Float32Array(a.length / c); for (let i = 0; i < o.length; i++) o[i] = a[i * c + k]; return o; });
fs.mkdirSync(`${W0}/stems`, { recursive: true });

// ── 1. strip, clean and time each segment on its own ──
const vo = new Float32Array(LEN);   // starts as pure digital silence
for (const [take, s, e] of plan) {
  const out = `homeowner/seg/${take}.wav`;
  let x = readF32(out);
  const tempo = Math.max(1, x.length / SR / (e - s));
  if (tempo > 1.005) { run(["-i", out, "-af", `atempo=${tempo.toFixed(3)}`, "-c:a", "pcm_f32le", `${W0}/${take}.t.wav`]); x = readF32(`${W0}/${take}.t.wav`); }
  const fi = Math.round(.015 * SR), fo = Math.round(.04 * SR), at = Math.round(s * SR);
  for (let i = 0; i < x.length && at + i < LEN; i++) {
    const g = Math.min(1, i / fi, (x.length - 1 - i) / fo);
    vo[at + i] = x[i] * Math.max(0, g);
  }
  console.log(`${take}  ${(x.length / SR).toFixed(2)} s at ${s.toFixed(2)}  x${tempo.toFixed(2)}`);
}
writeF32(`${W0}/stems/vo-raw.wav`, [vo]);

// bus dynamics: gentle compressor + limiter (zero in → zero out, so the pauses stay silent)
run(["-i", `${W0}/stems/vo-raw.wav`, "-af", "acompressor=threshold=0.1:ratio=3:attack=5:release=90:makeup=1.6,alimiter=limit=0.89:attack=3:release=40:level=0:latency=1", "-c:a", "pcm_f32le", `${W0}/stems/vo-bus.wav`]);
const voBus = readF32(`${W0}/stems/vo-bus.wav`).slice(0, LEN);
// ── 2. explicit zero blocks: everything outside the placed segments is forced to 0 ──
const inSeg = new Uint8Array(LEN);
for (const [take, s] of plan) { const n = readF32(fs.existsSync(`${W0}/${take}.t.wav`) ? `${W0}/${take}.t.wav` : `homeowner/seg/${take}.wav`).length; inSeg.fill(1, Math.round(s * SR), Math.min(LEN, Math.round(s * SR) + n)); }
for (let i = 0; i < LEN; i++) if (!inSeg[i]) voBus[i] = 0;
// VO gate for the pauses inside a line: 5 ms windows under -50 dBFS (with 5 ms of hold either side) become exact zero
{
  const W = 240, thr = Math.pow(10, -50 / 20), nW = Math.ceil(LEN / W), loud = new Uint8Array(nW);
  for (let w = 0; w < nW; w++) { let pk = 0; for (let i = w * W; i < Math.min(LEN, w * W + W); i++) pk = Math.max(pk, Math.abs(voBus[i])); loud[w] = pk >= thr ? 1 : 0; }
  const open = loud.map((_, w) => loud[Math.max(0, w - 1)] | loud[w] | loud[Math.min(nW - 1, w + 1)]);
  for (let i = 0; i < LEN; i++) {
    const w = Math.floor(i / W), a = open[w], b = open[Math.min(nW - 1, w + 1)], fr = (i % W) / W;
    voBus[i] *= a && b ? 1 : !a && !b ? 0 : a ? 1 - fr : fr;
  }
}
writeF32(`${W0}/stems/vo.wav`, [voBus]);

// ── music (ducked by the VO key) and SFX stems ──
run(["-i", "out/homeowner-music.wav", "-i", `${W0}/stems/vo.wav`, "-filter_complex",
  "[0:a]volume=0.34,equalizer=f=320:t=q:w=1:g=-3.5[m];[1:a]aformat=channel_layouts=stereo[k];[m][k]sidechaincompress=threshold=0.025:ratio=8:attack=10:release=300[out]",
  "-map", "[out]", "-c:a", "pcm_f32le", `${W0}/stems/music.wav`]);
run(["-i", "out/homeowner-sfx.wav", "-af", "volume=0.5", "-c:a", "pcm_f32le", `${W0}/stems/sfx.wav`]);

// ── sum, fixed gain to -14 LUFS, true-peak limit ──
const [mL, mR] = deinterleave(readF32(`${W0}/stems/music.wav`), 2), [fL, fR] = deinterleave(readF32(`${W0}/stems/sfx.wav`), 2);
const L = new Float32Array(LEN), R = new Float32Array(LEN);
for (let i = 0; i < LEN; i++) { L[i] = voBus[i] + (mL[i] || 0) + (fL[i] || 0); R[i] = voBus[i] + (mR[i] || 0) + (fR[i] || 0); }
writeF32(`${W0}/sum.wav`, [L, R]);
const I = +probe(["-i", `${W0}/sum.wav`, "-af", "ebur128", "-f", "null", "-"]).split("Summary:")[1].match(/I:\s+(-?[\d.]+) LUFS/)[1];
run(["-i", `${W0}/sum.wav`, "-af", `volume=${(-14 - I).toFixed(2)}dB,alimiter=limit=0.84:attack=2:release=50:level=0:latency=1`, "-c:a", "pcm_f32le", `${W0}/limited.wav`]);

// ── 3. master noise gate: 5 ms windows; if the window peak (both channels) is under -60 dBFS it becomes exact zero ──
const [gL, gR] = deinterleave(readF32(`${W0}/limited.wav`), 2).map((c) => c.slice(0, LEN));
const W = 240, thr = Math.pow(10, -60 / 20);
const open = new Float32Array(Math.ceil(LEN / W));
for (let w = 0; w < open.length; w++) { let pk = 0; for (let i = w * W; i < Math.min(LEN, w * W + W); i++) pk = Math.max(pk, Math.abs(gL[i]), Math.abs(gR[i])); open[w] = pk >= thr ? 1 : 0; }
let gated = 0;
for (let i = 0; i < LEN; i++) {   // 5 ms linear ramp between windows so the gate never clicks
  const w = Math.floor(i / W), fr = (i % W) / W, g = open[w] * (1 - fr) + (open[Math.min(open.length - 1, w + 1)]) * fr;
  const gg = open[w] && open[Math.min(open.length - 1, w + 1)] ? 1 : g;
  if (!open[w] && !open[Math.min(open.length - 1, w + 1)]) { gL[i] = 0; gR[i] = 0; gated++; } else { gL[i] *= gg; gR[i] *= gg; }
}
writeF32(`${W0}/master.wav`, [gL, gR]);
console.log(`sum ${I} LUFS → ${(-14 - I).toFixed(2)} dB; master gate muted ${(gated / SR).toFixed(2)} s to exact zero`);
run(["-i", `${W0}/master.wav`, "-c:a", "pcm_s24le", `${W0}/mix.wav`]);
run(["-i", "out/homeowner-video.mp4", "-i", `${W0}/mix.wav`, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", "out/RenoReady-ShowYourSpace-30s-aussie.mp4"]);
console.log("done");
