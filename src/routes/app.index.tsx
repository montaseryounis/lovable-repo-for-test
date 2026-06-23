import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Sun, Wand2, Eraser, ImagePlus, History } from "lucide-react";

export const Route = createFileRoute("/app/")({ component: Dashboard });

const cards = [
  { title: "Upscaler", desc: "Upscale & enhance images", url: "/app/tools/upscaler", icon: Sparkles },
  { title: "Relight", desc: "AI relighting", url: "/app/tools/relight", icon: Sun },
  { title: "Generative Fill", desc: "AI-powered fill", url: "/app/tools/generative-fill", icon: Wand2 },
  { title: "Eraser", desc: "Remove objects", url: "/app/tools/eraser", icon: Eraser },
  { title: "Style Transfer", desc: "Transfer visual styles", url: "/app/tools/style-transfer", icon: Sparkles },
  { title: "Image Generation", desc: "Text to image", url: "/app/tools/image-generation", icon: ImagePlus },
  { title: "History", desc: "All previous jobs", url: "/app/history", icon: History },
];

function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-4xl font-bold tracking-tight">Welcome to Magnific Studio</h2>
        <p className="text-muted-foreground mt-1">Pick a tool to start creating</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.url} to={c.url}>
            <Card className="hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer h-full bg-card/60">
              <CardHeader>
                <div className="size-11 rounded-xl flex items-center justify-center mb-2 text-white" style={{ background: "var(--gradient-primary)" }}>
                  <c.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{c.title}</CardTitle>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}