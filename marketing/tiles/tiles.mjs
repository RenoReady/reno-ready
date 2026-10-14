// Renders every swatch in tiles.html to public/tiles/<id>.webp (400 × 400),
// plus a contact sheet at marketing/tiles/sheet.png for review.
//   node marketing/tiles/tiles.mjs   (uses the headless browser from marketing/showreel/render.mjs on port 9333)
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, "../showreel/package.json"));
const puppeteer = require("puppeteer-core");
const sharp = require("sharp");

const out = path.join(here, "../../public/tiles");
mkdirSync(out, { recursive: true });

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null });
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(here, "tiles.html")).href);
await page.waitForFunction("window.__ready === true", { timeout: 120000 });
const ids = await page.evaluate(() => window.TILE_IDS);

const tiles = [];
for (const id of ids) {
  const dataUrl = await page.evaluate((id) => window.render(id).toDataURL("image/png"), id);
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  await sharp(png).webp({ quality: 86, effort: 6 }).toFile(path.join(out, `${id}.webp`));
  tiles.push({ id, png });
}
await page.close();
await browser.disconnect();

// contact sheet: 6 across
const T = 200, cols = 6, rows = Math.ceil(tiles.length / cols);
const composite = await Promise.all(tiles.map(async (t, i) => ({
  input: await sharp(t.png).resize(T - 8, T - 8).png().toBuffer(),
  left: (i % cols) * T + 4, top: Math.floor(i / cols) * T + 4,
})));
await sharp({ create: { width: cols * T, height: rows * T, channels: 3, background: "#ffffff" } })
  .composite(composite).png().toFile(path.join(here, "sheet.png"));
console.log(`wrote ${tiles.length} swatches`);
