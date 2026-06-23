import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/app/tools/voice")({
  component: VoicePage,
});

function VoicePage() {
  const [text, setText] = useState("");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Voice</h1>
      <p className="text-muted-foreground mb-8">Generate and clone voices</p>
      <div className="bg-card rounded-xl border border-border p-6">
        <label className="block text-sm font-medium text-foreground mb-2">Text to speak</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text you want to convert to speech..."
          rows={4}
          className="w-full px-3 py-2 rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
        />
        <button
          disabled={!text.trim()}
          className="mt-4 px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Generate Audio
        </button>
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Generated audio will appear here
      </div>
    </div>
  );
}
