import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Sun, Wand2, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Design Studio — AI tools for design teams" },
      { name: "description", content: "Unified platform for design teams: upscale, relight, generate and edit images." },
      { property: "og:title", content: "Design Studio" },
      { property: "og:description", content: "Magnific tools for your design team in one place." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60" />
          <span className="font-bold text-lg">Design Studio</span>
        </div>
        <Link to="/auth"><Button variant="outline">Sign in</Button></Link>
      </header>
      <main className="container mx-auto px-4 py-20">
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">AI Design Tools</h1>
          <p className="text-xl text-muted-foreground">A unified platform bringing the most powerful Magnific tools to your design team: upscale, relight, generate and prompt-based editing.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/auth"><Button size="lg">Get started</Button></Link>
          </div>
        </section>
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20">
          {[
            { icon: Sparkles, title: "Upscaler", desc: "Upscale & enhance" },
            { icon: Sun, title: "Relight", desc: "AI relighting" },
            { icon: Wand2, title: "Fill & Erase", desc: "Smart editing" },
            { icon: ImagePlus, title: "Generation", desc: "Text to image" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 text-center">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
