import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/seedream")({
  component: () => <ToolRunner tool="seedream_4_5" title="Seedream 4.5" description="ByteDance Seedream 4.5 text-to-image" requiresImage={false} promptPlaceholder="Describe your scene..." />,
});