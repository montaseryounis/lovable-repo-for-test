import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/image-expand")({
  component: () => <ToolRunner tool="image_expand" title="Image Expand (Outpainting)" description="Expand image canvas with Flux Pro outpainting" promptPlaceholder="Describe the extended scene..." />,
});