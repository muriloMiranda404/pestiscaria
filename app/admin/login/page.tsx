import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { currentAdmin } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase";
import { LoginForm } from "@/features/auth/LoginForm";
import "@/features/auth/auth.css";

export const metadata = { title: "Acesso ao painel | Lucrécio Petiscaria", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  const demo = process.env.APP_MODE === "demo";
  return <main className="auth-page">
    <Link className="auth-back" href="/"><ArrowLeft size={17} aria-hidden/> Voltar ao site</Link>
    <section className="auth-panel" aria-labelledby="login-title">
      <div className="auth-mark" aria-hidden>L</div>
      <p className="auth-eyebrow">Lucrécio Petiscaria</p>
      <h1 id="login-title">A casa nas suas mãos.</h1>
      <p className="auth-description">Cuide do cardápio, das novidades e de cada detalhe que convida à mesa.</p>
      <LoginForm demo={demo} configured={supabaseConfigured()}/>
      <p className="auth-footnote"><LockKeyhole size={14} aria-hidden/> Acesso ao painel de administração</p>
    </section>
    <p className="auth-signature">Desenvolvido por <a href="https://kodexbase.vercel.app/" target="_blank" rel="noopener noreferrer">KodexBase</a></p>
  </main>;
}
