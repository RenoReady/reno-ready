import type { Metadata } from "next";
import Link from "next/link";
import { TIER_LIMITS, PRO_PRICING } from "@/lib/plans";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms for using Reno Ready: plans and payments, cancellations and refunds, fair use, how you can use your AI designs, and our responsibilities.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "22 October 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-bold text-charcoal mb-3">{title}</h2>
      <div className="space-y-3 text-charcoal/70 leading-relaxed">{children}</div>
    </section>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-5 list-disc marker:text-terracotta">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

const CONTENTS: [string, string][] = [
  ["intro", "About these terms"], ["account", "Your account"], ["plans", "Plans and payments"],
  ["cancel", "Cancelling and refunds"], ["fair-use", "Fair use"], ["ai", "AI designs and cost estimates"],
  ["your-content", "Your photos and content"], ["licence", "Using your designs"], ["pro-tools", "Share links and branded reports"],
  ["builders", "Connecting with builders"], ["rules", "Things you must not do"], ["support", "Support"],
  ["changes", "Changes to Reno Ready"], ["liability", "Our responsibility to you"], ["ending", "Ending your use"],
  ["law", "Governing law"], ["contact", "Contact us"],
];

export default function TermsPage() {
  const pass = TIER_LIMITS.pass, pro = TIER_LIMITS.pro;
  return (
    <main className="min-h-screen bg-sand">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-3">Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">Terms of Use</h1>
        <p className="text-charcoal/50 mb-8">Last updated {LAST_UPDATED}</p>

        <nav aria-label="Contents" className="mb-12 rounded-2xl border border-sand-200 bg-white/60 p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-charcoal/45">Contents</p>
          <ol className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {CONTENTS.map(([id, label], i) => (
              <li key={id}><a href={`#${id}`} className="text-charcoal/65 hover:text-terracotta">{i + 1}. {label}</a></li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          <Section id="intro" title="1. About these terms">
            <p>
              Reno Ready (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs renoready.com.au, an online tool that creates AI
              design previews and cost estimates to help you plan a renovation. These terms apply whenever you use
              Reno Ready. By creating an account, buying a plan or using the site, you agree to them. Please also
              read our <Link href="/privacy" className="font-semibold text-terracotta hover:underline">Privacy Policy</Link>,
              which explains how we handle your information.
            </p>
            <p>
              Nothing in these terms takes away rights you have under the Australian Consumer Law. Where these terms
              and those rights conflict, your rights win.
            </p>
          </Section>

          <Section id="account" title="2. Your account">
            <List items={[
              "You sign in with a Google account. You need to be 18 or over, or have a parent or guardian's permission.",
              "Your account is for you. Don't share it or sell access to it. If you're a business, each person using Reno Ready should have their own account.",
              "Keep your Google account secure. Tell us straight away if you think someone else has used your Reno Ready account.",
            ]} />
          </Section>

          <Section id="plans" title="3. Plans and payments">
            <p>All prices are in Australian dollars. Payments are processed by Stripe; we never see your full card number.</p>
            <List items={[
              <><strong>Free.</strong> {TIER_LIMITS.free.renders} AI preview and {TIER_LIMITS.free.edits} &ldquo;Not quite right?&rdquo; edit per account, at standard quality with a watermark.</>,
              <><strong>7-Day Project Pass ($19, one-time).</strong> {pass.renders} renders and {pass.edits} edits in 2K, no watermark and downloadable PDF Pro Reports, for 7 days from purchase. It does not renew and you won&apos;t be charged again. Unused renders and edits expire at the end of the 7 days.</>,
              <><strong>Reno Ready Pro (${PRO_PRICING.monthly.price} a month or ${PRO_PRICING.annual.price} a year).</strong> Up to {pro.renders} renders and {pro.edits} edits each calendar month (see fair use below), 4 variations per click, 4K exports, client share links, branded and multi-room PDF reports, a commercial use licence and priority support. Pro is a subscription: it <strong>renews automatically</strong> at the end of each month or year, and we charge the card you used, until you cancel.</>,
            ]} />
            <p>
              The features of each plan are as described on our <Link href="/pricing" className="font-semibold text-terracotta hover:underline">pricing page</Link> when
              you buy. If we change the price of Pro, we&apos;ll email you at least 30 days before the new price applies,
              so you can cancel first if you want to.
            </p>
          </Section>

          <Section id="cancel" title="4. Cancelling and refunds">
            <List items={[
              <><strong>Cancel anytime.</strong> Cancel Pro in one click from the account menu (&ldquo;Manage or cancel subscription&rdquo;) or My Account. There&apos;s no contract or cancellation fee. Your Pro access continues until the end of the month or year you&apos;ve already paid for, and you won&apos;t be charged again.</>,
              <><strong>No refunds for change of mind.</strong> Your free preview and free edit let you try Reno Ready before you pay, so we don&apos;t give refunds if you simply change your mind, don&apos;t use your plan, or use only part of it. Cancelling Pro stops future payments; it doesn&apos;t refund the current month or year.</>,
              <><strong>Your consumer rights.</strong> This doesn&apos;t limit your rights under the Australian Consumer Law. If our service has a major failure (for example, it doesn&apos;t work or isn&apos;t as described), you&apos;re entitled to a refund or another remedy. Email us and we&apos;ll sort it out.</>,
            ]} />
          </Section>

          <Section id="fair-use" title="5. Fair use">
            <p>
              {`Reno Ready Pro includes up to ${pro.renders} renders and ${pro.edits} edits each calendar month.`}
              {" "}That&apos;s far more than any one person
              designing rooms by hand will use. The limit exists to stop automated or bulk use, which costs us money for
              every image. If you reach it, you can keep using everything else and your allowance resets at the start of
              the next month. If you need more for a business, email us.
            </p>
          </Section>

          <Section id="ai" title="6. AI designs and cost estimates">
            <List items={[
              <><strong>Designs are concepts.</strong> Previews are generated by artificial intelligence from your photo and choices. They show an idea of how a room could look. They may not be accurate to scale, may not be buildable as shown, and may not match the exact products, colours or finishes you choose.</>,
              <><strong>Estimates are indicative only.</strong> Cost estimates are based on average Australian market rates and the options you select. They aren&apos;t quotes. Real costs depend on your site, materials, trades and scope, and can be significantly higher or lower.</>,
              <><strong>Not professional advice.</strong> Reno Ready doesn&apos;t replace a licensed builder, plumber, electrician, engineer, certifier or designer. Always get written quotes from licensed trades, and check what approvals your project needs, before you start work.</>,
            ]} />
          </Section>

          <Section id="your-content" title="7. Your photos and content">
            <List items={[
              "You keep ownership of the photos you upload and the notes you write.",
              "You give us permission to use them to run Reno Ready for you: to create your designs, save your drafts and renders, build your reports and, when you ask, send your brief to builders. Our Privacy Policy explains how we store them and how long for.",
              "Only upload photos you have the right to use. Avoid photos that show people or other people's private information.",
            ]} />
          </Section>

          <Section id="licence" title="8. Using your designs">
            <p>We don&apos;t claim ownership of the images Reno Ready creates for you. How you may use them depends on your plan:</p>
            <List items={[
              <><strong>Free and 7-Day Project Pass: personal use.</strong> Use your designs and reports to plan your own renovation and share them with your builder, family and friends.</>,
              <><strong>Reno Ready Pro: commercial use.</strong> You may also use your designs in your business, including property listings, advertising, brochures, social media and client presentations. This licence covers images you create while your Pro plan is active, and continues after you cancel.</>,
              <><strong>Be clear they&apos;re AI concepts.</strong> If you use a design to market a property, don&apos;t present it as a photo of the property as it is. Label it as a concept or artist&apos;s impression (for example &ldquo;AI renovation concept&rdquo;), so buyers and renters aren&apos;t misled. You&apos;re responsible for following advertising and real estate rules.</>,
              "AI can create similar images for other people, so we can't promise your designs are unique.",
            ]} />
          </Section>

          <Section id="pro-tools" title="9. Share links and branded reports">
            <List items={[
              "Client share links are private, unlisted pages. Anyone with the link can view the design, the finishes and (if you choose) the estimate. Only share them with people you trust, and turn a link off from My Account when you no longer need it.",
              "Branded reports show the business name, logo and details you enter. Only use details and a logo that belong to your business or that you have permission to use. You're responsible for anything you hand to a client under your brand.",
            ]} />
          </Section>

          <Section id="builders" title="10. Connecting with builders">
            <p>
              When you ask us to send your brief to a builder, we pass on your details and design. Builders are
              independent businesses, not part of Reno Ready. Any quote, contract or work is between you and the builder,
              and we&apos;re not responsible for their services. Check a builder&apos;s licence and insurance before you
              engage them.
            </p>
          </Section>

          <Section id="rules" title="11. Things you must not do">
            <List items={[
              "Use Reno Ready for anything illegal, harmful or misleading.",
              "Try to get around plan limits, the watermark or the paywall, or create several accounts to get more free previews.",
              "Use bots, scripts or scraping, or resell or redistribute access to Reno Ready.",
              "Upload anything offensive, or anything you don't have the right to use.",
              "Try to break, overload or reverse-engineer the site.",
            ]} />
            <p>If you do, we may limit, suspend or close your account. If we close a paid account for a serious breach, we won&apos;t refund the remaining time.</p>
          </Section>

          <Section id="support" title="12. Support">
            <p>
              Email <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-terracotta hover:underline">{CONTACT_EMAIL}</a> for help.
              Priority support for Reno Ready Pro means your emails are answered first. We aim to reply within one
              business day (Queensland time), though we can&apos;t guarantee a response time.
            </p>
          </Section>

          <Section id="changes" title="13. Changes to Reno Ready">
            <p>
              We&apos;re always improving Reno Ready, so features may change. We won&apos;t remove a core feature of a
              plan you&apos;ve paid for during the period you&apos;ve paid for. We may update these terms; if a change
              materially affects you, we&apos;ll let you know by email or on the site before it applies. The date at the
              top shows when they last changed.
            </p>
            <p>
              We work to keep Reno Ready running, but it relies on other services (such as our hosting, AI and payment
              providers) and may sometimes be unavailable. If an image fails to generate, it isn&apos;t counted against
              your allowance.
            </p>
          </Section>

          <Section id="liability" title="14. Our responsibility to you">
            <p>
              Our services come with guarantees that can&apos;t be excluded under the Australian Consumer Law. Beyond
              those guarantees, and to the extent the law allows:
            </p>
            <List items={[
              "We provide Reno Ready as a planning tool. We aren't responsible for decisions you make, or money you spend on a renovation, based on a design or estimate.",
              "We aren't liable for indirect or consequential loss, such as lost profits or delays to your project.",
              "Our total liability to you is limited to supplying the service again, or refunding what you paid us in the 12 months before the problem.",
            ]} />
          </Section>

          <Section id="ending" title="15. Ending your use">
            <p>
              You can stop using Reno Ready at any time. To delete your account and data, use &ldquo;Delete my
              account&rdquo; under My Account (see our Privacy Policy for what&apos;s removed). Deleting your account
              cancels an active Pro subscription straight away, so you won&apos;t be charged again; the rest of the
              current period, or of a 7-Day Project Pass, isn&apos;t refunded.
            </p>
          </Section>

          <Section id="law" title="16. Governing law">
            <p>These terms are governed by the laws of Queensland, Australia, and you and we can bring proceedings in the courts of Queensland.</p>
          </Section>

          <Section id="contact" title="17. Contact us">
            <p>
              Questions about these terms, a refund request or a complaint: email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-terracotta hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
