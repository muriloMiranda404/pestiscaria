"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { MetricKind } from "@/types/domain";

let enabled = false;
function accepted() {
  try { return localStorage.getItem("lucrecio-metrics-consent") === "yes"; } catch { return false; }
}
export function track(kind: MetricKind, subject = "", campaign = "") {
  if (!enabled || !accepted()) return;
  const safeCampaign = campaign.replace(/[^\p{L}\p{N}\s._-]/gu, "").slice(0, 80);
  void fetch("/api/metrics", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, subject, campaign: safeCampaign, consent: true }), keepalive: true }).catch(() => {});
}
export function MetricsConsent({ allowed }: { allowed: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    enabled = allowed;
    const check = window.setTimeout(() => {
      if (allowed) {
        try { if (!localStorage.getItem("lucrecio-metrics-consent")) setShow(true); } catch {}
      }
    }, 0);
    const reopen = () => { if (allowed) setShow(true); };
    window.addEventListener("metrics-preferences", reopen);
    return () => { window.clearTimeout(check); enabled = false; window.removeEventListener("metrics-preferences", reopen); };
  }, [allowed]);
  function choose(value: string) {
    try { localStorage.setItem("lucrecio-metrics-consent", value); } catch {}
    setShow(false);
  }
  if (!show) return null;
  return <aside className="consent" aria-label="Preferências de privacidade"><p>Podemos registrar visitas e cliques de forma agregada para melhorar o site? <Link href="/privacidade">Saiba mais</Link></p>
    <div><button className="button outline" onClick={() => choose("no")}>Recusar</button><button className="button" onClick={() => choose("yes")}>Permitir métricas</button></div></aside>;
}
export function MetricsPreferences() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("metrics-preferences"))}>Preferências de privacidade</button>;
}
export function ViewMetric({ kind, subject = "" }: { kind: MetricKind; subject?: string }) {
  const path = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    const timer = setTimeout(() => {
      track(kind, subject, params.get("utm_campaign") || "");
      if (kind === "menu" && params.get("qr")) track("qr", params.get("mesa")?.replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "");
    }, 300);
    return () => clearTimeout(timer);
  }, [kind, subject, path, params]);
  return null;
}
