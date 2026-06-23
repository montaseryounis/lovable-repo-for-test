import React from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard, Image, Wand2, Library, Clock, Compass, MessageSquare,
  BarChart2, Settings, LogOut, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const mainNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/library", label: "Library", icon: Library },
  { to: "/app/history", label: "History", icon: Clock },
  { to: "/app/spaces", label: "Spaces", icon: Image },
  { to: "/app/assistant", label: "Assistant", icon: MessageSquare },
  { to: "/app/analytics", label: "Analytics", icon: BarChart2 },
];

const tools = [
  { to: "/app/tools/image-generation", label: "Image Generation" },
  { to: "/app/tools/flux2", label: "Flux 2" },
  { to: "/app/tools/flux-kontext", label: "Flux Kontext" },
  { to: "/app/tools/seedream", label: "Seedream" },
  { to: "/app/tools/seedream-edit", label: "Seedream Edit" },
  { to: "/app/tools/z-image", label: "Z-Image" },
  { to: "/app/tools/upscaler", label: "Upscaler" },
  { to: "/app/tools/remove-background", label: "Remove BG" },
  { to: "/app/tools/generative-fill", label: "Generative Fill" },
  { to: "/app/tools/eraser", label: "Eraser" },
  { to: "/app/tools/reimagine", label: "Reimagine" },
  { to: "/app/tools/relight", label: "Relight" },
  { to: "/app/tools/style-transfer", label: "Style Transfer" },
  { to: "/app/tools/image-expand", label: "Image Expand" },
  { to: "/app/tools/video", label: "Video" },
  { to: "/app/tools/runway", label: "Runway" },
  { to: "/app/tools/voice", label: "Voice" },
];

function AppLayout() {
  const [toolsOpen, setToolsOpen] = React.useState(true);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-56 flex flex-col border-r border-border bg-sidebar shrink-0">
        <div className="px-4 py-5 border-b border-border">
          <span className="text-lg font-bold text-foreground tracking-tight">Studio</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {mainNav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors [&.active]:bg-sidebar-accent [&.active]:text-sidebar-primary"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
          <div className="pt-2">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Wand2 className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>
            {toolsOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                {tools.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="block px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors [&.active]:text-sidebar-primary"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="px-2 py-3 border-t border-border space-y-0.5">
          <Link
            to="/app/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Settings className="w-4 h-4" />
            Admin
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-md text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
