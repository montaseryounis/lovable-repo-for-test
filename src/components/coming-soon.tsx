import { Sparkles } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8 max-w-3xl">
      <div className="rounded-2xl border bg-card/60 p-10 text-center space-y-3">
        <div
          className="mx-auto size-12 rounded-xl flex items-center justify-center text-white"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}