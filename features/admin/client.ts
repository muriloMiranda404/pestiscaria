"use client";
import { useEffect } from "react";

export async function mutate(url: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown) {
  const multipart = body instanceof FormData;
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: multipart || body === undefined ? { Accept: "application/json" } :
      { "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = response.status === 401 ? "Sua sessão expirou. Entre novamente no painel." : "Não foi possível salvar. Tente novamente.";
    throw new Error(typeof data?.error === "string" ? data.error : fallback);
  }
  return data;
}

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function confirmNavigation(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const next = new URL(link.href);
      if (next.origin === location.origin && next.pathname === location.pathname && next.search === location.search) return;
      if (!window.confirm("Descartar as alterações e sair desta página?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", confirmNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", confirmNavigation, true);
    };
  }, [dirty]);
}

export function failure(cause: unknown) {
  return cause instanceof Error ? cause.message : "Ocorreu uma falha. Tente novamente.";
}
