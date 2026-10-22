import type { Metadata } from "next";
import RoomConfigurator from "@/components/builder/RoomConfigurator";

// The tool itself stays out of search results, so searches show the home and room
// pages instead; links from it are still followed.
export const metadata: Metadata = {
  title: "Design Tool",
  robots: { index: false, follow: true },
};

// Room-agnostic entry point: opens with the room picker.
// The room pages (/bathroom, /kitchen, /bedroom) render the same configurator locked to one room.
export default function BuilderPage() {
  return <RoomConfigurator />;
}
