// Records the homeowner reel's voiceover, one Gemini take per line, with the same voice, model and
// direction as the contractor cut (Orus on gemini-3.8-flash-tts, homeowner/direction.txt).
//   node homeowner/vo.mjs            → homeowner/fg/<take>.wav (skips takes that exist)
//   REDO=A-03,A-08 node homeowner/vo.mjs   re-records those takes
import fs from "node:fs";
import { speak } from "./gemini.mjs";

export const VOICE = "Orus", MODEL = "gemini-3.8-flash-tts";
const DIRECTION = fs.readFileSync("homeowner/direction.txt", "utf8").trim();

// [take, start (s), latest end (s), direction, line]. Takes longer than their slot are sped up in the mix.
export const LINES = [
  ["A-01", 0.15, 1.55,  "Curious, knowing, slightly teasing.", "Dreaming of a reno?"],
  ["A-02", 1.6, 5.3,  "Rueful and dry, no long pauses.", "Fifty saved ideas. Zero clue how it all fits together."],
  ["A-03", 5.4, 7.5,  "Sceptical, already knows the answer.", "Tried one of those 3D planners?"],
  ["A-04", 8.4, 11.15, "Deadpan punchline.", "Three hours later, still a grey box."],
  ["A-05", 11.95, 14.25, "Snappy and decisive, the turn of the ad.", "Stop guessing. Show us your space."],
  ["A-06", 14.28, 18.6, "One flowing, brisk list that speeds up, then land the last word firmly.", "Snap your room, tap your tiles, tapware, vanity, and there it is. Priced."],
  ["A-10", 18.65, 21.15, "Easy and confident.", "Then send the brief straight to a builder."],
  ["B-11", 21.85, 23.45, "In character as a gruff, friendly Aussie tradie, impressed, a little eager.", "When do you want me to start?"],
  ["A-12", 23.55, 26.8, "Brand sign-off: proud, clear, a slight lift on 'in seconds'.", "Reno Ready. Design your dream reno in seconds."],
  ["A-13", 26.9, 29.85, "Friendly call to action, say the web address clearly as 'reno ready dot com dot A U'.", "Try it free at renoready dot com dot A U."],
];

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1].endsWith("vo.mjs")) {
  fs.mkdirSync("homeowner/fg", { recursive: true });
  const redo = (process.env.REDO ?? "").split(",").filter(Boolean);
  for (const [take, s, e, dir, line] of LINES) {
    const out = `homeowner/fg/${take}.wav`;
    if (fs.existsSync(out) && !redo.includes(take)) continue;
    const how = `${dir} | PACE: quick, tight delivery — this line must take only about ${(e - s - .15).toFixed(1)} seconds. No long pauses.`;
    // the model sometimes ad-libs extra sentences; re-record any take that runs well past its slot
    let secs = 0;
    for (let attempt = 1; attempt <= 6; attempt++) {
      secs = await speak(`${DIRECTION}

Line delivery: ${how}

Say: ${line}`, VOICE, out, undefined, MODEL);
      if (secs <= (e - s) * 1.5 + 1) break;
      console.log(`${take}  ${secs.toFixed(2)} s, too long, retrying`);
    }
    console.log(`${take}  ${secs.toFixed(2)} s  (slot ${(e - s).toFixed(2)} s)  ${line}`);
  }
}
