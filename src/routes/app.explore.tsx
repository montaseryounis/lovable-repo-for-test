import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchStock } from "@/lib/media.functions";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/explore")({ component: ExplorePage });

const SUGGESTIONS = ["nature", "abstract", "technology", "portrait", "city", "minimal"];

function ExplorePage() {
  const stockFn = useServerFn(searchStock);
  const [query, setQuery] = useState("trending");
  const [input, setInput] = useState("");
  const [type, setType] = useState<"resources" | "icons" | "videos">("resources");

  const { data, isLoading, error } = useQuery({
    queryKey: ["explore", query, type],
    queryFn: () => stockFn({ data: { query, type } }),
    retry: false,
  });

  const items = data?.items ?? [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Explore</h2>
        <p className="text-muted-foreground">Discover stock photos, icons and videos</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) setQuery(input.trim());
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search stock content…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {(
            [
              ["resources", "Photos"],
              ["icons", "Icons"],
              ["videos", "Videos"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={cn(
                "h-9 px-3 rounded-md text-sm border transition-colors",
                type === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-muted/40 border-border hover:border-muted-foreground/40",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setInput(s);
              setQuery(s);
            }}
            className="text-xs px-3 py-1 rounded-full border border-border bg-muted/40 hover:border-primary/50 capitalize"
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <p className="text-destructive">{(error as Error).message}</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No results. Try another search.</p>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((it) => (
            <a
              key={it.id}
              href={it.url ?? it.thumbnail ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl overflow-hidden border border-border bg-card/50 hover:border-primary/50 transition-colors"
            >
              <img
                src={it.thumbnail ?? ""}
                alt={it.title}
                className="w-full aspect-square object-cover"
              />
              <p className="text-[11px] truncate px-2 py-1.5 text-muted-foreground">{it.title}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
