import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/eraser")({
  component: () => <ToolRunner tool="eraser" title="Eraser" description="Remove unwanted objects" promptPlaceholder="Describe what to remove" />,
});