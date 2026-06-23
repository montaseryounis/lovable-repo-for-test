import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/app/explore")({
  component: () => <ComingSoon title="Explore" description="Discover community creations and trending prompts." />,
});