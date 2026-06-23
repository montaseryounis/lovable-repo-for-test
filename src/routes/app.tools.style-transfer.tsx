import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/style-transfer")({
  component: () => <ToolRunner tool="style_transfer" title="Style Transfer" description="Transfer visual styles between images" promptPlaceholder="Describe the desired style" />,
});