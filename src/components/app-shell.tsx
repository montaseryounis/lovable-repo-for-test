import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-background text-foreground" dir="ltr">
      <AppSidebar />
      <main className="flex-1 min-w-0">{children}</main>
      <Toaster />
    </div>
  );
}