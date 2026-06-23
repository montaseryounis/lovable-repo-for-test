import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/magnific-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-magnific-signature") ?? "";
        const body = await request.text();
        const secret = process.env.MAGNIFIC_WEBHOOK_SECRET;

        if (secret) {
          const expected = createHmac("sha256", secret).update(body).digest("hex");
          const sig = Buffer.from(signature);
          const exp = Buffer.from(expected);
          if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let payload: {
          task_id?: string;
          status?: string;
          generated?: string[];
          error?: string;
        };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const taskId = payload.task_id;
        if (!taskId) return new Response("Missing task_id", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const status = (payload.status ?? "").toUpperCase();
        const output = payload.generated?.[0] ?? null;

        if (status === "COMPLETED" && output) {
          await supabaseAdmin
            .from("jobs")
            .update({ status: "completed", output_url: output })
            .eq("magnific_request_id", taskId);
        } else if (status === "FAILED") {
          await supabaseAdmin
            .from("jobs")
            .update({ status: "failed", error_message: payload.error ?? "Magnific task failed" })
            .eq("magnific_request_id", taskId);
        }

        return new Response("ok");
      },
    },
  },
});