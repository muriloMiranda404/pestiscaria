"use client";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import type { Photo } from "@/types/domain";
import { mutate, failure } from "@/features/admin/client";

export function PhotoField({ value, onChange, label = "Fotografia", required = false }: {
  value: Photo | null; onChange: (value: Photo | null) => void; label?: string; required?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError("Selecione uma imagem JPEG, PNG ou WebP."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("A imagem deve ter até 8 MB."); return; }
    setBusy(true);
    try {
      const body = new FormData(); body.set("file", file);
      const result = await mutate("/api/admin/upload", "POST", body);
      onChange({ src: result.url, alt: value?.alt || "", illustrative: value?.illustrative ?? false });
    } catch (cause) { setError(failure(cause)); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  return <div className="adm-photo-field">
    <span className="adm-label">{label}{required ? " *" : ""}</span>
    <div className={`adm-upload${dragging ? " dragging" : ""}`} onDragOver={event => {event.preventDefault(); setDragging(true);}}
      onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) void upload(event.dataTransfer.files[0]); }}>
      {value && <Image className="adm-upload-image" src={value.src} alt={value.alt || "Prévia da fotografia"} width={280} height={180} unoptimized />}
      <div><button className="adm-btn secondary" type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? <LoaderCircle className="adm-spin" size={17}/> : <ImagePlus size={17}/>}{busy ? "Preparando imagem…" : value ? "Trocar fotografia" : "Selecionar fotografia"}
      </button><small>Arraste aqui ou selecione. JPEG, PNG ou WebP até 8 MB. A imagem é otimizada ao enviar.</small></div>
      <input id={id} ref={fileRef} aria-label={`Enviar ${label.toLowerCase()}`} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => void upload(event.target.files?.[0])}/>
    </div>
    {value && <><label className="adm-field"><span>Descrição da imagem *</span><input required maxLength={240} value={value.alt} onChange={event => onChange({...value, alt: event.target.value})} placeholder="Descreva o que aparece na fotografia" /></label>
      <div className="adm-row"><label className="adm-check"><input type="checkbox" checked={value.illustrative} onChange={event => onChange({...value, illustrative:event.target.checked})}/> Imagem ilustrativa</label>
      <button className="adm-text-button danger" type="button" onClick={() => onChange(null)}><Trash2 size={14}/>Remover do cadastro</button></div></>}
    {error && <p className="adm-field-error" role="alert">{error}</p>}
  </div>;
}
