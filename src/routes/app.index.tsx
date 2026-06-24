import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ImageIcon,
  Video,
  Mic,
  Layers,
  Sparkles,
  Sun,
  Wand2,
  Eraser,
  Scissors,
  Maximize2,
  Library,
  History,
  Compass,
  Bot,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/app/")({ component: Dashboard });

type Tile = { title: string; desc: string; url: string; icon: LucideIcon };

const groups: { label: string; cards: Tile[] }[] = [
  {
    label: "Create",
    cards: [
      { title: "Image Studio", desc: "Generate images, video, audio, icons & more", url: "/app/tools/image-generation", icon: ImageIcon },
      { title: "Video Generator", desc: "Text to video", url: "/app/tools/video", icon: Video },
      { title: "Voice Generator", desc: "Text to speech & audio", url: "/app/tools/voice", icon: Mic },
      { title: "Spaces", desc: "Visual node workflows", url: "/app/spaces", icon: Layers },
    ],
  },
  {
    label: "Edit & Enhance",
    cards: [
      { title: "Upscaler", desc: "Upscale & enhance images", url: "/app/tools/upscaler", icon: Sparkles },
      { title: "Relight", desc: "AI relighting", url: "/app/tools/relight", icon: Sun },
      { title: "Generative Fill", desc: "AI-powered fill", url: "/app/tools/generative-fill", icon: Wand2 },
      { title: "Style Transfer", desc: "Transfer visual styles", url: "/app/tools/style-transfer", icon: Sparkles },
      { title: "Eraser", desc: "Remove objects", url: "/app/tools/eraser", icon: Eraser },
      { title: "Remove BG", desc: "Transparent background", url: "/app/tools/remove-background", icon: Scissors },
      { title: "Image Expand", desc: "Outpaint & extend", url: "/app/tools/image-expand", icon: Maximize2 },
    ],
  },
  {
    label: "Workspace",
    cards: [
      { title: "Library", desc: "Your saved generations", url: "/app/library", icon: Library },
      { title: "History", desc: "All previous jobs", url: "/app/history", icon: History },
      { title: "Explore", desc: "Browse stock content", url: "/app/explore", icon: Compass },
      { title: "Prompt Assistant", desc: "Refine your prompts", url: "/app/assistant", icon: Bot },
      { title: "Analytics", desc: "Usage across tools", url: "/app/analytics", icon: BarChart3 },
    ],
  },
];

function Dashboard() {
  return (
    <div className="p-8 space-y-10">
      <div>
        <h2 className="text-4xl font-bold tracking-tight">Welcome to Magnific Studio</h2>
        <p className="text-muted-foreground mt-1">Pick a tool to start creating</p>
      </div>

      {groups.map((g) => (
        <section key={g.label} className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            {g.label}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.cards.map((c) => (
              <Link key={c.url} to={c.url}>
                <Card className="hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer h-full bg-card/60">
                  <CardHeader>
                    <div
                      className="size-11 rounded-xl flex items-center justify-center mb-2 text-white"
                      style={{ background: "var(--gradient-primary)" }}
                    >
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
        </section>
      ))}
    </div>
  );
}
