"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Search, SlidersHorizontal, ShoppingBag, X } from "lucide-react";
import type { Category, Product, Promotion } from "@/types/domain";
import { ProductCard } from "@/components/site/Presentation";
import { track } from "@/components/site/Metrics";
import { activePromotion, visibleProducts, type MenuFilters } from "./catalog";
import { ShareButton } from "./ShareButton";

interface Props {
  categories: Category[]; products: Product[]; promotions: Promotion[]; initialCategory: string; hasOrders: boolean; name: string;
}

export function MenuBrowser({ categories, products, promotions, initialCategory, hasOrders, name }: Props) {
  const listedCategories = useMemo(() => {
    const linked = new Set(products.filter((item) => item.status === "published").map((item) => item.category_id));
    return categories.filter((category) => category.status === "published" && linked.has(category.id))
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "pt-BR"));
  }, [products, categories]);
  const emptyFilters: MenuFilters = { search: "", category: "", available: false, order: "menu" };
  const [filters, setFilters] = useState<MenuFilters>({
    ...emptyFilters, category: listedCategories.some((item) => item.slug === initialCategory) ? initialCategory : "",
  });
  const matching = useMemo(() => visibleProducts(products, categories, promotions, filters), [products, categories, promotions, filters]);
  const categoryNames = useMemo(() => new Map(categories.map((item) => [item.id, item.name])), [categories]);
  const hasFilter = Boolean(filters.search || filters.category || filters.available || filters.order !== "menu");

  function selectCategory(slug: string) {
    setFilters((previous) => ({ ...previous, category: slug }));
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set("categoria", slug);
      track("category", slug);
    } else url.searchParams.delete("categoria");
    window.history.replaceState(null, "", url);
  }

  function reset() {
    selectCategory("");
    setFilters(emptyFilters);
  }

  return (
    <section className="container menu-workspace" aria-label="Consultar cardápio">
      <div className="menu-actions">
        <ShareButton title={`Cardápio · ${name}`} path="/cardapio" label="Compartilhar cardápio" />
        {hasOrders && <Link className="menu-tool" href="/pedidos"><ShoppingBag size={17} /> Ver sacola</Link>}
      </div>
      {listedCategories.length > 0 ? <>
        <div className="menu-categories" role="group" aria-label="Filtrar por categoria">
          <button type="button" aria-pressed={!filters.category} onClick={() => selectCategory("")}>Todas</button>
          {listedCategories.map((category) => <button type="button" key={category.id}
            aria-pressed={filters.category === category.slug} onClick={() => selectCategory(category.slug)}>
            {category.name}
          </button>)}
        </div>
        <div className="menu-filter-panel">
          <label className="menu-search">
            <Search aria-hidden size={19} />
            <span className="menu-sr-only">Buscar no cardápio</span>
            <input type="search" value={filters.search} maxLength={120} placeholder="Buscar no cardápio"
              onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          </label>
          <label className="menu-availability"><input type="checkbox" checked={filters.available}
            onChange={(event) => setFilters({ ...filters, available: event.target.checked })} /> Só disponíveis</label>
          <label className="menu-order"><SlidersHorizontal size={16} /><span className="menu-sr-only">Ordenar por</span>
            <select value={filters.order} onChange={(event) => setFilters({ ...filters, order: event.target.value as MenuFilters["order"] })}>
              <option value="menu">Ordem do cardápio</option><option value="asc">Menor preço</option><option value="desc">Maior preço</option>
            </select>
          </label>
        </div>
        <div className="menu-result-strip">
          <span aria-live="polite">{matching.length} {matching.length === 1 ? "item" : "itens"}</span>
          {hasFilter && <button type="button" onClick={reset}><X size={14} /> Limpar filtros</button>}
        </div>
        {matching.length > 0 ? <div className="menu-product-grid">{matching.map((product) =>
          <ProductCard key={product.id} product={product} category={categoryNames.get(product.category_id)} promotion={activePromotion(promotions, product.id)} />)}</div>
          : <div className="menu-empty"><Search size={32} /><h2>Nenhum item encontrado</h2><p>Experimente outro termo ou ajuste os filtros.</p>
            <button type="button" className="button outline" onClick={reset}>Ver todos os itens <ArrowRight size={17} /></button></div>}
      </> : <div className="menu-empty"><BookOpen size={36} strokeWidth={1.35} /><h2>O cardápio digital está em preparação</h2>
        <p>Para conhecer as opções de hoje, fale com a equipe da casa.</p><Link className="button" href="/contato">Entrar em contato <ArrowRight size={17} /></Link></div>}
    </section>
  );
}
