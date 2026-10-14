// Renders cover.html to the Facebook cover PNG, plus desktop/mobile crop previews.
//   node cover.mjs   (needs the headless browser from render.mjs on port 9333)
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null });
const page = await browser.newPage();
await page.setViewport({ width: 1640, height: 856, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(here, "cover.html")).href, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: "png" });
await page.close();
await browser.disconnect();

const out = (f) => path.join(here, "out", f);
await sharp(png).resize(1640, 856).png({ compressionLevel: 9 }).toFile(out("reno-ready-facebook-cover.png"));
await sharp(png).png({ compressionLevel: 9 }).toFile(out("reno-ready-facebook-cover@2x.png"));
// what Facebook shows: desktop = centre band 1640 × 624, phone = centre 1522 × 856
await sharp(png).resize(1640, 856).extract({ left: 0, top: 116, width: 1640, height: 624 }).toFile(out("cover-preview-desktop.png"));
await sharp(png).resize(1640, 856).extract({ left: 59, top: 0, width: 1522, height: 856 }).toFile(out("cover-preview-mobile.png"));
console.log("ok");
