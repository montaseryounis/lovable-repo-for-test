import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listJobs } from "@/lib/jobs.functions";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/history")({ component: HistoryPage });

function statusVariant(s: string) {
  return s === "completed" ? "default" : s === "failed" ? "destructive" : "secondary";
}

function HistoryPage() {
  const fetchJobs = useServerFn(listJobs);
  const { data, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => fetchJobs(),
    refetchInterval: 5000,
  });

  const jobs = data?.jobs ?? [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">History</h2>
        <p className="text-muted-foreground">All previous jobs</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground">No jobs yet — create something to see it here.</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="rounded-xl border border-border bg-card/60 overflow-hidden group"
            >
              <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden relative">
                {j.output_url ? (
                  <a href={j.output_url} target="_blank" rel="noreferrer" className="block w-full h-full">
                    <img
                      src={j.output_url}
                      alt={j.tool}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </a>
                ) : j.status === "failed" ? (
                  <span className="text-xs text-destructive px-3 text-center">
                    {j.error_message ?? "Failed"}
                  </span>
                ) : j.status === "completed" ? (
                  <ImageIcon className="size-8 text-muted-foreground/40" />
                ) : (
                  <Loader2 className="size-6 animate-spin text-primary" />
                )}
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium capitalize truncate">
                    {j.tool.replace(/_/g, " ")}
                  </span>
                  <Badge variant={statusVariant(j.status)} className="shrink-0">
                    {j.status}
                  </Badge>
                </div>
                {j.prompt && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{j.prompt}</p>
                )}
                <p className="text-[10px] text-muted-foreground/70">
                  {new Date(j.created_at).toLocaleString("en")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
