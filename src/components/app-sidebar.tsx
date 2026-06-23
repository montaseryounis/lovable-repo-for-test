import { Link, useRouterState } from "@tanstack/react-router";
import {
  Plus,
  Home,
  Search,
  Compass,
  FolderOpen,
  Library,
  ImageIcon,
  Video,
  Mic,
  Bot,
  Sparkles,
  Sun,
  Wand2,
  Eraser,
  History,
  Shield,
  Layers,
  Maximize2,
  Scissors,
  BarChart3,
  Palette,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

type Item = { title: string; url: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

const rail: Item[] = [
  { title: "Create", url: "/app/tools/image-generation", icon: Plus },
  { title: "Home", url: "/app", icon: Home },
  { title: "Search", url: "/app/library", icon: Search },
  { title: "Explore", url: "/app/explore", icon: Compass },
  { title: "Projects", url: "/app/history", icon: FolderOpen },
  { title: "Library", url: "/app/library", icon: Library },
];

const generators: Item[] = [
  { title: "Spaces", url: "/app/spaces", icon: Layers },
  { title: "Image Generator", url: "/app/tools/image-generation", icon: ImageIcon },
  { title: "Video Generator", url: "/app/tools/video", icon: Video },
  { title: "Voice Generator", url: "/app/tools/voice", icon: Mic },
  { title: "AI Assistant", url: "/app/assistant", icon: Bot },
];

const tools: Item[] = [
  { title: "Upscaler", url: "/app/tools/upscaler", icon: Sparkles },
  { title: "Relight", url: "/app/tools/relight", icon: Sun },
  { title: "Generative Fill", url: "/app/tools/generative-fill", icon: Wand2 },
  { title: "Style Transfer", url: "/app/tools/style-transfer", icon: Sparkles },
  { title: "Eraser", url: "/app/tools/eraser", icon: Eraser },
  { title: "Image Expand", url: "/app/tools/image-expand", icon: Maximize2 },
  { title: "Remove BG", url: "/app/tools/remove-background", icon: Scissors },
  { title: "Flux Kontext", url: "/app/tools/flux-kontext", icon: Palette },
  { title: "Flux 2 Pro", url: "/app/tools/flux2", icon: Sparkles },
  { title: "Seedream 4.5", url: "/app/tools/seedream", icon: Sparkles },
  { title: "Seedream Edit", url: "/app/tools/seedream-edit", icon: Wand2 },
  { title: "Z-Image Turbo", url: "/app/tools/z-image", icon: Sparkles },
  { title: "Reimagine", url: "/app/tools/reimagine", icon: Palette },
  { title: "RunWay T2I", url: "/app/tools/runway", icon: Sparkles },
];

const account: Item[] = [
  { title: "History", url: "/app/history", icon: History },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { title: "User Management", url: "/app/admin", icon: Shield },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  return (
    <aside className="flex h-screen sticky top-0 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground" dir="ltr">
      {/* Icon rail */}
      <div className="w-14 flex flex-col items-center gap-1 py-3 border-r border-sidebar-border">
        <Link
          to="/app/tools/image-generation"
          className="size-9 rounded-xl mb-2 flex items-center justify-center text-white shadow-lg"
          style={{ background: "var(--gradient-primary)" }}
          title="Create"
        >
          <Plus className="size-5" />
        </Link>
        {rail.slice(1).map((it) => (
          <Link
            key={it.title}
            to={it.url}
            title={it.title}
            className={cn(
              "size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors",
              isActive(it.url) && "bg-sidebar-accent text-foreground",
            )}
          >
            <it.icon className="size-[18px]" />
          </Link>
        ))}
      </div>

      {/* Label panel */}
      <div className="w-56 flex flex-col gap-4 px-3 py-4 overflow-y-auto">
        <div className="flex items-center gap-2 px-2">
          <div className="size-7 rounded-md" style={{ background: "var(--gradient-primary)" }} />
          <span className="font-bold tracking-tight">Magnific</span>
        </div>

        <Section title="Generate" items={generators} isActive={isActive} />
        <Section title="Tools" items={tools} isActive={isActive} />
        <Section title="Account" items={account} isActive={isActive} />

        <div className="mt-auto pt-4">
          <div className="rounded-xl border border-sidebar-border bg-card/40 p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-semibold">2,450</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-2/3" style={{ background: "var(--gradient-primary)" }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Section({
  title,
  items,
  isActive,
}: {
  title: string;
  items: Item[];
  isActive: (p: string) => boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground/70">{title}</div>
      {items.map((it) => (
        <Link
          key={it.title}
          to={it.url}
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-foreground transition-colors",
            isActive(it.url) && "bg-sidebar-accent text-foreground",
          )}
        >
          <it.icon className="size-[15px]" />
          <span className="truncate">{it.title}</span>
        </Link>
      ))}
    </div>
  );
}