import { GallerySection, InstagramSection } from "@/components/site/Editorial";
import { PageIntro } from "@/components/site/Presentation";
import { getCatalog } from "@/services/store";
import { meta } from "@/lib/seo";

export const metadata = meta("Galeria", "Veja as imagens cadastradas da Lucrécio Petiscaria. Conheça o clima da casa e acompanhe as novidades pelo Instagram.", "/galeria");

export default async function GalleryPage() {
  const { gallery, demo, settings } = await getCatalog();
  return <>
    <PageIntro eyebrow="O olhar da casa" title="Galeria" description="Detalhes que dão vontade de ficar um pouco mais." />
    <GallerySection entries={gallery} demo={demo} />
    <InstagramSection entries={gallery} settings={settings} />
  </>;
}
