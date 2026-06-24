import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Unified text-to-image generation through Magnific. Supports the Mystic engine
// variants (realism/fluid/zen) plus the dedicated text-to-image models
// (Flux 2, Seedream, Z-Image, Runway). Each runs server-side: POST the task,
// poll until COMPLETED, and return the final image URL directly.

type ModelDef =
  | { kind: "mystic"; engine: "realism" | "fluid" | "zen" }
  | { kind: "t2i"; path: string; plainAspect?: boolean; resolution?: boolean };

// Model registry. The key is the `id` the UI sends — for text-to-image models
// it matches the Magnific/Freepik REST slug under /ai/text-to-image/<slug>.
const MODELS: Record<string, ModelDef> = {
  realism: { kind: "mystic", engine: "realism" },
  fluid: { kind: "mystic", engine: "fluid" },
  zen: { kind: "mystic", engine: "zen" },
  // Google models: plain aspect-ratio values ("16:9"); Nano Banana Pro variants
  // also accept a resolution.
  "nano-banana-pro": {
    kind: "t2i",
    path: "/ai/text-to-image/nano-banana-pro",
    plainAspect: true,
  },
  "nano-banana-pro-flash": {
    kind: "t2i",
    path: "/ai/text-to-image/nano-banana-pro-flash",
    plainAspect: true,
  },
  "nano-banana": { kind: "t2i", path: "/ai/text-to-image/nano-banana", plainAspect: true },
  imagen3: { kind: "t2i", path: "/ai/text-to-image/imagen3", plainAspect: true },
  // Flux / Seedream / others use the Magnific aspect_ratio enum.
  "flux-2-turbo": { kind: "t2i", path: "/ai/text-to-image/flux-2-turbo" },
  "flux-pro-v1-1": { kind: "t2i", path: "/ai/text-to-image/flux-pro-v1-1" },
  "flux-dev": { kind: "t2i", path: "/ai/text-to-image/flux-dev" },
  "seedream-v4": { kind: "t2i", path: "/ai/text-to-image/seedream-v4" },
  "seedream-v4-5": { kind: "t2i", path: "/ai/text-to-image/seedream-v4-5" },
  "z-image": { kind: "t2i", path: "/ai/text-to-image/z-image" },
  runway: { kind: "t2i", path: "/ai/text-to-image/runway" },
};

// Shown in the studio's model dropdown.
export const LOVABLE_IMAGE_MODELS = [
  { id: "nano-banana-pro", name: "Google Nano Banana Pro", badge: "SOTA" },
  { id: "nano-banana-pro-flash", name: "Google Nano Banana Pro Flash", badge: "Fast" },
  { id: "nano-banana", name: "Google Nano Banana" },
  { id: "imagen3", name: "Google Imagen 3" },
  { id: "realism", name: "Mystic Realism", badge: "Default" },
  { id: "fluid", name: "Mystic Fluid", badge: "Cinematic" },
  { id: "zen", name: "Mystic Zen", badge: "Clean" },
  { id: "flux-2-turbo", name: "Flux 2 Turbo", badge: "Fast" },
  { id: "flux-pro-v1-1", name: "Flux 1.1 Pro" },
  { id: "flux-dev", name: "Flux Dev" },
  { id: "seedream-v4", name: "Seedream 4" },
  { id: "seedream-v4-5", name: "Seedream 4.5" },
  { id: "z-image", name: "Z-Image Turbo", badge: "Fast" },
  { id: "runway", name: "Runway" },
] as const;

export type LovableImageModelId = (typeof LOVABLE_IMAGE_MODELS)[number]["id"];

const MAGNIFIC_BASE = "https://api.magnific.com/v1";

// Convert internal aspect ids → Magnific aspect_ratio values (shared across the
// Mystic and text-to-image endpoints).
const ASPECT_MAP: Record<string, string> = {
  "1:1": "square_1_1",
  "3:4": "traditional_3_4",
  "4:3": "classic_4_3",
  "9:16": "social_story_9_16",
  "16:9": "widescreen_16_9",
};

const Input = z.object({
  model: z.string(),
  prompt: z.string().min(1).max(4000),
  aspect_ratio: z.string().optional(),
  quality: z.enum(["low", "medium", "high"]).optional(),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const generateImageWithLovableAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.MAGNIFIC_API_KEY;
    if (!apiKey) throw new Error("MAGNIFIC_API_KEY is not configured");

    const model = MODELS[data.model] ?? MODELS.realism;
    const aspect = ASPECT_MAP[data.aspect_ratio ?? "1:1"] ?? "square_1_1";

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        tool: "image_generation",
        status: "processing",
        prompt: data.prompt,
        params: { model: data.model, aspect_ratio: data.aspect_ratio ?? "1:1" },
      })
      .select()
      .single();
    if (jobErr) throw new Error(jobErr.message);

    try {
      // Endpoint + body differ per model family.
      let path: string;
      let body: Record<string, unknown>;
      if (model.kind === "mystic") {
        path = "/ai/mystic";
        const resolution =
          data.quality === "high" ? "4k" : data.quality === "medium" ? "2k" : "1k";
        body = {
          prompt: data.prompt,
          model: model.engine,
          engine: "automatic",
          aspect_ratio: aspect,
          resolution,
          filter_nsfw: true,
        };
      } else {
        path = model.path;
        // Google/imagen models take plain ratios ("16:9"); the rest take the
        // Magnific aspect_ratio enum ("widescreen_16_9").
        body = {
          prompt: data.prompt,
          aspect_ratio: model.plainAspect ? (data.aspect_ratio ?? "1:1") : aspect,
        };
        if (model.resolution) {
          body.resolution =
            data.quality === "high" ? "4k" : data.quality === "medium" ? "2k" : "1k";
        }
      }

      const headers = {
        "x-magnific-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      const res = await fetch(`${MAGNIFIC_BASE}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (res.status === 429) throw new Error("Rate limit reached. Please retry shortly.");
      if (res.status === 401 || res.status === 403)
        throw new Error("Invalid Magnific API key. Check MAGNIFIC_API_KEY.");

      const payload = (await res.json().catch(() => ({}))) as {
        data?: { task_id?: string; status?: string; generated?: string[] };
        error?: { message?: string };
        message?: string;
      };
      if (!res.ok) {
        // Surface the full payload so validation details (invalid_params, etc.)
        // are visible rather than just a generic "Validation error".
        const detail =
          payload?.error?.message ||
          (payload?.message && payload.message !== "Validation error"
            ? payload.message
            : JSON.stringify(payload).slice(0, 500));
        throw new Error(`Magnific error ${res.status}: ${detail}`);
      }

      const taskId = payload?.data?.task_id;
      if (!taskId) throw new Error("Magnific did not return a task id");

      // Poll until the task completes. Status lives under the same path.
      let outputUrl: string | null = null;
      const maxAttempts = 60; // ~120s total
      for (let i = 0; i < maxAttempts; i++) {
        await sleep(2000);
        const poll = await fetch(`${MAGNIFIC_BASE}${path}/${taskId}`, {
          headers: { "x-magnific-api-key": apiKey, Accept: "application/json" },
        });
        const pollPayload = (await poll.json().catch(() => ({}))) as {
          data?: { status?: string; generated?: string[] };
        };
        const status = pollPayload?.data?.status?.toUpperCase?.() ?? "";
        const generated = pollPayload?.data?.generated ?? [];
        if (status === "COMPLETED" && generated[0]) {
          outputUrl = generated[0];
          break;
        }
        if (status === "FAILED") {
          throw new Error("Magnific generation failed");
        }
      }

      if (!outputUrl) throw new Error("Generation timed out. Please retry.");

      await supabase
        .from("jobs")
        .update({ status: "completed", output_url: outputUrl, magnific_request_id: taskId })
        .eq("id", job.id);
      return { jobId: job.id, output_url: outputUrl };
    } catch (e) {
      const msg = (e as Error).message;
      await supabase
        .from("jobs")
        .update({ status: "failed", error_message: msg })
        .eq("id", job.id);
      throw new Error(msg);
    }
  });
