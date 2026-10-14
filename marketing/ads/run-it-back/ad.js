// Reno Ready — "Run It Back" 30s ad. renderFrame(t) draws the frame at time t (seconds).
const $ = (id) => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const easeIn = (p) => p * p;
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeBack = (p) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };

const INK = "#1d1d1f", TERRA = "#D27D5E", PAPER = "#F4EEE3";

// ── Timeline (seconds) ─────────────────────────────────────────────
const T = { s1: 0, s2: 4.5, s3: 7.9, s4: 11.6, s5: 14.2, s6: 15.1, s7: 20.4, s8: 23.7, end: 30 };

// ── Element pop helpers ────────────────────────────────────────────
function pop(el, t, at, dur = 0.28, from = 1.35) {
  const p = prog(t, at, at + dur);
  el.style.opacity = t < at ? 0 : Math.min(1, p * 2.5);
  el.style.transform = `scale(${lerp(from, 1, easeOut(p))})`;
}
function popBack(el, t, at, dur = 0.35, extra = "") {
  const p = prog(t, at, at + dur);
  el.style.opacity = t < at ? 0 : Math.min(1, p * 3);
  el.style.transform = `${extra} scale(${t < at ? 0.2 : Math.max(0.01, easeBack(p))})`;
}

// ── Stick figures ──────────────────────────────────────────────────
const S = `stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
const pl = (pts) => `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" ${S}/>`;
const heart = (x, y, s = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6 C-10 -4 -14 -10 -7 -13 C-3 -15 0 -12 0 -9 C0 -12 3 -15 7 -13 C14 -10 10 -4 0 6Z" fill="#E0453A" stroke="${INK}" stroke-width="2"/>`;

function face(hx, hy, o) {
  const d = o.look || 0; // shift features toward who they're facing
  const ex = 13, ey = hy - 4;
  let s = "";
  if (o.eyes === "heart") s += heart(hx - ex + d, ey, 1.25) + heart(hx + ex + d, ey, 1.25);
  else s += `<circle cx="${hx - ex + d}" cy="${ey}" r="5" fill="${INK}"/><circle cx="${hx + ex + d}" cy="${ey}" r="5" fill="${INK}"/>`;
  if (o.brows === "worried") s += `<path d="M${hx - ex - 9 + d} ${hy - 15} L${hx - ex + 7 + d} ${hy - 20} M${hx + ex + 9 + d} ${hy - 15} L${hx + ex - 7 + d} ${hy - 20}" ${S} stroke-width="5"/>`;
  if (o.brows === "angry") s += `<path d="M${hx - ex - 9 + d} ${hy - 21} L${hx - ex + 7 + d} ${hy - 15} M${hx + ex + 9 + d} ${hy - 21} L${hx + ex - 7 + d} ${hy - 15}" ${S} stroke-width="5"/>`;
  const mx = hx + d, my = hy + 15;
  const m = o.mouth || "smile";
  if (m === "smile") s += `<path d="M${mx - 13} ${my - 1} Q${mx} ${my + 10} ${mx + 13} ${my - 1}" ${S} stroke-width="5"/>`;
  if (m === "grin") s += `<path d="M${mx - 15} ${my - 3} Q${mx} ${my + 20} ${mx + 15} ${my - 3} Z" fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  if (m === "flat") s += `<path d="M${mx - 11} ${my + 3} L${mx + 11} ${my + 3}" ${S} stroke-width="5"/>`;
  if (m === "frown") s += `<path d="M${mx - 13} ${my + 8} Q${mx} ${my - 4} ${mx + 13} ${my + 8}" ${S} stroke-width="5"/>`;
  if (m === "o") s += `<ellipse cx="${mx}" cy="${my + 3}" rx="7" ry="9" fill="${INK}"/>`;
  return s;
}

function headAndHair(hx, hy, o) {
  let s = "";
  if (o.hair === "pony") {
    s += `<path d="M${hx + 26} ${hy - 26} Q${hx + 78} ${hy - 30} ${hx + 66} ${hy + 34}" ${S}/>`;
  }
  s += `<circle cx="${hx}" cy="${hy}" r="36" fill="${PAPER}" ${S.replace('fill="none"', "")}/>`;
  if (o.hair === "pony") s += `<path d="M${hx - 36} ${hy - 4} A36 36 0 0 1 ${hx + 36} ${hy - 4} Q${hx + 6} ${hy - 26} ${hx - 36} ${hy - 4}Z" fill="${INK}"/>`;
  if (o.hair === "spiky") s += `<path d="M${hx - 18} ${hy - 32} l-4 -14 M${hx - 4} ${hy - 36} l0 -15 M${hx + 10} ${hy - 35} l4 -14 M${hx + 23} ${hy - 28} l8 -11" ${S} stroke-width="6"/>`;
  if (o.hat) {
    s += `<path d="M${hx - 38} ${hy - 12} Q${hx - 38} ${hy - 62} ${hx} ${hy - 63} Q${hx + 38} ${hy - 62} ${hx + 38} ${hy - 12} Z" fill="${TERRA}" ${S.replace('fill="none"', "")} stroke-width="6"/>`;
    s += `<path d="M${hx - 50} ${hy - 12} L${hx + 52} ${hy - 12}" ${S} stroke-width="9"/>`;
    s += `<path d="M${hx} ${hy - 62} L${hx} ${hy - 30}" ${S} stroke-width="5"/>`;
  }
  return s + face(hx, hy, o);
}

// Standing figure. arms: "down" | "hold" | "crossed" | "lean" | "thumb"
function stand(x, gy, o = {}) {
  const hip = [x, gy - 200], neck = [x, gy - 410], hy = gy - 452, sh = neck[1] + 22;
  let s = pl([[x - 34, gy], hip, [x + 34, gy]]) + pl([neck, hip]);
  const arms = {
    down: [[[x, sh], [x - 40, sh + 92], [x - 55, sh + 176]], [[x, sh], [x + 40, sh + 92], [x + 55, sh + 176]]],
    hold: [[[x, sh], [x - 62, sh + 72], [x - 76, sh + 112]], [[x, sh], [x + 62, sh + 72], [x + 76, sh + 112]]],
    crossed: [[[x, sh], [x + 42, sh + 78], [x - 44, sh + 64]], [[x, sh], [x - 42, sh + 86], [x + 44, sh + 70]]],
    lean: [[[x, sh], [x - 64, sh + 60], [x - 112, sh + 18]], [[x, sh], [x + 40, sh + 92], [x + 55, sh + 176]]],
    thumb: [[[x, sh], [x - 40, sh + 92], [x - 55, sh + 176]], [[x, sh], [x + 70, sh - 14], [x + 82, sh - 92]]],
  }[o.arms || "down"];
  s += arms.map(pl).join("");
  if (o.arms === "thumb") s += `<path d="M${x + 82} ${sh - 92} l-3 -26 M${x + 82} ${sh - 92} l16 6" ${S} stroke-width="6"/>`;
  return s + headAndHair(x + (o.tilt || 0), hy, o);
}

// Seated figure facing dir (+1 right, -1 left). arms: "table" | "phone" | "lap"
function sit(x, seatY, gy, dir, o = {}) {
  const hip = [x, seatY - 8], neck = [x + dir * (o.lean || 0), seatY - 213], hy = seatY - 255, sh = neck[1] + 22;
  let s = pl([hip, [x + dir * 92, seatY - 2], [x + dir * 96, gy]]) + pl([[x, seatY - 4], [x + dir * 78, seatY + 4], [x + dir * 76, gy]]);
  s += pl([neck, hip]);
  const nx = neck[0];
  const a = o.arms || "table";
  if (a === "table") s += pl([[nx, sh], [nx + dir * 50, sh + 94], [nx + dir * 122, sh + 112]]) + pl([[nx, sh], [nx + dir * 36, sh + 100], [nx + dir * 108, sh + 120]]);
  if (a === "phone") s += pl([[nx, sh], [nx + dir * 62, sh + 92], [nx + dir * 108, sh + 22]]) + pl([[nx, sh], [nx + dir * 36, sh + 100], [nx + dir * 108, sh + 120]]);
  if (a === "lap") s += pl([[nx, sh], [nx + dir * 30, sh + 100], [nx + dir * 70, sh + 150]]) + pl([[nx, sh], [nx + dir * 20, sh + 104], [nx + dir * 62, sh + 156]]);
  if (a === "cheer") s += pl([[nx, sh], [nx + dir * 40, sh - 60], [nx + dir * 26, sh - 130]]) + pl([[nx, sh], [nx - dir * 40, sh - 60], [nx - dir * 30, sh - 128]]);
  return s + headAndHair(nx, hy, { ...o, look: dir * 6 });
}

function chair(x, seatY, gy, dir) {
  // back on the side away from the table
  const bx = x - dir * 40;
  return pl([[bx, seatY - 190], [bx, gy]]) + pl([[bx, seatY], [x + dir * 70, seatY], [x + dir * 70, gy]]);
}

// ── Static thought-bubble cloud ────────────────────────────────────
function buildCloud() {
  const cx = 270, cy = 205, rx = 205, ry = 150;
  let outer = `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 7}" ry="${ry + 7}"/>`, inner = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  const n = 13;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * rx * 0.98, y = cy + Math.sin(a) * ry * 0.98, r = 46 + (i % 3) * 8;
    outer += `<circle cx="${x}" cy="${y}" r="${r + 7}"/>`;
    inner += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  }
  $("cloudOuter").innerHTML = outer;
  $("cloudInner").innerHTML = inner;
}

// ── Scene 1: hook ──────────────────────────────────────────────────
function scene1(t) {
  pop($("s1l1"), t, 0.05); pop($("s1l2"), t, 0.3); pop($("s1l3"), t, 0.6);
  const gy = 1360, x = 540;
  const mouth = t < 1.5 ? "smile" : t < 2.4 ? "flat" : "frown";
  let s = `<path d="M-20 ${gy} L1100 ${gy}" ${S} stroke-width="5"/>`;
  s += stand(x, gy, { hat: true, arms: "hold", mouth, brows: t > 2.4 ? "worried" : null });
  // stack of quotes: front sheets fall one by one
  const falls = [1.5, 2.3, 3.0], land = [[-210, 14], [190, -10], [-60, 8]];
  const sheet = (w = 150, h = 196) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#fff" ${S.replace('fill="none"', "")} stroke-width="5"/>` +
    [0, 1, 2, 3, 4].map((i) => `<path d="M${-w / 2 + 22} ${-h / 2 + 36 + i * 28} L${w / 2 - 22 - (i % 2) * 24} ${-h / 2 + 36 + i * 28}" ${S} stroke-width="4"/>`).join("");
  const remaining = falls.filter((f) => t < f).length;
  for (let i = 0; i < remaining; i++) s += `<g transform="translate(${540 + (i - 1) * 6} ${1040 - i * 6}) rotate(${(i - 1) * 2})">${sheet()}</g>`;
  // hands over the stack
  s += `<circle cx="${x - 76}" cy="${1040 + 30}" r="9" fill="${INK}"/><circle cx="${x + 76}" cy="${1040 + 30}" r="9" fill="${INK}"/>`;
  falls.forEach((f, i) => {
    if (t < f) return;
    const p = prog(t, f, f + 0.55), q = easeIn(p);
    const y = lerp(1040, gy - 8, q), xx = lerp(540, 540 + land[i][0], easeOut(p));
    const rot = lerp(0, 90 + land[i][1], q), sy = 1 - 0.92 * clamp((p - 0.55) / 0.45);
    s += `<g transform="translate(${xx} ${y}) rotate(${p < 1 ? rot * 0.3 : 0}) scale(1 ${sy})">${sheet()}</g>`;
  });
  $("s1art").innerHTML = s;
}

// ── Table scene (S2 and S7) ────────────────────────────────────────
const GY = 1300, SEAT = 1125, TABLE_Y = 1062;
function tableBase() {
  let s = `<path d="M-20 ${GY} L1100 ${GY}" ${S} stroke-width="5"/>`;
  // lamp
  s += `<path d="M540 -10 L540 640" ${S} stroke-width="4"/><path d="M478 702 L602 702 L572 640 L508 640 Z" fill="${INK}"/><ellipse cx="540" cy="708" rx="22" ry="9" fill="#FFE9B0"/>`;
  // window + moon
  s += `<rect x="90" y="600" width="150" height="150" fill="#1E2B45" ${S.replace('fill="none"', "")} stroke-width="6"/><path d="M165 600 L165 750 M90 675 L240 675" ${S} stroke-width="5"/>`;
  s += `<circle cx="205" cy="630" r="15" fill="#F5F0DC"/><circle cx="213" cy="624" r="13" fill="#1E2B45"/>`;
  // clock
  s += `<circle cx="330" cy="640" r="40" fill="#fff" ${S.replace('fill="none"', "")} stroke-width="6"/><path d="M330 640 L330 614 M330 640 L348 650" ${S} stroke-width="5"/>`;
  // table
  s += `<rect x="300" y="${TABLE_Y}" width="480" height="16" rx="4" fill="${INK}"/><path d="M335 ${TABLE_Y + 16} L335 ${GY} M745 ${TABLE_Y + 16} L745 ${GY}" ${S}/>`;
  // mug + quote on the table
  s += `<rect x="400" y="${TABLE_Y - 44}" width="36" height="44" rx="5" fill="#9A6B4F" ${S.replace('fill="none"', "")} stroke-width="5"/><path d="M436 ${TABLE_Y - 34} q16 0 16 12 q0 12 -16 12" ${S} stroke-width="5"/>`;
  s += `<path d="M560 ${TABLE_Y - 2} L690 ${TABLE_Y - 2} L668 ${TABLE_Y - 16} L578 ${TABLE_Y - 16} Z" fill="#fff" ${S.replace('fill="none"', "")} stroke-width="4"/>`;
  // chairs
  s += chair(215, SEAT, GY, 1) + chair(865, SEAT, GY, -1);
  return s;
}

function tableScene(t, mode) {
  // mode "s2": the lost meeting; "s7": the win
  const win = mode === "s7";
  $("s2head").style.display = win ? "none" : "block";
  if (!win) { pop($("s2l1"), t, 0.1); pop($("s2l2"), t, 0.32); const f = 1 - prog(t, 1.9, 2.1); $("s2head").style.opacity = f; }
  let s = tableBase();
  // thought bubble trail dots
  const thoughtOn = win ? t > 0.15 : t > 0.45 && t < 2.05;
  if (thoughtOn) s += `<circle cx="826" cy="800" r="12" fill="#fff" ${S.replace('fill="none"', "")} stroke-width="5"/><circle cx="842" cy="826" r="7" fill="#fff" ${S.replace('fill="none"', "")} stroke-width="4"/>`;

  // Dave (left)
  const davePhone = win;
  s += sit(225, SEAT, GY, 1, { hat: true, arms: davePhone ? "phone" : "table", mouth: win ? (t > 2.3 ? "grin" : "smile") : (t > 2.1 ? "flat" : "smile"), brows: !win && t > 2.1 ? "worried" : null });
  // Sarah (right)
  const hearts = win && t > 0.6;
  s += sit(855, SEAT, GY, -1, {
    hair: "pony", arms: win && t > 2.3 ? "cheer" : "table",
    eyes: hearts ? "heart" : "dot", mouth: win ? (t > 1.3 ? "o" : "smile") : "flat",
    brows: win ? null : "worried",
  });
  if (win && t > 1.9) s = s; // keep
  // Mark (standing, far right)
  const lean = win && t > 0.7;
  s += stand(lean ? 975 : 995, GY, { hair: "spiky", arms: lean ? "lean" : "crossed", mouth: lean ? "smile" : "flat", brows: lean ? null : "angry", tilt: lean ? -10 : 0 });
  // speech tail
  const speechAt = win ? 1.35 : 2.1;
  if (t > speechAt) s += `<path d="M770 784 L824 846 L812 780" fill="#fff" ${S.replace('fill="none"', "")}/>`;
  $("tableart").innerHTML = s;

  // thought bubble
  const th = $("thought");
  th.style.left = "480px"; th.style.top = "390px";
  $("thoughtImg").src = win ? "assets/after.jpg" : "assets/before.jpg";
  if (win) popBack(th, t, 0.15, 0.35);
  else { popBack(th, t, 0.45, 0.35); if (t > 2.05) th.style.opacity = 0; }

  // speech bubble
  const sp = $("speech");
  sp.textContent = win ? "When can you start?" : "We need to think about it.";
  sp.style.transformOrigin = "60% 100%";
  popBack(sp, t, speechAt, 0.3);

  // phone in Dave's hand (win only)
  const hp = $("handphone");
  hp.style.display = davePhone ? "block" : "none";
  if (davePhone) { hp.style.left = `${225 + 108 - 37}px`; hp.style.top = `${SEAT - 213 + 22 + 22 - 120}px`; hp.style.boxShadow = "0 0 40px 10px rgba(255,236,190,.8)"; }

  // stamp
  const st = $("stamp");
  st.style.display = win ? "block" : "none";
  if (win) {
    const p = prog(t, 2.3, 2.48);
    st.style.left = "330px"; st.style.top = "935px";
    st.style.opacity = t < 2.3 ? 0 : 1;
    st.style.transform = `rotate(-9deg) scale(${lerp(2.6, 1, easeIn(p))})`;
  }
  // stamp shake
  const shake = win && t > 2.48 && t < 2.7 ? Math.sin(t * 120) * 10 * (1 - prog(t, 2.48, 2.7)) : 0;
  $("table").style.transform = `translate(${shake}px, ${shake * 0.5}px)`;
}

// ── Scene 3: the ghosting texts (lt = local time) ──────────────────
function scene3(lt, opts = {}) {
  const phone = $("s3phone");
  const slide = easeOut(prog(lt, 0, 0.35));
  const zoom = lerp(1, 1.22, easeInOut(prog(lt, 2.5, 3.2)));
  phone.style.transformOrigin = "50% 78%";
  phone.style.transform = `translateY(${(1 - slide) * 1300 + (opts.jx ? 0 : 0)}px) translateX(${opts.jx || 0}px) scale(${zoom}) rotate(${lerp(4, 0, slide)}deg)`;
  document.querySelectorAll("#thread [data-at]").forEach((el) => {
    const at = parseFloat(el.dataset.at);
    el.style.display = lt >= at ? "" : "none";
    const p = easeOut(prog(lt, at, at + 0.22));
    el.style.opacity = p;
    el.style.transform = `translateY(${(1 - p) * 24}px) scale(${lerp(0.92, 1, p)})`;
  });
  $("readcircle").firstElementChild.style.strokeDashoffset = 1 - easeOut(prog(lt, 1.95, 2.3));
  const vhs = !!opts.vhs;
  $("vhs").style.display = vhs ? "block" : "none";
  $("rew").style.display = vhs ? "block" : "none";
  $("runit").style.display = vhs ? "block" : "none";
  phone.style.filter = vhs ? "contrast(1.25) saturate(1.5) hue-rotate(-12deg) blur(1px)" : "none";
}

// ── Scene 4: the tally ─────────────────────────────────────────────
const penW = new Map();
function scene4(lt) {
  pop($("s4l1"), lt, 0.05);
  const pad = $("pad");
  const sl = easeOut(prog(lt, 0, 0.25));
  pad.style.transform = `translateY(${(1 - sl) * 900}px) rotate(-3deg)`;
  document.querySelectorAll("#pad .pen").forEach((el) => {
    const at = parseFloat(el.dataset.at);
    el.style.width = `${penW.get(el) * prog(lt, at, at + (el.style.fontSize ? 0.35 : 0.28))}px`;
  });
  $("sumline").style.transform = `scaleX(${easeOut(prog(lt, 1.5, 1.65))})`;
  $("sumcircle").style.strokeDashoffset = 1 - easeOut(prog(lt, 2.0, 2.3));
  const bill = $("bill"), bp = prog(lt, 2.3, 2.6);
  bill.style.display = lt > 2.3 ? "flex" : "none";
  bill.style.left = `${lerp(820, 1180, easeIn(bp))}px`; bill.style.top = `${lerp(1330, 860, bp)}px`;
  bill.style.transform = `rotate(${lerp(-10, 40, bp)}deg)`;
}

// ── Scene 6: Reno Ready demo (lt = local time) ─────────────────────
const tapPos = {};
function placeTap(lt, at, key) {
  const p = prog(lt, at - 0.18, at + 0.2);
  if (lt < at - 0.18 || lt > at + 0.25) return false;
  const [x, y] = tapPos[key];
  const tap = $("tap"), rip = $("ripple");
  tap.style.display = "block"; tap.style.left = `${x}px`; tap.style.top = `${y}px`;
  tap.style.transform = `scale(${lt < at ? lerp(1.3, 1, prog(lt, at - 0.18, at)) : lerp(1, 0.85, prog(lt, at, at + 0.08))})`;
  tap.style.opacity = lt > at + 0.15 ? 1 - prog(lt, at + 0.15, at + 0.25) : 1;
  if (lt >= at) {
    const r = lerp(30, 120, easeOut(prog(lt, at, at + 0.25)));
    rip.style.display = "block"; rip.style.left = `${x - r}px`; rip.style.top = `${y - r}px`;
    rip.style.width = rip.style.height = `${2 * r}px`; rip.style.opacity = 1 - prog(lt, at, at + 0.25);
  }
  return true;
}
function scene6(lt) {
  const phone = $("s6phone");
  phone.style.transform = `translateY(${(1 - easeOut(prog(lt, 0, 0.3))) * 1400}px)`;
  pop($("s6l1"), lt, 3.0); pop($("s6l2"), lt, 3.25);
  // which app screen
  const A = $("appA"), B = $("appB"), C = $("appC");
  const ab = easeInOut(prog(lt, 1.35, 1.6)), bc = easeInOut(prog(lt, 2.85, 3.1));
  A.style.transform = `translateX(${-ab * 100}%)`;
  B.style.transform = `translateX(${(1 - ab) * 100 - bc * 100}%)`;
  C.style.transform = `translateX(${(1 - bc) * 100}%)`;
  // A: upload
  const ph = prog(lt, 0.75, 0.95);
  $("dzphoto").style.opacity = ph; $("dztag").style.opacity = ph;
  $("dropzone").style.borderStyle = ph > 0 ? "solid" : "dashed";
  // B: selections
  const sage = $("swSage"), gold = $("chipGold"), gen = $("genbtn");
  sage.innerHTML = '<div class="lbl">Sage</div>' + (lt > 1.8 ? '<div class="ring"></div><div class="check">✓</div>' : "");
  gold.classList.toggle("on", lt > 2.2);
  gen.style.transform = `scale(${lt > 2.55 && lt < 2.7 ? 0.95 : 1})`;
  gen.style.filter = lt > 2.55 && lt < 2.7 ? "brightness(.9)" : "none";
  // C: before/after reveal + estimate
  const pos = lerp(100, 46, easeInOut(prog(lt, 3.05, 3.85)));
  $("beforeClip").style.width = `${pos}%`;
  $("handle").style.left = `${pos}%`;
  $("tagAfter").style.opacity = prog(lt, 3.3, 3.5);
  document.querySelectorAll("#estcard .row").forEach((r) => {
    const at = 3.45 + parseInt(r.dataset.at) * 0.16, p = easeOut(prog(lt, at, at + 0.2));
    r.style.opacity = p; r.style.transform = `translateX(${(1 - p) * 40}px)`;
  });
  const total = Math.round((30800 * easeOut(prog(lt, 3.45, 4.45))) / 100) * 100;
  $("total").textContent = "$" + total.toLocaleString("en-AU");
  // taps
  $("tap").style.display = "none"; $("ripple").style.display = "none";
  placeTap(lt, 0.55, "choose") || placeTap(lt, 1.8, "sage") || placeTap(lt, 2.2, "gold") || placeTap(lt, 2.6, "gen");
}

// ── Scene 8: end card ──────────────────────────────────────────────
function scene8(lt) {
  const lg = $("endlogo"), lp = easeOut(prog(lt, 0, 0.3));
  lg.style.opacity = lp; lg.style.transform = `translateY(${(1 - lp) * -40}px)`;
  pop($("s8l1"), lt, 0.2); pop($("s8l2"), lt, 0.45);
  const ba = $("endba"), bp = prog(lt, 0.55, 0.9);
  ba.style.opacity = bp > 0 ? 1 : 0; ba.style.transform = `scale(${lerp(0.7, 1, easeBack(bp))})`;
  const pos = lt < 0.9 ? 100 : 50 + 38 * Math.cos((lt - 0.9) * 1.9);
  $("endClip").style.width = `${pos}%`; $("endHandle").style.left = `${pos}%`;
  const cb = $("ctabtn"), cp = prog(lt, 1.15, 1.45);
  cb.style.opacity = cp > 0 ? 1 : 0;
  cb.style.transform = `scale(${lt < 1.15 ? 0.2 : lt < 1.6 ? easeBack(cp) : 1 + 0.035 * Math.sin((lt - 1.6) * 5.5)})`;
  $("ctasmall").style.opacity = prog(lt, 1.4, 1.7);
  // mini Dave, thumbs up
  const dp = easeOut(prog(lt, 1.6, 1.9));
  $("s8art").innerHTML = `<g transform="translate(${lerp(-200, 0, dp)} 0)"><g transform="translate(150 1890) scale(.62) translate(-150 -1890)">${stand(150, 1890, { hat: true, arms: "thumb", mouth: "grin" })}</g></g>`;
}

// ── Master ─────────────────────────────────────────────────────────
const scenes = ["s1", "table", "s3", "s4", "s6", "s8"];
function show(id) { scenes.forEach((s) => ($(s).style.display = s === id ? "block" : "none")); }

window.renderFrame = function (t) {
  $("turb").setAttribute("seed", String(1 + Math.floor(t * 8) % 9));
  let flash = 0;
  if (t < T.s2) { show("s1"); scene1(t - T.s1); }
  else if (t < T.s3) { show("table"); tableScene(t - T.s2, "s2"); }
  else if (t < T.s4) { show("s3"); scene3(t - T.s3); }
  else if (t < T.s5) { show("s4"); scene4(t - T.s4); }
  else if (t < T.s6) {
    // rewind: the thread runs backwards under VHS noise
    show("s3");
    const lt = t - T.s5;
    const back = lerp(3.3, 0, easeIn(prog(lt, 0, 0.65)));
    scene3(back, { vhs: true, jx: Math.sin(lt * 90) * 14 });
    const rb = $("runit");
    const p = prog(lt, 0.02, 0.18);
    rb.style.opacity = p > 0 ? 1 : 0;
    rb.style.transform = `scale(${lerp(1.5, 1, easeOut(p))}) translateX(${Math.sin(lt * 70) * 6}px)`;
    $("rew").style.opacity = Math.floor(lt * 6) % 2 ? 0.25 : 1;
    flash = prog(lt, 0.72, 0.9);
  }
  else if (t < T.s7) { show("s6"); scene6(t - T.s6); flash = 1 - prog(t, T.s6, T.s6 + 0.15); }
  else if (t < T.s8) { show("table"); tableScene(t - T.s7, "s7"); }
  else { show("s8"); scene8(t - T.s8); }
  $("flash").style.opacity = flash;
};

window.setup = async function () {
  // Hidden scenes don't trigger font loads, so load every face up front
  await Promise.all(["104px Anton", "62px Caveat", "86px Marker", "700 40px Inter", "800 40px Inter"].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
  buildCloud();
  // measure pen widths for write-on reveals
  show("s4");
  document.querySelectorAll("#pad .pen").forEach((el) => { el.style.width = "auto"; penW.set(el, el.scrollWidth + 10); });
  // tap targets, relative to the phone screen
  show("s6");
  const scr = $("appscreen").getBoundingClientRect();
  const center = (el) => { const r = el.getBoundingClientRect(); return [r.left - scr.left + r.width / 2, r.top - scr.top + r.height / 2]; };
  $("appB").style.transform = "none";
  tapPos.choose = center($("choosebtn"));
  $("appA").style.visibility = "hidden";
  tapPos.sage = center($("swSage")); tapPos.gold = center($("chipGold")); tapPos.gen = center($("genbtn"));
  $("appA").style.visibility = "";
  window.renderFrame(0);
  return { penW: [...penW.values()], tapPos };
};
