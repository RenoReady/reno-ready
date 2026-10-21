// Renders one test line in several Gemini voices, then asks Gemini which is closest to the contractor reel's narrator.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { speak, ask } from "./gemini.mjs";

const FF = "node_modules/ffmpeg-static/ffmpeg.exe";
const DIR = "homeowner/voices";
fs.mkdirSync(DIR, { recursive: true });
const STYLE = "Say in a natural general Australian accent, male, quick, clipped, warm and a bit cheeky, like an Aussie ad voiceover (rueful, dry):";
const LINE = "Fifty saved ideas… and zero clue how any of it fits together.";
const voices = (process.env.VOICES ?? "Puck,Fenrir,Orus,Charon,Algenib,Achird,Umbriel,Sadachbia").split(",");

await Promise.all(voices.map(async (v) => {
  const wav = `${DIR}/${v}.wav`;
  if (!fs.existsSync(wav)) await speak(`${STYLE} \"${LINE}\"`, v, wav);
  execFileSync(FF, ["-v", "error", "-y", "-i", wav, "-ac", "1", "-b:a", "64k", `${DIR}/${v}.mp3`]);
  console.log("made", v);
}));

const files = ["homeowner/ref-vo.mp3", ...voices.map((v) => `${DIR}/${v}.mp3`)];
console.log(await ask(files, `The first audio is a REFERENCE voiceover. The next ${voices.length} audios are candidates, in this order: ${voices.join(", ")}. ` +
  "For each candidate, rate 1-10: (a) how similar the voice is to the reference narrator (timbre, pitch, age, energy), (b) how authentically Australian the accent sounds, (c) any glitches, mispronunciations or artefacts. Then name the single best match. Be strict."));
