import { timeZone } from "@/config/restaurant";
import type { Hours, Settings, SpecialHours } from "@/types/domain";

export const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function fullAddress(settings: Settings) {
  return [settings.street, settings.district, [settings.city, settings.state].filter(Boolean).join(" - ")]
    .filter(Boolean).join(", ");
}

function publicHttpsUrl(input: string, hosts: string[]) {
  try {
    const url = new URL(input);
    if (url.protocol === "https:" && !url.username && !url.password && !url.port && hosts.includes(url.hostname)) return url;
  } catch { /* An unconfigured destination has no public link. */ }
  return null;
}

export function instagramLink(value: string) {
  const url = publicHttpsUrl(value, ["www.instagram.com", "instagram.com"]);
  return url && /^\/[a-z\d._]+\/?$/i.test(url.pathname) ? url.toString() : null;
}

export function instagramPost(value: string) {
  const url = publicHttpsUrl(value, ["www.instagram.com", "instagram.com"]);
  return url && /^\/(p|reel|tv)\/[a-z\d_-]+\/?$/i.test(url.pathname) ? url.toString() : null;
}

export function mapLink(settings: Settings) {
  const custom = publicHttpsUrl(settings.maps_url, [
    "www.google.com", "google.com", "www.google.com.br", "google.com.br",
    "maps.google.com", "maps.google.com.br", "maps.app.goo.gl", "goo.gl",
  ]);
  if (custom && (custom.hostname.startsWith("maps.") ||
    custom.pathname === "/maps" || custom.pathname.startsWith("/maps/"))) return custom.toString();
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(fullAddress(settings));
}

function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^\d{10,11}$/.test(digits)) return "55" + digits;
  if (/^55\d{10,11}$/.test(digits)) return digits;
  return null;
}

export function telephoneLink(phone: string) {
  const number = phoneDigits(phone);
  return number ? "tel:+" + number : null;
}

export function whatsappLink(settings: Settings, demo: boolean) {
  const number = phoneDigits(settings.whatsapp);
  if (!settings.whatsapp_confirmed || !number || demo) return null;
  return "https://wa.me/" + number + "?text=" + encodeURIComponent(
    "Olá! Encontrei " + settings.name + " pelo site e gostaria de consultar o cardápio.",
  );
}

export function localDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

type Interval = Pick<Hours, "opens" | "closes">;
function hasTimes(entry: Interval) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.opens.slice(0, 5))
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.closes.slice(0, 5));
}

function scheduleFor(date: string, hours: Hours[], exceptions: SpecialHours[]) {
  const override = exceptions.filter(entry => entry.date === date);
  if (override.length) return { known: true, intervals: override.filter(hasTimes) };
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  const day = hours.filter(entry => entry.day === weekday && hasTimes(entry));
  return { known: day.length > 0, intervals: day };
}

export function openingStatus(hours: Hours[], exceptions: SpecialHours[], now = new Date()): string | null {
  const date = localDate(now);
  const today = scheduleFor(date, hours, exceptions);
  const time = clock.format(now);
  const openToday = today.intervals.some(({ opens, closes }) => {
    const start = opens.slice(0, 5), end = closes.slice(0, 5);
    return time >= start && (end <= start || time < end);
  });
  if (openToday) return "Aberto agora";
  // A closure on a special date also supersedes the preceding overnight interval.
  if (!exceptions.some(entry => entry.date === date)) {
    const previous = new Date(date + "T12:00:00Z");
    previous.setUTCDate(previous.getUTCDate() - 1);
    const yesterday = scheduleFor(previous.toISOString().slice(0, 10), hours, exceptions);
    if (yesterday.intervals.some(({ opens, closes }) => {
      const start = opens.slice(0, 5), end = closes.slice(0, 5);
      return end <= start && time < end;
    })) return "Aberto agora";
  }
  return today.known ? "Fechado agora" : null;
}

export function formatInterval(interval: Interval) {
  if (!hasTimes(interval)) return "Fechado";
  const format = (value: string) => {
    const [hours, minutes] = value.slice(0, 5).split(":");
    return String(Number(hours)) + "h" + (minutes === "00" ? "" : minutes);
  };
  return format(interval.opens) + " às " + format(interval.closes);
}

export function formatSpecialDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(value + "T12:00:00Z"));
}
