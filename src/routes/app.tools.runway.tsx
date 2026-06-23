import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/runway")({
  component: () => <ToolRunner tool="runway_t2i" title="RunWay T2I" description="RunWay text-to-image generation" requiresImage={false} promptPlaceholder="Describe your image..." />,
});