import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

/** data-clarity-mask: Clarity blanks out this page if a recording that started elsewhere carries on into it */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div data-clarity-mask="True">{children}</div>;
}
