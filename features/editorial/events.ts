import { timeZone } from "@/config/restaurant";
import type { EventEntry } from "@/types/domain";
import { localDate } from "./visit";

const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone });
const fullDay = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone,
});
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone });
const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone });

export function formatEvent(value: string) {
  const date = new Date(value);
  return {
    day: day.format(date),
    month: shortMonth.format(date).replace(".", ""),
    full: fullDay.format(date),
    time: time.format(date),
  };
}

export function eventGroups(events: EventEntry[], now = new Date()) {
  const today = localDate(now);
  const upcoming: EventEntry[] = [], archive: EventEntry[] = [];
  for (const event of events) {
    if (event.status !== "published") continue;
    const start = new Date(event.starts_at);
    if (Number.isNaN(start.getTime())) continue;
    const past = event.ends_at ? Date.parse(event.ends_at) <= now.getTime() : localDate(start) < today;
    (past ? archive : upcoming).push(event);
  }
  upcoming.sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  archive.sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at));
  return { upcoming, archive };
}

function icalText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,").replace(/;/g, "\\;");
}

// RFC 5545 limits physical lines to 75 octets, including continuation whitespace.
function foldLine(value: string) {
  const encoder = new TextEncoder();
  let line = "", length = 0;
  const lines: string[] = [];
  for (const char of value) {
    const size = encoder.encode(char).length;
    if (length + size > 75) {
      lines.push(line);
      line = " ";
      length = 1;
    }
    line += char;
    length += size;
  }
  lines.push(line);
  return lines.join("\r\n");
}

function utc(value: string | Date) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function calendarFile(event: EventEntry, location: string, url: string, demo: boolean, generated = new Date()) {
  const title = (demo ? "Demonstração — " : "") + event.title;
  const description = [event.description, event.notes].filter(Boolean).join("\n\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KodexBase//Lucrecio Petiscaria//PT-BR",
    "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    "UID:" + icalText(event.id + "@" + new URL(url).hostname), "DTSTAMP:" + utc(generated),
    "DTSTART:" + utc(event.starts_at),
    ...(event.ends_at ? ["DTEND:" + utc(event.ends_at)] : []),
    "SUMMARY:" + icalText(title), "DESCRIPTION:" + icalText(description),
    "LOCATION:" + icalText(location), "URL:" + url, "END:VEVENT", "END:VCALENDAR",
  ].map(foldLine).join("\r\n") + "\r\n";
}
