"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

export function LoginForm({ demo, configured }: { demo: boolean; configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demo ? { demo: true } : { email: email.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível entrar. Tente novamente.");
      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Confira sua conexão e tente novamente.");
      setBusy(false);
    }
  }
  if (!demo && !configured) return <div className="auth-notice"><h2>Painel em preparação</h2><p>O responsável técnico está preparando o acesso da equipe.</p></div>;
  return <form className="auth-form" onSubmit={submit}>
    {demo ? <div className="auth-notice"><strong>Explore a demonstração</strong><p>Experimente as ferramentas com produtos fictícios. As alterações ficam no ambiente de apresentação. Use apenas dados de exemplo.</p></div> : <>
      <label htmlFor="login-email">E-mail</label>
      <input id="login-email" name="email" type="email" required maxLength={254} autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="Seu e-mail de acesso" disabled={busy}/>
      <label htmlFor="login-password">Senha</label>
      <div className="auth-password"><input id="login-password" name="password" type={showPassword ? "text" : "password"} required maxLength={200} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy}/>
        <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>
    </>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button type="submit" className="auth-submit" disabled={busy}>{busy ? <><LoaderCircle className="auth-spinner" size={18}/> Entrando…</> : <>{demo ? "Entrar na demonstração" : "Entrar no painel"}<ArrowRight size={18} aria-hidden/></>}</button>
    {!demo && <p className="auth-help">Precisa recuperar seu acesso? Fale com o responsável pela administração do site.</p>}
  </form>;
}
