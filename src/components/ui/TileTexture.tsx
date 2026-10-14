/**
 * TileTexture — the photo-style swatch for a tile material or tile layout.
 *
 * Swatches are pre-rendered 400 × 400 WebP images in /public/tiles, generated
 * by marketing/tiles/tiles.mjs (procedural textures, grout, bevels and studio
 * lighting). Re-run that script after adding a tile id.
 *
 * Used at ~80px in the tile pickers and ~300px in the tile detail modal.
 */

interface Props {
  tileId:     string;
  /** Rendered size hint in CSS px (the layout usually stretches it to fill) */
  size?:      number;
  className?: string;
  style?:     React.CSSProperties;
}

export default function TileTexture({ tileId, size = 64, className, style }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/tiles/${tileId}.webp`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={className}
      style={{ display: "block", objectFit: "cover", ...style }}
    />
  );
}
