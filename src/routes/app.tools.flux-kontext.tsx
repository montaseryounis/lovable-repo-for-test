import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/flux-kontext")({
  component: () => <ToolRunner tool="flux_kontext_pro" title="Flux Kontext Pro" description="Image-to-image generation with text and reference image" promptPlaceholder="Describe the edit..." />,
});