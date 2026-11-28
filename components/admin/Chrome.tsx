"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, CalendarDays, ChartNoAxesCombined, ChefHat, ChevronDown, Grip, Images, LayoutDashboard, ListTree, LogOut, Menu, NotebookText, QrCode, Settings, Tag } from "lucide-react";
import { failure, mutate } from "@/features/admin/client";

const sections = [
  { name: "Acompanhar", items: [
    { href: "/admin", label: "Visão geral", Icon: LayoutDashboard },
    { href: "/admin/metricas", label: "Métricas", Icon: ChartNoAxesCombined },
    { href: "/admin/reservas", label: "Reservas", Icon: NotebookText },
  ] },
  { name: "Conteúdo", items: [
    { href: "/admin/cardapio", label: "Produtos", Icon: ChefHat },
    { href: "/admin/categorias", label: "Categorias", Icon: ListTree },
    { href: "/admin/promocoes", label: "Promoções", Icon: Tag },
    { href: "/admin/eventos", label: "Eventos", Icon: CalendarDays },
    { href: "/admin/galeria", label: "Galeria", Icon: Images },
  ] },
  { name: "Restaurante", items: [
    { href: "/admin/qr-code", label: "QR Code de mesa", Icon: QrCode },
    { href: "/admin/configuracoes", label: "Configurações", Icon: Settings },
  ] },
];

export function AdminChrome({ children, name, demo }: { children: ReactNode; name: string; demo: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const details = useRef<HTMLDetailsElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await mutate("/api/admin/logout", "POST");
      router.replace("/admin/login");
      router.refresh();
    } catch (cause) { setError(failure(cause)); setBusy(false); }
  }
  function links() {
    return sections.map(section => <div className="adm-nav-group" key={section.name}>
      <p>{section.name}</p>
      {section.items.map(({ href, label, Icon }) =>
        <Link href={href} aria-current={path === href ? "page" : undefined} key={href}
          onClick={() => { if (details.current) details.current.open = false; }}>
          <Icon size={17} aria-hidden="true" />{label}
        </Link>)}
    </div>);
  }
  const current = sections.flatMap(section => section.items).find(item => item.href === path)?.label ?? "Painel";
  return <div className="admin-shell">
    <a className="adm-skip" href="#administracao">Ir para o conteúdo</a>
    <aside className="adm-sidebar">
      <Link className="adm-identity" href="/admin"><span className="adm-monogram" aria-hidden="true">L</span><span>{name}<small>Administração</small></span></Link>
      <nav aria-label="Navegação do painel">{links()}</nav>
      <Link className="adm-exit-site" href="/"><ArrowUpRight size={16} />Visitar o site</Link>
    </aside>
    <div className="adm-work">
      <header className="adm-topbar">
        <span className="adm-crumb"><Grip size={16} /><span>Painel</span><span aria-hidden="true">/</span><strong>{current}</strong></span>
        <details className="adm-mobile-nav" ref={details}><summary><Menu size={19}/> Painel <ChevronDown size={14}/></summary>
          <nav aria-label="Menu do painel">{links()}<Link href="/">Visitar o site <ArrowUpRight size={15}/></Link></nav>
        </details>
        <div className="adm-top-actions">{demo && <span className="adm-badge adm-demo">Demonstração</span>}
          <button className="adm-icon-text" onClick={signOut} disabled={busy} aria-label="Sair do painel"><LogOut size={16}/><span>Sair</span></button>
        </div>
      </header>
      {error && <p className="adm-flash error" role="alert">{error}</p>}
      <main className="adm-main" id="administracao" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
