import { EntityManager } from "@/components/admin/EntityManager";
import { panelCatalog } from "@/features/admin/data";

export default async function Page() {
  return <EntityManager entity="gallery" catalog={await panelCatalog()}/>;
}
