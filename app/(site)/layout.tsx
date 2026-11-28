import { Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { getCatalog } from "@/services/store";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { MetricsConsent } from "@/components/site/Metrics";

export const dynamic = "force-dynamic";
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, events, demo } = await getCatalog();
  const now = new Date().getTime();
  const announce = settings.announcement && (!settings.announcement_until || Date.parse(settings.announcement_until) > now);
  return <div className="site-shell" style={{ "--rust": settings.primary_color, "--gold": settings.accent_color } as CSSProperties}>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    {demo && <div className="demo-banner"><span>Demonstração · conteúdos fictícios</span><Link href="/admin">Ver painel <span aria-hidden="true">↗</span></Link></div>}
    <Navigation settings={settings} hasEvents={events.some(event => Date.parse(event.ends_at || event.starts_at) > now)} />
    {announce && <aside className="announcement" aria-label="Aviso da casa">{settings.announcement}</aside>}
    <main id="conteudo">{settings.maintenance ? <div className="container maintenance"><p className="eyebrow">Voltamos em breve</p><h1>Estamos preparando a casa.</h1><p>Entre em contato pelo telefone {settings.phone} para informações.</p></div> : children}</main>
    <Footer settings={settings} />
    <Suspense><MetricsConsent allowed={settings.analytics_enabled} /></Suspense>
  </div>;
}
