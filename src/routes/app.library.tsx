import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/app/library")({
  component: () => <ComingSoon title="Library" description="Your saved generations and assets will appear here." />,
});