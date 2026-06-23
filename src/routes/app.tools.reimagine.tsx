import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/reimagine")({
  component: () => <ToolRunner tool="reimagine_flux" title="Reimagine Flux" description="Reimagine an image with Flux" promptPlaceholder="Optional guidance..." />,
});