// Tiny Gemini helpers for the homeowner reel: listen to audio, and text-to-speech.
//   node homeowner/gemini.mjs ask <audio...> -- "question"
import fs from "node:fs";
import path from "node:path";

const env = fs.readFileSync(path.resolve(import.meta.dirname, "../../../.env.local"), "utf8");
const KEY = env.match(/^GOOGLE_API_KEY=(.*)$/m)[1].replace(/^"|"$/g, "").trim();
const API = "https://generativelanguage.googleapis.com/v1beta/models";

async function call(model, body) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${API}/${model}:generateContent`, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": KEY }, body: JSON.stringify(body),
    });
    if (r.ok) return r.json();
    const t = await r.text();
    if (r.status >= 500 || r.status === 429) { await new Promise((s) => setTimeout(s, 4000 * (attempt + 1))); continue; }
    throw new Error(`${model} ${r.status}: ${t.slice(0, 400)}`);
  }
  throw new Error(`${model}: gave up after retries`);
}

const mime = (f) => ({ ".mp3": "audio/mp3", ".wav": "audio/wav" })[path.extname(f)];

export async function ask(files, question, model = "gemini-3.8-flash") {
  const parts = files.map((f) => ({ inlineData: { mimeType: mime(f), data: fs.readFileSync(f).toString("base64") } }));
  const j = await call(model, { contents: [{ parts: [...parts, { text: question }] }] });
  return j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? JSON.stringify(j);
}

/** Speaks `text`; writes a 24 kHz mono 16-bit wav */
export async function speak(text, voice, out, direction, model = "gemini-3.1-flash-tts-preview") {
  const j = await call(model, {
    ...(direction ? { systemInstruction: { parts: [{ text: direction }] } } : {}),
    contents: [{ parts: [{ text }] }],
    generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
  });
  const part = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error(`no audio: ${JSON.stringify(j).slice(0, 300)}`);
  const pcm = Buffer.from(part.inlineData.data, "base64");
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(out, Buffer.concat([h, pcm]));
  return pcm.length / 48000;
}

if (process.argv[2] === "ask") {
  const i = process.argv.indexOf("--");
  console.log(await ask(process.argv.slice(3, i), process.argv.slice(i + 1).join(" ")));
}
