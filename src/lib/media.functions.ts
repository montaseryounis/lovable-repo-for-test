import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Additional Magnific-backed tools (video, audio, icons, lip-sync, prompt
// utilities, classifier, stock). These run server-side: POST the task, poll
// until it completes, and return the final result directly to the client —
// the same pattern as generateImageWithLovableAI. They intentionally do NOT
// write to the `jobs` table, because the live database's `tool_kind` enum does
// not include these tool names; adding History support requires a DB migration
// that adds those enum values first.

const MAGNIFIC_BASE = "https://api.magnific.com/v1";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function headers(apiKey: string) {
  return {
    "x-magnific-api-key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function apiKeyOrThrow(): string {
  const apiKey = process.env.MAGNIFIC_API_KEY;
  if (!apiKey) throw new Error("MAGNIFIC_API_KEY is not configured");
  return apiKey;
}

type MagnificData = Record<string, unknown> & {
  task_id?: string;
  status?: string;
  generated?: unknown;
  url?: string;
  high_resolution?: string;
};

async function parseError(res: Response): Promise<string> {
  const payload = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    message?: string;
    detail?: string;
  };
  const detail =
    payload?.error?.message ||
    payload?.message ||
    payload?.detail ||
    JSON.stringify(payload).slice(0, 300);
  if (res.status === 429) return "Rate limit reached. Please retry shortly.";
  if (res.status === 401 || res.status === 403)
    return "Invalid Magnific API key. Check MAGNIFIC_API_KEY.";
  return `Magnific error ${res.status}: ${detail}`;
}

// POST an async task, then poll its status endpoint until COMPLETED/FAILED.
// Returns the final `data` object so each caller can extract what it needs.
async function runAsyncTask(
  apiKey: string,
  path: string,
  body: Record<string, unknown>,
  { maxAttempts = 90, intervalMs = 2000 } = {},
): Promise<MagnificData> {
  const res = await fetch(`${MAGNIFIC_BASE}${path}`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));

  const payload = (await res.json().catch(() => ({}))) as { data?: MagnificData };
  const data = payload?.data ?? (payload as MagnificData);
  const taskId = data?.task_id;

  // Some endpoints return the result immediately (no task_id).
  if (!taskId) return data;

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    const poll = await fetch(`${MAGNIFIC_BASE}${path}/${taskId}`, {
      headers: { "x-magnific-api-key": apiKey, Accept: "application/json" },
    });
    const pollPayload = (await poll.json().catch(() => ({}))) as { data?: MagnificData };
    const d = pollPayload?.data ?? (pollPayload as MagnificData);
    const status = String(d?.status ?? "").toUpperCase();
    if (status === "COMPLETED") return d;
    if (status === "FAILED") throw new Error("Magnific task failed");
  }
  throw new Error("Generation timed out. Please retry.");
}

// Extract the first usable media URL from a Magnific result object.
function firstUrl(data: MagnificData): string | null {
  const g = data?.generated;
  if (Array.isArray(g) && g.length) {
    const first = g[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const o = first as Record<string, unknown>;
      return (o.url as string) || (o.high_resolution as string) || null;
    }
  }
  return (
    (data?.high_resolution as string) ||
    (data?.url as string) ||
    (data?.["audio_url"] as string) ||
    (data?.["video_url"] as string) ||
    null
  );
}

// Extract a text result (image-to-prompt / improve-prompt).
function firstText(data: MagnificData): string | null {
  const candidates = [
    data?.["prompt"],
    data?.["text"],
    data?.["result"],
    data?.["improved_prompt"],
    data?.generated,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
    if (Array.isArray(c) && typeof c[0] === "string") return c[0] as string;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Video generation                                                           */
/* -------------------------------------------------------------------------- */

export const VIDEO_MODELS = [
  { id: "kling-v3-turbo-720p", name: "Kling 3.0 Turbo · 720p" },
  { id: "kling-v3-turbo-1080p", name: "Kling 3.0 Turbo · 1080p" },
] as const;

const VideoInput = z.object({
  prompt: z.string().min(1).max(2500),
  model: z.string().optional(),
  duration: z.number().int().min(3).max(15).optional(),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
});

export const generateVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VideoInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = apiKeyOrThrow();
    const model = VIDEO_MODELS.some((m) => m.id === data.model)
      ? data.model!
      : "kling-v3-turbo-720p";
    const body: Record<string, unknown> = {
      prompt: data.prompt,
      duration: data.duration ?? 5,
      aspect_ratio: data.aspect_ratio ?? "16:9",
    };
    const result = await runAsyncTask(apiKey, `/ai/text-to-video/${model}`, body, {
      maxAttempts: 150,
      intervalMs: 3000,
    });
    const url = firstUrl(result);
    if (!url) throw new Error("Magnific did not return a video URL");
    return { output_url: url };
  });

/* -------------------------------------------------------------------------- */
/* Audio: music, sound effects, voiceover                                     */
/* -------------------------------------------------------------------------- */

export const VOICEOVER_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (calm, female)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi (strong, female)" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (warm, male)" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold (deep, male)" },
] as const;

const AudioInput = z.object({
  kind: z.enum(["music", "sound_effects", "voiceover"]),
  prompt: z.string().min(1).max(2500),
  duration: z.number().int().min(1).max(60).optional(),
  voice_id: z.string().optional(),
});

export const generateAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AudioInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = apiKeyOrThrow();
    let path: string;
    let body: Record<string, unknown>;
    if (data.kind === "music") {
      path = "/ai/music-generation";
      body = { prompt: data.prompt, duration: data.duration ?? 30 };
    } else if (data.kind === "sound_effects") {
      path = "/ai/sound-effects";
      body = { prompt: data.prompt, duration: data.duration ?? 5 };
    } else {
      path = "/ai/voiceover/elevenlabs-turbo-v2-5";
      body = {
        text: data.prompt,
        voice_id: data.voice_id || VOICEOVER_VOICES[0].id,
      };
    }
    const result = await runAsyncTask(apiKey, path, body, {
      maxAttempts: 120,
      intervalMs: 2500,
    });
    const url = firstUrl(result);
    if (!url) throw new Error("Magnific did not return an audio URL");
    return { output_url: url };
  });

/* -------------------------------------------------------------------------- */
/* Icon generation                                                            */
/* -------------------------------------------------------------------------- */

export const ICON_STYLES = ["solid", "outline", "color", "flat", "sticker"] as const;

const IconInput = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.enum(ICON_STYLES).optional(),
  format: z.enum(["png", "svg"]).optional(),
});

export const generateIcon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IconInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = apiKeyOrThrow();
    const body: Record<string, unknown> = {
      prompt: data.prompt,
      style: data.style ?? "color",
      format: data.format ?? "png",
    };
    const webhook = process.env.MAGNIFIC_WEBHOOK_URL;
    if (webhook) body.webhook_url = webhook;
    const result = await runAsyncTask(apiKey, "/ai/text-to-icon", body);
    const url = firstUrl(result);
    if (!url) throw new Error("Magnific did not return an icon URL");
    return { output_url: url };
  });

/* -------------------------------------------------------------------------- */
/* Lip Sync                                                                    */
/* -------------------------------------------------------------------------- */

const LipSyncInput = z.object({
  video_url: z.string().url(),
  audio_url: z.string().url(),
});

export const lipSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LipSyncInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = apiKeyOrThrow();
    const body = { video_url: data.video_url, audio_url: data.audio_url };
    const result = await runAsyncTask(apiKey, "/ai/lip-sync/latent-sync", body, {
      maxAttempts: 150,
      intervalMs: 3000,
    });
    const url = firstUrl(result);
    if (!url) throw new Error("Magnific did not return a video URL");
    return { output_url: url };
  });

/* -------------------------------------------------------------------------- */
/* Image editing (flux-kontext-pro, instruction-driven)                       */
/* -------------------------------------------------------------------------- */

const EditInput = z.object({
  input_image: z.string().url(),
  prompt: z.string().min(1).max(2000),
});

export const editImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EditInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = apiKeyOrThrow();
    const body = { prompt: data.prompt, input_image: data.input_image };
    const result = await runAsyncTask(apiKey, "/ai/text-to-image/flux-kontext-pro", body);
    const url = firstUrl(result);
    if (!url) throw new Error("Magnific did not return an image URL");
    return { output_url: url };
  });

/* -------------------------------------------------------------------------- */
/* Image To Prompt                                                            */
/* -------------------------------------------------------------------------- */

const ImageToPromptInput = z.object({ image_url: z.string().url() });

export const imageToPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImageToPromptInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = apiKeyOrThrow();
    const result = await runAsyncTask(apiKey, "/ai/image-to-prompt", {
      image: data.image_url,
    });
    const text = firstText(result);
    if (!text) throw new Error("Magnific did not return a prompt");
    return { text };
  });

/* -------------------------------------------------------------------------- */
/* Improve Prompt                                                             */
/* -------------------------------------------------------------------------- */

const ImprovePromptInput = z.object({
  prompt: z.string().min(1).max(2500),
  type: z.enum(["image", "video"]).optional(),
  language: z.string().optional(),
});

export const improvePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImprovePromptInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = apiKeyOrThrow();
    const result = await runAsyncTask(apiKey, "/ai/improve-prompt", {
      prompt: data.prompt,
      type: data.type ?? "image",
      language: data.language ?? "en",
    });
    const text = firstText(result);
    if (!text) throw new Error("Magnific did not return an improved prompt");
    return { text };
  });

/* -------------------------------------------------------------------------- */
/* AI Image Classifier (synchronous)                                          */
/* -------------------------------------------------------------------------- */

const ClassifyInput = z.object({ image_url: z.string().url() });

export const classifyImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ClassifyInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = apiKeyOrThrow();
    const res = await fetch(`${MAGNIFIC_BASE}/ai/classifier/image`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify({ image: data.image_url }),
    });
    if (!res.ok) throw new Error(await parseError(res));
    const payload = (await res.json().catch(() => ({}))) as {
      data?: Array<{ class_name?: string; probability?: number }>;
    };
    const raw = Array.isArray(payload?.data) ? payload.data : [];
    const classes = raw
      .map((c) => ({
        class_name: String(c.class_name ?? "unknown"),
        probability: Number(c.probability ?? 0),
      }))
      .sort((a, b) => b.probability - a.probability);
    return { classes };
  });

/* -------------------------------------------------------------------------- */
/* Stock content search                                                       */
/* -------------------------------------------------------------------------- */

const StockInput = z.object({
  query: z.string().min(1).max(200),
  type: z.enum(["resources", "icons", "videos"]).optional(),
  page: z.number().int().min(1).max(50).optional(),
});

export const searchStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StockInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = apiKeyOrThrow();
    const type = data.type ?? "resources";
    const params = new URLSearchParams({
      term: data.query,
      page: String(data.page ?? 1),
      limit: "30",
    });
    const res = await fetch(`${MAGNIFIC_BASE}/${type}?${params.toString()}`, {
      headers: { "x-magnific-api-key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(await parseError(res));
    const payload = (await res.json().catch(() => ({}))) as {
      data?: Array<Record<string, unknown>>;
    };
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    const items = rows
      .map((r) => {
        const thumb =
          (r["thumbnail"] as string) ||
          (r["preview"] as string) ||
          ((r["image"] as Record<string, unknown>)?.["source"] as Record<string, unknown>)?.[
            "url"
          ] ||
          ((r["thumbnails"] as Record<string, unknown>)?.["small"] as string) ||
          null;
        return {
          id: String(r["id"] ?? ""),
          title: String(r["title"] ?? r["name"] ?? "Untitled"),
          thumbnail: (thumb as string) ?? null,
          url: (r["url"] as string) ?? null,
        };
      })
      .filter((i) => i.thumbnail);
    return { items };
  });
