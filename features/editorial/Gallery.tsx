"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { useState } from "react";
import type { GalleryEntry } from "@/types/domain";
import { instagramPost } from "./visit";

export function Gallery({ entries, compact = false }: { entries: GalleryEntry[]; compact?: boolean }) {
  const [category, setCategory] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const categories = Array.from(new Set(entries.map(entry => entry.category)));
  const filtered = entries.filter(entry => !category || entry.category === category);
  const selected = filtered.findIndex(entry => entry.id === activeId);
  const active = selected >= 0 ? filtered[selected] : null;
  const post = active ? instagramPost(active.instagram_url) : null;

  function move(direction: number) {
    if (filtered.length) setActiveId(filtered[(selected + direction + filtered.length) % filtered.length].id);
  }

  return <>
    {!compact && categories.length > 1 && <div className="gallery-filters" role="group" aria-label="Filtrar fotografias">
      <button onClick={() => setCategory("")} aria-pressed={!category}>Todas</button>
      {categories.map(value => <button key={value} onClick={() => setCategory(value)} aria-pressed={category === value}>{value}</button>)}
    </div>}
    <Dialog.Root open={active !== null} onOpenChange={open => { if (!open) setActiveId(null); }}>
      <div className={"editorial-gallery" + (compact ? " compact" : "")}>
        {filtered.map((entry) => <figure key={entry.id} className="editorial-gallery-item">
          <Dialog.Trigger asChild>
            <button type="button" onClick={() => setActiveId(entry.id)}><span className="editorial-sr-only">Ampliar </span>
              <Image src={entry.image.src} alt={entry.image.alt} fill sizes={compact ? "(max-width: 640px) 85vw, 33vw" : "(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"} loading="lazy" />
              <span className="gallery-expand" aria-hidden="true"><Expand size={18} /></span>
              {entry.image.illustrative && <span className="photo-disclosure">Imagem ilustrativa</span>}
              <span className="gallery-image-title">{entry.category}</span>
            </button>
          </Dialog.Trigger>
          {!compact && <figcaption>{entry.image.alt}</figcaption>}
        </figure>)}
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="gallery-overlay" />
        <Dialog.Content className="gallery-dialog" aria-describedby="gallery-image-caption" onKeyDown={event => {
          if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        }}>
          <Dialog.Title className="editorial-sr-only">{active?.image.alt ?? "Fotografia"}</Dialog.Title>
          <Dialog.Close className="gallery-close" aria-label="Fechar fotografia"><X size={23} /></Dialog.Close>
          {active && <>
            <div className="gallery-dialog-image"><Image src={active.image.src} alt={active.image.alt} fill sizes="90vw" /></div>
            <div id="gallery-image-caption" className="gallery-caption">
              <p>{active.image.alt}{active.image.illustrative && <span>Imagem ilustrativa</span>}</p>
              <div className="gallery-controls">
                {post && <a href={post} target="_blank" rel="noopener noreferrer">Ver publicação</a>}
                <button type="button" aria-label="Fotografia anterior" onClick={() => move(-1)} disabled={filtered.length < 2}><ArrowLeft size={21} /></button>
                <span aria-live="polite">{selected + 1} / {filtered.length}</span>
                <button type="button" aria-label="Próxima fotografia" onClick={() => move(1)} disabled={filtered.length < 2}><ArrowRight size={21} /></button>
              </div>
            </div>
          </>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
