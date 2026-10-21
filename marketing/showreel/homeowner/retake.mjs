// Re-records one VO line several times and asks Gemini which take best matches the narrator
// in the surrounding takes (timbre, pitch, loudness, accent, energy). The winner replaces fg/<take>.wav.
//   node homeowner/retake.mjs A-10 [count]
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { speak, ask } from "./gemini.mjs";
import { LINES, VOICE, MODEL } from "./vo.mjs";

const FF = "node_modules/ffmpeg-static/ffmpeg.exe";
const [take, count = "4"] = process.argv.slice(2);
const i = LINES.findIndex((l) => l[0] === take);
const [, s, e, dir, line] = LINES[i];
const DIRECTION = fs.readFileSync("homeowner/direction.txt", "utf8").trim();
const how = `${dir} Match the exact same voice, pitch, loudness and energy as the rest of the ad. | PACE: quick, tight delivery — this line must take only about ${(e - s - .15).toFixed(1)} seconds. No long pauses.`;
const dirOut = `homeowner/retake-${take}`;
fs.mkdirSync(dirOut, { recursive: true });
const mp3 = (wav) => { const o = wav.replace(/\.wav$/, ".mp3"); execFileSync(FF, ["-v", "error", "-y", "-i", wav, "-ac", "1", "-b:a", "64k", o]); return o; };

const cands = [];
for (let k = 1; cands.length < +count && k <= +count * 3; k++) {
  const out = `${dirOut}/${take}-${k}.wav`;
  const secs = await speak(`${DIRECTION}\n\nLine delivery: ${how}\n\nSay: ${line}`, VOICE, out, undefined, MODEL);
  if (secs > (e - s) * 1.5 + 1) { console.log(`take ${k}: ${secs.toFixed(2)} s, too long, skipped`); continue; }
  console.log(`take ${k}: ${secs.toFixed(2)} s`);
  cands.push(out);
}
const neighbours = [LINES[i - 1][0], LINES[i + 1][0]].map((t) => mp3(`homeowner/seg/${t}.wav`));
const files = [...neighbours, ...cands.map(mp3)];
const verdict = await ask(files,
  `Audios 1 and 2 are the narrator's lines just before and after this one in a 30 s ad. Audios 3-${files.length} are candidate takes (numbered 1-${cands.length}) of the line "${line}". ` +
  "For each candidate: does it say exactly that line (no extra or missing words)? Rate 1-10 how seamlessly it matches the surrounding narrator (timbre, pitch, loudness, Australian accent, energy). " +
  'Finish with a final line exactly like: BEST: <number>');
console.log(verdict);
const best = +(verdict.match(/BEST:\s*(\d+)/)?.[1] ?? 0);
if (!best || !cands[best - 1]) throw new Error("no clear winner; pick one by hand from " + dirOut);
fs.copyFileSync(cands[best - 1], `homeowner/fg/${take}.wav`);
console.log(`using take ${best} for ${take}`);
