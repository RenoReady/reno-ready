import type { Metadata } from "next";
import RoomLanding from "@/components/rooms/RoomLanding";
import { ROOM_PAGES } from "@/lib/roomPages";

const page = ROOM_PAGES.kitchen;

export const metadata: Metadata = {
  title:       page.metaTitle,
  description: page.metaDescription,
};

export default function KitchenPage() {
  return <RoomLanding room="kitchen" />;
}
