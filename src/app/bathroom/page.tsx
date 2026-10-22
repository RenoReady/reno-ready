import type { Metadata } from "next";
import RoomLanding from "@/components/rooms/RoomLanding";
import { ROOM_PAGES, SHARE_IMAGE } from "@/lib/roomPages";

const page = ROOM_PAGES.bathroom;

export const metadata: Metadata = {
  title:       page.metaTitle,
  description: page.metaDescription,
  alternates:  { canonical: page.path },
  // shared links show this room, not the site-wide title
  openGraph:   { title: `${page.metaTitle} | Reno Ready`, description: page.metaDescription, url: page.path, siteName: "Reno Ready", locale: "en_AU", type: "website", images: [SHARE_IMAGE] },
  twitter:     { card: "summary_large_image", title: `${page.metaTitle} | Reno Ready`, description: page.metaDescription, images: [SHARE_IMAGE.url] },
};

export default function BathroomPage() {
  return <RoomLanding room="bathroom" />;
}
