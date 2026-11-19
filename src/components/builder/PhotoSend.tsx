"use client";

/**
 * The phone side of the Step 1 QR code: "Send a photo to your computer".
 * The phone opened /<room>?handoff=<token>. They take or pick a photo, it's
 * shrunk here (downsizePhoto) and sent to /api/handoff/<token>, and the
 * computer that showed the QR code picks it up by itself.
 *
 * "Design on this phone instead" leaves the hand-off and carries on here.
 */

import { useState } from "react";
import { Camera, CheckCircle2, Loader2, Monitor } from "lucide-react";
import { downsizePhoto } from "@/lib/photoDownsize";

type Room = "bathroom" | "kitchen" | "bedroom";

export default function PhotoSend({ token, room, onDesignHere }: {
  token: string;
  room: Room;
  /** Leave the hand-off and design on this phone (with this photo, if they picked one) */
  onDesignHere: (photo: string | null) => void;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const send = async (file: File) => {
    setError(null);
    setState("sending");
    try {
      const shrunk = await downsizePhoto(file);
      setPhoto(shrunk);
      const res = await fetch(`/api/handoff/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: shrunk }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "We couldn't send that just now. Please try again.");
      }
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send that just now. Please try again.");
      setState("idle");
    }
  };

  if (state === "sent") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-emerald-200 bg-emerald-50/70 px-6 py-10 text-center">
        <CheckCircle2 size={40} className="text-emerald-600" />
        <div>
          <p className="text-xl font-bold text-charcoal">Sent to your computer</p>
          <p className="mt-1 text-sm text-charcoal/60">It should appear there in a few seconds. Carry on choosing your finishes on the bigger screen.</p>
        </div>
        <button type="button" onClick={() => onDesignHere(photo)}
          className="text-sm font-semibold text-charcoal/55 underline underline-offset-2">Or keep designing on this phone</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-[3px] border-dashed border-terracotta/60 bg-white px-6 py-10 text-center">
        <input type="file" accept="image/*" className="sr-only" disabled={state === "sending"}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void send(f); e.target.value = ""; }} />
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-terracotta text-white shadow-warm-lg">
          {state === "sending" ? <Loader2 size={28} className="animate-spin" /> : <Monitor size={28} />}
        </span>
        <span className="flex flex-col gap-1.5">
          <span className="text-xl font-bold text-charcoal">Send a photo of your {room} to your computer</span>
          <span className="text-sm text-charcoal/55">Any photo works, even an old one from your camera roll. It&apos;ll appear on your computer by itself.</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-charcoal px-6 py-3.5 text-base font-bold text-white">
          <Camera size={18} /> {state === "sending" ? "Sending…" : "Take or choose photo"}
        </span>
      </label>
      {error && <p className="text-center text-sm font-semibold text-red-600">{error}</p>}
      <button type="button" onClick={() => onDesignHere(photo)}
        className="self-center text-sm font-semibold text-charcoal/55 underline underline-offset-2">Design on this phone instead</button>
    </div>
  );
}
