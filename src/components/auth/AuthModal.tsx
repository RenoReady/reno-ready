"use client";

/**
 * AuthModal — Google sign-in gate before AI generation.
 *
 * Uses Supabase Auth with Google OAuth.
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ShieldCheck, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

// ── Supabase client (browser-side, cookie-backed for SSR) ────────
function getSupabase() {
  return createSupabaseBrowserClient();
}

// ── Lightweight auth helpers used by the builder gate ─────────────
const AUTH_KEY = "reno_ready_authed";

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "1";
}

export function markAuthed(): void {
  localStorage.setItem(AUTH_KEY, "1");
}

export function signOut(): void {
  localStorage.removeItem(AUTH_KEY);
}

// ── Modal ─────────────────────────────────────────────────────────

interface AuthModalProps {
  onSuccess: () => void;
  onClose:   () => void;
}

export default function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const overlayRef          = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // After Google redirect, Supabase sets session in localStorage.
  // We listen for the storage event so the modal can close itself
  // if the user authenticates in the same tab.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === AUTH_KEY && e.newValue === "1") {
        onSuccess();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [onSuccess]);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/builder`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (oauthError) throw oauthError;
      // Browser will navigate away — no further action needed here.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(44,62,80,0.6)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-warm-xl p-8 flex flex-col gap-6">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X size={15} className="text-charcoal/60" />
        </button>

        {/* Logo — centred for brand trust. Multiply blend removes white canvas on white modal. */}
        <div className="flex justify-center pt-2">
          <Image
            src="/logo.png"
            alt="Reno Ready"
            height={80}
            width={80}
            style={{
              height: 80,
              width:  80,
              mixBlendMode: "multiply",
            }}
            priority
          />
        </div>

        {/* Headline */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-2">Sign in to generate</h2>
          <p className="text-charcoal/60 text-sm leading-relaxed">
            Get <strong>3 free AI previews</strong> just for signing in.
            No credit card required.
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={cn(
            "flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-2xl",
            "border-2 border-sand-200 bg-white hover:bg-sand-50 hover:border-sand-300",
            "text-sm font-semibold text-charcoal transition-all duration-200",
            "shadow-warm-sm hover:shadow-warm",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-charcoal/50" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? "Redirecting to Google…" : "Continue with Google"}
        </button>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 text-center -mt-2">{error}</p>
        )}

        {/* Trust */}
        <div className="flex items-center justify-center gap-2 text-xs text-charcoal/40">
          <ShieldCheck size={13} className="text-terracotta/60" />
          <span>Your data is never shared. Unsubscribe anytime.</span>
        </div>

        <p className="text-center text-xs text-charcoal/40">
          After 3 free previews — from <strong className="text-charcoal/60">$19 AUD</strong> for unlimited 24-hour access.
        </p>
      </div>
    </div>
  );
}
