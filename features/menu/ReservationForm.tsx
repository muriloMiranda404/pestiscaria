"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { track } from "@/components/site/Metrics";

type Fields = { date: string; time: string; people: number; name: string; phone: string; notes: string; privacy: boolean };

function localDate() {
  const pieces = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return ["year", "month", "day"].map((part) => pieces.find((piece) => piece.type === part)?.value).join("-");
}

export function ReservationForm({ demo }: { demo: boolean }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Fields>();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [preview, setPreview] = useState(false);

  async function submit(values: Fields) {
    setError("");
    if (demo) { setPreview(true); return; }
    try {
      const { privacy: _privacy, ...request } = values;
      void _privacy;
      const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível enviar sua solicitação.");
      setSent(true); track("reservation");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Falha de conexão. Tente novamente."); }
  }

  if (sent) return <section className="reservation-success" role="status"><CheckCircle2 size={40} strokeWidth={1.3} /><h2>Solicitação recebida</h2><p>O pedido de reserva está pendente. Aguarde o contato da equipe para confirmar a mesa e o horário.</p><Link className="button outline" href="/cardapio">Conhecer o cardápio</Link></section>;
  return <form className="reservation-form" onSubmit={handleSubmit(submit)} noValidate>
    <div className="reservation-form-grid"><label className="menu-field">Data<input type="date" min={localDate()} aria-invalid={Boolean(errors.date)} {...register("date", { required: "Escolha uma data.", validate: (value) => value >= localDate() || "Escolha uma data a partir de hoje." })} />{errors.date && <span className="menu-error">{errors.date.message}</span>}</label>
      <label className="menu-field">Horário desejado<input type="time" aria-invalid={Boolean(errors.time)} {...register("time", { required: "Informe o horário desejado." })} />{errors.time && <span className="menu-error">{errors.time.message}</span>}</label>
      <label className="menu-field">Quantidade de pessoas<input type="number" min={1} max={100} inputMode="numeric" aria-invalid={Boolean(errors.people)} {...register("people", { valueAsNumber: true, required: "Informe a quantidade.", min: { value: 1, message: "Informe pelo menos uma pessoa." }, max: { value: 100, message: "Para grupos maiores, fale diretamente com a equipe." }, validate: (value) => Number.isInteger(value) || "Informe uma quantidade inteira." })} />{errors.people && <span className="menu-error">{errors.people.message}</span>}</label>
      <label className="menu-field">Seu nome<input autoComplete="name" maxLength={100} aria-invalid={Boolean(errors.name)} {...register("name", { required: "Informe seu nome.", validate: (value) => !!value.trim() || "Informe seu nome." })} />{errors.name && <span className="menu-error">{errors.name.message}</span>}</label>
      <label className="menu-field reservation-full">Telefone para retorno<input type="tel" autoComplete="tel" placeholder="(27) 99999-9999" maxLength={24} aria-invalid={Boolean(errors.phone)} {...register("phone", { required: "Informe um telefone de contato.", validate: (value) => /^\d{10,15}$/.test(value.replace(/\D/g, "")) || "Informe DDD e telefone." })} />{errors.phone && <span className="menu-error">{errors.phone.message}</span>}</label>
      <label className="menu-field reservation-full">Observações opcionais<textarea maxLength={500} rows={3} {...register("notes")} /></label></div>
    <label className="reservation-privacy"><input type="checkbox" {...register("privacy", { required: true })} /><span>Li a <Link href="/privacidade">política de privacidade</Link> e estou ciente do uso destes dados para responder à solicitação.</span></label>{errors.privacy && <p className="menu-error">Leia a política e confirme sua ciência para continuar.</p>}
    {demo && <p className="menu-warning">Este formulário faz parte da demonstração. Use dados de exemplo. A equipe do restaurante não recebe estas informações.</p>}
    <button type="submit" className="button" disabled={isSubmitting}><CalendarDays size={18} />{isSubmitting ? "Enviando…" : demo ? "Testar solicitação" : "Solicitar reserva"}</button>
    {error && <p role="alert" className="menu-error">{error}</p>}{preview && <p role="status" className="menu-warning">Formulário validado. Na versão habilitada pelo restaurante, a solicitação ficará pendente de análise.</p>}
  </form>;
}
