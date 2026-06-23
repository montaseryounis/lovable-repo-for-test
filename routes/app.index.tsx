import { createFileRoute } from "@tanstack/react-router";
import { Image, Wand2, Clock, Zap } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const quickTools = [
  { label: "Image Generation", desc: "Create images from text", icon: Image, href: "/app/tools/image-generation" },
  { label: "Upscaler", desc: "Enhance image resolution", icon: Zap, href: "/app/tools/upscaler" },
  { label: "Reimagine", desc: "Transform existing images", icon: Wand2, href: "/app/tools/reimagine" },
  { label: "History", desc: "View past creations", icon: Clock, href: "/app/history" },
];

function Dashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
        <p className="text-muted-foreground">What will you create today?</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickTools.map(({ label, desc, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            className="group flex flex-col gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </a>
        ))}
      </div>
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent creations</h2>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          No creations yet. Start with a tool above!
        </div>
      </div>
    </div>
  );
}
