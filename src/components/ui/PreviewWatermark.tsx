"use client";

/**
 * PreviewWatermark — the diagonal "Reno Ready — Free Preview" overlay on
 * free-tier renders. Sits on top of the image (pointer-events: none) so it
 * vanishes as soon as the account upgrades. Optional "Remove watermark"
 * button opens the upgrade pop-up.
 */

import { useId } from "react";
import { Lock } from "lucide-react";
import { WATERMARK_TEXT } from "@/lib/watermark";

export default function PreviewWatermark({ onUpgrade }: { onUpgrade?: () => void }) {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <svg aria-hidden className="pointer-events-none absolute inset-0 z-[5] h-full w-full select-none" data-watermark>
        <defs>
          <pattern id={`wm-${id}`} width="280" height="140" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
            {[[140, 40], [0, 110], [280, 110]].map(([x, y]) => (
              <text
                key={`${x}-${y}`} x={x} y={y} textAnchor="middle"
                fontSize="15" fontWeight="600" letterSpacing="0.04em"
                fill="rgba(255,255,255,0.36)" stroke="rgba(0,0,0,0.16)" strokeWidth="0.6"
                style={{ paintOrder: "stroke", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
              >
                {WATERMARK_TEXT}
              </text>
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#wm-${id})`} />
      </svg>
      {onUpgrade && (
        <button
          type="button"
          onClick={onUpgrade}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur-md transition-colors hover:bg-black/75"
        >
          <Lock size={11} /> Remove watermark
        </button>
      )}
    </>
  );
}
