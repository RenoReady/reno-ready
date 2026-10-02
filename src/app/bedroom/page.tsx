import type { Metadata } from "next";
import RoomLanding from "@/components/rooms/RoomLanding";
import { ROOM_PAGES } from "@/lib/roomPages";

const page = ROOM_PAGES.bedroom;

export const metadata: Metadata = {
  title:       page.metaTitle,
  description: page.metaDescription,
};

export default function BedroomPage() {
  return <RoomLanding room="bedroom" />;
}
