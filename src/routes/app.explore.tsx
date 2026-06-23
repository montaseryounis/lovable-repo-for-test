import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Explore</h1>
      <p className="text-muted-foreground mb-8">Discover community creations</p>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Coming soon
      </div>
    </div>
  );
}
