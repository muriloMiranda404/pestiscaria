import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, UsersRound, Utensils, Heart, Beer } from "lucide-react";
import { getCatalog } from "@/services/store";
import { meta, absUrl, jsonLd } from "@/lib/seo";
import { ProductCard } from "@/components/site/Presentation";
import { Reveal } from "@/components/site/Reveal";
import { GallerySection, VisitSection, EventSection, InstagramSection } from "@/components/site/Editorial";
import { activePromotion, money } from "@/features/menu/catalog";

export async function generateMetadata() {
  const { settings } = await getCatalog();
  return meta(settings.seo_title, settings.seo_description, "/");
}
export default async function HomePage() {
  const { settings, products, categories, gallery, events, promotions, demo } = await getCatalog();
  const featured = products.filter(product => product.featured).slice(0, 3);
  const hero = gallery.find(photo => photo.category.toLowerCase() === "capa")?.image;
  const about = gallery.find(photo => photo.category.toLowerCase() === "ambiente")?.image;
  const highlightedOffer = promotions.find(offer => offer.featured && products.some(product =>
    product.id === offer.product_id && product.available &&
    (product.price_cents === null || offer.price_cents < product.price_cents)));
  const highlightedProduct = products.find(product => product.id === highlightedOffer?.product_id);
  const highlightedImage = highlightedOffer?.image || highlightedProduct?.image;
  const structured = { "@context": "https://schema.org", "@type": "Restaurant", name: settings.name,
    url: absUrl("/"), telephone: settings.phone, servesCuisine: "Brasileira", sameAs: [settings.instagram],
    address: { "@type": "PostalAddress", streetAddress: settings.street, addressLocality: settings.city, addressRegion: settings.state, postalCode: settings.postal_code, addressCountry: "BR" },
    ...(products.length && !demo ? { hasMenu: absUrl("/cardapio") } : {}),
    ...(settings.hours.length ? { openingHoursSpecification: settings.hours.map(hour => ({ "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][hour.day], opens: hour.opens, closes: hour.closes })) } : {}),
  };
  return <>
    {!demo && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />}
    <section className="hero">
      <Image className="hero-image" src={hero?.src || "/images/hero.webp"} alt={hero?.alt || "Composição gastronômica ilustrativa com petiscos dourados sobre uma mesa de madeira"} fill priority fetchPriority="high" sizes="100vw" />
      <div className="hero-shade" /><div className="container hero-content">
        <p className="eyebrow">RESTAURANTE E PETISCARIA <span>·</span> LINHARES, ES</p>
        <h1>Bons momentos<br />merecem <em>bons<br className="desktop-break" /> sabores.</em></h1>
        <p className="hero-description">Porções para compartilhar, petiscos e um ambiente familiar para aproveitar com quem você gosta.</p>
        <div className="hero-actions"><Link className="button" href="/cardapio">Explorar cardápio <ArrowUpRight size={19} /></Link><Link className="hero-location" href="/contato"><MapPin size={17} /> Como chegar</Link></div>
        <div className="hero-foot"><span className="hero-location-note">No coração do Canivete.</span><span>À mesa, a vida fica melhor.</span></div>
      </div>
      {(hero?.illustrative ?? true) && <span className="hero-caption">Imagem ilustrativa</span>}
    </section>
    <div className="values-strip"><div className="container">{[
      [Heart, "Ambiente familiar"], [Utensils, "Porções para compartilhar"], [Beer, "Petiscos e cerveja gelada"], [UsersRound, "Boa companhia"],
    ].map(([Icon, label]) => { const Mark = Icon as typeof Heart; return <div key={String(label)}><Mark size={24} strokeWidth={1.25} /><span>{String(label)}</span></div>; })}</div></div>

    <section className="home-menu container">
      <Reveal><div className="section-heading"><div><p className="eyebrow">SABORES QUE APROXIMAM</p><h2>Para dividir.<br /><em>Para aproveitar.</em></h2></div><div className="section-side"><p>Escolha os sabores, reúna sua gente.<br />O resto é conversa boa.</p><Link className="text-link" href="/cardapio">Conheça o cardápio <ArrowUpRight size={18} /></Link></div></div></Reveal>
      {featured.length ? <div className="featured-grid">{featured.map(product => <ProductCard key={product.id} product={product} category={categories.find(category => category.id === product.category_id)?.name} promotion={activePromotion(promotions, product.id)} />)}</div> :
        <div className="menu-teaser"><Image src="/images/porcoes.webp" alt="Porção de mandioca em imagem ilustrativa" width={620} height={420} /><div><p className="eyebrow">À MESA</p><h3>Um bom motivo<br />para reunir a turma.</h3><p>Nosso cardápio digital está em preparação. Fale com a equipe para conhecer as opções da casa.</p><Link className="text-link" href="/contato">Conversar com a equipe <ArrowRight size={18} /></Link><small>Imagem ilustrativa</small></div></div>}
    </section>

    {highlightedOffer && highlightedProduct && <section className="home-promotion container" aria-label="Promoção em destaque">
      <div className={`promotion-feature${highlightedImage ? " has-image" : ""}`}>
        {highlightedImage && <div className="promotion-photo"><Image src={highlightedImage.src} alt={highlightedImage.alt} fill sizes="(max-width: 700px) 100vw, 50vw" />
          {highlightedImage.illustrative && <span className="image-caption">Imagem ilustrativa</span>}</div>}
        <div className="promotion-content"><p className="eyebrow">Oferta da casa</p><h2>{highlightedOffer.title}</h2>
          <p>{highlightedProduct.name}</p><strong>{money(highlightedOffer.price_cents)}</strong>
          <small>Válida até {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(highlightedOffer.ends_at))}.</small>
          <Link className="button" href={`/cardapio/${highlightedProduct.slug}`}>Ver item no cardápio <ArrowUpRight size={18} /></Link>
        </div>
      </div>
    </section>}

    <section className="home-about"><div className="container home-about-grid">
      <Reveal className="about-photo"><Image src={about?.src || "/images/mesa.webp"} alt={about?.alt || "Ambiente de petiscaria acolhedor em imagem ilustrativa"} fill sizes="(max-width: 760px) 100vw, 50vw" />{(about?.illustrative ?? true) && <span className="image-caption">Ambiente ilustrativo</span>}<span className="photo-corner" aria-hidden="true" /></Reveal>
      <Reveal className="about-copy"><p className="eyebrow">A NOSSA CASA</p><h2>Chegue perto.<br /><em>Sinta-se à vontade.</em></h2><span className="small-divider" /><p>{settings.about}</p><p>Da primeira conversa ao último brinde, o melhor da mesa é estar junto.</p><Link className="text-link" href="/sobre">Conheça a Lucrécio <ArrowUpRight size={18} /></Link></Reveal>
    </div></section>
    <EventSection events={events} demo={demo} />
    <GallerySection entries={gallery} demo={demo} compact />
    <InstagramSection entries={gallery} settings={settings} />
    <VisitSection settings={settings} demo={demo} />
  </>;
}
