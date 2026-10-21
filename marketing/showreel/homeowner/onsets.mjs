// Prints phrase onsets (after gaps of >= 50 ms below -32 dBFS) in a processed VO take, at the mix tempo.
import fs from "node:fs";
const [take, tempo = "1"] = process.argv.slice(2);
const b = fs.readFileSync(`homeowner/seg/${take}.wav`), d = b.indexOf("data") + 8;
const x = new Float32Array(b.buffer.slice(b.byteOffset + d, b.byteOffset + b.length - ((b.length - d) % 4)));
const W = 480, thr = 10 ** (-32 / 20), loud = [];
for (let i = 0; i + W <= x.length; i += W) { let p = 0; for (let k = i; k < i + W; k++) p = Math.max(p, Math.abs(x[k])); loud.push(p > thr); }
let quiet = 99, out = [];
loud.forEach((l, w) => { if (l && quiet >= 5) out.push((w * W / 48000 / +tempo).toFixed(2)); quiet = l ? 0 : quiet + 1; });
console.log(take, "onsets:", out.join(" "), " end:", (x.length / 48000 / +tempo).toFixed(2));
