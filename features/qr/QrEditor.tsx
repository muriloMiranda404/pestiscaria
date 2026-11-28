"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Printer, QrCode, Save, Upload, X } from "lucide-react";
import type { QrEntry } from "@/types/domain";
import "./qr.css";

interface Props { initial: QrEntry[]; siteUrl: string; name: string; logo: string; demo: boolean }
function escapeXml(value: string) { return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!); }
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function imageToDataUrl(source: string): Promise<string> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("Não foi possível carregar a logo.");
  const file = await response.blob();
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) throw new Error("Use logo PNG, JPEG ou WebP de até 2 MB.");
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Não foi possível ler a logo.")); reader.readAsDataURL(file); });
}

export function QrEditor({ initial, siteUrl, name, logo, demo }: Props) {
  const [entries, setEntries] = useState(initial);
  const [label, setLabel] = useState("Cardápio da casa");
  const [table, setTable] = useState("");
  const [template, setTemplate] = useState("classico");
  const [origin, setOrigin] = useState(siteUrl);
  const [brandLogo, setBrandLogo] = useState("");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tableValid = /^[a-zA-Z0-9_-]{0,32}$/.test(table);
  const link = origin && tableValid ? `${origin}/cardapio?qr=1${table ? `&mesa=${encodeURIComponent(table)}` : ""}` : "";

  useEffect(() => {
    const frame = requestAnimationFrame(() => { if (!siteUrl && demo) setOrigin(window.location.origin); });
    return () => cancelAnimationFrame(frame);
  }, [siteUrl, demo]);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      if (!link) { setSvg(""); return; }
      try {
        const QRCode = await import("qrcode");
        const code = await QRCode.toString(link, { type: "svg", errorCorrectionLevel: "H", margin: 4, width: 300, color: { dark: "#211a15", light: "#ffffff" } });
        const inner = code.replace(/<\?xml[^>]*>/, "").replace(/<svg /, '<svg x="35" y="90" width="290" height="290" ').replace(/ width="300" height="300"/, "");
        const dark = template === "terracota";
        const text = dark ? "#fff8ef" : "#211a15";
        const logoContent = brandLogo ? `<rect x="155" y="210" width="50" height="50" rx="4" fill="white"/><image href="${escapeXml(brandLogo)}" x="159" y="214" width="42" height="42" preserveAspectRatio="xMidYMid meet"/>` : "";
        const title = label.length > 34 ? `${label.slice(0, 33)}…` : label;
        const restaurant = name.length > 30 ? `${name.slice(0, 29)}…` : name;
        const result = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="460" viewBox="0 0 360 460"><rect width="360" height="460" fill="${dark ? "#A94026" : "#fff8ef"}"/><rect x="12" y="12" width="336" height="436" fill="none" stroke="${dark ? "#e5ac89" : "#cbbbaa"}"/><text x="180" y="51" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="${text}">${escapeXml(restaurant)}</text><text x="180" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="${text}">RESTAURANTE E PETISCARIA</text>${inner}${logoContent}<text x="180" y="406" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="${text}">${escapeXml(title)}</text><text x="180" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${text}">Aponte a câmera e explore o cardápio${table ? ` · Mesa ${escapeXml(table.slice(0, 12))}` : ""}</text></svg>`;
        if (!cancelled) { setSvg(result); setError(""); }
      } catch { if (!cancelled) setError("Não foi possível gerar o QR Code. Tente atualizar a página."); }
    }
    void generate();
    return () => { cancelled = true; };
  }, [link, template, label, name, brandLogo, table]);

  async function loadLogo(source: string) {
    try { setBrandLogo(await imageToDataUrl(source)); setError(""); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Falha ao ler a logo."); }
  }

  async function uploadLogo(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    try { await loadLogo(url); }
    finally { URL.revokeObjectURL(url); }
  }

  async function save() {
    if (!label.trim() || !tableValid || !link) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/admin/qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: label.trim(), table_code: table, template }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar este modelo.");
      setEntries((previous) => [result as QrEntry, ...previous]);
      setMessage("Modelo salvo. O endereço do cardápio permanece o mesmo após alterações de produtos e preços.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  }

  async function exportPng() {
    setExporting(true); setError("");
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Falha ao preparar a imagem.")); image.src = url; });
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1380;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Seu navegador não permite exportar imagens.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Falha ao exportar o PNG.");
      download(blob, `cardapio${table ? `-mesa-${table}` : ""}.png`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível baixar a imagem."); }
    finally { URL.revokeObjectURL(url); setExporting(false); }
  }

  return <section className="qr-editor"><div className="qr-intro"><p>Um acesso permanente ao cardápio, pronto para a mesa.</p><p>Preços e produtos podem mudar sem precisar reimprimir o código. Confira o domínio e escaneie o arquivo com um telefone antes da impressão final.</p></div>
    {!siteUrl && <p className="qr-warning">{demo ? "Este QR usa o endereço temporário da demonstração. Para impressão definitiva, configure o domínio de produção." : "Configure NEXT_PUBLIC_SITE_URL com o domínio HTTPS definitivo para gerar os QR Codes."}</p>}
    <div className="qr-layout"><div className="qr-controls"><label>Título do adesivo<input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} /></label>
      <label>Identificador de mesa opcional<input value={table} onChange={(event) => setTable(event.target.value)} maxLength={32} placeholder="Ex. 12 ou varanda-2" aria-invalid={!tableValid} /></label>{!tableValid && <p className="qr-error">Use letras sem acento, números, hífen ou sublinhado.</p>}
      <fieldset><legend>Modelo visual</legend><label className="qr-radio"><input type="radio" name="qr-template" checked={template === "classico"} onChange={() => setTemplate("classico")} /> Clássico</label><label className="qr-radio"><input type="radio" name="qr-template" checked={template === "terracota"} onChange={() => setTemplate("terracota")} /> Terracota</label></fieldset>
      <div className="qr-logo-controls"><span>Logo oficial</span><input type="file" accept="image/png,image/jpeg,image/webp" ref={fileRef} hidden onChange={(event) => void uploadLogo(event.target.files?.[0])} /><button type="button" onClick={() => fileRef.current?.click()}><Upload size={17} /> Adicionar logo</button>{logo && <button type="button" onClick={() => void loadLogo(logo)}>Usar logo cadastrada</button>}{brandLogo && <button type="button" onClick={() => setBrandLogo("")}><X size={16} /> Remover logo</button>}<small>PNG, JPEG ou WebP até 2 MB. Usada nesta exportação.</small></div>
      <label>Endereço permanente<input value={link} readOnly aria-label="Endereço do QR Code" onFocus={(event) => event.target.select()} /></label>
      {link && <a href={link} target="_blank" rel="noreferrer">Abrir destino do QR Code</a>}
      <button className="qr-primary" type="button" disabled={saving || !link || !label.trim()} onClick={save}><Save size={17} />{saving ? "Salvando…" : "Salvar modelo"}</button>
      {entries.length > 0 && <label>Modelos salvos<select defaultValue="" onChange={(event) => { const entry = entries.find((item) => item.id === event.target.value); if (entry) { setLabel(entry.label); setTable(entry.table_code); setTemplate(entry.template); } }}><option value="" disabled>Selecione um modelo</option>{entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}{entry.table_code ? ` · Mesa ${entry.table_code}` : ""}</option>)}</select></label>}
    </div><div className="qr-preview-column"><div className="qr-preview" aria-label="Prévia do adesivo">{svg ? <div className="qr-print" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="qr-placeholder"><QrCode size={70} /><p>{link ? "Gerando prévia…" : "O QR Code aparecerá aqui."}</p></div>}</div>
      <div className="qr-exports"><button type="button" disabled={!svg || exporting} onClick={exportPng}><Download size={17} />{exporting ? "Exportando…" : "Baixar PNG"}</button><button type="button" disabled={!svg} onClick={() => download(new Blob([svg], { type: "image/svg+xml" }), `cardapio${table ? `-mesa-${table}` : ""}.svg`)}><Download size={17} />Baixar SVG</button><button type="button" disabled={!svg} onClick={() => window.print()}><Printer size={17} />Imprimir</button></div>
      <p className="qr-caption">Prévia de adesivo 9 × 11,5 cm. Mantenha a margem branca ao redor do código.</p>
    </div></div>
    {error && <p className="qr-error" role="alert">{error}</p>}{message && <p className="qr-success" role="status">{message}</p>}
  </section>;
}
