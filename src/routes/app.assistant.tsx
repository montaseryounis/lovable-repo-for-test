import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/app/assistant")({
  component: () => <ComingSoon title="AI Assistant" description="Chat with an AI assistant to plan and refine your prompts." />,
});