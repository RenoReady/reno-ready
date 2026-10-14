// Renders profile.html to square profile pictures (light + dark), plus a circle-crop preview.
//   node profile.mjs   (needs the headless browser from render.mjs on port 9333)
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = (f) => path.join(here, "out", f);
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
for (const v of ["light", "dark"]) {
  await page.goto(pathToFileURL(path.join(here, "profile.html")).href + (v === "dark" ? "?dark" : ""), { waitUntil: "networkidle0" });
  const shot = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1080, height: 1080 } });
  const png = await sharp(shot).resize(2160, 2160).png().toBuffer();
  const circle = Buffer.from('<svg width="2160" height="2160"><circle cx="1080" cy="1080" r="1080"/></svg>');
  await sharp(png).png({ compressionLevel: 9 }).toFile(out(`reno-ready-profile-${v}.png`));
  const round = await sharp(png).composite([{ input: circle, blend: "dest-in" }]).png().toBuffer();
  await sharp(round).resize(400, 400).png().toFile(out(`profile-preview-${v}.png`));
}
await page.close();
await browser.disconnect();
console.log("ok");
