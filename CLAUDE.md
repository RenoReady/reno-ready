# Reno Ready — Project Guide

## Brand

**Name:** Reno Ready
**Tagline:** Renovation planning made simple.

### Colors

| Name                  | Hex       | Tailwind Token       |
|-----------------------|-----------|----------------------|
| Slate Charcoal        | `#2C3E50` | `charcoal` / `text-charcoal` |
| Australian Terracotta | `#D27D5E` | `terracotta` / `bg-terracotta` |

Use **Slate Charcoal** for headings, body text, and UI chrome.
Use **Australian Terracotta** for CTAs, highlights, and accent elements.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v3
- **Font:** Geist (via `next/font/google`)

## Project Structure

```
src/
  app/
    layout.tsx   # Root layout with font + metadata
    page.tsx     # Home page
    globals.css  # Tailwind directives + CSS vars
```

## Conventions

- All pages and components go under `src/app` (App Router).
- Use the `@/*` alias for imports (maps to `src/`).
- Keep components co-located with their route unless shared across multiple routes.
- No `use client` unless interactivity requires it — prefer server components.

## Getting Started

```bash
npm install
npm run dev
```
