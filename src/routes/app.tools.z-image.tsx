import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/z-image")({
  component: () => <ToolRunner tool="z_image_turbo" title="Z-Image Turbo" description="Fast text-to-image generation" requiresImage={false} promptPlaceholder="Describe your image..." />,
});