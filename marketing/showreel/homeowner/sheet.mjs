// Contact sheet of review stills: node homeowner/sheet.mjs out.jpg a.jpg b.jpg ...
import sharp from "sharp";
const [out, ...files] = process.argv.slice(2);
const W = 360, H = 640, cols = Math.min(7, files.length), rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(files.map((f) => sharp(f).resize(W, H).toBuffer()));
await sharp({ create: { width: cols * W, height: rows * H, channels: 3, background: "#000" } })
  .composite(tiles.map((input, i) => ({ input, left: (i % cols) * W, top: Math.floor(i / cols) * H }))).jpeg({ quality: 85 }).toFile(out);
