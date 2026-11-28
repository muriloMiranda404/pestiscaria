import { requireAdmin } from "@/lib/auth";
import { getAdminCatalog, listQr } from "@/services/store";
import { QrEditor } from "@/features/qr/QrEditor";
export const metadata = { title: "QR Codes · Administração", robots: { index: false, follow: false } };
export default async function QrPage() {
  await requireAdmin();
  const [catalog, entries] = await Promise.all([getAdminCatalog(), listQr()]);
  let siteUrl = "";
  try {
    const configured = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
    if (configured.protocol === "https:" || (catalog.demo && configured.protocol === "http:")) siteUrl = configured.origin;
  } catch { /* O editor informa que o domínio precisa ser definido. */ }
  return <><header className="qr-heading"><p>À mesa</p><h1>QR Codes do cardápio</h1></header><QrEditor initial={entries} siteUrl={siteUrl} name={catalog.settings.name} logo={catalog.settings.logo} demo={catalog.demo} /></>;
}
