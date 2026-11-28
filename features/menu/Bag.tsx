"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ShoppingBag, Trash2 } from "lucide-react";
import type { Catalog, Product, Promotion, Settings } from "@/types/domain";
import { bagKey, bagLifetime, parseBag, priceBag, type BagItem } from "./bag";
import { money, ordersOpen, whatsappNumber } from "./catalog";
import { track } from "@/components/site/Metrics";

type OrderSettings = Pick<Settings, "whatsapp" | "orders_enabled" | "whatsapp_confirmed" | "pickup_enabled" | "delivery_enabled">;
export function Bag({ catalog }: { catalog: Catalog }) {
  const [items, setItems] = useState<BagItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState("consulta");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<{ products: Product[]; promotions: Promotion[]; settings: OrderSettings }>({ products: catalog.products, promotions: catalog.promotions, settings: catalog.settings });
  const priced = useMemo(() => priceBag(items, current.products, current.promotions), [items, current]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setItems(parseBag(localStorage.getItem(bagKey))); }
      catch { setError("O armazenamento local está bloqueado. Ative-o para recuperar sua sacola."); }
      setLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function save(next: BagItem[]) {
    setItems(next); setReview(false);
    try { localStorage.setItem(bagKey, JSON.stringify({ expires: Date.now() + bagLifetime, items: next })); }
    catch { setError("A sacola está disponível nesta tela, mas o navegador impediu sua gravação."); }
  }

  async function requestReview() {
    setBusy(true); setError("");
    try {
      if (catalog.demo) { setReview(true); return; }
      const response = await fetch("/api/catalog/order-review", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar os preços.");
      const next = data as typeof current;
      if (!ordersOpen(next.settings as Settings)) throw new Error("Os pedidos pelo site estão temporariamente indisponíveis.");
      const refreshed = priceBag(items, next.products, next.promotions);
      setCurrent(next);
      setNotice(refreshed.total !== priced.total ? "Os preços foram atualizados. Confira o subtotal antes de continuar." : "");
      setReview(true);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Falha ao revisar sua sacola. Tente novamente."); }
    finally { setBusy(false); }
  }

  function message() {
    const content = priced.lines.map(({ item, product, unitPrice, subtotal }) => `${item.quantity}x ${product.name}${item.variant ? ` (${item.variant})` : ""}${item.addons.length ? ` + ${item.addons.join(", ")}` : ""} · ${money(unitPrice)} cada · ${money(subtotal)}${item.notes ? `\nObservação: ${item.notes}` : ""}`).join("\n\n");
    const modality = mode === "retirada" && current.settings.pickup_enabled ? "Retirada no estabelecimento" : mode === "entrega" && current.settings.delivery_enabled ? "Consultar entrega, taxa e região atendida" : "Consultar atendimento";
    return `Olá! Gostaria de consultar este pedido pelo site.\n\n${content}\n\nSubtotal dos produtos: ${money(priced.total)}\n${modality}\n\nAguardo confirmação da disponibilidade, do valor final e do atendimento pela equipe.`;
  }

  if (!loaded) return <section className="container bag-page" aria-busy="true"><p>Carregando sua sacola…</p></section>;
  return <section className="container bag-page">
    <Link href="/cardapio" className="menu-back"><ArrowLeft size={17} /> Continuar no cardápio</Link>
    {items.length === 0 ? <div className="menu-empty"><ShoppingBag size={38} strokeWidth={1.3} /><h2>Sua sacola está vazia</h2><p>Abra um item do cardápio para escolher tamanho, adicionais e quantidade.</p><Link className="button" href="/cardapio">Explorar cardápio</Link></div> : <div className="bag-layout"><div>
      {priced.removed.length > 0 && <div className="menu-warning"><p>{priced.removed.length} {priced.removed.length === 1 ? "item precisa" : "itens precisam"} ser retirado da sacola por alteração de disponibilidade, tamanho ou adicionais.</p><button type="button" className="menu-text-link" onClick={() => save(priced.lines.map((line) => line.item))}>Remover itens indisponíveis</button></div>}
      {priced.lines.map(({ item, product, unitPrice, subtotal }) => <article className="bag-line" key={item.key}>
        <div className="bag-line-heading"><Link href={`/cardapio/${product.slug}`}><h2>{product.name}</h2></Link><button type="button" className="menu-icon-button" aria-label={`Remover ${product.name}`} onClick={() => save(items.filter((line) => line.key !== item.key))}><Trash2 size={18} /></button></div>
        {item.variant && <p>{item.variant}</p>}{item.addons.length > 0 && <p>Com {item.addons.join(", ")}</p>}{item.notes && <p className="bag-note">{item.notes}</p>}
        <div className="bag-line-bottom"><label>Quantidade <input type="number" aria-label={`Quantidade de ${product.name}`} min={1} max={30} value={item.quantity} onChange={(event) => save(items.map((line) => line.key === item.key ? { ...line, quantity: Math.max(1, Math.min(30, Number(event.target.value) || 1)) } : line))} /></label><span>{money(unitPrice)} cada</span><strong>{money(subtotal)}</strong></div>
      </article>)}
    </div><aside className="bag-summary"><h2>Resumo da sacola</h2><p className="bag-total"><span>Subtotal</span><strong>{money(priced.total)}</strong></p>
      {(current.settings.pickup_enabled || current.settings.delivery_enabled) && <label className="menu-field">Atendimento<select value={mode} onChange={(event) => { setMode(event.target.value); setReview(false); }}><option value="consulta">Consultar com a equipe</option>{current.settings.pickup_enabled && <option value="retirada">Retirada no estabelecimento</option>}{current.settings.delivery_enabled && <option value="entrega">Consultar entrega</option>}</select></label>}
      <p className="menu-note">A equipe confirma disponibilidade, valor final e atendimento pelo WhatsApp. Taxas de entrega, quando aplicáveis, serão informadas na conversa.</p>
      {notice && <p role="status" className="menu-warning">{notice}</p>}
      {catalog.demo && <p className="menu-warning">Demonstração comercial. Você pode revisar a sacola nesta tela. O envio de pedidos está desativado.</p>}
      {review ? <div className="bag-review"><h3>Confira antes de enviar</h3><pre>{message()}</pre>{!catalog.demo && priced.lines.length > 0 && priced.removed.length === 0 && <a className="button" href={`https://wa.me/${whatsappNumber(current.settings.whatsapp)}?text=${encodeURIComponent(message())}`} target="_blank" rel="noreferrer" onClick={() => track("contact", "pedido")}>Consultar pelo WhatsApp <ArrowUpRight size={17} /></a>}<button className="menu-text-link" type="button" onClick={() => setReview(false)}>Voltar à sacola</button></div> : <button className="button" type="button" disabled={busy || !priced.lines.length || !!priced.removed.length} onClick={requestReview}>{busy ? "Atualizando preços…" : "Revisar pedido"}</button>}
      <p className="menu-note">A sacola fica neste navegador por até 6 horas.</p>
    </aside></div>}
    {error && <p className="menu-error" role="alert">{error}</p>}
  </section>;
}
