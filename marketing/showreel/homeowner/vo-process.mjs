// Cleans each VO take: trims the ends, squeezes any pause inside a line to at most 0.14 s, light EQ,
// then levels every line to the same loudness so no take stands out from the others.
//   node homeowner/vo-process.mjs  → homeowner/seg/<take>.wav (48 kHz mono float) and a length report
import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { LINES } from "./vo.mjs";

const FF = "node_modules/ffmpeg-static/ffmpeg.exe";
fs.mkdirSync("homeowner/seg", { recursive: true });
const chain = [
  "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.01:detection=peak",
  "areverse", "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.03:detection=peak", "areverse",
  "silenceremove=stop_periods=-1:stop_duration=0.14:stop_threshold=-42dB:stop_silence=0.14:detection=rms",   // squeeze inner pauses
  "highpass=f=85", "deesser=i=0.35:m=0.5:f=0.5",
  "equalizer=f=250:t=q:w=1:g=-1.5", "equalizer=f=3200:t=q:w=1.2:g=2",
].join(",");
const TARGET = -20;   // LUFS per line, before the bus compressor
const lufs = (f) => +String(spawnSync(FF, ["-hide_banner", "-i", f, "-af", "ebur128", "-f", "null", "-"], { encoding: "utf8" }).stderr).split("Summary:")[1].match(/I:\s+(-?[\d.]+) LUFS/)[1];
let total = 0;
for (const [take, s, e] of LINES) {
  const out = `homeowner/seg/${take}.wav`;
  const raw = `homeowner/seg/${take}.raw.wav`;
  execFileSync(FF, ["-v", "error", "-y", "-i", `homeowner/fg/${take}.wav`, "-af", chain, "-ar", "48000", "-ac", "1", "-c:a", "pcm_f32le", raw]);
  const I = lufs(raw);
  execFileSync(FF, ["-v", "error", "-y", "-i", raw, "-af", `volume=${(TARGET - I).toFixed(2)}dB`, "-c:a", "pcm_f32le", out]);
  fs.unlinkSync(raw);
  const b = fs.readFileSync(out), len = (b.length - b.indexOf("data") - 8) / 4 / 48000;
  total += len;
  console.log(`${take}  ${I.toFixed(1)} LUFS → ${TARGET}  ${len.toFixed(2)} s   slot ${s.toFixed(2)}–${e.toFixed(2)} (${(e - s).toFixed(2)})  ${len > e - s ? `needs x${(len / (e - s)).toFixed(2)}` : "fits"}`);
}
console.log(`total speech ${total.toFixed(2)} s`);
