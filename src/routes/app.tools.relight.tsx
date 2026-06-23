import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/tools/relight")({
  component: RelightPage,
});

function RelightPage() {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Relight</h1>
      <p className="text-muted-foreground mb-8">Change lighting in images</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); }}
        className={`rounded-xl border-2 border-dashed p-16 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-card"}`}
      >
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm font-medium text-foreground mb-1">Drop an image here</p>
        <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 20MB</p>
        <button className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          Browse files
        </button>
      </div>
    </div>
  );
}
