// Builds the social share image (1200×630) used for links to renoready.com.au:
// the before/after bathroom on the left, the headline on the right.
//   node scripts/make-og-image.mjs   →  src/app/opengraph-image.jpg + twitter-image.jpg
import fs from "node:fs";
import sharp from "sharp";

const W = 1200, H = 630, PHOTO_W = 560;
const half = PHOTO_W / 2;

const crop = (file) => sharp(file).resize(half, H, { fit: "cover", position: "attention" }).toBuffer();
const [before, after] = await Promise.all([crop("public/Reno-before.jpg"), crop("public/Reno-after.jpg")]);
const logo = await sharp("public/logo.png").trim().resize({ height: 92 }).png().toBuffer();
const logoMeta = await sharp(logo).metadata();

const text = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- photo labels -->
  <rect x="20" y="22" rx="14" width="104" height="32" fill="#2C3E50" opacity="0.9"/>
  <text x="72" y="44" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="2">BEFORE</text>
  <rect x="${half + 20}" y="22" rx="14" width="92" height="32" fill="#D27D5E"/>
  <text x="${half + 66}" y="44" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="2">AFTER</text>
  <rect x="${half - 1.5}" y="0" width="3" height="${H}" fill="#fff"/>
  <!-- headline -->
  <text font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#2C3E50">
    <tspan x="${PHOTO_W + 60}" y="${170 + 92 + 50}" font-size="54">Design your dream</tspan>
    <tspan x="${PHOTO_W + 60}" y="${170 + 92 + 114}" font-size="54">renovation</tspan>
    <tspan x="${PHOTO_W + 60}" y="${170 + 92 + 178}" font-size="54" fill="#D27D5E">in seconds.</tspan>
  </text>
  <text font-family="Arial, Helvetica, sans-serif" font-size="23" fill="#5B6875">
    <tspan x="${PHOTO_W + 60}" y="${170 + 92 + 236}">AI previews, instant itemised costs</tspan>
    <tspan x="${PHOTO_W + 60}" y="${170 + 92 + 268}">and builder briefs for every room.</tspan>
  </text>
  <text x="${PHOTO_W + 60}" y="${H - 34}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#D27D5E">renoready.com.au</text>
</svg>`;

const img = sharp({ create: { width: W, height: H, channels: 3, background: "#F7F2EA" } })
  .composite([
    { input: before, left: 0, top: 0 },
    { input: after, left: half, top: 0 },
    { input: logo, left: PHOTO_W + 58, top: 150 - Math.round((logoMeta.height ?? 92) / 2) + 20 },
    { input: Buffer.from(text), left: 0, top: 0 },
  ])
  .jpeg({ quality: 86, mozjpeg: true });

const out = await img.toBuffer();
fs.writeFileSync("src/app/opengraph-image.jpg", out);
fs.writeFileSync("src/app/twitter-image.jpg", out);
const alt = "Reno Ready: a bathroom before and after an AI redesign, with the line “Design your dream renovation in seconds.”";
fs.writeFileSync("src/app/opengraph-image.alt.txt", alt);
fs.writeFileSync("src/app/twitter-image.alt.txt", alt);
console.log(`share image: ${W}x${H}, ${(out.length / 1024).toFixed(0)} KB`);
