import { createFileRoute } from "@tanstack/react-router";
import { ToolRunner } from "@/components/tool-runner";
export const Route = createFileRoute("/app/tools/generative-fill")({
  component: () => <ToolRunner tool="generative_fill" title="Generative Fill" description="Fill and edit parts of your image" promptPlaceholder="Describe what to add" />,
});