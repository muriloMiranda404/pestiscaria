"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title, path, label = "Compartilhar" }: { title: string; path: string; label?: string }) {
  const [result, setResult] = useState<"copied" | "manual" | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  async function share() {
    const url = new URL(path, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setResult("copied");
    } catch {
      setManualUrl(url);
      setResult("manual");
    }
  }

  return (
    <div className="menu-share">
      <button type="button" className="menu-tool" onClick={share}>
        {result === "copied" ? <Check size={17} /> : <Share2 size={17} />} <span>{result === "copied" ? "Link copiado" : label}</span>
      </button>
      {result === "manual" && <label className="share-manual">Copie este link<input readOnly value={manualUrl} onFocus={(event) => event.target.select()} /></label>}
      <span className="menu-sr-only" aria-live="polite">{result === "copied" ? "Link copiado." : ""}</span>
    </div>
  );
}
