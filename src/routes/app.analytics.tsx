import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Analytics</h1>
      <p className="text-muted-foreground mb-8">Usage and performance metrics</p>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Coming soon
      </div>
    </div>
  );
}
