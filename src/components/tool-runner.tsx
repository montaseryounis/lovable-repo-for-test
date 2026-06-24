import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createJob, pollJob } from "@/lib/jobs.functions";
import { Upload, Loader2, ImageIcon, Download } from "lucide-react";

type ToolName =
  | "upscaler" | "precision_upscaler" | "precision_upscaler_v2"
  | "relight" | "relight_v2"
  | "style_transfer" | "structure_transfer" | "generative_fill"
  | "eraser" | "remove_background" | "image_expand"
  | "image_generation" | "sketch_to_image"
  | "flux_kontext_pro" | "flux_2_pro" | "flux_2_turbo" | "flux_2_klein"
  | "seedream_4" | "seedream_4_5" | "seedream_4_5_edit"
  | "z_image_turbo" | "reimagine_flux" | "runway_t2i";

type Props = {
  tool: ToolName;
  title: string;
  description: string;
  requiresImage?: boolean;
  promptPlaceholder?: string;
};

export function ToolRunner({ tool, title, description, requiresImage = true, promptPlaceholder }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const runFn = useServerFn(createJob);
  const pollFn = useServerFn(pollJob);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () =>
      runFn({ data: { tool, prompt: prompt || null, input_url: inputUrl, params: {} } }),
    onSuccess: (r) => {
      setJobId(r.jobId);
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job started");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Poll the job until it finishes.
  const pollQ = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => pollFn({ data: { jobId: jobId! } }),
    enabled: !!jobId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "completed" || s === "failed" ? false : 2500;
    },
  });

  const status = pollQ.data?.status;
  const outputUrl = pollQ.data?.output_url ?? null;
  const jobError = pollQ.data?.error ?? null;
  const isRunning = mutation.isPending || (!!jobId && status !== "completed" && status !== "failed");

  const onFile = async (f: File) => {
    setPreviewUrl(URL.createObjectURL(f));
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Please sign in first"); setUploading(false); return; }
    const path = `${u.user.id}/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("magnific").upload(path, f);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: signed } = await supabase.storage.from("magnific").createSignedUrl(path, 60 * 60 * 24);
    setInputUrl(signed?.signedUrl ?? null);
    setUploading(false);
    toast.success("Image uploaded");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Enter the inputs and start processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiresImage && (
              <div className="space-y-2">
                <Label>Input image</Label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" className="max-h-48 object-contain rounded" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to choose an image</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                </label>
                {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label>Prompt {requiresImage ? "(optional)" : ""}</Label>
              <Textarea placeholder={promptPlaceholder ?? "Describe what you want..."} value={prompt}
                onChange={(e) => setPrompt(e.target.value)} rows={4} />
            </div>
            <Button className="w-full" size="lg"
              disabled={isRunning || uploading || (requiresImage && !inputUrl) || (!requiresImage && !prompt)}
              onClick={() => mutation.mutate()}>
              {isRunning ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing</>) : "Start"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              {status === "completed" ? "Done" : status === "failed" ? "Failed" : isRunning ? "Processing…" : "Appears here after processing"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden relative">
              {outputUrl ? (
                <img src={outputUrl} alt="result" className="w-full h-full object-contain" />
              ) : isRunning ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : jobError ? (
                <p className="text-sm text-destructive px-4 text-center">{jobError}</p>
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
              )}
            </div>
            {outputUrl && (
              <a href={outputUrl} download target="_blank" rel="noreferrer" className="inline-block mt-3">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
