import { chromium } from "playwright-core";
import fs from "fs";
const [,, url, outDir, mode, ...rest] = process.argv;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.goto(url, { waitUntil: "load" });
console.log("setup:", JSON.stringify(await page.evaluate(() => window.setup())));
fs.mkdirSync(outDir, { recursive: true });
const times = mode === "stills" ? rest.map(Number) : null;
const fps = 30, total = mode === "all" ? Number(rest[0] || 30) : 0;
const list = times ?? Array.from({ length: Math.round(total * fps) }, (_, i) => i / fps);
const t0 = Date.now();
for (let i = 0; i < list.length; i++) {
  await page.evaluate((t) => window.renderFrame(t), list[i]);
  const name = times ? `still_${list[i].toFixed(2)}.jpg` : `f${String(i).padStart(4, "0")}.jpg`;
  await page.screenshot({ path: `${outDir}/${name}`, type: "jpeg", quality: 93 });
  if (!times && i % 150 === 0) console.log("frame", i, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
console.log("errors:", errs.join(" | ") || "none");
await browser.close();
