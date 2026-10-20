/**
 * Free-preview watermark + image helpers (browser only).
 *
 * The preview panels show the watermark as an overlay (PreviewWatermark), so
 * it disappears the moment someone upgrades. Downloads made on the free tier
 * get the same watermark burned into the file with watermarkImage().
 */

export const WATERMARK_TEXT = "Reno Ready — Free Preview";

/** Diagonal tiles, as fractions of the image width */
const TILE_W = 0.34, TILE_H = 0.17, FONT = 0.026, ANGLE = -30;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

/** Draws the diagonal watermark over a w×h canvas */
export function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const tileW = w * TILE_W, tileH = w * TILE_H;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((ANGLE * Math.PI) / 180);
  ctx.font = `600 ${Math.max(12, Math.round(w * FONT))}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, w * 0.0018);
  ctx.strokeStyle = "rgba(0,0,0,0.16)";
  ctx.fillStyle = "rgba(255,255,255,0.34)";
  // cover the rotated canvas: the diagonal is the longest run
  const reach = Math.hypot(w, h);
  for (let y = -reach, row = 0; y <= reach; y += tileH, row++) {
    for (let x = -reach + (row % 2 ? tileW / 2 : 0); x <= reach; x += tileW) {
      ctx.strokeText(WATERMARK_TEXT, x, y);
      ctx.fillText(WATERMARK_TEXT, x, y);
    }
  }
  ctx.restore();
}

/** The image with the free-preview watermark burned in (JPEG data URL) */
export async function watermarkImage(src: string): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0);
  drawWatermark(ctx, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Re-encodes an image as JPEG at full size. 2K renders come back as large
 * PNGs; re-sending one for an edit would blow the 4.5 MB request limit.
 */
export async function toJpeg(src: string, quality = 0.92): Promise<string> {
  if (src.startsWith("data:image/jpeg")) return src;
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Saves an image; the free tier gets the watermarked copy */
export async function downloadImage(src: string, opts: { watermark: boolean; filename?: string }): Promise<void> {
  let href = opts.watermark ? await watermarkImage(src) : src;
  let revoke = false;
  if (!href.startsWith("data:")) {
    href = URL.createObjectURL(await (await fetch(href)).blob());
    revoke = true;
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = opts.filename ?? (opts.watermark ? "My-Reno-Ready-Design-Free-Preview.jpg" : "My-Reno-Ready-Design.png");
  a.click();
  if (revoke) setTimeout(() => URL.revokeObjectURL(href), 1_000);
}
