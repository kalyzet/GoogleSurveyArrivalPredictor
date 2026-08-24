import { getDatasetHealth } from "@/lib/dataService";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const seededRow = db.prepare("SELECT value FROM settings WHERE key = 'seeded'").get() as
    | { value: string }
    | undefined;
  return Response.json({
    health: getDatasetHealth(),
    coldstartApplied: !!seededRow,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body?.action === "clear-models") {
    getDb().prepare("DELETE FROM model_versions").run();
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Aksi tidak dikenal" }, { status: 400 });
}
