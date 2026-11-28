import { adminAction, json } from "@/lib/security/api";
import { readJson } from "@/lib/security/request";
import { saveQr } from "@/services/store";
export async function POST(request: Request) {
  return adminAction(request, async () => json(await saveQr(await readJson(request)), 201));
}
