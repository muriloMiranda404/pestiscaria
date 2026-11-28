import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, UtensilsCrossed } from "lucide-react";
import { getCatalog } from "@/services/store";
import { absUrl, meta } from "@/lib/seo";
import { ViewMetric } from "@/components/site/Metrics";
import { AddToBag } from "@/features/menu/AddToBag";
import { ShareButton } from "@/features/menu/ShareButton";
import { activePromotion, basePrice, money, ordersOpen, whatsappNumber } from "@/features/menu/catalog";
import "@/features/menu/menu.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, catalog] = await Promise.all([params, getCatalog()]);
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) return meta("Item não encontrado", "Consulte os itens publicados no cardápio.", "/cardapio");
  return meta(product.name, product.description || `Consulte ${product.name} no cardápio da ${catalog.settings.name}.`, `/cardapio/${product.slug}`);
}

export default async function ProductPage({ params }: Props) {
  const [{ slug }, catalog] = await Promise.all([params, getCatalog()]);
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) notFound();
  const category = catalog.categories.find((item) => item.id === product.category_id);
  if (!category) notFound();
  const promotion = activePromotion(catalog.promotions, product.id);
  const price = basePrice(product, promotion);
  const whatsapp = whatsappNumber(catalog.settings.whatsapp);
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: absUrl("/") },
    { "@type": "ListItem", position: 2, name: "Cardápio", item: absUrl("/cardapio") },
    { "@type": "ListItem", position: 3, name: product.name, item: absUrl(`/cardapio/${product.slug}`) },
  ] };
  return <article className="container product-detail">
    <nav className="menu-breadcrumbs" aria-label="Caminho da página"><Link href="/">Início</Link><span aria-hidden>/</span><Link href="/cardapio">Cardápio</Link><span aria-hidden>/</span><span>{product.name}</span></nav>
    <div className="product-detail-grid"><div>
      <figure className="product-photo">{product.image ? <Image src={product.image.src} alt={product.image.alt} width={900} height={1050} sizes="(max-width: 767px) 100vw, 50vw" priority /> : <div className="product-photo-placeholder"><UtensilsCrossed size={60} strokeWidth={1} /><span>Fotografia em preparação</span></div>}
        {product.image?.illustrative && <figcaption>Imagem ilustrativa</figcaption>}</figure>
      {product.images.length > 0 && <div className="product-extra-photos">{product.images.map((photo, index) => <figure key={`${photo.src}-${index}`}><Image src={photo.src} alt={photo.alt} width={360} height={300} sizes="(max-width: 767px) 45vw, 22vw" />{photo.illustrative && <figcaption>Imagem ilustrativa</figcaption>}</figure>)}</div>}
    </div><div className="product-info"><Link className="menu-back" href={`/cardapio?categoria=${category.slug}`}><ArrowLeft size={16} /> Voltar ao cardápio</Link>
      <p className="eyebrow">{category.name}</p><h1>{product.name}</h1>
      {catalog.demo && <p className="demo-product-note">Produto demonstrativo · preço de exemplo</p>}
      <p className="product-description">{product.description}</p>
      {product.serves && <p className="product-serving">{product.serves}</p>}
      <div className="product-price-block">{promotion && product.price_cents !== null && promotion.price_cents < product.price_cents && <del>{money(product.price_cents)}</del>}
        <strong>{price === null ? "Preço sob consulta" : money(price)}</strong><span className={product.available ? "product-available" : "product-unavailable"}>{product.available ? "Disponível" : "Indisponível no momento"}</span></div>
      {promotion && <p className="menu-note">{promotion.title} · até {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(promotion.ends_at))}.</p>}
      {(product.ingredients || product.allergens) && <dl className="product-details-list">
        {product.ingredients && <div><dt>Ingredientes</dt><dd>{product.ingredients}</dd></div>}
        {product.allergens && <div><dt>Alergênicos informados pela casa</dt><dd>{product.allergens}</dd></div>}
      </dl>}
      {product.variants.length > 0 && <div className="product-options"><h2>Tamanhos</h2>{product.variants.map((variant, index) => <p key={index}><span>{variant.name}</span><strong>{money(variant.price_cents)}</strong></p>)}</div>}
      {ordersOpen(catalog.settings) ? <AddToBag product={product} promotion={promotion} /> : catalog.settings.whatsapp_confirmed && whatsapp && !catalog.demo ? <a className="button" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre ${product.name}.`)}`} target="_blank" rel="noreferrer">Consultar este item <ArrowUpRight size={18} /></a> : <Link href="/contato" className="button outline">Falar com a equipe <ArrowUpRight size={18} /></Link>}
      <ShareButton title={product.name} path={`/cardapio/${product.slug}`} label="Compartilhar este item" />
    </div></div>
    <ViewMetric kind="product" subject={product.slug} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
  </article>;
}
