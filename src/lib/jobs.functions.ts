import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ToolEnum = z.enum([
  "upscaler",
  "precision_upscaler",
  "precision_upscaler_v2",
  "relight",
  "relight_v2",
  "style_transfer",
  "structure_transfer",
  "generative_fill",
  "eraser",
  "remove_background",
  "image_expand",
  "image_generation",
  "sketch_to_image",
  "flux_kontext_pro",
  "flux_2_pro",
  "flux_2_turbo",
  "flux_2_klein",
  "seedream_4",
  "seedream_4_5",
  "seedream_4_5_edit",
  "z_image_turbo",
  "reimagine_flux",
  "runway_t2i",
]);

const CreateJobInput = z.object({
  tool: ToolEnum,
  prompt: z.string().max(2000).optional().nullable(),
  input_url: z.string().url().optional().nullable(),
  params: z.record(z.string(), z.any()).optional(),
});

const MAGNIFIC_BASE = "https://api.magnific.com/v1";

function magnificPath(tool: string): { path: string; method: "POST" } {
  switch (tool) {
    case "upscaler":
      return { path: "/ai/image-upscaler", method: "POST" };
    case "precision_upscaler":
      return { path: "/ai/image-upscaler-precision", method: "POST" };
    case "precision_upscaler_v2":
      return { path: "/ai/image-upscaler-precision-v2", method: "POST" };
    case "relight":
    case "relight_v2":
      return { path: "/ai/image-relight", method: "POST" };
    case "style_transfer":
    case "structure_transfer":
      return { path: "/ai/image-style-transfer", method: "POST" };
    case "image_expand":
      return { path: "/ai/image-expand/flux-pro", method: "POST" };
    case "remove_background":
    case "eraser":
      return { path: "/ai/beta/remove-background", method: "POST" };
    case "flux_kontext_pro":
      return { path: "/ai/text-to-image/flux-kontext-pro", method: "POST" };
    case "flux_2_pro":
      return { path: "/ai/text-to-image/flux-2-pro", method: "POST" };
    case "flux_2_turbo":
      return { path: "/ai/text-to-image/flux-2-turbo", method: "POST" };
    case "flux_2_klein":
      return { path: "/ai/text-to-image/flux-2-klein", method: "POST" };
    case "seedream_4":
      return { path: "/ai/text-to-image/seedream-v4", method: "POST" };
    case "seedream_4_5":
      return { path: "/ai/text-to-image/seedream-v4-5", method: "POST" };
    case "seedream_4_5_edit":
    case "generative_fill":
      return { path: "/ai/text-to-image/seedream-v4-5-edit", method: "POST" };
    case "z_image_turbo":
      return { path: "/ai/text-to-image/z-image", method: "POST" };
    case "reimagine_flux":
      // Beta + synchronous endpoint (returns the image immediately, no task_id).
      return { path: "/ai/beta/text-to-image/reimagine-flux", method: "POST" };
    case "runway_t2i":
      return { path: "/ai/text-to-image/runway", method: "POST" };
    case "image_generation":
    case "sketch_to_image":
    default:
      return { path: "/ai/mystic", method: "POST" };
  }
}

function statusPath(tool: string, taskId: string): string {
  const { path } = magnificPath(tool);
  return `${path}/${taskId}`;
}

// Convert "1:1" → "square_1_1" for Mystic
const ASPECT_MAP: Record<string, string> = {
  "1:1": "square_1_1",
  "3:4": "traditional_3_4",
  "4:3": "classic_4_3",
  "9:16": "social_story_9_16",
  "16:9": "widescreen_16_9",
};

function normalizeMysticBody(body: Record<string, unknown>): Record<string, unknown> {
  const out = { ...body };
  if (typeof out.aspect_ratio === "string" && ASPECT_MAP[out.aspect_ratio]) {
    out.aspect_ratio = ASPECT_MAP[out.aspect_ratio];
  }
  // map internal model ids → Mystic engine variants
  if (typeof out.model === "string") {
    const m = out.model;
    if (m === "mystic" || m === "auto") out.model = "realism";
    else if (m === "cinematic") out.model = "fluid";
    else if (m === "gpt" || m === "nano" || m === "seedream") out.model = "zen";
  }
  delete out.num_images;
  delete out.creativity;
  return out;
}

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateJobInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        tool: data.tool,
        status: "pending",
        prompt: data.prompt ?? null,
        input_url: data.input_url ?? null,
        params: data.params ?? {},
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const apiKey = process.env.MAGNIFIC_API_KEY;
    if (!apiKey) {
      await supabase.from("jobs").update({
        status: "failed",
        error_message: "MAGNIFIC_API_KEY is not configured",
      }).eq("id", job.id);
      return { jobId: job.id };
    }

    try {
      const { path, method } = magnificPath(data.tool);
      // Synchronous Magnific endpoints return the result immediately (no task_id):
      // remove-background (beta) and reimagine-flux (beta).
      const isSync = path.includes("/beta/");

      let body: Record<string, unknown> = {
        ...(data.params ?? {}),
      };
      if (data.prompt) body.prompt = data.prompt;
      if (data.input_url) {
        // Per-endpoint input image field name.
        if (path === "/ai/beta/remove-background") body.image_url = data.input_url;
        else if (path === "/ai/text-to-image/flux-kontext-pro") body.input_image = data.input_url;
        else body.image = data.input_url;
      }
      if (path === "/ai/mystic") body = normalizeMysticBody(body);

      const res = await fetch(`${MAGNIFIC_BASE}${path}`, {
        method,
        headers: {
          "x-magnific-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        data?: {
          task_id?: string;
          status?: string;
          generated?: string[];
          url?: string;
          high_resolution?: string;
        };
        url?: string;
        high_resolution?: string;
        generated?: string[];
      };

      if (isSync) {
        // Result is available right away — pull the output URL from the response.
        const d = payload?.data ?? payload;
        const outputUrl =
          d?.high_resolution || d?.url || d?.generated?.[0] || null;
        await supabase.from("jobs").update({
          status: res.ok && outputUrl ? "completed" : "failed",
          output_url: outputUrl,
          error_message: res.ok && outputUrl ? null : JSON.stringify(payload).slice(0, 500),
        }).eq("id", job.id);
      } else {
        const taskId = payload?.data?.task_id ?? null;
        await supabase.from("jobs").update({
          status: res.ok && taskId ? "processing" : "failed",
          magnific_request_id: taskId,
          error_message: res.ok ? null : JSON.stringify(payload).slice(0, 500),
        }).eq("id", job.id);
      }
    } catch (e) {
      await supabase.from("jobs").update({
        status: "failed",
        error_message: (e as Error).message,
      }).eq("id", job.id);
    }
    return { jobId: job.id };
  });

const PollInput = z.object({ jobId: z.string().uuid() });

export const pollJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PollInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: job } = await supabase.from("jobs").select("*").eq("id", data.jobId).single();
    if (!job) throw new Error("Job not found");
    if (job.status === "completed" || job.status === "failed") {
      return { status: job.status, output_url: job.output_url, error: job.error_message };
    }
    if (!job.magnific_request_id) return { status: job.status };
    const apiKey = process.env.MAGNIFIC_API_KEY;
    if (!apiKey) return { status: job.status };

    const res = await fetch(`${MAGNIFIC_BASE}${statusPath(job.tool, job.magnific_request_id)}`, {
      headers: { "x-magnific-api-key": apiKey, Accept: "application/json" },
    });
    const payload = (await res.json().catch(() => ({}))) as {
      data?: { status?: string; generated?: string[] };
    };
    const status = payload?.data?.status?.toUpperCase?.() ?? "";
    const generated = payload?.data?.generated ?? [];
    if (status === "COMPLETED" && generated[0]) {
      await supabase.from("jobs").update({
        status: "completed",
        output_url: generated[0],
      }).eq("id", job.id);
      return { status: "completed" as const, output_url: generated[0] };
    }
    if (status === "FAILED") {
      await supabase.from("jobs").update({
        status: "failed",
        error_message: JSON.stringify(payload).slice(0, 500),
      }).eq("id", job.id);
      return { status: "failed" as const, error: "Magnific task failed" };
    }
    return { status: "processing" as const };
  });

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { jobs: data ?? [] };
  });

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("user_id", userId);
    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Admin only");
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
    return { profiles: profiles ?? [], roles: allRoles ?? [] };
  });

export const myRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return { roles: (data ?? []).map((r) => r.role) };
  });