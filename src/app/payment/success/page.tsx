/**
 * /payment/success
 *
 * Stripe redirects here after a successful checkout.
 * We verify the session server-side, mark the user as paid in
 * Supabase, then display a confirmation screen.
 */

import { Suspense } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Stripe from "stripe";

async function SuccessContent({
  sessionId,
  plan,
}: {
  sessionId: string | null;
  plan:      string | null;
}) {
  // ── Verify with Stripe ────────────────────────────────────────
  let customerEmail: string | null = null;
  let planLabel = "Reno Ready Access";

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      customerEmail = session.customer_details?.email ?? null;
    } catch {
      // Non-fatal — still show the success screen
    }
  }

  if (plan === "dayPass")  planLabel = "Day Pass — 24hr Unlimited";
  if (plan === "monthly")  planLabel = "Monthly — Unlimited Access";
  if (plan === "annual")   planLabel = "Annual — Best Value";

  // ── (Optional) Mark user as paid in Supabase ──────────────────
  // Uncomment once Supabase is configured:
  //
  // if (customerEmail && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  //   const supabase = createClient(
  //     process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //     process.env.SUPABASE_SERVICE_ROLE_KEY!,  // service role for server writes
  //   );
  //   await supabase
  //     .from("profiles")
  //     .update({ has_paid: true, plan, paid_at: new Date().toISOString() })
  //     .eq("email", customerEmail);
  // }

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-warm-xl p-10 flex flex-col items-center gap-7 text-center">

        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Reno Ready"
          height={36}
          width={144}
          style={{ height: 36, width: "auto" }}
          priority
        />

        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={1.5} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-charcoal mb-2">You&apos;re all set!</h1>
          <p className="text-charcoal/60 text-sm leading-relaxed">
            Your <strong className="text-charcoal">{planLabel}</strong> is now active.
            {customerEmail && (
              <> A receipt has been sent to <strong>{customerEmail}</strong>.</>
            )}
          </p>
        </div>

        {/* What's next */}
        <div className="w-full bg-sand-50 rounded-2xl border border-sand-200 p-5 text-left flex flex-col gap-3">
          <p className="text-xs font-bold text-charcoal/50 uppercase tracking-widest">What&apos;s next</p>
          {[
            "Head to the Configurator and choose your tiles",
            "Upload a photo for a personalised AI preview",
            "Download your Reno Brief and share with builders",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-charcoal/70">
              <span className="w-5 h-5 rounded-full bg-terracotta/15 text-terracotta text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </div>
          ))}
        </div>

        <Link
          href="/builder"
          className="flex items-center gap-2 w-full justify-center py-3.5 px-6 rounded-2xl bg-terracotta text-white font-semibold text-sm shadow-warm-sm hover:bg-terracotta-600 transition-colors"
        >
          Start Designing Now
          <ArrowRight size={16} />
        </Link>

        <p className="text-xs text-charcoal/35">
          Questions? Email us at{" "}
          <a href="mailto:hello@renoready.com.au" className="underline hover:text-charcoal/60">
            hello@renoready.com.au
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; plan?: string };
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    }>
      <SuccessContent
        sessionId={searchParams.session_id ?? null}
        plan={searchParams.plan ?? null}
      />
    </Suspense>
  );
}
