import { adminAction, json } from "@/lib/security/api";
import { readJson } from "@/lib/security/request";
import { saveSettings } from "@/services/store";
export async function PUT(request: Request) {
  return adminAction(request, async () => {
    await saveSettings(await readJson(request));
    return json({ ok: true });
  });
}
