import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { PageIntro } from "@/components/site/Presentation";
import { EventList } from "@/components/site/Editorial";
import { getCatalog } from "@/services/store";
import { eventGroups } from "@/features/editorial/events";
import { meta } from "@/lib/seo";
import "@/features/editorial/editorial.css";

export const metadata = meta("Eventos e novidades", "Consulte a programação publicada pela Lucrécio Petiscaria em Linhares. Veja os detalhes de cada encontro e as novidades da casa.", "/eventos");

export default async function EventsPage() {
  const { events, demo } = await getCatalog();
  const { upcoming, archive } = eventGroups(events);
  return <>
    <PageIntro eyebrow="A agenda da casa" title="Encontros para lembrar." description="Acompanhe a programação e veja os detalhes de cada encontro." />
    <section className="container events-page-section" aria-labelledby="upcoming-events">
      <h2 id="upcoming-events" className="events-subheading">Próximos encontros</h2>
      {demo && events.length > 0 && <p className="editorial-demo-note">Os eventos desta demonstração são fictícios.</p>}
      {upcoming.length ? <EventList events={upcoming} demo={demo} /> : <div className="editorial-empty"><CalendarDays size={38} strokeWidth={1.2} /><h3>A próxima data vem aí.</h3><p>A programação será divulgada aqui assim que for confirmada pela casa.</p><Link className="editorial-text-link" href="/contato">Falar com a equipe <ArrowUpRight size={17} /></Link></div>}
    </section>
    {archive.length > 0 && <section className="container events-page-section"><h2 className="events-subheading">Já passou por aqui</h2><EventList events={archive} demo={demo} archived /></section>}
  </>;
}
