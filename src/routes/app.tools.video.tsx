import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/app/tools/video")({
  component: () => <ComingSoon title="Video Generator" description="Generate videos from text or images." />,
});