import "server-only";
import { cache } from "react";
import { requireAdmin } from "@/lib/auth";
import { getAdminCatalog } from "@/services/store";

export const authorizePanel = cache(async () => { await requireAdmin(); });

export const panelCatalog = cache(async () => {
  await authorizePanel();
  return getAdminCatalog();
});
