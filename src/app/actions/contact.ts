"use server";

/**
 * Contact / Connect submission server action.
 *
 * Sends an email notification to the Reno Ready inbox via Resend
 * containing the user's contact details, design selections, and
 * estimated budget.
 *
 * Required env vars:
 *   RESEND_API_KEY              — from resend.com/api-keys
 *   CONTACT_EMAIL_DESTINATION   — your destination inbox (e.g. you@gmail.com)
 *   RESEND_FROM_EMAIL           — verified sender (default falls back to Resend's onboarding sender)
 */

import { Resend } from "resend";
import { LEAD_NOTIFICATION_DESTINATION, RESEND_FROM } from "@/lib/config";

// ── Inbound payload from the Connect form ──────────────────────────
export interface ConnectSubmission {
  name:     string;
  email:    string;
  phone?:   string;
  message?: string;

  // Snapshot of the user's design at submission time
  design: {
    floorTile?:        { id: string; name: string } | null;
    wallTile?:         { id: string; name: string } | null;
    customFloorColor?: string | null;
    customWallColor?:  string | null;
    tileStyle?:        string | null;
    vanity:            string;
    tapware:           string;
    budget:            number;
    estimatedCost:     number;
    customNote?:       string;
    structuralChanges: {
      removeBathtub:    boolean;
      addWalkinShower:  boolean;
      replaceToilet:    boolean;
      inWallCistern:    boolean;
      showerNiche:      "none" | "single" | "double";
      showerFixtures:   "single" | "dual";
    };
    /** Itemised cost breakdown — sent in the email so the team has full context. */
    itemisedCosts: { label: string; amount: number; detail?: string }[];
    /** Raw prompt that would be sent to Gemini if the user generated. */
    aiPrompt: string;
  };
}

export interface ConnectResult {
  ok:       boolean;
  error?:   string;
  /** True when running with the placeholder API key — email was simulated. */
  mock?:    boolean;
}

const PLACEHOLDER_API_KEY = "your_resend_api_key_here";

function isMock(): boolean {
  const key = process.env.RESEND_API_KEY;
  return !key || key === PLACEHOLDER_API_KEY || key.trim() === "";
}

const fmtAUD = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);

// ── HTML email template ────────────────────────────────────────────
function renderEmailHtml(s: ConnectSubmission): string {
  const d  = s.design;
  const sc = d.structuralChanges;

  const escape = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const structuralLines: string[] = [];
  if (sc.removeBathtub)             structuralLines.push("Bathtub Removal");
  if (sc.addWalkinShower)           structuralLines.push("Walk-in Shower Conversion");
  if (sc.replaceToilet)             structuralLines.push("Toilet Replacement");
  if (sc.inWallCistern)             structuralLines.push("In-Wall Cistern");
  if (sc.showerNiche === "single")  structuralLines.push("Single Shower Niche");
  if (sc.showerNiche === "double")  structuralLines.push("Double Shower Niche");
  if (sc.showerFixtures === "dual") structuralLines.push("Dual Shower Heads (Rain + Handheld)");

  const colorChip = (hex?: string | null) => hex
    ? `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${escape(hex)};border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-left:6px;"></span><span style="font-family:'SF Mono',Menlo,monospace;font-size:10px;color:#9CA3AF;margin-left:4px;">${escape(hex)}</span>`
    : "";

  const tilesRow = (label: string, name: string | undefined, color: string | null | undefined) =>
    `<tr>
      <td style="padding:8px 14px;color:#6B7480;font-size:12px;border-bottom:1px solid #EFE9DD;">${label}</td>
      <td style="padding:8px 14px;color:#2C3E50;font-weight:600;font-size:13px;border-bottom:1px solid #EFE9DD;">${escape(name ?? "—")}${colorChip(color)}</td>
    </tr>`;

  const costRows = d.itemisedCosts
    .map((it, i) => `
      <tr style="background:${i % 2 === 0 ? "#FAF7F2" : "#fff"};">
        <td style="padding:7px 14px;color:#3E4A57;font-size:13px;">${escape(it.label)}${it.detail ? `<br><span style="color:#9CA3AF;font-size:11px;">${escape(it.detail)}</span>` : ""}</td>
        <td style="padding:7px 14px;text-align:right;color:#2C3E50;font-weight:600;font-size:13px;font-family:'SF Mono',Menlo,monospace;">${it.amount >= 0 ? "" : "-"}${fmtAUD(Math.abs(it.amount))}</td>
      </tr>`)
    .join("");

  const replyMailto = `mailto:${s.email}?subject=${encodeURIComponent("Re: Your Reno Ready bathroom design")}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New Lead — Reno Ready</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#F5F0E6;margin:0;padding:32px 16px;color:#2C3E50;-webkit-font-smoothing:antialiased;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #EDE5D8;box-shadow:0 8px 32px rgba(44,62,80,0.06);">

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#2C3E50 0%,#3a4f66 100%);padding:28px 32px;color:#fff;">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td>
            <p style="margin:0;font-size:10px;color:#D27D5E;text-transform:uppercase;letter-spacing:3px;font-weight:800;">🛁  Reno Ready · New Lead</p>
            <h1 style="margin:8px 0 0 0;font-size:26px;font-weight:700;line-height:1.2;">${escape(s.name)}</h1>
            <p style="margin:6px 0 0 0;font-size:13px;color:rgba(255,255,255,0.7);">
              <a href="mailto:${escape(s.email)}" style="color:rgba(255,255,255,0.9);text-decoration:none;">${escape(s.email)}</a>${s.phone ? `  ·  <a href="tel:${escape(s.phone)}" style="color:rgba(255,255,255,0.9);text-decoration:none;">${escape(s.phone)}</a>` : ""}
            </p>
          </td>
          <td align="right" valign="top" style="padding-left:16px;">
            <div style="background:rgba(210,125,94,0.18);border:1px solid rgba(210,125,94,0.4);border-radius:12px;padding:10px 14px;text-align:center;">
              <p style="margin:0;font-size:9px;color:#D27D5E;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Estimated</p>
              <p style="margin:4px 0 0 0;font-size:18px;font-weight:700;color:#fff;font-family:'SF Mono',Menlo,monospace;">${fmtAUD(d.estimatedCost)}</p>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Quick action -->
    <div style="padding:18px 32px;background:#FAF7F2;border-bottom:1px solid #EDE5D8;">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td>
            <p style="margin:0;font-size:11px;color:#6B7480;font-weight:600;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981;margin-right:6px;vertical-align:middle;"></span>
              Submitted just now ·  ${escape(s.email)}
            </p>
          </td>
          <td align="right">
            <a href="${replyMailto}" style="background:#D27D5E;color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:8px 14px;border-radius:10px;display:inline-block;">Reply →</a>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:28px 32px;">
      ${s.message ? `
      <div style="background:#FAF7F2;border-left:3px solid #D27D5E;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Customer Note</p>
        <p style="margin:6px 0 0 0;font-size:14px;line-height:1.6;color:#3E4A57;font-style:italic;">"${escape(s.message).replace(/\n/g, "<br>")}"</p>
      </div>` : ""}

      <h2 style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">🎨  Design Selections</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #EFE9DD;">
        ${tilesRow("Floor Tile",  d.floorTile?.name, d.customFloorColor)}
        ${tilesRow("Wall Tile",   d.wallTile?.name,  d.customWallColor)}
        <tr><td style="padding:8px 14px;color:#6B7480;font-size:12px;border-bottom:1px solid #EFE9DD;">Tile Layout</td><td style="padding:8px 14px;color:#2C3E50;font-weight:600;font-size:13px;border-bottom:1px solid #EFE9DD;">${escape(d.tileStyle ?? "—")}</td></tr>
        <tr><td style="padding:8px 14px;color:#6B7480;font-size:12px;border-bottom:1px solid #EFE9DD;">Vanity</td><td style="padding:8px 14px;color:#2C3E50;font-weight:600;font-size:13px;border-bottom:1px solid #EFE9DD;">${escape(d.vanity)}</td></tr>
        <tr><td style="padding:8px 14px;color:#6B7480;font-size:12px;border-bottom:1px solid #EFE9DD;">Tapware</td><td style="padding:8px 14px;color:#2C3E50;font-weight:600;font-size:13px;border-bottom:1px solid #EFE9DD;">${escape(d.tapware)}</td></tr>
        <tr><td style="padding:8px 14px;color:#6B7480;font-size:12px;">Budget Target</td><td style="padding:8px 14px;color:#2C3E50;font-weight:600;font-size:13px;">${fmtAUD(d.budget)}</td></tr>
      </table>

      ${structuralLines.length > 0 ? `
      <h2 style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">🔧  Structural Changes</h2>
      <div style="background:#fff;border:1px solid #EFE9DD;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <ul style="margin:0;padding-left:20px;color:#3E4A57;font-size:13px;line-height:1.85;">
          ${structuralLines.map(l => `<li>${escape(l)}</li>`).join("")}
        </ul>
      </div>` : ""}

      <h2 style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">💰  Itemised Cost Breakdown</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;border-radius:10px;overflow:hidden;border:1px solid #EFE9DD;">
        ${costRows}
        <tr style="background:#2C3E50;color:#fff;">
          <td style="padding:11px 14px;font-size:13px;font-weight:700;">Estimated Total</td>
          <td style="padding:11px 14px;text-align:right;font-size:15px;font-weight:700;font-family:'SF Mono',Menlo,monospace;">${fmtAUD(d.estimatedCost)}</td>
        </tr>
      </table>

      ${d.customNote ? `
      <h2 style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin:28px 0 12px 0;font-weight:700;">📝  Builder Note</h2>
      <p style="margin:0 0 24px 0;color:#3E4A57;font-size:13px;line-height:1.6;font-style:italic;background:#FAF7F2;padding:14px 16px;border-radius:8px;">"${escape(d.customNote)}"</p>` : ""}

      <details style="margin-top:28px;background:#1A1F28;border-radius:10px;padding:0;overflow:hidden;">
        <summary style="cursor:pointer;font-size:10px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;padding:14px 18px;">⚙  AI Prompt (raw, sent to Gemini)</summary>
        <pre style="margin:0;padding:14px 18px;font-family:'SF Mono',Menlo,monospace;font-size:11px;color:rgba(255,255,255,0.85);white-space:pre-wrap;line-height:1.5;border-top:1px solid rgba(255,255,255,0.1);">${escape(d.aiPrompt)}</pre>
      </details>
    </div>

    <div style="padding:18px 32px;border-top:1px solid #EDE5D8;background:#FAF7F2;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;">
        Sent by <a href="https://www.renoready.com.au" style="color:#D27D5E;text-decoration:none;font-weight:600;">renoready.com.au</a> · Reply directly to respond to the customer
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Server Action ──────────────────────────────────────────────────
export async function submitConnectForm(payload: ConnectSubmission): Promise<ConnectResult> {
  // Basic input validation — the server is the source of truth
  if (!payload.name?.trim())  return { ok: false, error: "Name is required." };
  if (!payload.email?.trim()) return { ok: false, error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))
    return { ok: false, error: "Please enter a valid email." };

  // Mock mode — log only, return success so dev/staging works without a key
  if (isMock()) {
    console.info("[connect] MOCK MODE — Resend key not configured. Submission logged only:", {
      name:  payload.name,
      email: payload.email,
      phone: payload.phone,
    });
    return { ok: true, mock: true };
  }

  const resend      = new Resend(process.env.RESEND_API_KEY!);
  const destination = LEAD_NOTIFICATION_DESTINATION;
  const fromAddress = RESEND_FROM;

  try {
    const { error } = await resend.emails.send({
      from:     fromAddress,
      to:       destination,
      replyTo:  payload.email,
      subject:  `🛁 New Lead — ${payload.name} · ${fmtAUD(payload.design.estimatedCost)} reno brief`,
      html:     renderEmailHtml(payload),
    });

    if (error) {
      console.error("[connect] Resend error:", error);
      return { ok: false, error: error.message ?? "Email send failed." };
    }

    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[connect] submitConnectForm failed:", msg);
    return { ok: false, error: msg };
  }
}
