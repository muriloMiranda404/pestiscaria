import { timeZone } from "@/config/restaurant";
import type { Status } from "@/types/domain";

export const publication: Record<Status, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export const reservationLabels = {
  pending: "Pendente", confirmed: "Confirmada", declined: "Recusada",
  cancelled: "Cancelada", completed: "Concluída",
} as const;

export const money = (value: number | null) =>
  value === null ? "A consultar" : (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function centsInput(cents: number | null) {
  return cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

export function parseCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized)) throw new Error("Informe o preço em reais, com até duas casas decimais.");
  const [reais, fraction = ""] = normalized.split(".");
  return Number(reais) * 100 + Number(fraction.padEnd(2, "0"));
}

export function searchable(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function makeSlug(value: string) {
  return searchable(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const localParts = new Intl.DateTimeFormat("en-GB", {
  timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function dateInput(value: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  const parts = Object.fromEntries(localParts.formatToParts(d).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function instantInSaoPaulo(local: string) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(local)) throw new Error("Informe a data e a hora.");
  const target = Date.parse(local + ":00Z");
  let instant = target;
  for (let attempt = 0; attempt < 3 && Number.isFinite(instant); attempt++) {
    const seen = dateInput(new Date(instant));
    if (seen === local) return new Date(instant).toISOString();
    instant += target - Date.parse(seen + ":00Z");
  }
  throw new Error("Confira a data e a hora de Brasília.");
}

export function nextDate(date: string, days = 1) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string, withTime = false) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone, dateStyle: "short", ...(withTime ? {timeStyle: "short"} : {}),
  }).format(new Date(iso));
}
