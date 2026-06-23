import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createJob } from "@/lib/jobs.functions";
import { Upload, Loader2, ImageIcon } from "lucide-react";

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
  const runFn = useServerFn(createJob);

  const mutation = useMutation({
    mutationFn: async () =>
      runFn({ data: { tool, prompt: prompt || null, input_url: inputUrl, params: {} } }),
    onSuccess: () => toast.success("Job created"),
    onError: (e: Error) => toast.error(e.message),
  });

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
              disabled={mutation.isPending || uploading || (requiresImage && !inputUrl) || (!requiresImage && !prompt)}
              onClick={() => mutation.mutate()}>
              {mutation.isPending ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing</>) : "Start"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Will appear here after processing (track progress in History)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square rounded-lg border bg-muted/30 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
            {mutation.data && (
              <p className="text-xs text-muted-foreground mt-3">
                Job #{mutation.data.jobId.slice(0, 8)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}