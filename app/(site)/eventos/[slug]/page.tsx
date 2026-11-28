import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarPlus, Clock3, MapPin, Music2 } from "lucide-react";
import { getCatalog } from "@/services/store";
import { absUrl, meta } from "@/lib/seo";
import { formatEvent } from "@/features/editorial/events";
import { fullAddress, mapLink } from "@/features/editorial/visit";
import { ShareButton } from "@/features/menu/ShareButton";
import { TrackedLink } from "@/components/site/TrackedLink";
import "@/features/editorial/editorial.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const [{ slug }, catalog] = await Promise.all([params, getCatalog()]);
  const event = catalog.events.find(entry => entry.slug === slug && entry.status === "published");
  if (!event) return meta("Evento não encontrado", "Confira os encontros publicados na agenda da casa.", "/eventos");
  const result = meta(event.title, event.description.slice(0, 170), `/eventos/${slug}`);
  return { ...result, ...(event.image ? { openGraph: { ...result.openGraph, images: [{ url: absUrl(event.image.src), alt: event.image.alt }] } } : {}) };
}

export default async function EventPage({ params }: Props) {
  const [{ slug }, catalog] = await Promise.all([params, getCatalog()]);
  const event = catalog.events.find(entry => entry.slug === slug && entry.status === "published");
  if (!event) notFound();
  const date = formatEvent(event.starts_at);
  const past = Date.parse(event.ends_at ?? event.starts_at) < new Date().getTime();
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: absUrl("/") },
    { "@type": "ListItem", position: 2, name: "Eventos", item: absUrl("/eventos") },
    { "@type": "ListItem", position: 3, name: event.title, item: absUrl(`/eventos/${slug}`) },
  ] };
  const structured = { "@context": "https://schema.org", "@type": "Event", name: event.title, description: event.description,
    startDate: event.starts_at, ...(event.ends_at ? { endDate: event.ends_at } : {}),
    ...(event.image ? { image: absUrl(event.image.src) } : {}), url: absUrl(`/eventos/${slug}`),
    location: { "@type": "Place", name: catalog.settings.name, address: fullAddress(catalog.settings) },
    ...(event.artist ? { performer: { "@type": "PerformingGroup", name: event.artist } } : {}),
  };
  return <article className="container event-detail">
    <nav className="editorial-breadcrumb" aria-label="Você está aqui"><Link href="/">Início</Link><span aria-hidden="true">/</span><Link href="/eventos">Eventos</Link><span aria-hidden="true">/</span><span>{event.title}</span></nav>
    <div className="event-detail-heading"><p className="eyebrow">{catalog.demo ? "Evento fictício · Demonstração" : past ? "Arquivo da agenda" : "Na agenda da casa"}</p><h1>{event.title}</h1><p>{date.full}</p></div>
    {event.image && <figure className="event-detail-photo"><Image src={event.image.src} alt={event.image.alt} fill priority sizes="(max-width: 1200px) 100vw, 1200px" />{event.image.illustrative && <figcaption className="photo-disclosure">Imagem ilustrativa</figcaption>}</figure>}
    <div className="event-detail-columns"><div className="event-detail-copy"><h2>Sobre o encontro</h2><p>{event.description}</p>{event.notes && <p>{event.notes}</p>}
      {catalog.demo && <p className="editorial-demo-note">Este evento existe para apresentar o funcionamento da agenda. Data, atração e valores são exemplos fictícios.</p>}
      <div className="event-detail-actions"><a className="button outline" href={`/eventos/${event.slug}/calendario`} download><CalendarPlus size={18} /> Adicionar ao calendário</a><ShareButton title={event.title} path={`/eventos/${event.slug}`} label="Compartilhar evento" /></div>
    </div><aside className="event-detail-facts" aria-label="Informações do evento">
      <div><Clock3 size={21} /><p><strong>Data e horário</strong><time dateTime={event.starts_at}>{date.full}<br />A partir das {date.time}</time><small>Horário de Brasília.</small></p></div>
      {event.artist && <div><Music2 size={21} /><p><strong>Atração</strong>{event.artist}</p></div>}
      {event.fee_cents !== null && <div><span className="event-fee-symbol" aria-hidden="true">R$</span><p><strong>Entrada</strong>{event.fee_cents === 0 ? "Entrada gratuita" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(event.fee_cents / 100)}</p></div>}
      <div><MapPin size={21} /><p><strong>{catalog.settings.name}</strong>{fullAddress(catalog.settings)}<TrackedLink kind="directions" href={mapLink(catalog.settings)} target="_blank" rel="noopener noreferrer" className="editorial-text-link">Como chegar <ArrowUpRight size={17} /></TrackedLink></p></div>
    </aside></div>
    <Link className="editorial-text-link event-back" href="/eventos"><ArrowLeft size={18} /> Voltar para a agenda</Link>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
    {!catalog.demo && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }} />}
  </article>;
}
