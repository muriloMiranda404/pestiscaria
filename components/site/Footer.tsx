import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";
import type { Settings } from "@/types/domain";
import { Brand } from "./Navigation";
import { MetricsPreferences } from "./Metrics";

export function Footer({ settings }: { settings: Settings }) {
  return <footer className="site-footer"><div className="container">
    <div className="footer-main"><div><Brand name={settings.name} logo={settings.logo} /><p>Bons sabores. Boa companhia.<br />A gente se encontra à mesa.</p></div>
      <nav aria-label="Links do rodapé"><h2>Explore a casa</h2><Link href="/cardapio">Cardápio</Link><Link href="/sobre">Sobre a Lucrécio</Link><Link href="/galeria">Galeria</Link><Link href="/eventos">Agenda</Link></nav>
      <div><h2>Venha nos encontrar</h2><p>{settings.street}<br />{settings.district} · {settings.city}, {settings.state}</p><Link href="/contato">Ver localização <ArrowUpRight size={14} /></Link></div>
      <div><h2>Fique por perto</h2><a href={settings.instagram} target="_blank" rel="noreferrer"><Camera size={17} /> Instagram <ArrowUpRight size={14} /></a><p>{settings.phone}</p><Link href="/contato">Contato</Link></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.name}.{settings.show_cnpj && ` CNPJ ${settings.cnpj}.`}</span>
      <div><Link href="/privacidade">Privacidade</Link>{settings.analytics_enabled && <MetricsPreferences />}<Link href="/admin">Área da equipe</Link></div>
      <a href="https://kodexbase.vercel.app/" target="_blank" rel="noreferrer">Desenvolvido por <strong>KodexBase</strong> <ArrowUpRight size={12} /></a>
    </div>
  </div></footer>;
}
