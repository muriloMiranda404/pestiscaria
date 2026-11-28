import { InstagramSection, VisitSection } from "@/components/site/Editorial";
import { getCatalog } from "@/services/store";
import { meta } from "@/lib/seo";

export const metadata = meta("Contato e localização", "Encontre a Lucrécio Petiscaria na Rua João Tersi, 216, Canivete, Linhares. Consulte o telefone, o perfil da casa e as informações para sua visita.", "/contato");

export default async function ContactPage() {
  const { settings, demo, gallery } = await getCatalog();
  return <><VisitSection settings={settings} demo={demo} pageHeading /><InstagramSection entries={gallery} settings={settings} /></>;
}
