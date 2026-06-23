import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/flux2")({
  component: () => <ToolRunner tool="flux_2_pro" title="Flux 2 Pro" description="High-quality text-to-image generation with Flux 2" requiresImage={false} promptPlaceholder="A cinematic shot of..." />,
});