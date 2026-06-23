import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/upscaler")({
  component: () => <ToolRunner tool="upscaler" title="Upscaler" description="Upscale and enhance image resolution with Magnific" promptPlaceholder="e.g. high detail, sharp" />,
});