import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Image models available through Lovable AI Gateway (LOVABLE_API_KEY).
export const LOVABLE_IMAGE_MODELS = [
  { id: "openai/gpt-image-2", name: "GPT Image 2", badge: "Default" },
  { id: "openai/gpt-image-1-mini", name: "GPT Image 1 Mini", badge: "Fast" },
  { id: "google/gemini-3.1-flash-image-preview", name: "Nano Banana 2", badge: "New" },
  { id: "google/gemini-2.5-flash-image", name: "Nano Banana" },
  { id: "google/gemini-3-pro-image-preview", name: "Gemini 3 Pro Image", badge: "HQ" },
] as const;

export type LovableImageModelId = (typeof LOVABLE_IMAGE_MODELS)[number]["id"];

const SIZE_MAP: Record<string, string> = {
  "1:1": "1024x1024",
  "16:9": "1536x1024",
  "9:16": "1024x1536",
  "4:3": "1536x1024",
  "3:4": "1024x1536",
};

const Input = z.object({
  model: z.string(),
  prompt: z.string().min(1).max(4000),
  aspect_ratio: z.string().optional(),
  quality: z.enum(["low", "medium", "high"]).optional(),
});

type GatewayImageResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
};

export const generateImageWithLovableAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");

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
      const size = SIZE_MAP[data.aspect_ratio ?? "1:1"] ?? "1024x1024";
      const body = {
        model: data.model,
        prompt: data.prompt,
        size,
        quality: data.quality ?? "low",
        n: 1,
      };
      const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429) throw new Error("Rate limit reached. Please retry shortly.");
      if (res.status === 402)
        throw new Error("AI credits exhausted. Add credits in Settings → Plans & credits.");

      const payload = (await res.json().catch(() => ({}))) as GatewayImageResponse;
      if (!res.ok) {
        throw new Error(payload?.error?.message || `Gateway error ${res.status}`);
      }
      const first = payload?.data?.[0];
      let outputUrl: string | null = null;
      if (first?.b64_json) outputUrl = `data:image/png;base64,${first.b64_json}`;
      else if (first?.url) outputUrl = first.url;
      if (!outputUrl) throw new Error("No image returned by model");

      await supabase
        .from("jobs")
        .update({ status: "completed", output_url: outputUrl })
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