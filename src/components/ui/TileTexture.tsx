"use client";

/**
 * TileTexture — renders a procedural SVG tile texture for any tile ID.
 *
 * All patterns use a 100×100 viewBox and scale via the `size` prop.
 * Used at:
 *   - 64px  in TileCard thumbnails
 *   - 300px in TileModal lightbox
 */

interface Props {
  tileId:    string;
  size?:     number;
  className?: string;
  style?:    React.CSSProperties;
}

export default function TileTexture({ tileId, size = 64, className, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", ...style }}
      aria-hidden="true"
    >
      {pattern(tileId)}
    </svg>
  );
}

// ── Pattern selector ──────────────────────────────────────────────
function pattern(id: string) {
  switch (id) {
    // ── Floor tiles ──
    case "travertine":      return <Travertine />;
    case "desert-stone":    return <DesertStone />;
    case "charcoal-slate":  return <CharcoalSlate />;
    case "zellige-ivory":   return <ZelligeIvory />;
    case "terrazzo-blanc":  return <TerrazzoStyle fill="#F5F4EF" chips={[
      { cx:14, cy:18, rx:6, ry:4,  rot:30,  fill:"#C49898" },
      { cx:46, cy:11, rx:4, ry:6,  rot:-20, fill:"#8C9C8C" },
      { cx:76, cy:32, rx:5, ry:3,  rot:45,  fill:"#D4B880" },
      { cx:24, cy:56, rx:3, ry:5,  rot:15,  fill:"#6C7C8C" },
      { cx:62, cy:67, rx:6, ry:3,  rot:-30, fill:"#A4A898" },
      { cx:86, cy:79, rx:4, ry:5,  rot:60,  fill:"#C8A898" },
      { cx:34, cy:86, rx:5, ry:3,  rot:-45, fill:"#9898A8" },
      { cx:70, cy:91, rx:3, ry:4,  rot:20,  fill:"#B0C0A8" },
      { cx:91, cy:46, rx:4, ry:3,  rot:-15, fill:"#D0A880" },
      { cx:10, cy:81, rx:3, ry:5,  rot:40,  fill:"#A89898" },
    ]} />;
    case "honed-limestone": return <HonedLimestone />;
    case "natural-oak":     return <NaturalOak />;
    case "matte-slate-lg":  return <MatteSlateLG />;
    // ── Wall tiles ──
    case "marble-blanc":       return <MarbleBlanc />;
    case "sage-subway":        return <SageSubway />;
    case "terracotta-feature": return <TerracottaFeature />;
    case "zellige-white":      return <ZelligeGrid fill="#F4F0E4" grout="#C8C0A8" />;
    case "zellige-sage":       return <ZelligeGrid fill="#7A9E7A" grout="#5A7E5A" />;
    case "fluted-white":       return <FlutedWhite />;
    case "coastal-terrazzo":   return <TerrazzoStyle fill="#D4B890" chips={[
      { cx:12, cy:22, rx:5, ry:3,  rot:25,  fill:"#A08060" },
      { cx:48, cy:14, rx:4, ry:5,  rot:-30, fill:"#706050" },
      { cx:74, cy:38, rx:6, ry:3,  rot:50,  fill:"#8C7860" },
      { cx:22, cy:60, rx:3, ry:5,  rot:10,  fill:"#B0A888" },
      { cx:60, cy:72, rx:5, ry:3,  rot:-40, fill:"#907060" },
      { cx:88, cy:82, rx:4, ry:4,  rot:65,  fill:"#786050" },
      { cx:36, cy:88, rx:5, ry:3,  rot:-20, fill:"#9A8870" },
      { cx:72, cy:90, rx:3, ry:4,  rot:35,  fill:"#A09080" },
      { cx:92, cy:50, rx:4, ry:3,  rot:-10, fill:"#B0A070" },
    ]} />;
    case "smoked-concrete":   return <SmokedConcrete />;
    // ── Tile layout / style patterns ──
    case "vertical-stack":    return <LayoutVerticalStack />;
    case "herringbone":       return <LayoutHerringbone />;
    case "terrazzo":          return <TerrazzoStyle fill="#F5F4EF" chips={[
      { cx:14, cy:18, rx:6, ry:4,  rot:30,  fill:"#C49898" },
      { cx:46, cy:11, rx:4, ry:6,  rot:-20, fill:"#8C9C8C" },
      { cx:76, cy:32, rx:5, ry:3,  rot:45,  fill:"#D4B880" },
      { cx:24, cy:56, rx:3, ry:5,  rot:15,  fill:"#6C7C8C" },
      { cx:62, cy:67, rx:6, ry:3,  rot:-30, fill:"#A4A898" },
      { cx:86, cy:79, rx:4, ry:5,  rot:60,  fill:"#C8A898" },
      { cx:34, cy:86, rx:5, ry:3,  rot:-45, fill:"#9898A8" },
      { cx:70, cy:91, rx:3, ry:4,  rot:20,  fill:"#B0C0A8" },
      { cx:91, cy:46, rx:4, ry:3,  rot:-15, fill:"#D0A880" },
      { cx:10, cy:81, rx:3, ry:5,  rot:40,  fill:"#A89898" },
    ]} />;
    case "zellige":           return <ZelligeGrid fill="#F0E8CC" grout="#B8A888" />;
    case "large-format":      return <LayoutLargeFormat />;
    case "penny-rounds":      return <LayoutPennyRounds />;
    case "checkerboard":      return <LayoutCheckerboard />;
    case "honed-travertine":  return <LayoutHonedTravertine />;
    default:                  return <FallbackPattern />;
  }
}

// ══════════════════════════════════════════════════════════════════
// FLOOR TILE PATTERNS
// ══════════════════════════════════════════════════════════════════

function Travertine() {
  return (
    <>
      <rect width="100" height="100" fill="#E4CFAA" />
      {/* Horizontal travertine banding */}
      <path d="M0 20 Q25 17 50 22 Q75 26 100 20" stroke="#C8AD80" strokeWidth="2.5" fill="none" opacity="0.65" />
      <path d="M0 38 Q30 35 60 41 Q82 45 100 38" stroke="#BCA070" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M0 56 Q20 59 50 54 Q77 50 100 57" stroke="#C8B080" strokeWidth="2" fill="none" opacity="0.55" />
      <path d="M0 74 Q38 71 68 76 Q86 78 100 73" stroke="#B8A070" strokeWidth="1.2" fill="none" opacity="0.4" />
      <path d="M0 88 Q45 86 75 90 Q90 91 100 88" stroke="#CAAC78" strokeWidth="1" fill="none" opacity="0.35" />
      {/* Natural pore marks */}
      <circle cx="14" cy="30" r="1.5" fill="#A08060" opacity="0.4" />
      <circle cx="72" cy="48" r="1"   fill="#A08060" opacity="0.35" />
      <circle cx="41" cy="66" r="1.5" fill="#A08060" opacity="0.3" />
      <circle cx="87" cy="82" r="1"   fill="#A08060" opacity="0.3" />
      <circle cx="58" cy="22" r="1"   fill="#A08060" opacity="0.25" />
    </>
  );
}

function DesertStone() {
  return (
    <>
      <rect width="100" height="100" fill="#C8A060" />
      {/* Sandy variation patches */}
      <ellipse cx="25" cy="30" rx="20" ry="15" fill="#B89050" opacity="0.45" />
      <ellipse cx="72" cy="20" rx="18" ry="12" fill="#D4A860" opacity="0.35" />
      <ellipse cx="55" cy="65" rx="22" ry="14" fill="#B08848" opacity="0.4" />
      <ellipse cx="15" cy="78" rx="14" ry="10" fill="#D0A458" opacity="0.3" />
      <ellipse cx="84" cy="60" rx="16" ry="18" fill="#BCA060" opacity="0.35" />
      {/* Gritty texture dots */}
      <circle cx="40" cy="15" r="1.5" fill="#987040" opacity="0.5" />
      <circle cx="80" cy="40" r="1"   fill="#987040" opacity="0.4" />
      <circle cx="20" cy="55" r="1.5" fill="#987040" opacity="0.45" />
      <circle cx="65" cy="80" r="1"   fill="#987040" opacity="0.4" />
      <circle cx="90" cy="88" r="1.5" fill="#987040" opacity="0.35" />
      {/* Subtle grain lines */}
      <path d="M0 50 Q50 48 100 52" stroke="#A87840" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M0 75 Q50 72 100 76" stroke="#A87840" strokeWidth="0.5" fill="none" opacity="0.25" />
    </>
  );
}

function CharcoalSlate() {
  return (
    <>
      <rect width="100" height="100" fill="#3A4552" />
      {/* Cleavage planes — angular split lines */}
      <path d="M0 28 L100 24"     stroke="#5A6878" strokeWidth="1"   opacity="0.65" />
      <path d="M0 52 L100 49"     stroke="#4A5868" strokeWidth="0.7" opacity="0.5" />
      <path d="M0 74 L100 77"     stroke="#5A6878" strokeWidth="1"   opacity="0.55" />
      <path d="M0 88 L100 86"     stroke="#4A5868" strokeWidth="0.5" opacity="0.4" />
      {/* Diagonal micro-fractures */}
      <path d="M22 0 L18 100"     stroke="#506070" strokeWidth="0.4" opacity="0.3" />
      <path d="M65 0 L70 100"     stroke="#4A5868" strokeWidth="0.4" opacity="0.25" />
      <path d="M82 0 L78 60"      stroke="#556070" strokeWidth="0.3" opacity="0.2" />
      {/* Surface glint */}
      <rect x="0" y="0" width="100" height="12" fill="#4A5868" opacity="0.2" />
      <circle cx="35" cy="60" r="2" fill="#7A8898" opacity="0.15" />
    </>
  );
}

function ZelligeIvory() {
  // Hand-drawn irregular tile grid — cream
  const grout = "#B8A888";
  const base  = "#F0E8CC";
  return (
    <>
      <rect width="100" height="100" fill={grout} />
      {/* Each "tile" is a slightly imperfect rect */}
      {[
        [2,2,30,30], [34,1,30,31], [66,3,32,29],
        [1,34,31,31], [33,33,32,32], [67,34,31,30],
        [3,67,29,31], [34,66,31,32], [67,67,32,31],
      ].map(([x,y,w,h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={base}
              opacity={0.85 + (i % 3) * 0.05} rx="0.5" />
      ))}
      {/* Slight glaze variation */}
      <rect x="2"  y="2"  width="30" height="30" fill="#F8F0DC" opacity="0.3" rx="0.5" />
      <rect x="67" y="34" width="31" height="30" fill="#EAE0C4" opacity="0.25" rx="0.5" />
      <rect x="34" y="66" width="31" height="32" fill="#F4ECD4" opacity="0.3" rx="0.5" />
    </>
  );
}

interface Chip { cx:number; cy:number; rx:number; ry:number; rot:number; fill:string; }
function TerrazzoStyle({ fill, chips }: { fill: string; chips: Chip[] }) {
  return (
    <>
      <rect width="100" height="100" fill={fill} />
      {chips.map((c, i) => (
        <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry}
                 fill={c.fill} opacity={0.65 + (i % 3) * 0.08}
                 transform={`rotate(${c.rot} ${c.cx} ${c.cy})`} />
      ))}
    </>
  );
}

function HonedLimestone() {
  return (
    <>
      <rect width="100" height="100" fill="#EAE0CC" />
      {/* Very subtle fossil-like marks */}
      <path d="M15 40 Q25 38 30 42 Q35 46 25 48 Q15 50 10 46 Q5 42 15 40Z"
            stroke="#CEC0A4" strokeWidth="0.8" fill="none" opacity="0.45" />
      <path d="M60 20 Q70 18 74 23 Q78 28 68 30 Q58 32 55 27 Q52 22 60 20Z"
            stroke="#CEC0A4" strokeWidth="0.8" fill="none" opacity="0.35" />
      <path d="M70 65 Q80 63 84 68 Q88 73 78 75 Q68 77 64 72 Q60 67 70 65Z"
            stroke="#CEC0A4" strokeWidth="0.8" fill="none" opacity="0.4" />
      {/* Subtle surface variation */}
      <rect x="0" y="0" width="100" height="100" fill="#D8CEB4" opacity="0.12" />
      {/* Fine parallel scoring */}
      <path d="M0 33 Q50 31 100 34" stroke="#D0C4A8" strokeWidth="0.4" fill="none" opacity="0.3" />
      <path d="M0 66 Q50 64 100 67" stroke="#D0C4A8" strokeWidth="0.4" fill="none" opacity="0.3" />
    </>
  );
}

function NaturalOak() {
  // Horizontal wood grain
  const grains = [8,14,19,25,30,37,43,50,56,62,68,74,80,87,93];
  const colors = ["#C09050","#B88848","#C89858","#B08040","#C89050","#B88848","#C09050","#B88040","#C89858","#B89048","#C49050","#B08040","#C89858","#C09050","#B88040"];
  return (
    <>
      <rect width="100" height="100" fill="#C8A060" />
      {grains.map((y, i) => (
        <path key={i}
          d={`M0 ${y} Q${20 + i*3} ${y + (i%2===0?-1:1)} ${50} ${y} Q${70 - i*2} ${y + (i%2===0?1:-1)} 100 ${y}`}
          stroke={colors[i]} strokeWidth={i%3===0 ? 1.5 : 0.8} fill="none" opacity={0.6 + (i%2)*0.1}
        />
      ))}
      {/* Knot */}
      <ellipse cx="30" cy="55" rx="8" ry="5" stroke="#906030" strokeWidth="1" fill="none" opacity="0.4" />
      <ellipse cx="30" cy="55" rx="4" ry="2.5" stroke="#906030" strokeWidth="0.8" fill="none" opacity="0.3" />
    </>
  );
}

function MatteSlateLG() {
  // Large-format tile: single grout line cross showing two-tile join
  return (
    <>
      <rect width="100" height="100" fill="#8090A0" />
      {/* Subtle surface gradation */}
      <rect x="0"  y="0"  width="49" height="100" fill="#7A8898" opacity="0.2" />
      <rect x="51" y="0"  width="49" height="100" fill="#8898A8" opacity="0.15" />
      {/* Grout lines — thin, precise */}
      <rect x="49" y="0"  width="2"  height="100" fill="#606878" />
      <rect x="0"  y="49" width="100" height="2"  fill="#606878" />
      {/* Micro surface texture */}
      <path d="M5 20 Q25 18 45 21"  stroke="#6A7888" strokeWidth="0.4" fill="none" opacity="0.4" />
      <path d="M55 35 Q75 33 95 36" stroke="#6A7888" strokeWidth="0.4" fill="none" opacity="0.4" />
      <path d="M5 70 Q25 68 45 71"  stroke="#6A7888" strokeWidth="0.4" fill="none" opacity="0.35" />
      <path d="M55 82 Q75 80 95 83" stroke="#6A7888" strokeWidth="0.4" fill="none" opacity="0.35" />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// WALL TILE PATTERNS
// ══════════════════════════════════════════════════════════════════

function MarbleBlanc() {
  return (
    <>
      <rect width="100" height="100" fill="#F8F6F4" />
      {/* Primary vein */}
      <path d="M8 0 Q28 18 24 38 Q20 58 38 78 Q52 94 68 100"
            stroke="#C0BCB4" strokeWidth="2.5" fill="none" opacity="0.6" />
      {/* Secondary veins */}
      <path d="M18 0 Q34 14 28 32 Q22 52 36 72"
            stroke="#D0CCC4" strokeWidth="1.2" fill="none" opacity="0.4" />
      <path d="M62 0 Q52 28 66 48 Q76 64 66 100"
            stroke="#B8B4AC" strokeWidth="1.5" fill="none" opacity="0.3" />
      {/* Fine capillaries */}
      <path d="M30 18 Q40 22 50 18 Q56 16 62 24"
            stroke="#C8C4BC" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M24 55 Q36 58 46 54 Q52 52 58 60"
            stroke="#C0BCB4" strokeWidth="0.5" fill="none" opacity="0.4" />
      <path d="M45 72 Q55 75 65 70"
            stroke="#C8C4BC" strokeWidth="0.5" fill="none" opacity="0.35" />
    </>
  );
}

function SageSubway() {
  // Brick/subway tile pattern in sage green
  const TILE_H = 20;
  const TILE_W = 40;
  const base   = "#8AAD88";
  const grout  = "#6A8D68";
  const glaze  = "#9EC09C";
  return (
    <>
      <rect width="100" height="100" fill={grout} />
      {/* Row 0 (offset 0) */}
      {[0, 42].map((x) => <rect key={`r0-${x}`} x={x+1} y={1}  width={TILE_W-2} height={TILE_H-2} fill={base} rx="0.5" />)}
      <rect x="83" y="1"   width="16" height={TILE_H-2} fill={base} rx="0.5" />
      {/* Row 1 (offset -20) */}
      <rect x="1"  y="21" width="20" height={TILE_H-2} fill={base} rx="0.5" />
      {[22, 64].map((x) => <rect key={`r1-${x}`} x={x} y={21} width={TILE_W-2} height={TILE_H-2} fill={base} rx="0.5" />)}
      {/* Row 2 */}
      {[0, 42].map((x) => <rect key={`r2-${x}`} x={x+1} y={41} width={TILE_W-2} height={TILE_H-2} fill={base} rx="0.5" />)}
      <rect x="83" y="41"  width="16" height={TILE_H-2} fill={base} rx="0.5" />
      {/* Row 3 */}
      <rect x="1"  y="61" width="20" height={TILE_H-2} fill={base} rx="0.5" />
      {[22, 64].map((x) => <rect key={`r3-${x}`} x={x} y={61} width={TILE_W-2} height={TILE_H-2} fill={base} rx="0.5" />)}
      {/* Row 4 */}
      {[0, 42].map((x) => <rect key={`r4-${x}`} x={x+1} y={81} width={TILE_W-2} height={TILE_H-2} fill={base} rx="0.5" />)}
      <rect x="83" y="81"  width="16" height={TILE_H-2} fill={base} rx="0.5" />
      {/* Glaze highlight on a few tiles */}
      <rect x="1"  y="1"  width="38" height="6" fill={glaze} opacity="0.25" rx="0.5" />
      <rect x="22" y="61" width="40" height="5" fill={glaze} opacity="0.2"  rx="0.5" />
    </>
  );
}

function TerracottaFeature() {
  return (
    <>
      <rect width="100" height="100" fill="#B85C38" />
      {/* Natural clay surface variation */}
      <ellipse cx="30" cy="25" rx="22" ry="18" fill="#C86840" opacity="0.35" />
      <ellipse cx="75" cy="45" rx="18" ry="22" fill="#A85030" opacity="0.3" />
      <ellipse cx="40" cy="75" rx="20" ry="16" fill="#C06040" opacity="0.35" />
      <ellipse cx="80" cy="80" rx="14" ry="12" fill="#A84E2C" opacity="0.25" />
      {/* Fine surface cracks — natural clay character */}
      <path d="M10 50 Q30 48 40 52 Q50 55 45 60" stroke="#903C20" strokeWidth="0.5" fill="none" opacity="0.4" />
      <path d="M60 20 Q70 25 75 20 Q80 15 85 22" stroke="#903C20" strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* Slight sheen band */}
      <rect x="0" y="0" width="100" height="20" fill="#D06840" opacity="0.2" />
    </>
  );
}

function ZelligeGrid({ fill, grout }: { fill: string; grout: string }) {
  // Irregular hand-glazed tile grid
  const tiles = [
    [2,2,29,29], [33,1,31,30], [66,3,32,28],
    [1,33,30,31], [33,33,32,31], [67,33,31,31],
    [2,66,28,32], [32,65,32,33], [66,67,32,31],
  ];
  return (
    <>
      <rect width="100" height="100" fill={grout} />
      {tiles.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill}
              opacity={0.82 + (i % 4) * 0.04} rx="0.5" />
      ))}
      {/* Glaze shimmer on random tiles */}
      <rect x="2"  y="2"  width="29" height="10" fill="rgba(255,255,255,0.18)" rx="0.5" />
      <rect x="67" y="33" width="31" height="8"  fill="rgba(255,255,255,0.14)" rx="0.5" />
      <rect x="32" y="65" width="32" height="10" fill="rgba(255,255,255,0.15)" rx="0.5" />
    </>
  );
}

function FlutedWhite() {
  // Vertical ribbed / fluted ceramic
  const ridgeColor  = "#EEECEA";
  const valleyColor = "#D4D0CA";
  const ridgeW = 11;
  return (
    <>
      <rect width="100" height="100" fill={ridgeColor} />
      {/* Alternating ridge valleys */}
      {[0,1,2,3,4,5,6,7,8].map((i) => (
        <rect key={i}
          x={i * ridgeW}
          y={0}
          width={ridgeW * 0.45}
          height={100}
          fill={valleyColor}
          opacity={0.65}
        />
      ))}
      {/* Subtle glaze highlight on ridge crowns */}
      {[0,1,2,3,4,5,6,7,8].map((i) => (
        <rect key={`h${i}`}
          x={i * ridgeW + ridgeW * 0.45 + 1}
          y={0}
          width={2}
          height={100}
          fill="rgba(255,255,255,0.5)"
          opacity={0.6}
        />
      ))}
    </>
  );
}

function SmokedConcrete() {
  return (
    <>
      <rect width="100" height="100" fill="#8A8E94" />
      {/* Subtle tonal variation */}
      <rect x="0"  y="0"  width="100" height="50" fill="#848890" opacity="0.35" />
      <rect x="0"  y="50" width="100" height="50" fill="#909498" opacity="0.25" />
      {/* Concrete aggregate marks */}
      <circle cx="15" cy="22" r="2"   fill="#787C82" opacity="0.4" />
      <circle cx="60" cy="10" r="1.5" fill="#787C82" opacity="0.35" />
      <circle cx="82" cy="35" r="2"   fill="#787C82" opacity="0.4" />
      <circle cx="25" cy="65" r="1.5" fill="#787C82" opacity="0.3" />
      <circle cx="70" cy="80" r="2"   fill="#787C82" opacity="0.4" />
      <circle cx="45" cy="90" r="1.5" fill="#787C82" opacity="0.3" />
      {/* Fine form-work lines */}
      <path d="M0 33 L100 33" stroke="#807882" strokeWidth="0.4" opacity="0.3" />
      <path d="M0 66 L100 66" stroke="#807882" strokeWidth="0.4" opacity="0.3" />
      {/* Subtle smoke tonal wash */}
      <rect x="0" y="0" width="100" height="100" fill="#6A6E72" opacity="0.1" />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// TILE LAYOUT / STYLE PATTERNS
// ══════════════════════════════════════════════════════════════════

function LayoutVerticalStack() {
  // Portrait-oriented brick tiles in vertical stack bond
  const base  = "#F0EBE3";
  const grout = "#C8BFB0";
  // Columns of tall portrait tiles, stacked vertically (no offset)
  const cols = [0, 25, 50, 75];
  const rows = [0, 34, 68];
  return (
    <>
      <rect width="100" height="100" fill={grout} />
      {cols.map((x) =>
        rows.map((y, ri) => (
          <rect key={`${x}-${ri}`}
            x={x + 1} y={y + 1} width={22} height={31}
            fill={base} rx="0.5"
            opacity={0.88 + (ri % 2) * 0.05}
          />
        ))
      )}
      {/* Subtle highlight on top edge of each tile */}
      {cols.map((x) =>
        rows.map((y, ri) => (
          <rect key={`h${x}-${ri}`}
            x={x + 1} y={y + 1} width={22} height={4}
            fill="rgba(255,255,255,0.3)" rx="0.5"
          />
        ))
      )}
    </>
  );
}

function LayoutHerringbone() {
  // Classic 45° herringbone brick pattern
  const base  = "#EDE5D8";
  const dark  = "#D4C8B8";
  const grout = "#B8AD9E";
  return (
    <>
      <rect width="100" height="100" fill={grout} />
      {/* Herringbone = pairs of rotated bricks. Each brick 20×9px. */}
      {/* Row A — /  direction */}
      {[[-10,0],[10,0],[30,0],[50,0],[70,0],[90,0],[-10,40],[10,40],[30,40],[50,40],[70,40],[90,40],[-10,80],[10,80],[30,80],[50,80],[70,80],[90,80]].map(([x, y], i) => (
        <g key={`a${i}`} transform={`translate(${x + 10},${y + 5}) rotate(45)`}>
          <rect x={-10} y={-4} width={20} height={8} fill={base} rx="0.4" opacity="0.9" />
        </g>
      ))}
      {/* Row B — \  direction */}
      {[[0,20],[20,20],[40,20],[60,20],[80,20],[100,20],[0,60],[20,60],[40,60],[60,60],[80,60],[100,60],[0,100],[20,100],[40,100],[60,100],[80,100]].map(([x, y], i) => (
        <g key={`b${i}`} transform={`translate(${x},${y}) rotate(-45)`}>
          <rect x={-10} y={-4} width={20} height={8} fill={dark} rx="0.4" opacity="0.85" />
        </g>
      ))}
    </>
  );
}

function LayoutLargeFormat() {
  // Two large-format stone tiles with very thin grout lines
  const base  = "#DDD6C8";
  const grout = "#A8A098";
  return (
    <>
      <rect width="100" height="100" fill={base} />
      {/* 2×2 large tiles */}
      <rect x="0"  y="0"  width="49" height="49" fill="#E2DBCD" opacity="0.6" />
      <rect x="51" y="0"  width="49" height="49" fill="#D8D0C2" opacity="0.5" />
      <rect x="0"  y="51" width="49" height="49" fill="#D4CCC0" opacity="0.55" />
      <rect x="51" y="51" width="49" height="49" fill="#DDD6C8" opacity="0.5" />
      {/* Hairline grout */}
      <rect x="49" y="0"   width="2" height="100" fill={grout} />
      <rect x="0"  y="49"  width="100" height="2" fill={grout} />
      {/* Subtle stone veining on top-left tile */}
      <path d="M5 15 Q18 20 22 35 Q26 50 38 48" stroke="#B8B0A0" strokeWidth="1" fill="none" opacity="0.4" />
      {/* Veining on bottom-right tile */}
      <path d="M60 65 Q72 70 78 82 Q84 90 95 88" stroke="#B0A898" strokeWidth="0.8" fill="none" opacity="0.35" />
    </>
  );
}

function LayoutPennyRounds() {
  // Penny-round mosaic in honeycomb arrangement
  const fill  = "#E8E0D0";
  const grout = "#B0A898";
  const r = 7.5;
  // Honeycomb grid — offset every other row
  const rows = [
    { y: 8,  xs: [8, 23, 38, 53, 68, 83, 98] },
    { y: 21, xs: [0, 15, 30, 45, 60, 75, 90] },
    { y: 34, xs: [8, 23, 38, 53, 68, 83, 98] },
    { y: 47, xs: [0, 15, 30, 45, 60, 75, 90] },
    { y: 60, xs: [8, 23, 38, 53, 68, 83, 98] },
    { y: 73, xs: [0, 15, 30, 45, 60, 75, 90] },
    { y: 86, xs: [8, 23, 38, 53, 68, 83, 98] },
    { y: 99, xs: [0, 15, 30, 45, 60, 75, 90] },
  ];
  return (
    <>
      <rect width="100" height="100" fill={grout} />
      {rows.map(({ y, xs }) =>
        xs.map((x, i) => (
          <circle key={`${y}-${i}`} cx={x} cy={y} r={r}
            fill={fill} opacity={0.85 + (i % 3) * 0.05}
          />
        ))
      )}
      {/* Highlight glaze on some pennies */}
      {[[8,8],[53,21],[23,60],[75,73]].map(([cx,cy], i) => (
        <circle key={`g${i}`} cx={cx} cy={cy} r={r * 0.5}
          fill="rgba(255,255,255,0.3)" opacity="0.6"
        />
      ))}
    </>
  );
}

function LayoutCheckerboard() {
  // Two-tone checkerboard — crisp and geometric
  const light = "#F0EBE3";
  const dark  = "#3A4552";
  const sz    = 20;
  const squares = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      squares.push({ x: col * sz, y: row * sz, dark: (row + col) % 2 === 1 });
    }
  }
  return (
    <>
      <rect width="100" height="100" fill={light} />
      {squares.map(({ x, y, dark: isDark }, i) =>
        isDark ? <rect key={i} x={x} y={y} width={sz} height={sz} fill={dark} /> : null
      )}
      {/* Subtle gloss on light squares */}
      <rect x="20" y="0"  width="20" height="6" fill="rgba(255,255,255,0.2)" />
      <rect x="0"  y="20" width="20" height="6" fill="rgba(255,255,255,0.2)" />
      <rect x="40" y="40" width="20" height="6" fill="rgba(255,255,255,0.2)" />
    </>
  );
}

function LayoutHonedTravertine() {
  // Honed travertine — matte finish with unfilled natural voids
  return (
    <>
      <rect width="100" height="100" fill="#DED2BA" />
      {/* Horizontal banding */}
      <path d="M0 22 Q30 19 60 24 Q80 27 100 22" stroke="#C4B498" strokeWidth="2" fill="none" opacity="0.55" />
      <path d="M0 45 Q25 43 55 47 Q78 50 100 45" stroke="#B8A888" strokeWidth="1.5" fill="none" opacity="0.45" />
      <path d="M0 68 Q35 65 65 70 Q85 73 100 68" stroke="#C4B498" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M0 88 Q40 86 75 90 Q90 91 100 88" stroke="#B8A888" strokeWidth="1" fill="none" opacity="0.35" />
      {/* Unfilled voids — the defining feature of honed travertine */}
      <ellipse cx="18" cy="33" rx="3"   ry="1.5" fill="#A89070" opacity="0.55" />
      <ellipse cx="55" cy="15" rx="2.5" ry="1"   fill="#A89070" opacity="0.5" />
      <ellipse cx="78" cy="55" rx="3.5" ry="1.5" fill="#A89070" opacity="0.5" />
      <ellipse cx="35" cy="78" rx="2"   ry="1"   fill="#A89070" opacity="0.45" />
      <ellipse cx="68" cy="82" rx="3"   ry="1.5" fill="#A89070" opacity="0.5" />
      <ellipse cx="90" cy="38" rx="2.5" ry="1"   fill="#A89070" opacity="0.45" />
      <ellipse cx="12" cy="60" rx="2"   ry="1.2" fill="#A89070" opacity="0.45" />
      {/* Matte surface — no sheen overlay */}
    </>
  );
}

function FallbackPattern() {
  return <rect width="100" height="100" fill="#E8E0D0" />;
}
