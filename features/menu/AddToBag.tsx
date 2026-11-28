"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import type { Product, Promotion } from "@/types/domain";
import { bagKey, bagLifetime, parseBag } from "./bag";
import { basePrice, money } from "./catalog";

export function AddToBag({ product, promotion }: { product: Product; promotion?: Promotion }) {
  const base = basePrice(product, promotion);
  const [variant, setVariant] = useState(base === null ? (product.variants[0]?.name ?? "") : "");
  const [addons, setAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const price = variant ? product.variants.find((item) => item.name === variant)?.price_cents : base;
  const total = ((price ?? 0) + product.addons.filter((item) => addons.includes(item.name)).reduce((sum, item) => sum + item.price_cents, 0)) * quantity;

  function add() {
    try {
      const bag = parseBag(localStorage.getItem(bagKey));
      if (bag.length >= 50) { setError("Sua sacola já possui 50 itens. Revise a sacola antes de adicionar mais."); return; }
      bag.push({ key: crypto.randomUUID(), product_id: product.id, variant, addons, quantity, notes: notes.trim() });
      localStorage.setItem(bagKey, JSON.stringify({ expires: Date.now() + bagLifetime, items: bag }));
      setError(""); setAdded(true);
    } catch { setError("Habilite o armazenamento local do navegador para usar a sacola."); }
  }

  if (!product.available) return <p className="menu-note">Este item está indisponível no momento.</p>;
  if (base === null && product.variants.length === 0) return <p className="menu-note">Consulte o preço com a equipe antes de incluir este item.</p>;
  return <section className="bag-config" aria-label="Adicionar à sacola">
    {product.variants.length > 0 && <label className="menu-field">Tamanho<select value={variant} onChange={(event) => { setVariant(event.target.value); setAdded(false); }}>
      {base !== null && <option value="">Padrão · {money(base)}</option>}
      {product.variants.map((item, index) => <option key={`${item.name}-${index}`} value={item.name}>{item.name} · {money(item.price_cents)}</option>)}
    </select></label>}
    {product.addons.length > 0 && <fieldset className="bag-addons"><legend>Adicionais</legend>{product.addons.map((item, index) => <label key={`${item.name}-${index}`}>
      <input type="checkbox" checked={addons.includes(item.name)} onChange={(event) => { setAddons(event.target.checked ? [...addons, item.name] : addons.filter((name) => name !== item.name)); setAdded(false); }} />
      <span>{item.name}</span><b>+ {money(item.price_cents)}</b>
    </label>)}</fieldset>}
    <div className="bag-controls"><label className="menu-field">Quantidade<input type="number" inputMode="numeric" min={1} max={30} value={quantity} onChange={(event) => { setQuantity(Math.max(1, Math.min(30, Number(event.target.value) || 1))); setAdded(false); }} /></label>
      <label className="menu-field">Observações opcionais<textarea value={notes} maxLength={300} rows={2} placeholder="Alguma observação para a equipe?" onChange={(event) => { setNotes(event.target.value); setAdded(false); }} /></label></div>
    <button className="button" type="button" onClick={add} disabled={price == null || added}>{added ? <Check size={18} /> : <ShoppingBag size={18} />}{added ? "Adicionado à sacola" : `Adicionar · ${money(total)}`}</button>
    {added && <Link className="menu-text-link" href="/pedidos">Revisar minha sacola</Link>}
    {error && <p role="alert" className="menu-error">{error}</p>}
    <span className="menu-sr-only" role="status">{added ? "Item adicionado à sacola." : ""}</span>
  </section>;
}
