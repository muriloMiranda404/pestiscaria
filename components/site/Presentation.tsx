import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Utensils } from "lucide-react";
import type { Product, Promotion } from "@/types/domain";
import { lowestPrice, money } from "@/features/menu/catalog";

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <header className="page-intro container">
    <p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}
  </header>;
}
export function ProductCard({ product, category, promotion }: { product: Product; category?: string; promotion?: Promotion }) {
  const price = lowestPrice(product, promotion);
  return <article className="product-card">
    <Link href={`/cardapio/${product.slug}`} className="product-picture" tabIndex={-1} aria-hidden="true">
      {product.image ? <Image src={product.image.src} alt={product.image.alt} fill loading={product.featured ? "eager" : "lazy"} sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw" /> :
        <div className="product-no-image"><Utensils size={44} strokeWidth={1} /></div>}
      {product.image?.illustrative && <span className="image-caption">Imagem ilustrativa</span>}
      {!product.available && <span className="availability">Indisponível</span>}
    </Link>
    <div className="product-body"><span className="eyebrow">{category || "Cardápio"}</span>
      <h3><Link href={`/cardapio/${product.slug}`}>{product.name}</Link></h3>
      <p>{product.description}</p><div className="product-bottom">
        <span className="product-price">{price === null ? "Consulte a equipe" : <>{product.variants.length > 0 && <small>A partir de </small>}{money(price)}</>}</span>
        <Link href={`/cardapio/${product.slug}`} className="product-arrow" aria-label={`Ver ${product.name}`}><ArrowUpRight size={21} /></Link>
      </div>
    </div>
  </article>;
}
