import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/library")({
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Library</h1>
      <p className="text-muted-foreground mb-8">Your saved assets and styles</p>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Coming soon
      </div>
    </div>
  );
}
