import { createFileRoute } from "@tanstack/react-router";
import { ImageStudio } from "@/components/image-studio";

export const Route = createFileRoute("/app/tools/video")({
  component: () => <ImageStudio initialRail="video" />,
});
