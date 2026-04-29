/**
 * POST /api/generate
 *
 * Accepts a bathroom configuration and an optional room photo,
 * returns an AI-generated renovation preview.
 *
 * ── MODES ────────────────────────────────────────────────────────
 *  MOCK (default)  — GOOGLE_API_KEY is missing/placeholder.
 *                    Simulates a 5-second generation with progress
 *                    steps and returns a null imageUrl so the UI
 *                    renders the premium CSS mockup with an
 *                    "AI Preview Simulated" badge.
 *
 *  REAL            — GOOGLE_API_KEY is set in .env.local.
 *                    Tries gemini-3.1-flash-image-preview first;
 *                    falls back to gemini-2.5-flash-image if the
 *                    primary model is unavailable in your region.
 *                    If a room photo is provided it is passed as
 *                    an inlineData part so the model can apply
 *                    the new finishes to the actual room.
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { buildGeminiPrompt as buildSharedPrompt } from "@/lib/buildPrompt";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";

// Vercel hobby plan caps serverless functions at 60 s.
// We set 55 s here so we have time to return a clean error rather than a raw 504.
export const maxDuration = 55;

// Allow up to 10 MB request bodies (base-64 images can be large)
export const dynamic = "force-dynamic";

// ── Types ──────────────────────────────────────────────────────────
interface GenerateRequest {
  /** Optional base-64 data URL of the uploaded room photo */
  imageBase64?: string | null;
  /** Human-readable prompt derived from the user's selections */
  prompt: string;
  /** Structured selections for logging / prompt enrichment */
  selections: {
    floorTile?:         { id: string; name: string } | null;
    wallTile?:          { id: string; name: string } | null;
    vanity:             string;
    tapware:            string;
    budget:             number;
    customNote?:        string;
    customFloorColor?:  string | null;
    customWallColor?:   string | null;
    tileStyle?:         string | null;
    structuralChanges?: {
      removeBathtub:   boolean;
      addWalkinShower: boolean;
      replaceToilet:   boolean;
      inWallCistern:   boolean;
      showerNiche:     "none" | "single" | "double";
      showerFixtures:  "single" | "dual";
    };
  };
}

interface GenerateResponse {
  success:           boolean;
  imageUrl?:         string | null;   // base-64 data URL or null (CSS mockup shown)
  description?:      string;
  mock?:             boolean;         // true when running in mock mode
  error?:            string;
  upgrade_required?: boolean;         // true when the user must upgrade
  reason?:           "auth_required" | "limit_reached";
}

/** Free tier limit */
const FREE_GENERATION_LIMIT = 3;

// ── Helpers ────────────────────────────────────────────────────────
const PLACEHOLDER_API_KEY = "your_google_api_key_here";

function isMockMode(): boolean {
  const key = process.env.GOOGLE_API_KEY;
  return !key || key === PLACEHOLDER_API_KEY || key.trim() === "";
}

/** Build the system instruction + user prompt from structured selections */
function buildGeminiPrompt(req: GenerateRequest): string {
  return buildSharedPrompt({
    imageBase64: req.imageBase64,
    selections:  req.selections,
  });
}

// ── Mock handler ───────────────────────────────────────────────────
async function handleMock(selections: GenerateRequest["selections"]): Promise<GenerateResponse> {
  // Simulate the model thinking (5 seconds total)
  await new Promise<void>((resolve) => setTimeout(resolve, 5_000));

  const floorName = selections.floorTile?.name ?? "stone tile";
  const wallName  = selections.wallTile?.name  ?? "wall tile";
  const floorDesc = selections.customFloorColor ? `${floorName} in ${selections.customFloorColor}` : floorName;
  const wallDesc  = selections.customWallColor  ? `${wallName} in ${selections.customWallColor}`   : wallName;

  return {
    success:     true,
    imageUrl:    null,       // UI will render the premium CSS mockup
    mock:        true,
    description: `Your ${wallDesc} walls and ${floorDesc} floors have been beautifully rendered. ` +
                 `The ${selections.vanity} vanity with ${selections.tapware} tapware completes ` +
                 `the look. Add your GOOGLE_API_KEY to .env.local to enable real AI image generation.`,
  };
}

// ── Models — fastest first ─────────────────────────────────────────
// Try 2.5-flash first; fall back to 3.1-flash-preview if it fails.
const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Returns true for transient capacity errors that are worth retrying */
function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("503") || msg.includes("Service Unavailable") || msg.includes("high demand");
}

// ── Real Gemini handler ────────────────────────────────────────────
async function handleReal(req: GenerateRequest): Promise<GenerateResponse> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleGenerativeAI } = require("@google/generative-ai");

  // v1beta exposes preview image-gen models
  const genAI  = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!, { apiVersion: "v1beta" });
  const prompt = buildGeminiPrompt(req);

  // Build content parts — image first (if provided), then the text prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];

  if (req.imageBase64) {
    const rawBase64 = req.imageBase64.replace(/^data:image\/[a-z+]+;base64,/, "");
    const mimeMatch = req.imageBase64.match(/^data:(image\/[a-z+]+);base64,/);
    const mimeType  = mimeMatch?.[1] ?? "image/jpeg";
    parts.push({ inlineData: { mimeType, data: rawBase64 } });
  }
  parts.push({ text: prompt });

  // Try each model; on a 503 retry once after 3 s before moving on
  let lastError = "";
  let allBusy   = true;   // tracks whether every failure was a capacity 503

  for (const modelName of MODELS) {
    const maxAttempts = 2;  // 1 initial + 1 retry on 503
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.info(`[generate] Trying ${modelName} (attempt ${attempt})`);
        const model  = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        });

        console.info(`[generate] Response received from: ${modelName}`);

        const candidate     = result.response.candidates?.[0];
        const responseParts = candidate?.content?.parts ?? [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imagePart = responseParts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textPart  = responseParts.find((p: any) => typeof p.text === "string");

        if (imagePart?.inlineData) {
          const { mimeType, data } = imagePart.inlineData;
          return {
            success:     true,
            imageUrl:    `data:${mimeType};base64,${data}`,
            description: textPart?.text ?? "Your AI renovation preview is ready.",
          };
        }

        // Returned text only — treat as non-retryable failure
        lastError = "Model returned no image";
        allBusy   = false;
        console.warn(`[generate] ${modelName} returned no image, trying next model`);
        break;

      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : "Unknown error";

        if (isRetryable(err) && attempt < maxAttempts) {
          console.warn(`[generate] ${modelName} busy (503), retrying in 3 s…`);
          await sleep(3_000);
          continue;   // retry same model
        }

        if (!isRetryable(err)) allBusy = false;
        console.warn(`[generate] ${modelName} failed: ${lastError}`);
        break;  // move to next model
      }
    }
  }

  // All attempts exhausted ─────────────────────────────────────────
  if (allBusy) {
    // Every failure was a 503 — give the user a clear, actionable message
    // instead of silently showing the CSS mockup.
    return {
      success: false,
      error:   "Gemini is experiencing high demand right now. Please try again in 30 seconds — it usually clears quickly.",
    };
  }

  // Non-capacity failure — return an error so the count is NOT incremented
  return {
    success: false,
    error:   "The AI couldn't generate an image this time. Please try again in a moment.",
  };
}


// ── Route handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    const body: GenerateRequest = await req.json();

    // ── Auth + subscription gate ──────────────────────────────────
    // Resolve the session (cookies forwarded automatically in Route Handlers)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success:          false,
        upgrade_required: true,
        reason:           "auth_required",
        error:            "Sign in to generate previews.",
      });
    }

    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (!isAdmin) {
      // Look up profile for subscription status + count
      const svc = createSupabaseServiceRoleClient();
      const { data: profile } = await svc
        .from("profiles")
        .select("generation_count, subscription_plan, subscription_expires_at")
        .eq("id", user.id)
        .single();

      const plan        = profile?.subscription_plan ?? "free";
      const expiresAt   = profile?.subscription_expires_at
        ? new Date(profile.subscription_expires_at)
        : null;
      const isPremium   = ["day_pass", "paid", "monthly", "annual"].includes(plan)
        && (!expiresAt || expiresAt > new Date());

      if (!isPremium) {
        const count = profile?.generation_count ?? 0;
        if (count >= FREE_GENERATION_LIMIT) {
          return NextResponse.json({
            success:          false,
            upgrade_required: true,
            reason:           "limit_reached",
            error:            `You've used all ${FREE_GENERATION_LIMIT} free previews. Upgrade to continue.`,
          });
        }
      }
    }
    // ── End gate ──────────────────────────────────────────────────

    // ── Run generation ────────────────────────────────────────────
    let result: GenerateResponse;
    if (isMockMode()) {
      console.info("[generate] Running in MOCK mode — set GOOGLE_API_KEY to enable real generation.");
      result = await handleMock(body.selections);
    } else {
      console.info("[generate] Calling Gemini API…");
      result = await handleReal(body);
    }

    // ── Increment count on success (free tier only, after generation) ──
    // Only increments when the generation actually completed — failed
    // calls don't cost the user a credit.
    if (result.success && !isAdmin) {
      const svc = createSupabaseServiceRoleClient();
      svc.rpc("increment_generation_count", { uid: user.id }).then(({ error }) => {
        if (error) console.warn("[generate] Failed to increment count:", error.message);
      });
    }

    return NextResponse.json(result);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate] Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
