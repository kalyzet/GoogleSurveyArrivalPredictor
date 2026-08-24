import { NextRequest } from "next/server";
import { insertSurvey, validateSurveyInput } from "@/lib/dataService";
import { evaluatePendingPredictions } from "@/lib/evaluate";
import { toISODate } from "@/lib/stats";

interface ImportRow {
  date?: string;
  tanggal?: string;
  reward?: number | string;
  hadiah?: number | string;
}

function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/.exec(trimmed);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    if (!Number.isNaN(d.getTime())) return toISODate(d);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return toISODate(parsed);
  return null;
}

function normalizeReward(raw: number | string | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const cleaned = String(raw).replace(/[Rp\s.,]/g, (ch) => (ch === "." ? "" : ch === "," ? "." : ""));
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.round(num) : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.rows)) {
    return Response.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const dryRun: boolean = !!body.dryRun;

  const valid: Array<{ date: string; reward: number }> = [];
  const invalid: Array<{ row: unknown; reason: string }> = [];
  const duplicates: Array<{ row: unknown }> = [];

  for (const row of body.rows as ImportRow[]) {
    const rawDate = row.date ?? row.tanggal;
    const rawReward = row.reward ?? row.hadiah;
    if (rawDate === undefined || rawReward === undefined) {
      invalid.push({ row, reason: "Kolom tanggal/hadiah tidak lengkap" });
      continue;
    }
    const iso = typeof rawDate === "string" ? normalizeDate(rawDate) : null;
    const reward = normalizeReward(rawReward);
    const check = validateSurveyInput(iso ?? "", reward);
    if (!check.ok) {
      invalid.push({ row, reason: check.error ?? "Tidak valid" });
      continue;
    }
    if (valid.some((v) => v.date === iso) || (await import("@/lib/dataService")).isDuplicateDate(iso!)) {
      duplicates.push({ row });
      continue;
    }
    valid.push({ date: iso!, reward: reward! });
  }

  if (!dryRun && valid.length > 0) {
    for (const v of valid) insertSurvey(v.date, v.reward);
    evaluatePendingPredictions(valid[valid.length - 1].date, valid[valid.length - 1].reward);
  }

  return Response.json({
    dryRun,
    validCount: valid.length,
    invalidCount: invalid.length,
    duplicateCount: duplicates.length,
    preview: valid.slice(0, 10),
    invalidPreview: invalid.slice(0, 5),
  });
}
