"use server";

/**
 * Contact / Connect submission server action.
 *
 * Saves the brief (see leadStore — admin dashboard + My Account), then emails
 * it to the Reno Ready inbox via Resend with the Pro Report attached. Saving
 * comes first, so a lead is kept even if the email fails.
 *
 * Required env vars:
 *   RESEND_API_KEY              — from resend.com/api-keys
 *   CONTACT_EMAIL_DESTINATION   — your destination inbox (e.g. you@gmail.com)
 *   RESEND_FROM_EMAIL           — verified sender (default falls back to Resend's onboarding sender)
 */

import { Resend } from "resend";
import { LEAD_NOTIFICATION_DESTINATION, RESEND_FROM } from "@/lib/config";
import type { ProReportInput } from "@/lib/generateProReportPDF";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveLead, markLeadEmailed } from "@/lib/leadStore";
import { logEvent } from "@/lib/funnel";
import { cookies, headers } from "next/headers";

// ── Inbound payload from the Connect form ──────────────────────────
export interface ConnectSubmission {
  name:     string;
  email:    string;
  phone?:   string;
  message?: string;
  /** Property address or suburb */
  address?:  string;
  /** Preferred timeline label, e.g. "1 to 3 Months" */
  timeline?: string;
  /** Everything needed to build the client's Pro Report PDF here on the server (photos as small JPEG data URLs) */
  reportInput?: ProReportInput;
  /** Why the report couldn't be attached, when it couldn't */
  reportError?: string;

  // Snapshot of the user's design at submission time
  design: {
    floorTile?:        { id: string; name: string } | null;
    wallTile?:         { id: string; name: string } | null;
    customFloorColor?: string | null;
    customWallColor?:  string | null;
    /** Painted walls, e.g. "Natural White · Crisp Neutral" */
    wallColour?:       string | null;
    tileStyle?:        string | null;
    vanity:            string;
    tapware:           string;
    budget:            number;
    estimatedCost:     number;
    customNote?:       string;
    /** "Kitchen", "Bedroom" or "Bathroom" */
    room?:             string;
    /** The design as shown on the connect page, for any room */
    rows?:             { label: string; value: string; color?: string | null }[];
    /** Structural / services items for any room */
    structural?:       string[];
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
function renderEmailHtml(s: ConnectSubmission, hasReport = false): string {
  const d  = s.design;
  const sc = d.structuralChanges;
  const room = d.room ?? "Bathroom";

  const escape = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // newer submissions send the room's own structural list; older ones only had the bathroom flags
  const structuralLines: string[] = d.structural ? [...d.structural] : [];
  const bathroomFlags = !d.structural;
  if (bathroomFlags && sc.removeBathtub)             structuralLines.push("Bathtub Removal");
  if (bathroomFlags && sc.addWalkinShower)           structuralLines.push("Walk-in Shower Conversion");
  if (bathroomFlags && sc.replaceToilet)             structuralLines.push("Toilet Replacement");
  if (bathroomFlags && sc.inWallCistern)             structuralLines.push("In-Wall Cistern");
  if (bathroomFlags && sc.showerNiche === "single")  structuralLines.push("Single Shower Niche");
  if (bathroomFlags && sc.showerNiche === "double")  structuralLines.push("Double Shower Niche");
  if (bathroomFlags && sc.showerFixtures === "dual") structuralLines.push("Dual Shower Heads (Rain + Handheld)");

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

  const replyMailto = `mailto:${s.email}?subject=${encodeURIComponent(`Re: Your Reno Ready ${room.toLowerCase()} design`)}`;

  const designRows = d.rows
    ? d.rows.map((r) => tilesRow(r.label, r.value, r.color)).join("")
    : `${tilesRow("Floor Tile", d.floorTile?.name, d.customFloorColor)}${tilesRow("Wall Tile", d.wallTile?.name, d.customWallColor)}${tilesRow("Vanity", d.vanity, null)}${tilesRow("Tapware", d.tapware, null)}`;

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
            <p style="margin:0;font-size:10px;color:#D27D5E;text-transform:uppercase;letter-spacing:3px;font-weight:800;">Reno Ready · New ${escape(room)} Lead</p>
            <h1 style="margin:8px 0 0 0;font-size:26px;font-weight:700;line-height:1.2;">${escape(s.name)}</h1>
            <p style="margin:6px 0 0 0;font-size:13px;color:rgba(255,255,255,0.7);">
              <a href="mailto:${escape(s.email)}" style="color:rgba(255,255,255,0.9);text-decoration:none;">${escape(s.email)}</a>${s.phone ? `  ·  <a href="tel:${escape(s.phone)}" style="color:rgba(255,255,255,0.9);text-decoration:none;">${escape(s.phone)}</a>` : ""}
            </p>
            ${s.address ? `<p style="margin:4px 0 0 0;font-size:13px;color:rgba(255,255,255,0.7);">${escape(s.address)}</p>` : ""}
            ${s.timeline ? `<p style="margin:10px 0 0 0;"><span style="display:inline-block;background:#D27D5E;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;">Timeline: ${escape(s.timeline)}</span></p>` : ""}
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
            <p style="margin:4px 0 0 0;font-size:11px;color:#6B7480;">${hasReport ? `Pro Report PDF attached — ready to forward to builders.${s.reportError ? ` Note: ${escape(s.reportError.slice(0, 160))}.` : ""}` : `No report attached — ${escape((s.reportError ?? "unknown reason").slice(0, 200))}.`}</p>
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

      <h2 style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">${escape(room)} Design Selections</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #EFE9DD;">
        ${designRows}
        <tr><td style="padding:8px 14px;color:#6B7480;font-size:12px;">Budget Target</td><td style="padding:8px 14px;color:#2C3E50;font-weight:600;font-size:13px;">${fmtAUD(d.budget)}</td></tr>
      </table>

      ${structuralLines.length > 0 ? `
      <h2 style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">Structural &amp; Services</h2>
      <div style="background:#fff;border:1px solid #EFE9DD;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <ul style="margin:0;padding-left:20px;color:#3E4A57;font-size:13px;line-height:1.85;">
          ${structuralLines.map(l => `<li>${escape(l)}</li>`).join("")}
        </ul>
      </div>` : ""}

      <h2 style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">Itemised Cost Breakdown</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;border-radius:10px;overflow:hidden;border:1px solid #EFE9DD;">
        ${costRows}
        <tr style="background:#2C3E50;color:#fff;">
          <td style="padding:11px 14px;font-size:13px;font-weight:700;">Estimated Total</td>
          <td style="padding:11px 14px;text-align:right;font-size:15px;font-weight:700;font-family:'SF Mono',Menlo,monospace;">${fmtAUD(d.estimatedCost)}</td>
        </tr>
      </table>

      ${d.customNote ? `
      <h2 style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin:28px 0 12px 0;font-weight:700;">Client Request</h2>
      <p style="margin:0 0 24px 0;color:#3E4A57;font-size:13px;line-height:1.6;font-style:italic;background:#FAF7F2;padding:14px 16px;border-radius:8px;">"${escape(d.customNote)}"</p>` : ""}

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

// ── Pro Report attachment ──────────────────────────────────────────
async function buildReportAttachment(payload: ConnectSubmission): Promise<{ attachment?: { filename: string; content: Buffer }[]; reportProblem?: string }> {
  const input = payload.reportInput;
  if (!input) {
    return { reportProblem: payload.reportError ?? "the page didn't send the design for the report (it may have been opened before an update — refresh and try again)" };
  }
  try {
    // photos must be small JPEG data URLs (the browser shrinks them); anything else is left out of the report
    const okImage = (u: unknown) => typeof u === "string" && u.startsWith("data:image/jpeg;base64,") && u.length < 2_500_000 ? u : null;
    const safe: ProReportInput = { ...input, roomPhotoUrl: okImage(input.roomPhotoUrl), generatedImageUrl: okImage(input.generatedImageUrl) };
    // contact details come from the form fields here, not from the browser-built design data
    safe.client = {
      name:     payload.name.trim(),
      email:    payload.email.trim(),
      phone:    payload.phone?.trim() || null,
      address:  payload.address?.trim().slice(0, 160) || null,
      timeline: payload.timeline?.slice(0, 60) || null,
      message:  payload.message?.trim().slice(0, 1_500) || null,
    };
    safe.selections = { ...safe.selections, roomPhotoUrl: safe.roomPhotoUrl, generatedImageUrl: safe.generatedImageUrl };
    const { proReportPdfBytes } = await import("@/lib/generateProReportPDF");
    const bytes = await proReportPdfBytes(safe);
    const who = payload.name.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "Client";
    const room = (payload.design.room ?? "Bathroom").replace(/[^A-Za-z]/g, "");
    const note = payload.reportError ? ` (${payload.reportError})` : "";
    return {
      attachment: [{ filename: `Reno-Ready-${room}-Report-${who}.pdf`, content: Buffer.from(bytes) }],
      reportProblem: note ? `attached, but without photos${note}` : undefined,
    };
  } catch (err) {
    return { reportProblem: `the server couldn't build the report: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ── Server Action ──────────────────────────────────────────────────
export async function submitConnectForm(payload: ConnectSubmission): Promise<ConnectResult> {
  // Basic input validation — the server is the source of truth
  if (!payload.name?.trim())  return { ok: false, error: "Name is required." };
  if (!payload.email?.trim()) return { ok: false, error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))
    return { ok: false, error: "Please enter a valid email." };

  // Build the Pro Report here so the attachment never depends on the client's browser
  const { attachment, reportProblem } = await buildReportAttachment(payload);
  if (reportProblem) console.error("[connect] report:", reportProblem);

  // Keep the brief before anything else can go wrong
  const leadId = await keepLead(payload, attachment?.[0]?.content ?? null).catch((err) => {
    console.error("[connect] couldn't save the lead:", err instanceof Error ? err.message : err);
    return null;
  });

  // Mock mode — log only, return success so dev/staging works without a key
  if (isMock()) {
    console.info("[connect] MOCK MODE — Resend key not configured. Submission logged only:", {
      name:  payload.name,
      email: payload.email,
      phone: payload.phone,
      leadId,
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
      subject:  `New ${payload.design.room ?? "Bathroom"} Lead — ${payload.name} · ${fmtAUD(payload.design.estimatedCost)} reno brief`,
      html:     renderEmailHtml({ ...payload, reportError: reportProblem }, !!attachment),
      attachments: attachment,
    });

    if (error) {
      console.error("[connect] Resend error:", error);
      // the brief is saved, so it's on the admin dashboard even though the email didn't go
      if (leadId) return { ok: true };
      return { ok: false, error: error.message ?? "Email send failed." };
    }

    if (leadId) await markLeadEmailed(leadId, true).catch(() => {});
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[connect] submitConnectForm failed:", msg);
    if (leadId) return { ok: true };
    return { ok: false, error: msg };
  }
}

/** Saves the brief with its PDF and render; returns the lead id */
async function keepLead(payload: ConnectSubmission, pdf: Buffer | null): Promise<string> {
  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    userId = (await supabase.auth.getUser()).data.user?.id ?? null;
  } catch { /* signed out: the brief is still saved, just not listed on an account */ }

  const d = payload.design;
  const clip = (v: string | null | undefined, n: number) => v?.trim().slice(0, n) || null;
  const render = payload.reportInput?.generatedImageUrl;
  // journey funnel: the last step
  try {
    const [h, c] = await Promise.all([headers(), cookies()]);
    await logEvent({ headers: h, cookies: c }, { step: "brief", userId, room: /kitchen/i.test(d.room ?? "") ? "kitchen" : /bed/i.test(d.room ?? "") ? "bedroom" : "bathroom" });
  } catch { /* never block the brief */ }
  return saveLead({
    userId,
    name:       payload.name.trim().slice(0, 120),
    email:      payload.email.trim().slice(0, 160),
    phone:      clip(payload.phone, 40),
    address:    clip(payload.address, 160),
    timeline:   clip(payload.timeline, 60),
    message:    clip(payload.message, 1_500),
    room:       (d.room ?? "Bathroom").slice(0, 20),
    estimate:   Number.isFinite(d.estimatedCost) ? d.estimatedCost : 0,
    budget:     Number.isFinite(d.budget) ? d.budget : null,
    rows:       (d.rows ?? []).slice(0, 20).map((r) => ({ label: String(r.label).slice(0, 40), value: String(r.value ?? "").slice(0, 120) })),
    structural: (d.structural ?? []).slice(0, 20).map((x) => String(x).slice(0, 80)),
    designNote: clip(d.customNote, 1_000),
  }, {
    pdf,
    renderJpeg: typeof render === "string" && render.startsWith("data:image/jpeg;base64,") && render.length < 2_500_000 ? render : null,
  });
}
