import type { Metadata } from "next";
import Link from "next/link";
import PricingPlans from "@/components/ui/PricingPlans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with an AI preview and an edit of your room. Upgrade to the $19 7-Day Project Pass for 2K renders and contractor PDF reports, or Reno Ready Pro for unlimited designs and 4K exports.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-sand">
      <section className="px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-terracotta">Pricing</p>
            <h1 className="mb-4 text-3xl font-bold text-charcoal sm:text-5xl">Unlock Full 2K Designs &amp; Contractor PDF Reports</h1>
            <p className="text-base text-charcoal/60 sm:text-lg">
              See your room transformed for free. When you&apos;re ready to plan properly, a whole project is just $19.
            </p>
          </div>
          <PricingPlans />
          <p className="mt-10 text-center text-sm text-charcoal/50">
            Questions about plans? Email <a href="mailto:hello@renoready.com.au" className="font-semibold underline underline-offset-2">hello@renoready.com.au</a>
            {" "}or read the <Link href="/#faq" className="font-semibold underline underline-offset-2">FAQ</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
