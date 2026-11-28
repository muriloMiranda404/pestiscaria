import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Beer, HeartHandshake, Utensils } from "lucide-react";
import { getCatalog } from "@/services/store";
import { meta } from "@/lib/seo";
import { VisitSection } from "@/components/site/Editorial";
import "@/features/editorial/editorial.css";

export const metadata = meta("Sobre a casa", "Conheça a Lucrécio Petiscaria, um restaurante de porções, petiscos e encontros em família no Canivete, em Linhares, ES.", "/sobre");

export default async function AboutPage() {
  const { settings, demo, gallery } = await getCatalog();
  const photo = gallery.find(entry => entry.status === "published" && !entry.image.illustrative)?.image
    ?? { src: "/images/mesa.webp", alt: "Mesa de madeira com luz acolhedora, em composição ilustrativa", illustrative: true };
  return <>
    <section className="about-opening container">
      <div><p className="eyebrow">A casa · {settings.district}, {settings.city}</p><h1>Uma mesa.<br />Muitas <em>histórias.</em></h1><p className="about-lead">Um lugar para compartilhar bons momentos.</p></div>
      <div className="about-photo"><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 760px) 100vw, 55vw" priority />{photo.illustrative && <span className="photo-disclosure">Imagem ilustrativa</span>}</div>
    </section>
    <section className="container about-story"><div><p className="eyebrow">Lucrécio Petiscaria</p><h2>A boa companhia<br /> faz parte da mesa.</h2></div><div><p>{settings.about}</p><p>Conheça as opções do cardápio e fale com a equipe para planejar a sua visita.</p><Link className="button" href="/cardapio">Explorar cardápio <ArrowRight size={18} /></Link></div></section>
    <section className="about-values container" aria-label="A proposta da casa">
      <div><HeartHandshake size={29} strokeWidth={1.25} /><h2>Para estar junto</h2><p>Um ambiente familiar para encontros e conversas.</p></div>
      <div><Utensils size={29} strokeWidth={1.25} /><h2>Para compartilhar</h2><p>Porções e petiscos como convite para dividir a mesa.</p></div>
      <div><Beer size={29} strokeWidth={1.25} /><h2>Para aproveitar</h2><p>Cerveja gelada e boa companhia no bairro Canivete.</p></div>
    </section>
    <VisitSection settings={settings} demo={demo} />
  </>;
}
