import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Reno Ready collects, uses, stores and protects your personal information, including your room photos and AI-generated designs.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "27 October 2026";

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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-sand">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-3">Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">Privacy Policy</h1>
        <p className="text-charcoal/50 mb-12">Last updated {LAST_UPDATED}</p>

        <div className="space-y-10">
          <Section id="intro" title="About this policy">
            <p>
              Reno Ready (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs renoready.com.au, an online tool that helps
              Australians plan renovations with AI design previews and cost estimates. This policy explains what
              personal information we collect, why, who we share it with and the choices you have. We handle
              personal information in line with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy
              Principles.
            </p>
          </Section>

          <Section id="collect" title="What we collect">
            <List items={[
              <><strong>Account details.</strong> When you sign in with Google we receive your email address and a unique account ID. We don&apos;t receive your Google password.</>,
              <><strong>Your designs.</strong> The finishes, room size, budget and notes you choose in the design tool, the AI instructions (prompt) built from them, and the AI-generated preview images. We store each preview with the date and time it was made and the room type.</>,
              <><strong>Room photos.</strong> If you upload a photo of your room, it&apos;s sent to our AI provider to create your preview.</>,
              <><strong>Drafts.</strong> While you design, your choices, room photo and latest preview are saved automatically so you can pick up where you left off. On your device they&apos;re kept in your browser&apos;s storage. Once you&apos;re signed in, they&apos;re also saved privately to your account and listed under My Account, where you can delete any draft at any time. We keep your 12 most recent drafts.</>,
              <><strong>Usage of free previews.</strong> How many previews you&apos;ve generated, so we can apply the free limit.</>,
              <><strong>Payments.</strong> Your plan and when it expires. Card details are entered directly with Stripe, our payment processor; we never see or store your full card number.</>,
              <><strong>Builder enquiries.</strong> If you ask to be connected with a builder, the name, email, phone number, property address, preferred timeline and message you enter, together with your design, estimate and the PDF report made from them. We keep each brief so we can follow it up, and if you were signed in, you can see the briefs you&apos;ve sent under My Account.</>,
              <><strong>How you use the site.</strong> Which steps of the design tool you reach (for example choosing a room, adding a photo, generating a preview), the room type and style you pick, your device type, and your approximate area (city or region, worked out from your internet connection; we don&apos;t store your IP address for this). If you type in a property postcode, we keep that too and add it to your builder brief. Before you sign in this is linked only to a random ID in a cookie; once you sign in it&apos;s linked to your account. We use it to see where people get stuck and to improve the tool.</>,
              <><strong>Technical information.</strong> Standard server logs from our hosting provider (such as IP address, browser type and pages visited), used to keep the site running and secure.</>,
            ]} />
          </Section>

          <Section id="use" title="How we use it">
            <List items={[
              "To create your AI design previews and cost estimates.",
              "To manage your account, free preview limit and paid access.",
              "To email you a reminder if you leave a design unfinished for a day or two (at most one a week). Every reminder has an unsubscribe link, and you can turn them off under My Account.",
              "To pass your design brief to builders when you ask us to connect you with one.",
              "To review the quality of AI previews, fix problems and improve the tool. Your stored designs may be viewed by the Reno Ready team for this purpose.",
              "To respond to you and to meet our legal obligations.",
            ]} />
            <p>We do not sell your personal information, and we don&apos;t use it for third-party advertising.</p>
          </Section>

          <Section id="share" title="Who we share it with">
            <p>We use trusted service providers to run Reno Ready. They only receive what they need to provide their service:</p>
            <List items={[
              <><strong>Supabase</strong> — sign-in, database and storage of your account and designs.</>,
              <><strong>Google (Gemini API)</strong> — generates your AI previews from your selections and any room photo you upload. Google sign-in is also used to log you in.</>,
              <><strong>Stripe</strong> — processes payments.</>,
              <><strong>Vercel</strong> — hosts the website.</>,
              <><strong>Resend</strong> — delivers emails, including builder enquiries.</>,
            ]} />
            <p>
              <strong>Builders.</strong> When you submit a builder enquiry, your details and design brief are sent to
              Reno Ready, and we pass them to a local building company we work with, who may contact you to arrange a
              site visit and quote. They use your details only for your enquiry. We don&apos;t share your details
              with builders unless you&apos;ve asked to be connected.
            </p>
            <p>
              <strong>Overseas storage.</strong> Some of these providers store or process information on servers
              outside Australia, including in the United States. We choose providers with strong security practices,
              but by using Reno Ready you acknowledge that your information may be handled overseas.
            </p>
            <p>We may also disclose information if required by law.</p>
          </Section>

          <Section id="storage" title="How long we keep it">
            <p>
              We keep your account and stored designs while your account is active, so you and we can refer back to
              them. You can delete your account yourself at any time under My Account. That permanently deletes your
              profile, sign-in, AI designs and exports, drafts and room photos, client share links, report branding and
              the builder briefs saved to your account, and cancels any active subscription. Copies of builder briefs
              already emailed to us are deleted from our email records when you ask us to. Payment records are kept by
              Stripe as required by Australian tax law.
            </p>
          </Section>

          <Section id="security" title="Keeping it secure">
            <p>
              Your stored designs are kept in private storage that isn&apos;t publicly accessible. Access to them
              uses short-lived, signed links. Data is sent over encrypted (HTTPS) connections, and only the Reno Ready
              team can access admin tools. No system is perfectly secure, but we take reasonable steps to protect
              your information from misuse, loss and unauthorised access.
            </p>
          </Section>

          <Section id="browser" title="Cookies and browser storage">
            <p>
              We use essential cookies to keep you signed in, and your browser&apos;s local storage to remember your
              sign-in state and to hold your design temporarily while you sign in. We also set two first-party
              cookies of our own: one with a random ID so we can count visits and see how far people get in the
              design tool, and one that remembers which ad or website first brought you here. They&apos;re only used
              by Reno Ready. We don&apos;t use advertising cookies or third-party trackers.
            </p>
          </Section>

          <Section id="choices" title="Your choices and rights">
            <List items={[
              "You can use parts of the site, such as the guides and cost information, without an account.",
              "You can ask to see the personal information we hold about you, or ask us to correct it.",
              "You can delete your account and stored designs at any time under My Account, or ask us to do it for you.",
            ]} />
            <p>
              To make a request, email us at <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-terracotta hover:underline">{CONTACT_EMAIL}</a>.
              We&apos;ll respond within 30 days.
            </p>
          </Section>

          <Section id="contact" title="Questions and complaints">
            <p>
              If you have a question or concern about your privacy, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-terracotta hover:underline">{CONTACT_EMAIL}</a>.
              If you&apos;re not satisfied with our response, you can contact the Office of the Australian Information
              Commissioner at{" "}
              <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="font-semibold text-terracotta hover:underline">oaic.gov.au</a>.
            </p>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p>
              We may update this policy as Reno Ready changes. We&apos;ll post the new version here with an updated
              date.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
