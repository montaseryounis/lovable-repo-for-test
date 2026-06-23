import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listJobs } from "@/lib/jobs.functions";
import {
  generateImageWithLovableAI,
  LOVABLE_IMAGE_MODELS,
} from "@/lib/ai-images.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Video,
  Pencil,
  Shapes,
  ScanSearch,
  Mic,
  Layers,
  Type,
  Wand2,
  Music,
  Loader2,
  Maximize2,
  Share2,
  X,
  ChevronDown,
  Info,
  Frame,
  Sparkles,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Model = { id: string; name: string; badge?: string };

const MODELS: Model[] = LOVABLE_IMAGE_MODELS.map((m) => ({ ...m }));

const RAIL: { id: string; name: string; icon: typeof ImageIcon }[] = [
  { id: "image_generation", name: "Image generation", icon: ImageIcon },
  { id: "video", name: "Video generation", icon: Video },
  { id: "edit", name: "Image editing", icon: Pencil },
  { id: "icon", name: "Icon generation", icon: Shapes },
  { id: "classifier", name: "AI image classifier", icon: ScanSearch },
  { id: "lip", name: "Lip Sync", icon: Mic },
  { id: "stock", name: "Stock content", icon: Layers },
  { id: "i2p", name: "Image To Prompt", icon: Type },
  { id: "improve", name: "Improve Prompt", icon: Wand2 },
  { id: "audio", name: "Audio Generation", icon: Music },
];

const ASPECTS = [
  { id: "1:1", label: "Square 1:1" },
  { id: "4:3", label: "Classic 4:3" },
  { id: "3:4", label: "Traditional 3:4" },
  { id: "16:9", label: "Widescreen 16:9" },
  { id: "9:16", label: "Story 9:16" },
];

const EXAMPLES = [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=200&h=200&fit=crop",
];

export function ImageStudio() {
  const [activeRail, setActiveRail] = useState("image_generation");
  const [panelOpen, setPanelOpen] = useState(true);
  const [prompt, setPrompt] = useState(
    "Fashion editorial photo, an redhead androgynous model posing, the scene is illuminated by soft pastel pink and purple lighting, creating a dreamy, ethereal atmosphere, denim outfit.",
  );
  const [model, setModel] = useState<Model>(MODELS[0]);
  const [aspect, setAspect] = useState("16:9");
  const [resolution, setResolution] = useState("2k");
  const [, setActiveJobId] = useState<string | null>(null);

  const qc = useQueryClient();
  const generateFn = useServerFn(generateImageWithLovableAI);
  const listFn = useServerFn(listJobs);

  const jobsQ = useQuery({
    queryKey: ["jobs"],
    queryFn: () => listFn(),
    refetchInterval: 30000,
  });

  const mutation = useMutation({
    mutationFn: async () =>
      generateFn({
        data: {
          model: model.id,
          prompt,
          aspect_ratio: aspect,
          quality: resolution === "4k" ? "high" : resolution === "2k" ? "medium" : "low",
        },
      }),
    onSuccess: (r) => {
      setActiveJobId(r.jobId);
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Generation complete");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const jobs = jobsQ.data?.jobs ?? [];
  const latest = jobs[0];
  const activeImage = latest?.output_url ?? null;
  const isProcessing = mutation.isPending;
  const activeRailItem = RAIL.find((r) => r.id === activeRail) ?? RAIL[0];

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground" dir="ltr">
      {/* Icon rail */}
      <nav className="w-[78px] shrink-0 border-r border-border bg-sidebar flex flex-col items-stretch py-2 gap-1 overflow-y-auto">
        {RAIL.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeRail;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveRail(item.id);
                setPanelOpen(true);
              }}
              className={cn(
                "mx-2 rounded-lg flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] leading-tight font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.6} />
              <span className="text-center px-1 break-words">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Parameters panel */}
      {panelOpen && (
        <aside className="w-[320px] shrink-0 border-r border-border bg-sidebar flex flex-col">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <h2 className="text-[15px] font-semibold">{activeRailItem.name}</h2>
            <button
              onClick={() => setPanelOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            <Section title="Model" info>
              <Select
                value={model.id}
                onValueChange={(id) => setModel(MODELS.find((m) => m.id === id) ?? MODELS[0])}
              >
                <SelectTrigger className="h-10 bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        {m.name}
                        {m.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                            {m.badge}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>

            <div>
              <h3 className="text-sm font-semibold mb-2.5">Run example</h3>
              <div className="flex gap-2">
                {EXAMPLES.map((src, i) => (
                  <button
                    key={i}
                    className={cn(
                      "size-16 rounded-lg overflow-hidden border-2 transition-colors",
                      i === 0
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/30",
                    )}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Parameters</h3>
              <div className="space-y-4">
                <Section title="Prompt" info>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    className="resize-none bg-muted/50 border-border text-sm"
                  />
                </Section>

                <Section title="Resolution" info>
                  <div className="flex gap-1.5">
                    {["1k", "2k", "4k"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setResolution(r)}
                        className={cn(
                          "flex-1 h-9 rounded-md text-sm font-medium border transition-colors",
                          resolution === r
                            ? "bg-foreground text-background border-foreground"
                            : "bg-muted/50 border-border hover:border-muted-foreground/40",
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </Section>

                <PanelGroup icon={Frame} label="Aspect ratio">
                  <div className="grid grid-cols-2 gap-1.5">
                    {ASPECTS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAspect(a.id)}
                        className={cn(
                          "h-9 rounded-md text-xs border transition-colors",
                          aspect === a.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "bg-muted/40 border-border hover:border-muted-foreground/40",
                        )}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </PanelGroup>

                <PanelGroup icon={Sparkles} label="Styles">
                  <p className="text-xs text-muted-foreground">No styles selected.</p>
                </PanelGroup>
                <PanelGroup icon={Users} label="Characters">
                  <p className="text-xs text-muted-foreground">No characters selected.</p>
                </PanelGroup>
                <PanelGroup icon={SlidersHorizontal} label="Advanced settings">
                  <p className="text-xs text-muted-foreground">Adherence, HDR, Creative detailing…</p>
                </PanelGroup>
              </div>
            </div>
          </div>

          <div className="border-t border-border px-4 py-3 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 bg-transparent"
                onClick={() => setPrompt("")}
              >
                Clear
              </Button>
              <Button
                className="flex-1 h-10 font-semibold"
                onClick={() => mutation.mutate()}
                disabled={!prompt || isProcessing}
              >
                {isProcessing ? <Loader2 className="size-4 animate-spin" /> : "Run"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Info className="size-3" />
              <a className="underline cursor-pointer">Costs</a> using personal API key.
            </p>
          </div>
        </aside>
      )}

      {/* Canvas */}
      <main className="flex-1 min-w-0 relative bg-[oklch(0.18_0.01_280)] flex flex-col">
        <div className="absolute top-3 left-3 z-10">
          <Button variant="secondary" size="sm" className="h-8 bg-muted/80 backdrop-blur gap-1.5">
            <Maximize2 className="size-3.5" /> Full screen
          </Button>
        </div>
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8">
            <Share2 className="size-4" />
          </Button>
          <Button variant="secondary" size="icon" className="size-8 bg-muted/80">
            <Maximize2 className="size-4" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-10 overflow-hidden">
          <Canvas imageUrl={activeImage} isProcessing={isProcessing} aspect={aspect} />
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  info,
  children,
}: {
  title: string;
  info?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        {info && <Info className="size-3 text-muted-foreground" />}
      </div>
      {children}
    </div>
  );
}

function PanelGroup({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Frame;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Collapsible className="rounded-lg border border-border bg-muted/40 overflow-hidden">
      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/60 transition-colors group">
        <span className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 pt-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function Canvas({
  imageUrl,
  isProcessing,
  aspect,
}: {
  imageUrl: string | null;
  isProcessing: boolean;
  aspect: string;
}) {
  const [w, h] = aspect.split(":").map(Number);
  const ratio = w / h;
  const checker: React.CSSProperties = {
    backgroundImage: "var(--checker)",
    backgroundSize: "var(--checker-size)",
    backgroundPosition: "var(--checker-position)",
    backgroundColor: "oklch(0.21 0.01 280)",
  };
  return (
    <div
      className="relative rounded-md overflow-hidden max-h-full max-w-full shadow-2xl"
      style={{
        ...checker,
        aspectRatio: ratio,
        width: ratio >= 1 ? "min(1100px, 100%)" : "auto",
        height: ratio < 1 ? "min(85vh, 1000px)" : "auto",
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="generated" className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/60 text-sm">
          Press
          <span className="mx-2 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold">
            Run
          </span>
          to generate
        </div>
      )}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}