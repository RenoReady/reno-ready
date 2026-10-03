// Renders index.html to video by seeking the GSAP timeline frame by frame.
//   node render.mjs                 → out/video.mp4 (60 fps, 4 sub-frames of motion blur)
//   STILLS=0.5,2,4 node render.mjs  → out/still-*.jpg for review
import puppeteer from "puppeteer-core";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS  = +(process.env.FPS ?? 60);
const SUB  = +(process.env.SUB ?? 4);        // sub-frames blended per output frame
const DUR  = 15;
const PAGE = process.env.PAGE ?? "index.html";                 // kitchen.html for the kitchen reel
const NAME = path.basename(PAGE, ".html") === "index" ? "" : path.basename(PAGE, ".html") + "-";
const OUT  = process.env.OUT ?? path.join(here, "out", `${NAME}video.mp4`);
const BROWSERS = [
  process.env.BROWSER,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const executablePath = BROWSERS.find((p) => existsSync(p));
mkdirSync(path.join(here, "out"), { recursive: true });

// Edge re-parents itself on launch, so start it ourselves and attach over the
// DevTools port instead of letting puppeteer own the process.
const PORT = 9333;
const alive = () => fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.ok).catch(() => false);
if (!(await alive())) {
  spawn(executablePath, [
    "--headless=new", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    "--force-device-scale-factor=1", "--allow-file-access-from-files", "--force-color-profile=srgb",
    `--user-data-dir=${path.join(here, ".browser-profile")}`, `--remote-debugging-port=${PORT}`, "about:blank",
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 60 && !(await alive()); i++) await new Promise((r) => setTimeout(r, 250));
}
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${PORT}`, defaultViewport: null });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.error("CONSOLE:", m.text()); });
await page.goto(pathToFileURL(path.join(here, PAGE)).href + "?render=1");
await page.waitForFunction("window.__ready === true", { timeout: 30000 });

const shot = async (t, type = "jpeg") => {
  await page.evaluate((t) => window.seek(t), t);
  return page.screenshot(type === "png" ? { type: "png" } : { type: "jpeg", quality: 97, optimizeForSpeed: true });
};

if (process.env.STILLS) {
  for (const s of process.env.STILLS.split(",")) {
    const t = parseFloat(s);
    writeFileSync(path.join(here, "out", `${NAME}still-${t.toFixed(2).padStart(5, "0")}.jpg`), await shot(t));
  }
  await page.close();
  await browser.disconnect();
  process.exit(0);
}

const vf = [
  SUB > 1 ? `tmix=frames=${SUB}` : null,
  SUB > 1 ? `fps=${FPS}` : null,
  "scale=in_range=pc:out_range=tv:out_color_matrix=bt709",
  "format=yuv420p",
].filter(Boolean).join(",");
const ff = spawn(ffmpegPath, [
  "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS * SUB), "-c:v", "mjpeg", "-i", "-",
  "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
  "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", OUT,
], { stdio: ["pipe", "inherit", "inherit"] });

// tmix averages the SUB most recent sub-frames, and fps keeps every SUB-th
// result, so each output frame is a blend ending on its exact frame time.
const total = DUR * FPS * SUB, t0 = Date.now();
for (let i = 0; i < total; i++) {
  const t = i / (FPS * SUB);
  const buf = await shot(t);
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % (FPS * SUB) === 0) console.log(`${(i / (FPS * SUB)).toFixed(0)}s / ${DUR}s  (${((Date.now() - t0) / 1000).toFixed(0)}s elapsed)`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await page.close();
await browser.close();
console.log("wrote", OUT);

// add the soundtrack from audio.mjs if it has been generated
const wav = path.join(here, "out", `${NAME}audio.wav`);
if (existsSync(wav)) {
  const final = path.join(here, "out", NAME ? `reno-ready-${NAME}reel.mp4` : "reno-ready-showreel.mp4");
  const mux = spawn(ffmpegPath, ["-y", "-loglevel", "error", "-i", OUT, "-i", wav, "-map", "0:v", "-map", "1:a",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", final], { stdio: "inherit" });
  await new Promise((r) => mux.on("close", r));
  console.log("wrote", final);
}
process.exit(0);
