"use client";

/**
 * BrushMask — the "Not quite right?" highlighter.
 *
 * The client paints over the part of the render they want changed with a translucent
 * pink gel, so the image stays clearly visible underneath. Strokes are drawn opaque on
 * their own canvas and the whole layer is shown at reduced opacity, so overlapping
 * strokes stay one even tint instead of building up into an opaque blob.
 *
 * highlighted() returns the render with the painted area tinted (a JPEG data URL at the
 * image's own resolution), which is sent to the AI as the "change only this" reference.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export const BRUSH_COLOUR = "#FF2D95";
export const BRUSH_SIZES = { S: 16, M: 30, L: 52 } as const;
export type BrushSize = keyof typeof BRUSH_SIZES;

export interface BrushMaskHandle {
  undo:        () => void;
  clear:       () => void;
  /** The render with the painted area tinted, or null if nothing is painted */
  highlighted: () => Promise<string | null>;
}

type Point  = { x: number; y: number };
type Stroke = { size: number; points: Point[] };

const BrushMask = forwardRef<BrushMaskHandle, {
  imageUrl:  string;
  size:      BrushSize;
  onChange?: (strokes: number) => void;
}>(function BrushMask({ imageUrl, size, onChange }, ref) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes   = useRef<Stroke[]>([]);
  const drawing   = useRef<Stroke | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);

  // Points are stored in CSS pixels relative to the overlay, so a resize just redraws
  const redraw = useCallback(() => {
    const c = canvasRef.current, w = wrapRef.current;
    if (!c || !w) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = w.getBoundingClientRect();
    if (c.width !== Math.round(width * dpr) || c.height !== Math.round(height * dpr)) {
      c.width = Math.round(width * dpr); c.height = Math.round(height * dpr);
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = BRUSH_COLOUR; ctx.fillStyle = BRUSH_COLOUR;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const s of [...strokes.current, ...(drawing.current ? [drawing.current] : [])]) {
      ctx.lineWidth = s.size;
      if (s.points.length === 1) { ctx.beginPath(); ctx.arc(s.points[0].x, s.points[0].y, s.size / 2, 0, Math.PI * 2); ctx.fill(); continue; }
      ctx.beginPath();
      s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    redraw();
    const ro = new ResizeObserver(redraw);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [redraw]);

  const at = (e: React.PointerEvent): Point => {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  useImperativeHandle(ref, () => ({
    undo:  () => { strokes.current.pop(); redraw(); onChange?.(strokes.current.length); },
    clear: () => { strokes.current = []; redraw(); onChange?.(0); },
    highlighted: async () => {
      const mask = canvasRef.current, wrap = wrapRef.current;
      if (!mask || !wrap || strokes.current.length === 0) return null;
      const img = await new Promise<HTMLImageElement | null>((resolve) => {
        const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = imageUrl;
      });
      if (!img) return null;
      const { width: cw, height: ch } = wrap.getBoundingClientRect();
      const iw = img.naturalWidth, ih = img.naturalHeight;
      // the render is shown with object-fit: cover — map overlay pixels back onto the image
      const k = Math.max(cw / iw, ch / ih), offX = (cw - iw * k) / 2, offY = (ch - ih * k) / 2;
      const out = document.createElement("canvas"); out.width = iw; out.height = ih;
      const ctx = out.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 0.55;
      ctx.setTransform(1 / k, 0, 0, 1 / k, -offX / k, -offY / k);
      ctx.drawImage(mask, 0, 0, cw, ch);
      return out.toDataURL("image/jpeg", 0.9);
    },
  }), [imageUrl, onChange, redraw]);

  const r = BRUSH_SIZES[size];
  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 z-20 cursor-none"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = { size: r, points: [at(e)] };
        redraw();
      }}
      onPointerMove={(e) => {
        const p = at(e);
        setCursor(p);
        if (drawing.current) { drawing.current.points.push(p); redraw(); }
      }}
      onPointerUp={() => {
        if (drawing.current) { strokes.current.push(drawing.current); drawing.current = null; redraw(); onChange?.(strokes.current.length); }
      }}
      onPointerLeave={() => setCursor(null)}
      onPointerCancel={() => { drawing.current = null; redraw(); }}
    >
      {/* one even, see-through tint for every stroke */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0.42, mixBlendMode: "normal" }} />
      {cursor && (
        <span
          className="pointer-events-none absolute rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: cursor.x - r / 2, top: cursor.y - r / 2, width: r, height: r, background: `${BRUSH_COLOUR}33` }}
        />
      )}
    </div>
  );
});

export default BrushMask;
