import { notFound } from "next/navigation";
import { getCatalog } from "@/services/store";
import { PageIntro } from "@/components/site/Presentation";
import { ReservationForm } from "@/features/menu/ReservationForm";
import { meta } from "@/lib/seo";
import "@/features/menu/menu.css";
export const metadata = { ...meta("Solicitar reserva", "Consulte a disponibilidade de uma mesa com a equipe da Lucrécio.", "/reservas"), robots: { index: false, follow: false } };
export default async function ReservationsPage() {
  const catalog = await getCatalog();
  if (!catalog.settings.reservations_enabled) notFound();
  return <><PageIntro eyebrow="Um encontro à mesa" title="Solicitar uma reserva" description="Conte quando gostaria de vir. A equipe verificará a disponibilidade e entrará em contato para confirmar." /><section className="container reservation-page"><ReservationForm demo={catalog.demo} /><aside><h2>Uma mesa para encontrar quem você gosta.</h2><p>O envio deste formulário registra uma solicitação. A reserva depende da confirmação do estabelecimento.</p><p>Para falar com a equipe, consulte os contatos da casa.</p><a className="menu-text-link" href="/contato">Ver contatos</a></aside></section></>;
}
