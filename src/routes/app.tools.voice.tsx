import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/app/tools/voice")({
  component: () => <ComingSoon title="Voice Generator" description="Generate natural-sounding voices from text." />,
});