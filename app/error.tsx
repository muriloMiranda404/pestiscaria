"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="container error-page" role="alert"><p className="eyebrow">Uma pausa por aqui</p><h1>Não conseguimos carregar esta página.</h1><p>Tente novamente em instantes.</p><div className="hero-actions"><button className="button" onClick={reset}>Tentar novamente</button><Link className="button outline" href="/">Voltar ao início</Link></div></section>;
}
