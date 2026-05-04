"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ProgressNav from "@/components/ui/ProgressNav";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LogOut, RefreshCcw } from "lucide-react";

const APP_ROUTES = ["/builder", "/preview", "/connect"];

interface UserInfo {
  email:     string;
  avatarUrl: string | null;
  initials:  string;
}

function buildUserInfo(user: { email?: string; user_metadata?: Record<string, string> }): UserInfo {
  const email    = user.email ?? "";
  const name     = (user.user_metadata?.["full_name"] as string | undefined) ?? email;
  const initials = name.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";
  return { email, avatarUrl: user.user_metadata?.["avatar_url"] ?? null, initials };
}

export default function Header() {
  const pathname  = usePathname();
  const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r));

  const [user,     setUser]     = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load session once on mount, then listen for auth changes
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? buildUserInfo(data.session.user) : null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? buildUserInfo(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    localStorage.removeItem("reno_ready_authed");
    setUser(null);
    setMenuOpen(false);
  }

  async function handleSwitchAccount() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    localStorage.removeItem("reno_ready_authed");
    setUser(null);
    setMenuOpen(false);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-sand-50/90 backdrop-blur-md border-b border-sand-200">
      <div className={cn(
        "max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-6",
        isAppRoute ? "h-16 sm:h-28" : "h-16 sm:h-28",
      )}>

        {/* ── Logo (+ wordmark on landing page) ─────────────────── */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Reno Ready"
            height={150}
            width={150}
            style={{ mixBlendMode: "multiply" }}
            priority
            className={cn(
              "w-auto transition-opacity duration-200 group-hover:opacity-75",
              isAppRoute ? "h-12 sm:h-[120px]" : "h-12 sm:h-[120px]",
            )}
          />
          {/* Wordmark — landing page only, hidden on app routes where space is tight */}
          {!isAppRoute && (
            <div className="flex flex-col leading-tight">
              <span className="text-base sm:text-2xl font-bold text-charcoal tracking-tight leading-none transition-colors duration-200 group-hover:text-terracotta">
                Reno Ready
              </span>
              <span className="hidden sm:block text-xs text-charcoal/45 font-medium tracking-wide mt-0.5">
                Renovation planning made simple.
              </span>
            </div>
          )}
        </Link>

        {/* ── Middle: Progress nav OR landing nav links ──────────── */}
        {isAppRoute ? (
          <ProgressNav />
        ) : (
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "How It Works", href: "/#how-it-works" },
              { label: "Pricing",      href: "/#pricing" },
              { label: "FAQ",          href: "/#faq" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold text-charcoal/70",
                  "hover:text-charcoal hover:bg-charcoal/5 transition-all duration-150",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* ── Right: CTA + account widget ───────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* "Start Free" CTA — landing page only, desktop only */}
          {!isAppRoute && (
            <Link
              href="/builder"
              className={cn(
                "hidden sm:inline-flex items-center gap-2",
                "px-5 py-2.5 rounded-xl text-sm font-semibold",
                "bg-terracotta text-white shadow-warm-sm",
                "hover:bg-terracotta-600 transition-all duration-200",
              )}
            >
              Start Free
            </Link>
          )}

          {/* Account button — shown when a Google account is signed in */}
          {user && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-sand-200",
                  "bg-white/70 hover:bg-sand-50 transition-all duration-200",
                )}
                title={user.email}
                aria-label="Account menu"
              >
                {user.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-terracotta/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-terracotta">{user.initials}</span>
                  </div>
                )}
                <span className="hidden sm:block text-xs font-semibold text-charcoal/70 max-w-[110px] truncate">
                  {user.email.split("@")[0]}
                </span>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-warm-xl border border-sand-200 z-[200] overflow-hidden">
                  {/* Signed-in email */}
                  <div className="px-4 py-3 border-b border-sand-100">
                    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mb-0.5">
                      Signed in as
                    </p>
                    <p className="text-sm font-semibold text-charcoal truncate">{user.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="py-1.5">
                    <button
                      onClick={handleSwitchAccount}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-charcoal/70 hover:bg-sand-50 hover:text-charcoal transition-colors text-left"
                    >
                      <RefreshCcw size={14} className="text-charcoal/40 flex-shrink-0" />
                      Sign in with a different account
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-charcoal/70 hover:bg-sand-50 hover:text-charcoal transition-colors text-left"
                    >
                      <LogOut size={14} className="text-charcoal/40 flex-shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
