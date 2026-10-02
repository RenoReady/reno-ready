import RoomConfigurator from "@/components/builder/RoomConfigurator";

// Room-agnostic entry point: opens with the room picker.
// The room pages (/bathroom, /kitchen, /bedroom) render the same configurator locked to one room.
export default function BuilderPage() {
  return <RoomConfigurator />;
}
