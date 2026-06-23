import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/assistant")({
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Assistant</h1>
      <p className="text-muted-foreground mb-8">AI-powered creative assistant</p>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Coming soon
      </div>
    </div>
  );
}
