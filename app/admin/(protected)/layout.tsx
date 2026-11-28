import type { Metadata } from "next";
import { AdminChrome } from "@/components/admin/Chrome";
import { panelCatalog } from "@/features/admin/data";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel administrativo", robots: { index: false, follow: false } };

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { settings, demo } = await panelCatalog();
  return <AdminChrome name={settings.name} demo={demo}>{children}</AdminChrome>;
}
