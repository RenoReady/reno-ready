/**
 * Content + media for the room landing pages (/bathroom, /kitchen, /bedroom).
 *
 * To give a room its own reel, drop the files in public/videos/ and fill in
 * `video` — the landing page switches from the static panel to the player.
 */

import type { RoomType } from "./roomTypes";

export interface RoomVideo {
  /** Desktop source — 1080p H.264 MP4 */
  src:        string;
  /** Optional lighter source served to screens ≤ 768px */
  mobileSrc?: string;
  /** Still frame shown before playback, and instead of it on reduced-motion / data-saver */
  poster:     string;
}

export interface RoomPage {
  room:        RoomType;
  path:        `/${RoomType}`;
  emoji:       string;
  eyebrow:     string;
  title:       string;
  /** Link text used when pointing at this room from elsewhere */
  exploreLabel: string;
  intro:       string;
  features:    string[];
  metaTitle:   string;
  metaDescription: string;
  video:       RoomVideo | null;
}

export const MARKETING_VIDEO: RoomVideo = {
  src:       "/videos/renoready-marketing-video.mp4",
  mobileSrc: "/videos/renoready-marketing-video-720.mp4",
  poster:    "/videos/renoready-marketing-video-poster.jpg",
};

export const ROOM_PAGES: Record<RoomType, RoomPage> = {
  bathroom: {
    room:     "bathroom",
    path:     "/bathroom",
    emoji:    "🛁",
    eyebrow:  "The Sanctuary",
    title:    "Design your bathroom",
    exploreLabel: "Explore Bathrooms",
    intro:    "Pick your tiles, vanity and tapware, preview it with AI, and see an itemised cost estimate in seconds.",
    features: [
      "Nude Travertine & Zellige tile library",
      "Walk-in showers, niches & structural changes",
      "Chrome, matte black or brushed gold tapware",
      "Avg. cost: $15k – $35k",
    ],
    metaTitle:       "Bathroom Renovation Designer & Cost Estimator",
    metaDescription: "Design your Australian bathroom renovation with AI. Choose tiles, vanity and tapware, preview the result and get an instant itemised cost estimate.",
    video:    MARKETING_VIDEO,
  },
  kitchen: {
    room:     "kitchen",
    path:     "/kitchen",
    emoji:    "🏗️",
    eyebrow:  "The Heart",
    title:    "Design your kitchen",
    exploreLabel: "Explore Kitchens",
    intro:    "Choose cabinetry, benchtops and splashbacks, preview it with AI, and get an itemised estimate before you call a builder.",
    features: [
      "Cabinetry, benchtop & splashback combos",
      "Island bench design with cost advisor",
      "Integrated appliance planning",
      "Avg. cost: $22k – $45k",
    ],
    metaTitle:       "Kitchen Renovation Designer & Cost Estimator",
    metaDescription: "Design your Australian kitchen renovation with AI. Compare cabinetry, benchtops and splashbacks, preview the result and get an instant cost estimate.",
    video:    null,
  },
  bedroom: {
    room:     "bedroom",
    path:     "/bedroom",
    emoji:    "🛏️",
    eyebrow:  "The Retreat",
    title:    "Design your bedroom",
    exploreLabel: "Explore Bedrooms",
    intro:    "Try flooring, wall treatments and lighting, preview it with AI, and get an itemised estimate for your living or master suite.",
    features: [
      "Flooring: oak herringbone to polished concrete",
      "Wall treatments: VJ, limewash, feature paint",
      "Lighting & joinery cost estimates",
      "Avg. cost: $8k – $28k",
    ],
    metaTitle:       "Bedroom & Living Renovation Designer & Cost Estimator",
    metaDescription: "Design your Australian bedroom or living room renovation with AI. Try flooring, wall treatments and lighting, and get an instant cost estimate.",
    video:    null,
  },
};
