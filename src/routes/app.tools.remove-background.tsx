import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/remove-background")({
  component: () => <ToolRunner tool="remove_background" title="Remove Background" description="Synchronously remove the background and return a transparent PNG" />,
});