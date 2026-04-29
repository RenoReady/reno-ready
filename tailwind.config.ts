import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand primaries
        charcoal: {
          DEFAULT: "#2C3E50",
          50:  "#edf0f3",
          100: "#d0d9e1",
          200: "#a1b3c3",
          300: "#728da5",
          400: "#4d6d87",
          500: "#2C3E50",
          600: "#243547",
          700: "#1c2b3d",
          800: "#142131",
          900: "#0c1724",
        },
        terracotta: {
          DEFAULT: "#D27D5E",
          50:  "#fdf4f1",
          100: "#f9e2d8",
          200: "#f2c4ae",
          300: "#e9a585",
          400: "#de8f70",
          500: "#D27D5E",
          600: "#b8664a",
          700: "#9a5039",
          800: "#7c3d2b",
          900: "#5e2c1e",
        },
        // Warm background palette
        sand: {
          DEFAULT: "#F5F0E8",
          50:  "#FDFAF5",
          100: "#F5F0E8",
          200: "#EDE5D4",
          300: "#E0D5BE",
          400: "#D3C4A8",
          500: "#C4B394",
        },
        stone: {
          DEFAULT: "#8B7355",
          100: "#EDE0CC",
          200: "#CEBA9A",
          300: "#B09470",
          400: "#8B7355",
          500: "#6B5840",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        "warm-sm": "0 2px 8px 0 rgba(44, 62, 80, 0.06)",
        "warm":    "0 4px 20px 0 rgba(44, 62, 80, 0.08)",
        "warm-lg": "0 8px 40px 0 rgba(44, 62, 80, 0.12)",
        "warm-xl": "0 16px 60px 0 rgba(44, 62, 80, 0.16)",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
      backgroundImage: {
        // ── Original 8 ────────────────────────────────────────────
        "travertine":    "linear-gradient(135deg, #D4C4A8 0%, #C4B394 40%, #B8A87E 70%, #C8B898 100%)",
        "desert-stone":  "linear-gradient(135deg, #C9A87C 0%, #B8956A 40%, #A8835A 70%, #BA9870 100%)",
        "charcoal-slate":"linear-gradient(135deg, #4A5568 0%, #374151 40%, #2D3748 70%, #3D4A5C 100%)",
        "zellige-ivory": "linear-gradient(135deg, #F0E8D8 0%, #E5D9C4 40%, #D8CDB4 70%, #EAE0CC 100%)",
        "marble-blanc":  "linear-gradient(135deg, #F8F5F0 0%, #EEE9E0 40%, #E5DDD0 70%, #F2EDE6 100%)",
        "sage-subway":   "linear-gradient(135deg, #8FA68B 0%, #7A9076 40%, #687A64 70%, #849E80 100%)",
        "terracotta-feature": "linear-gradient(135deg, #D27D5E 0%, #C06B4C 40%, #A85A3C 70%, #C87460 100%)",
        "zellige-white": "linear-gradient(135deg, #FAFAF8 0%, #F0EDE6 40%, #E8E3D8 70%, #F5F2EC 100%)",
        // ── New 8 (expanded configurator) ─────────────────────────
        "terrazzo-blanc":   "linear-gradient(135deg, #F4F1EB 0%, #EAE7DF 30%, #F2EFE8 60%, #E6E3DC 100%)",
        "honed-limestone":  "linear-gradient(135deg, #E8E0D0 0%, #DDD4C0 40%, #D4C8B0 70%, #E0D8C8 100%)",
        "natural-oak":      "linear-gradient(135deg, #C8985C 0%, #B88A50 25%, #D4A870 50%, #B88A50 75%, #C49860 100%)",
        "matte-slate-lg":   "linear-gradient(135deg, #606878 0%, #505868 40%, #484E5C 70%, #585E6E 100%)",
        "zellige-sage":     "linear-gradient(135deg, #7EA488 0%, #6A9074 40%, #5C7C64 70%, #74927A 100%)",
        "fluted-white":     "linear-gradient(160deg, #F9F7F4 0%, #EDE9E3 20%, #F6F3EE 40%, #E8E4DD 60%, #F4F1EB 80%, #EAE7E0 100%)",
        "coastal-terrazzo": "linear-gradient(135deg, #E4DAD0 0%, #D8CEC0 40%, #CEC2B0 70%, #DACED0 100%)",
        "smoked-concrete":  "linear-gradient(135deg, #8A8C90 0%, #7A7C80 40%, #686A6E 70%, #7E8084 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
