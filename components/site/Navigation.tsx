"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Menu, X, UtensilsCrossed } from "lucide-react";
import type { Settings } from "@/types/domain";

export function Brand({ name, logo }: { name: string; logo: string }) {
  return <Link href="/" className="brand">
    {logo ? <Image src={logo} alt={name} width={170} height={65} className="brand-logo" /> : <>
      <UtensilsCrossed size={30} strokeWidth={1.15} aria-hidden="true" />
      <span><strong>{name.replace(/ Petiscaria$/i, "")}</strong><small>RESTAURANTE & PETISCARIA</small></span>
    </>}<span className="sr-only">Início</span>
  </Link>;
}
export function Navigation({ settings, hasEvents }: { settings: Settings; hasEvents: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = [{ href: "/", label: "Início" }, { href: "/cardapio", label: "Cardápio" },
    { href: "/sobre", label: "A casa" }, { href: "/galeria", label: "Galeria" },
    ...(hasEvents ? [{ href: "/eventos", label: "Agenda" }] : []), { href: "/contato", label: "Localização" }];
  const items = links.map(link => <Link key={link.href} href={link.href} aria-current={path === link.href ? "page" : undefined}
    onClick={() => setOpen(false)}>{link.label}</Link>);
  return <header className={`site-header ${path === "/" ? "over-hero" : ""}`}>
    <div className="container nav-inner"><Brand name={settings.name} logo={settings.logo} />
      <nav aria-label="Navegação principal" className="desktop-nav">{items}</nav>
      <Link className="nav-contact" href="/contato">Fale com a gente <ArrowUpRight size={16} /></Link>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className="mobile-trigger" aria-label="Abrir menu"><Menu size={26} /></Dialog.Trigger>
        <Dialog.Portal><Dialog.Overlay className="nav-overlay" /><Dialog.Content className="mobile-menu">
          <div className="mobile-menu-top"><Dialog.Title>Lucrécio</Dialog.Title><Dialog.Close aria-label="Fechar menu"><X size={24} /></Dialog.Close></div>
          <Dialog.Description className="sr-only">Navegue pelo site da Lucrécio Petiscaria</Dialog.Description>
          <nav aria-label="Navegação mobile">{items}</nav><p>Canivete · Linhares, ES</p>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>
    </div>
  </header>;
}
