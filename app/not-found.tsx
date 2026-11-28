import Link from "next/link";
export default function NotFound() {
  return <main className="container error-page"><p className="eyebrow">Página não encontrada</p><h1>Vamos voltar<br />para a mesa?</h1><p>O endereço pode ter mudado ou o conteúdo está indisponível.</p><Link className="button" href="/">Voltar ao início</Link></main>;
}
