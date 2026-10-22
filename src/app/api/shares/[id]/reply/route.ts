/**
 * /api/shares/:id/reply — the client's reply on a shared design (public, no account).
 *   POST { kind: "approve" | "question", option?, name, contact, message?, website? }
 *        option: the label they were looking at, when several options were shared
 *        `website` is a honeypot: real people never see it, bots fill it in.
 *
 * The reply is saved with the share (the owner sees it under Client links in
 * My Account) and emailed to the owner. Email only goes once a verified
 * sending domain is set (RESEND_FROM_EMAIL): Resend's shared test sender can
 * only deliver to the Resend account's own inbox.
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { addShareReply, isShareId, shareOwner, type ShareReply } from "@/lib/shareStore";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isShareId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });   // honeypot

  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const kind = body.kind === "approve" ? "approve" : body.kind === "question" ? "question" : null;
  const name = text(body.name, 80);
  const contact = text(body.contact, 120);
  const message = text(body.message, 1000) || null;
  if (!kind || !name) return NextResponse.json({ error: "Add your name." }, { status: 400 });
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isPhone = (contact.match(/\d/g) ?? []).length >= 8;
  if (!isEmail && !isPhone) return NextResponse.json({ error: "Add an email or phone number so they can get back to you." }, { status: 400 });
  if (kind === "question" && !message) return NextResponse.json({ error: "Type your question." }, { status: 400 });

  const option = text(body.option, 8) || null;
  const reply: Omit<ShareReply, "at"> = { kind, option, name, contact, message };
  let share;
  try {
    share = await addShareReply(id, reply);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Not found") return NextResponse.json({ error: "This link has been turned off." }, { status: 404 });
    if (msg === "Too many replies") return NextResponse.json({ error: "This link has had a lot of replies. Contact them directly instead." }, { status: 429 });
    console.error("[share-reply] save failed:", msg);
    return NextResponse.json({ error: "Couldn't send that. Please try again." }, { status: 500 });
  }

  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  if (sender && process.env.RESEND_API_KEY) {
    try {
      const { email } = await shareOwner(share.ownerId);
      if (email) {
        const link = `${req.nextUrl.origin}/s/${id}`;
        const picked = option && share.options?.includes(option) ? option : null;
        const what = kind === "approve" ? `approved ${picked ? `option ${picked} of ` : ""}“${share.title}”` : `has a question about ${picked ? `option ${picked} of ` : ""}“${share.title}”`;
        const subject = kind === "approve" ? `${name} approved ${picked ? `option ${picked} of ` : ""}the ${share.roomType} design` : `${name} has a question about the ${share.roomType} design`;
        const lines = [
          `<p style="font-size:16px"><strong>${esc(name)}</strong> ${esc(what)}.</p>`,
          message ? `<blockquote style="margin:0 0 16px;padding:12px 16px;background:#F6F1EA;border-radius:10px;font-size:15px;white-space:pre-line">${esc(message)}</blockquote>` : "",
          `<p style="font-size:15px">Get back to them: <strong>${esc(contact)}</strong></p>`,
          `<p style="font-size:14px"><a href="${link}">Open the design</a> · <a href="${req.nextUrl.origin}/account">All replies in My Account</a></p>`,
        ];
        await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: sender, to: email, subject,
          ...(isEmail && { replyTo: contact }),
          html: `<div style="font-family:Arial,sans-serif;color:#2C3E50;max-width:560px">${lines.join("")}</div>`,
          text: `${name} ${kind === "approve" ? "approved" : "has a question about"} ${picked ? `option ${picked} of ` : ""}"${share.title}".\n\n${message ? message + "\n\n" : ""}Get back to them: ${contact}\n\n${link}`,
        });
      }
    } catch (err) {
      // saved either way; it shows in My Account
      console.error("[share-reply] email failed:", err instanceof Error ? err.message : err);
    }
  }
  return NextResponse.json({ ok: true });
}
