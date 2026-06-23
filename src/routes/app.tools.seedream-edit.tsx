import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/seedream-edit")({
  component: () => <ToolRunner tool="seedream_4_5_edit" title="Seedream 4.5 Edit" description="Image-to-image editing with 1-5 reference images" promptPlaceholder="Describe the edit..." />,
});