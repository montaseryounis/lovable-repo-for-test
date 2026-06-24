import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  generateImageWithLovableAI,
  LOVABLE_IMAGE_MODELS,
} from "@/lib/ai-images.functions";
import {
  generateVideo,
  generateAudio,
  generateIcon,
  lipSync,
  editImage,
  imageToPrompt,
  improvePrompt,
  classifyImage,
  searchStock,
  VIDEO_MODELS,
  VOICEOVER_VOICES,
  ICON_STYLES,
} from "@/lib/media.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Info,
  Upload,
  Copy,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RailId =
  | "image_generation"
  | "video"
  | "edit"
  | "icon"
  | "classifier"
  | "lip"
  | "stock"
  | "i2p"
  | "improve"
  | "audio";

const RAIL: { id: RailId; name: string; icon: typeof ImageIcon }[] = [
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

const IMAGE_MODELS = LOVABLE_IMAGE_MODELS.map((m) => ({ ...m }));

const IMAGE_ASPECTS = [
  { id: "1:1", label: "1:1" },
  { id: "4:3", label: "4:3" },
  { id: "3:4", label: "3:4" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
];
const VIDEO_ASPECTS = [
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "1:1", label: "1:1" },
];

type ResultKind = "image" | "video" | "audio" | "text" | "classes" | "stock" | null;
type ClassRow = { class_name: string; probability: number };
type StockItem = { id: string; title: string; thumbnail: string | null; url: string | null };

type Result = {
  kind: ResultKind;
  url?: string | null;
  text?: string | null;
  classes?: ClassRow[];
  items?: StockItem[];
};

const PROMPT_DEFAULTS: Partial<Record<RailId, string>> = {
  image_generation:
    "Fashion editorial photo, a redhead androgynous model posing, soft pastel pink and purple lighting, dreamy ethereal atmosphere, denim outfit.",
  video: "Cinematic shot of a paper boat sailing down a rain-soaked city street, slow motion.",
  edit: "Change the background to a sunny beach at golden hour.",
  icon: "A friendly robot mascot, rounded shapes.",
  improve: "a cat on a sofa",
  audio: "Uplifting cinematic orchestral track with strings and piano.",
};

export function ImageStudio({ initialRail = "image_generation" }: { initialRail?: RailId }) {
  const [activeRail, setActiveRail] = useState<RailId>(initialRail);
  const [panelOpen, setPanelOpen] = useState(true);

  // Shared inputs
  const [prompt, setPrompt] = useState(PROMPT_DEFAULTS[initialRail] ?? "");
  const [model, setModel] = useState(IMAGE_MODELS[0]);
  const [aspect, setAspect] = useState("16:9");
  const [resolution, setResolution] = useState("2k");

  // Tool-specific inputs
  const [videoModel, setVideoModel] = useState<string>(VIDEO_MODELS[0].id);
  const [duration, setDuration] = useState(5);
  const [iconStyle, setIconStyle] = useState<(typeof ICON_STYLES)[number]>("color");
  const [iconFormat, setIconFormat] = useState<"png" | "svg">("png");
  const [audioKind, setAudioKind] = useState<"music" | "sound_effects" | "voiceover">("music");
  const [voiceId, setVoiceId] = useState<string>(VOICEOVER_VOICES[0].id);
  const [improveType, setImproveType] = useState<"image" | "video">("image");
  const [stockType, setStockType] = useState<"resources" | "icons" | "videos">("resources");

  // Uploaded media (signed URLs)
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lipVideoUrl, setLipVideoUrl] = useState<string | null>(null);
  const [lipAudioUrl, setLipAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [result, setResult] = useState<Result>({ kind: null });

  // Server fns
  const imageFn = useServerFn(generateImageWithLovableAI);
  const videoFn = useServerFn(generateVideo);
  const audioFn = useServerFn(generateAudio);
  const iconFn = useServerFn(generateIcon);
  const lipFn = useServerFn(lipSync);
  const editFn = useServerFn(editImage);
  const i2pFn = useServerFn(imageToPrompt);
  const improveFn = useServerFn(improvePrompt);
  const classifyFn = useServerFn(classifyImage);
  const stockFn = useServerFn(searchStock);

  const activeRailItem = RAIL.find((r) => r.id === activeRail) ?? RAIL[0];

  const uploadToStorage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        toast.error("Please sign in first");
        return null;
      }
      const path = `${u.user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("magnific").upload(path, file);
      if (error) {
        toast.error(error.message);
        return null;
      }
      const { data: signed } = await supabase.storage
        .from("magnific")
        .createSignedUrl(path, 60 * 60 * 24);
      return signed?.signedUrl ?? null;
    } finally {
      setUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (): Promise<Result> => {
      switch (activeRail) {
        case "image_generation": {
          const r = await imageFn({
            data: {
              model: model.id,
              prompt,
              aspect_ratio: aspect,
              quality: resolution === "4k" ? "high" : resolution === "2k" ? "medium" : "low",
            },
          });
          return { kind: "image", url: r.output_url };
        }
        case "video": {
          const r = await videoFn({
            data: {
              prompt,
              model: videoModel,
              duration,
              aspect_ratio: (["16:9", "9:16", "1:1"].includes(aspect)
                ? aspect
                : "16:9") as "16:9" | "9:16" | "1:1",
            },
          });
          return { kind: "video", url: r.output_url };
        }
        case "edit": {
          if (!imageUrl) throw new Error("Please upload an image first");
          const r = await editFn({ data: { input_image: imageUrl, prompt } });
          return { kind: "image", url: r.output_url };
        }
        case "icon": {
          const r = await iconFn({
            data: { prompt, style: iconStyle, format: iconFormat },
          });
          return { kind: "image", url: r.output_url };
        }
        case "classifier": {
          if (!imageUrl) throw new Error("Please upload an image first");
          const r = await classifyFn({ data: { image_url: imageUrl } });
          return { kind: "classes", classes: r.classes };
        }
        case "lip": {
          if (!lipVideoUrl || !lipAudioUrl)
            throw new Error("Please upload both a video and an audio file");
          const r = await lipFn({ data: { video_url: lipVideoUrl, audio_url: lipAudioUrl } });
          return { kind: "video", url: r.output_url };
        }
        case "stock": {
          const r = await stockFn({ data: { query: prompt, type: stockType } });
          return { kind: "stock", items: r.items };
        }
        case "i2p": {
          if (!imageUrl) throw new Error("Please upload an image first");
          const r = await i2pFn({ data: { image_url: imageUrl } });
          return { kind: "text", text: r.text };
        }
        case "improve": {
          const r = await improveFn({ data: { prompt, type: improveType } });
          return { kind: "text", text: r.text };
        }
        case "audio": {
          const r = await audioFn({
            data: {
              kind: audioKind,
              prompt,
              duration,
              voice_id: audioKind === "voiceover" ? voiceId : undefined,
            },
          });
          return { kind: "audio", url: r.output_url };
        }
        default:
          throw new Error("Unknown tool");
      }
    },
    onSuccess: (r) => {
      setResult(r);
      if (r.kind === "stock") toast.success(`Found ${r.items?.length ?? 0} results`);
      else toast.success("Done");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isProcessing = mutation.isPending;

  const switchRail = (id: RailId) => {
    setActiveRail(id);
    setPanelOpen(true);
    setResult({ kind: null });
    if (PROMPT_DEFAULTS[id] !== undefined) setPrompt(PROMPT_DEFAULTS[id]!);
    if (id === "video") setAspect("16:9");
  };

  // Which run-button label / disabled state
  const needsImage = activeRail === "edit" || activeRail === "classifier" || activeRail === "i2p";
  const needsPrompt = [
    "image_generation",
    "video",
    "edit",
    "icon",
    "improve",
    "audio",
    "stock",
  ].includes(activeRail);
  const runDisabled =
    isProcessing ||
    uploading ||
    (needsImage && !imageUrl) ||
    (activeRail === "lip" && (!lipVideoUrl || !lipAudioUrl)) ||
    (needsPrompt && !prompt.trim());

  const runLabel = activeRail === "stock" ? "Search" : "Run";

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
              onClick={() => switchRail(item.id)}
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
            {/* Image model (image generation only) */}
            {activeRail === "image_generation" && (
              <Section title="Model">
                <Select
                  value={model.id}
                  onValueChange={(id) =>
                    setModel(IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS[0])
                  }
                >
                  <SelectTrigger className="h-10 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Section>
            )}

            {/* Video model */}
            {activeRail === "video" && (
              <Section title="Model">
                <Select value={videoModel} onValueChange={setVideoModel}>
                  <SelectTrigger className="h-10 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Section>
            )}

            {/* Audio kind */}
            {activeRail === "audio" && (
              <Section title="Type">
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      ["music", "Music"],
                      ["sound_effects", "SFX"],
                      ["voiceover", "Voice"],
                    ] as const
                  ).map(([id, label]) => (
                    <Chip key={id} active={audioKind === id} onClick={() => setAudioKind(id)}>
                      {label}
                    </Chip>
                  ))}
                </div>
              </Section>
            )}

            {activeRail === "audio" && audioKind === "voiceover" && (
              <Section title="Voice">
                <Select value={voiceId} onValueChange={setVoiceId}>
                  <SelectTrigger className="h-10 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICEOVER_VOICES.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Section>
            )}

            {/* Stock type */}
            {activeRail === "stock" && (
              <Section title="Content type">
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      ["resources", "Photos"],
                      ["icons", "Icons"],
                      ["videos", "Videos"],
                    ] as const
                  ).map(([id, label]) => (
                    <Chip key={id} active={stockType === id} onClick={() => setStockType(id)}>
                      {label}
                    </Chip>
                  ))}
                </div>
              </Section>
            )}

            {/* Image upload */}
            {needsImage && (
              <Section title="Input image">
                <UploadBox
                  preview={imagePreview}
                  accept="image/*"
                  hint="Click to choose an image"
                  onPick={async (f) => {
                    setImagePreview(URL.createObjectURL(f));
                    const url = await uploadToStorage(f);
                    setImageUrl(url);
                    if (url) toast.success("Image uploaded");
                  }}
                />
              </Section>
            )}

            {/* Lip sync uploads */}
            {activeRail === "lip" && (
              <>
                <Section title="Input video">
                  <UploadBox
                    preview={null}
                    accept="video/*"
                    hint={lipVideoUrl ? "Video ready ✓" : "Click to choose a video"}
                    onPick={async (f) => {
                      const url = await uploadToStorage(f);
                      setLipVideoUrl(url);
                      if (url) toast.success("Video uploaded");
                    }}
                  />
                </Section>
                <Section title="Input audio">
                  <UploadBox
                    preview={null}
                    accept="audio/*"
                    hint={lipAudioUrl ? "Audio ready ✓" : "Click to choose audio"}
                    onPick={async (f) => {
                      const url = await uploadToStorage(f);
                      setLipAudioUrl(url);
                      if (url) toast.success("Audio uploaded");
                    }}
                  />
                </Section>
              </>
            )}

            {/* Prompt / query */}
            {needsPrompt && (
              <Section title={activeRail === "stock" ? "Search" : "Prompt"}>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={activeRail === "stock" ? 2 : 5}
                  placeholder={
                    activeRail === "stock"
                      ? "Search stock content…"
                      : "Describe what you want…"
                  }
                  className="resize-none bg-muted/50 border-border text-sm"
                />
              </Section>
            )}

            {/* Improve prompt: target type */}
            {activeRail === "improve" && (
              <Section title="Target">
                <div className="grid grid-cols-2 gap-1.5">
                  {(["image", "video"] as const).map((t) => (
                    <Chip key={t} active={improveType === t} onClick={() => setImproveType(t)}>
                      {t === "image" ? "For image" : "For video"}
                    </Chip>
                  ))}
                </div>
              </Section>
            )}

            {/* Icon options */}
            {activeRail === "icon" && (
              <>
                <Section title="Style">
                  <div className="grid grid-cols-3 gap-1.5">
                    {ICON_STYLES.map((s) => (
                      <Chip key={s} active={iconStyle === s} onClick={() => setIconStyle(s)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                </Section>
                <Section title="Format">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["png", "svg"] as const).map((f) => (
                      <Chip key={f} active={iconFormat === f} onClick={() => setIconFormat(f)}>
                        {f.toUpperCase()}
                      </Chip>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {/* Resolution (image only) */}
            {activeRail === "image_generation" && (
              <Section title="Resolution">
                <div className="flex gap-1.5">
                  {["1k", "2k", "4k"].map((r) => (
                    <Chip key={r} active={resolution === r} onClick={() => setResolution(r)}>
                      {r}
                    </Chip>
                  ))}
                </div>
              </Section>
            )}

            {/* Duration (video / audio non-voice) */}
            {(activeRail === "video" ||
              (activeRail === "audio" && audioKind !== "voiceover")) && (
              <Section title={`Duration · ${duration}s`}>
                <input
                  type="range"
                  min={activeRail === "video" ? 3 : 1}
                  max={activeRail === "video" ? 15 : 60}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </Section>
            )}

            {/* Aspect ratio (image / video) */}
            {(activeRail === "image_generation" || activeRail === "video") && (
              <Section title="Aspect ratio">
                <div className="grid grid-cols-5 gap-1.5">
                  {(activeRail === "video" ? VIDEO_ASPECTS : IMAGE_ASPECTS).map((a) => (
                    <Chip key={a.id} active={aspect === a.id} onClick={() => setAspect(a.id)}>
                      {a.label}
                    </Chip>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <div className="border-t border-border px-4 py-3 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 bg-transparent"
                onClick={() => {
                  setResult({ kind: null });
                  if (needsPrompt) setPrompt("");
                }}
              >
                Clear
              </Button>
              <Button
                className="flex-1 h-10 font-semibold"
                onClick={() => mutation.mutate()}
                disabled={runDisabled}
              >
                {isProcessing ? <Loader2 className="size-4 animate-spin" /> : runLabel}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Info className="size-3" />
              Costs using your Magnific API key.
            </p>
          </div>
        </aside>
      )}

      {/* Canvas */}
      <main className="flex-1 min-w-0 relative bg-[oklch(0.18_0.01_280)] flex flex-col">
        {!panelOpen && (
          <div className="absolute top-3 left-3 z-10">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 bg-muted/80 backdrop-blur gap-1.5"
              onClick={() => setPanelOpen(true)}
            >
              <Maximize2 className="size-3.5" /> Parameters
            </Button>
          </div>
        )}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8">
            <Share2 className="size-4" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-10 overflow-auto">
          <ResultView result={result} isProcessing={isProcessing} aspect={aspect} />
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 rounded-md text-xs font-medium border transition-colors px-1 capitalize",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "bg-muted/40 border-border hover:border-muted-foreground/40",
      )}
    >
      {children}
    </button>
  );
}

function UploadBox({
  preview,
  accept,
  hint,
  onPick,
}: {
  preview: string | null;
  accept: string;
  hint: string;
  onPick: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors text-center">
      {preview ? (
        <img src={preview} alt="preview" className="max-h-40 object-contain rounded" />
      ) : (
        <>
          <Upload className="h-7 w-7 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{hint}</span>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
    </label>
  );
}

function ResultView({
  result,
  isProcessing,
  aspect,
}: {
  result: Result;
  isProcessing: boolean;
  aspect: string;
}) {
  const [w, h] = aspect.split(":").map(Number);
  const ratio = w && h ? w / h : 1;
  const checker: React.CSSProperties = {
    backgroundImage: "var(--checker)",
    backgroundSize: "var(--checker-size)",
    backgroundPosition: "var(--checker-position)",
    backgroundColor: "oklch(0.21 0.01 280)",
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Working… this can take up to a couple of minutes.</p>
      </div>
    );
  }

  if (result.kind === "text") {
    return (
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card/70 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Result</h3>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              navigator.clipboard.writeText(result.text ?? "");
              toast.success("Copied");
            }}
          >
            <Copy className="size-3.5" /> Copy
          </Button>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.text}</p>
      </div>
    );
  }

  if (result.kind === "classes") {
    const rows = result.classes ?? [];
    return (
      <div className="w-full max-w-md rounded-xl border border-border bg-card/70 p-6 space-y-3">
        <h3 className="text-sm font-semibold">AI-generation analysis</h3>
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No result.</p>}
        {rows.map((c) => (
          <div key={c.class_name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="capitalize">{c.class_name.replace(/_/g, " ")}</span>
              <span className="text-muted-foreground">
                {(c.probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded bg-muted overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, c.probability * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (result.kind === "stock") {
    const items = result.items ?? [];
    if (items.length === 0)
      return <Empty label="No results. Try another search." />;
    return (
      <div className="w-full h-full overflow-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((it) => (
            <a
              key={it.id}
              href={it.url ?? it.thumbnail ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg overflow-hidden border border-border bg-card/50 hover:border-primary/50 transition-colors"
            >
              <img
                src={it.thumbnail ?? ""}
                alt={it.title}
                className="w-full aspect-square object-cover"
              />
              <p className="text-[11px] truncate px-2 py-1.5 text-muted-foreground">
                {it.title}
              </p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (result.kind === "video" && result.url) {
    return (
      <MediaShell url={result.url} download="output.mp4">
        <video src={result.url} controls className="max-h-[80vh] max-w-full rounded-md" />
      </MediaShell>
    );
  }

  if (result.kind === "audio" && result.url) {
    return (
      <MediaShell url={result.url} download="output.mp3">
        <div className="rounded-xl border border-border bg-card/70 p-8 flex flex-col items-center gap-4">
          <Music className="size-10 text-primary" />
          <audio src={result.url} controls className="w-80" />
        </div>
      </MediaShell>
    );
  }

  if (result.kind === "image" && result.url) {
    return (
      <MediaShell url={result.url} download="output.png">
        <div
          className="relative rounded-md overflow-hidden max-h-[80vh] max-w-full shadow-2xl"
          style={{ ...checker, aspectRatio: ratio }}
        >
          <img src={result.url} alt="generated" className="w-full h-full object-contain" />
        </div>
      </MediaShell>
    );
  }

  return <Empty label="Press Run to generate" />;
}

function MediaShell({
  url,
  download,
  children,
}: {
  url: string;
  download: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center gap-3">
      {children}
      <a href={url} download={download} target="_blank" rel="noreferrer">
        <Button variant="secondary" size="sm" className="gap-1.5 bg-muted/80">
          <Download className="size-3.5" /> Download
        </Button>
      </a>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground/60 text-sm flex items-center gap-2">
      <span>{label}</span>
    </div>
  );
}
