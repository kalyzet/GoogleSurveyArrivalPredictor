import { getDb } from "@/lib/db";
import type { ModelVersion } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT mv.*
      FROM model_versions mv
      INNER JOIN (
        SELECT target, MAX(trained_at) AS max_trained, MAX(id) AS max_id
        FROM model_versions GROUP BY target, algorithm
      ) latest
      ON mv.target = latest.target AND mv.algorithm = latest.algorithm AND mv.trained_at = latest.max_trained AND mv.id <= latest.max_id
      ORDER BY mv.trained_at DESC
    `)
    .all() as ModelVersion[];
  const unique = new Map<string, ModelVersion>();
  for (const row of rows) {
    const key = `${row.target}|${row.algorithm}`;
    if (!unique.has(key)) unique.set(key, row);
  }
  return Response.json({ versions: [...unique.values()] });
}
