import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdminData } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdminData) throw new Error("Admin only");

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("tool, status, created_at, user_id");
    if (error) throw new Error(error.message);

    const total = jobs?.length ?? 0;
    const byStatus: Record<string, number> = {};
    const byTool: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    for (const j of jobs ?? []) {
      byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
      byTool[j.tool] = (byTool[j.tool] ?? 0) + 1;
      byUser[j.user_id] = (byUser[j.user_id] ?? 0) + 1;
    }
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last7d = (jobs ?? []).filter(
      (j) => new Date(j.created_at).getTime() >= since,
    ).length;

    return {
      total,
      last7d,
      uniqueUsers: Object.keys(byUser).length,
      byStatus,
      byTool,
    };
  });