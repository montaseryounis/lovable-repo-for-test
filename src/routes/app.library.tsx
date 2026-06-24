import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listJobs } from "@/lib/jobs.functions";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Download } from "lucide-react";

export const Route = createFileRoute("/app/library")({ component: LibraryPage });

function LibraryPage() {
  const fetchJobs = useServerFn(listJobs);
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => fetchJobs(),
    refetchInterval: 10000,
  });

  const assets = (data?.jobs ?? []).filter(
    (j) => j.status === "completed" && j.output_url,
  );
  const filtered = q
    ? assets.filter(
        (j) =>
          j.tool.toLowerCase().includes(q.toLowerCase()) ||
          (j.prompt ?? "").toLowerCase().includes(q.toLowerCase()),
      )
    : assets;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Library</h2>
          <p className="text-muted-foreground">Your saved generations</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by tool or prompt…"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">
          {assets.length === 0 ? "No saved assets yet." : "No results for your search."}
        </p>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((j) => (
            <div
              key={j.id}
              className="group relative rounded-xl overflow-hidden border border-border bg-card/50"
            >
              <img
                src={j.output_url!}
                alt={j.tool}
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-xs text-white capitalize font-medium">
                  {j.tool.replace(/_/g, " ")}
                </p>
                {j.prompt && (
                  <p className="text-[10px] text-white/80 line-clamp-2">{j.prompt}</p>
                )}
                <a
                  href={j.output_url!}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-2 right-2 size-8 rounded-md bg-black/50 hover:bg-black/70 flex items-center justify-center text-white"
                >
                  <Download className="size-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
