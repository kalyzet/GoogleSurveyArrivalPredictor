import { getDb } from "@/lib/db";
import type { PredictionRecord } from "@/lib/types";

export async function GET() {
  const rows = getDb()
    .prepare("SELECT * FROM predictions ORDER BY created_at DESC LIMIT 100")
    .all() as PredictionRecord[];
  return Response.json({ predictions: rows });
}
