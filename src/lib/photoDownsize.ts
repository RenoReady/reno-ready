"use client";

/**
 * Reads a photo the person picked and shrinks it to a JPEG at most 1280px on
 * its longest side: what the design tool works with, and small enough to send
 * from a phone to a computer quickly. Rejects with a message to show them.
 */
export function downsizePhoto(file: File, max = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type && !file.type.startsWith("image/")) {
      reject(new Error("That file isn't a photo. Please choose a JPG, PNG or HEIC image."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("We couldn't read that photo. Please try another one."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("We couldn't open that photo. Please try a JPG or PNG."));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx || !canvas.width || !canvas.height) { reject(new Error("We couldn't process that photo. Please try another one.")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
