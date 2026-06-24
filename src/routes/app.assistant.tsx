import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { improvePrompt } from "@/lib/media.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Bot, Loader2, Copy, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/assistant")({ component: AssistantPage });

function AssistantPage() {
  const improveFn = useServerFn(improvePrompt);
  const [idea, setIdea] = useState("");
  const [type, setType] = useState<"image" | "video">("image");
  const [result, setResult] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => improveFn({ data: { prompt: idea, type } }),
    onSuccess: (r) => {
      setResult(r.text);
      toast.success("Prompt improved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="size-11 rounded-xl flex items-center justify-center text-white"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Bot className="size-5" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Prompt Assistant</h2>
          <p className="text-muted-foreground">
            Turn a rough idea into a detailed, optimized prompt
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your idea</CardTitle>
          <CardDescription>Describe what you want to create, briefly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={3}
            placeholder="e.g. a cat astronaut floating in space"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Optimize for:</span>
            {(["image", "video"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "h-8 px-3 rounded-md text-sm border transition-colors capitalize",
                  type === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-muted/40 border-border hover:border-muted-foreground/40",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!idea.trim() || mutation.isPending}
            className="gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wand2 className="size-4" />
            )}
            Improve prompt
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Improved prompt</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard.writeText(result);
                toast.success("Copied");
              }}
            >
              <Copy className="size-3.5" /> Copy
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
