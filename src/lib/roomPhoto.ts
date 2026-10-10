/**
 * Turns an uploaded file (or a sample image URL) into the JPEG data URL the
 * generation pipeline expects in `roomPhotoUrl`.
 *
 * Every path into Step 1 goes through here, so uploads and samples reach
 * /api/generate in the same shape. Failures throw an Error whose message is
 * safe to show to the user.
 */

import type { RoomType } from "./roomTypes";

/** Longest edge sent to the model; larger photos are scaled down */
const MAX_EDGE = 1280;
/** Phone photos are rarely over 15 MB; anything much bigger is probably not a photo */
const MAX_BYTES = 30 * 1024 * 1024;

export const SAMPLE_ROOMS: Record<RoomType, { src: string; label: string }> = {
  bathroom: { src: "/samples/bathroom.jpg", label: "Dated family bathroom" },
  kitchen:  { src: "/samples/kitchen.jpg",  label: "’90s timber kitchen" },
  bedroom:  { src: "/samples/bedroom.jpg",  label: "Spare bedroom" },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = src;
  });
}

export async function toRoomPhotoDataUrl(source: File | string): Promise<string> {
  let src = typeof source === "string" ? source : "";
  let objectUrl: string | null = null;

  if (typeof source !== "string") {
    const isHeic = /\.hei[cf]$/i.test(source.name) || /image\/hei[cf]/i.test(source.type);
    if (!source.type.startsWith("image/") && !isHeic) {
      throw new Error("That file isn't a photo. Please choose a JPG, PNG or WEBP image.");
    }
    if (source.size > MAX_BYTES) {
      throw new Error("That photo is too large. Please choose one under 30 MB.");
    }
    objectUrl = URL.createObjectURL(source);
    src = objectUrl;
  }

  try {
    let img: HTMLImageElement;
    try {
      img = await loadImage(src);
    } catch {
      throw new Error(
        typeof source === "string"
          ? "The sample room didn't load. Please check your connection and try again."
          : "We couldn't open that photo. Please try a JPG or PNG (iPhone HEIC photos may need converting first).",
      );
    }

    const scale  = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width  = Math.max(1, Math.round(img.naturalWidth  * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser couldn't process the photo. Please try another browser.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
