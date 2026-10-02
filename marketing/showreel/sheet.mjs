// node sheet.mjs name t1,t2,...  → out/sheet-name.jpg (contact sheet of stills)
import { execFileSync } from "node:child_process";
import sharp from "sharp";
const [name, list, cols = "3"] = process.argv.slice(2);
execFileSync(process.execPath, ["render.mjs"], { env: { ...process.env, STILLS: list }, stdio: "inherit" });
const ts = list.split(",").map(parseFloat), C = +cols, W = Math.floor(1920 / C), H = Math.round(W * 9 / 16);
const tiles = await Promise.all(ts.map(async (t, i) => ({
  input: await sharp(`out/still-${t.toFixed(2).padStart(5, "0")}.jpg`).resize(W - 8, H - 8).toBuffer(),
  left: (i % C) * W + 4, top: Math.floor(i / C) * H + 4,
})));
await sharp({ create: { width: W * C, height: H * Math.ceil(ts.length / C), channels: 3, background: "#ff00ff" } })
  .composite(tiles).jpeg({ quality: 90 }).toFile(`out/sheet-${name}.jpg`);
