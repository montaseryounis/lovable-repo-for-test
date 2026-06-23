import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/relight")({
  component: () => <ToolRunner tool="relight" title="Relight" description="Professional AI relighting for your images" promptPlaceholder="e.g. golden hour" />,
});