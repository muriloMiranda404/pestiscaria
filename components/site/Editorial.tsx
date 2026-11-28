import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, Camera, MapPin, Phone } from "lucide-react";
import type { EventEntry, GalleryEntry, Settings } from "@/types/domain";
import { Gallery } from "@/features/editorial/Gallery";
import { eventGroups, formatEvent } from "@/features/editorial/events";
import { formatInterval, formatSpecialDate, instagramLink, instagramPost, localDate, mapLink, openingStatus, telephoneLink, weekdays, whatsappLink } from "@/features/editorial/visit";
import { TrackedLink } from "./TrackedLink";
import "@/features/editorial/editorial.css";

export const illustrativeGallery: GalleryEntry[] = [
  { id: "illustrative-1", status: "published", position: 0, category: "À mesa", instagram_url: "", image: { src: "/images/porcoes.webp", alt: "Porção compartilhada à mesa, em composição ilustrativa", illustrative: true } },
  { id: "illustrative-2", status: "published", position: 1, category: "Encontros", instagram_url: "", image: { src: "/images/mesa.webp", alt: "Mesa acolhedora em um ambiente ilustrativo", illustrative: true } },
  { id: "illustrative-3", status: "published", position: 2, category: "Brindes", instagram_url: "", image: { src: "/images/bebidas.webp", alt: "Bebida gelada, em fotografia ilustrativa", illustrative: true } },
];

export function GallerySection({ entries, demo, compact = false }: { entries: GalleryEntry[]; demo: boolean; compact?: boolean }) {
  const published = entries.filter(entry => entry.status === "published").sort((a, b) => a.position - b.position);
  const gallery = published.length ? published : illustrativeGallery;
  return <section className="editorial-section gallery-section">
    <div className="container">
      <div className="editorial-section-heading">
        <div><p className="eyebrow">Para entrar no clima</p><h2>Entre sabores<br /> e bons encontros.</h2></div>
        <div><p>{published.length ? "Um convite para conhecer a casa pelos seus detalhes." : "Imagens ilustrativas inspiram o clima deste projeto. As fotografias da casa serão apresentadas aqui."}</p>
          {compact && <Link className="editorial-text-link" href="/galeria">Explorar a galeria <ArrowUpRight size={18} /></Link>}
          {demo && <small>Galeria de demonstração.</small>}
        </div>
      </div>
      <Gallery entries={compact ? gallery.slice(0, 3) : gallery} compact={compact} />
    </div>
  </section>;
}

export function VisitSection({ settings, demo, pageHeading = false }: { settings: Settings; demo: boolean; pageHeading?: boolean }) {
  const phone = telephoneLink(settings.phone);
  const whatsapp = whatsappLink(settings, demo);
  const instagram = instagramLink(settings.instagram);
  const status = openingStatus(settings.hours, settings.special_hours);
  const today = localDate(new Date());
  const exceptions = settings.special_hours.filter(entry => entry.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  return <section className="visit-section">
    <div className="container visit-grid">
      <div className="visit-intro">
        <p className="eyebrow">Canivete · Linhares, ES</p>
        {pageHeading ? <h1>A gente se<br /><em>encontra aqui.</em></h1> : <h2>A gente se<br /><em>encontra aqui.</em></h2>}
        <p>Traga a boa companhia.<br />O caminho até a casa começa por aqui.</p>
        <div className="visit-directions">
          <MapPin size={24} strokeWidth={1.4} aria-hidden="true" />
          <div><h3>{settings.street}</h3><p>{settings.district}, {settings.city} – {settings.state}</p><p>{settings.reference}</p></div>
        </div>
        <TrackedLink kind="directions" href={mapLink(settings)} className="button" target="_blank" rel="noopener noreferrer">Como chegar <ArrowUpRight size={18} /></TrackedLink>
        {!settings.maps_url && <small className="visit-note">A busca no Google Maps usa o endereço divulgado pela casa.</small>}
      </div>
      <div className="visit-details">
        <div className="visit-detail-block"><Clock3 size={22} strokeWidth={1.4} aria-hidden="true" /><div>
          <h3>Planeje a sua visita</h3>
          {status && <p className="visit-status">{status}</p>}
          {settings.hours.length ? <dl className="visit-hours">{[1, 2, 3, 4, 5, 6, 0].map(day => {
            const hours = settings.hours.filter(entry => entry.day === day).sort((a, b) => a.opens.localeCompare(b.opens));
            return hours.length ? <div key={day}><dt>{weekdays[day]}</dt><dd>{hours.map(formatInterval).join(" · ")}</dd></div> : null;
          })}</dl> : <p>Consulte a equipe para confirmar os dias e horários de atendimento.</p>}
          {exceptions.length > 0 && <div className="visit-exceptions"><h4>Datas especiais</h4>{exceptions.map(entry => <p key={entry.date}><strong>{formatSpecialDate(entry.date)}</strong><br />{entry.label} · {formatInterval(entry)}</p>)}</div>}
          {settings.hours.length > 0 && <small>Horário de Brasília.</small>}
        </div></div>
        <div className="visit-detail-block"><Phone size={22} strokeWidth={1.4} aria-hidden="true" /><div>
          <h3>Fale com a casa</h3>{phone && <TrackedLink kind="contact" subject="telefone" href={phone} className="visit-phone">{settings.phone}</TrackedLink>}
          {whatsapp && <TrackedLink kind="contact" subject="whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer" className="editorial-text-link">Conversar no WhatsApp <ArrowUpRight size={17} /></TrackedLink>}
          {settings.reservations_enabled && <Link href="/reservas" className="editorial-text-link">Consultar uma reserva <ArrowUpRight size={17} /></Link>}
        </div></div>
        {instagram && <div className="visit-detail-block"><Camera size={22} strokeWidth={1.4} aria-hidden="true" /><div>
          <h3>As novidades passam por lá</h3><TrackedLink kind="contact" subject="instagram" href={instagram} target="_blank" rel="noopener noreferrer" className="editorial-text-link">{new URL(instagram).pathname.replaceAll("/", "@").replace(/@$/, "")} <ArrowUpRight size={17} /></TrackedLink>
        </div></div>}
      </div>
    </div>
  </section>;
}

export function EventList({ events, demo, archived = false }: { events: EventEntry[]; demo: boolean; archived?: boolean }) {
  return <div className="editorial-event-list">{events.map(event => {
    const date = formatEvent(event.starts_at);
    return <article className="editorial-event" key={event.id}>
      <time dateTime={event.starts_at} className="event-date"><strong>{date.day}</strong><span>{date.month}</span></time>
      {event.image && <div className="event-image"><Image src={event.image.src} alt={event.image.alt} fill sizes="(max-width: 700px) 100vw, 180px" />{event.image.illustrative && <span className="photo-disclosure">Imagem ilustrativa</span>}</div>}
      <div className="event-info"><p className="eyebrow">{demo ? "Evento fictício · Demonstração" : archived ? "Arquivo da agenda" : event.featured ? "Na agenda da casa" : "Programação"}</p>
        <h3><Link href={`/eventos/${event.slug}`}>{event.title}</Link></h3><p>{event.artist || event.description.slice(0, 140)}</p><span>{date.full} · {date.time}</span>
      </div>
      <Link href={`/eventos/${event.slug}`} className="event-more" aria-label={`Ver detalhes de ${event.title}`}><ArrowUpRight size={25} strokeWidth={1.4} /></Link>
    </article>;
  })}</div>;
}

export function EventSection({ events, demo }: { events: EventEntry[]; demo: boolean }) {
  const { upcoming } = eventGroups(events);
  if (!upcoming.length) return null;
  return <section className="editorial-section"><div className="container">
    <div className="editorial-section-heading"><div><p className="eyebrow">Para colocar na agenda</p><h2>Mais um motivo<br /> para vir.</h2></div><Link className="editorial-text-link" href="/eventos">Ver toda a programação <ArrowUpRight size={18} /></Link></div>
    <EventList events={upcoming.slice(0, 3)} demo={demo} />
  </div></section>;
}

export function InstagramSection({ entries, settings }: { entries: GalleryEntry[]; settings: Settings }) {
  const profile = instagramLink(settings.instagram);
  if (!profile) return null;
  const posts = entries.filter(entry => entry.status === "published" && instagramPost(entry.instagram_url)).sort((a, b) => a.position - b.position).slice(0, 4);
  return <section className="instagram-section"><div className="container">
    <div className="instagram-heading"><Camera size={32} strokeWidth={1.2} /><div><p className="eyebrow">O encontro continua</p><h2>Acompanhe a casa.</h2><p>Novidades, encontros e o dia a dia da Lucrécio.</p></div>
      <TrackedLink kind="contact" subject="instagram" href={profile} target="_blank" rel="noopener noreferrer" className="button outline">Acompanhe a Lucrécio no Instagram <ArrowUpRight size={18} /></TrackedLink>
    </div>
    {posts.length > 0 && <div className="instagram-mosaic">{posts.map(entry => <a key={entry.id} href={instagramPost(entry.instagram_url)!} target="_blank" rel="noopener noreferrer" aria-label={`Ver publicação — ${entry.image.alt}`}>
      <Image src={entry.image.src} alt={entry.image.alt} fill sizes="(max-width: 640px) 50vw, 25vw" />{entry.image.illustrative && <span className="photo-disclosure">Imagem ilustrativa</span>}
    </a>)}</div>}
  </div></section>;
}
