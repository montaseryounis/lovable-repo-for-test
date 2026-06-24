import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Image generation now runs through Magnific's Mystic engine (MAGNIFIC_API_KEY),
// the same provider used by the other tools in jobs.functions.ts. This replaces
// the previous Lovable AI Gateway path (LOVABLE_API_KEY), which is only available
// inside Lovable Cloud.
export const LOVABLE_IMAGE_MODELS = [
  { id: "realism", name: "Mystic Realism", badge: "Default" },
  { id: "fluid", name: "Mystic Fluid", badge: "Cinematic" },
  { id: "zen", name: "Mystic Zen", badge: "Clean" },
] as const;

export type LovableImageModelId = (typeof LOVABLE_IMAGE_MODELS)[number]["id"];

const MAGNIFIC_BASE = "https://api.magnific.com/v1";

// Convert internal aspect ids → Mystic aspect_ratio values.
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

const VALID_ENGINES = new Set(["realism", "fluid", "zen"]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const generateImageWithLovableAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.MAGNIFIC_API_KEY;
    if (!apiKey) throw new Error("MAGNIFIC_API_KEY is not configured");

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
      const engine = VALID_ENGINES.has(data.model) ? data.model : "realism";
      const body: Record<string, unknown> = {
        prompt: data.prompt,
        model: engine,
        aspect_ratio: ASPECT_MAP[data.aspect_ratio ?? "1:1"] ?? "square_1_1",
        num_images: 1,
      };

      const headers = {
        "x-magnific-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      const res = await fetch(`${MAGNIFIC_BASE}/ai/mystic`, {
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
      };
      if (!res.ok) {
        throw new Error(payload?.error?.message || `Magnific error ${res.status}`);
      }

      const taskId = payload?.data?.task_id;
      if (!taskId) throw new Error("Magnific did not return a task id");

      // Poll until the task completes (Mystic generations take a few seconds).
      let outputUrl: string | null = null;
      const maxAttempts = 60; // ~120s total
      for (let i = 0; i < maxAttempts; i++) {
        await sleep(2000);
        const poll = await fetch(`${MAGNIFIC_BASE}/ai/mystic/${taskId}`, {
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
