import { createFileRoute } from "@tanstack/react-router";
import { SpacesPage } from "@/components/spaces-page";

export const Route = createFileRoute("/app/spaces")({
  component: SpacesPage,
});