import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { PredictionStatus } from "@/lib/types";

const BACKUP_VERSION = 1;

interface BackupSurvey {
  date?: unknown;
  reward?: unknown;
}

interface BackupPrediction {
  created_at?: unknown;
  predicted_interval?: unknown;
  predicted_date?: unknown;
  predicted_reward?: unknown;
  range_low_days?: unknown;
  range_high_days?: unknown;
  range_low_reward?: unknown;
  range_high_reward?: unknown;
  reliability_arrival?: unknown;
  reliability_reward?: unknown;
  model_version_arrival?: unknown;
  model_version_reward?: unknown;
  status?: unknown;
  actual_date?: unknown;
  actual_reward?: unknown;
  arrival_error?: unknown;
  reward_error?: unknown;
}

interface BackupFile {
  version?: unknown;
  surveys?: unknown;
  predictions?: unknown;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isNullableDate(value: unknown): value is string | null {
  return value === null || isIsoDate(value);
}

const PREDICTION_STATUSES: PredictionStatus[] = ["pending", "evaluated", "missed"];

function validatePrediction(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null) return "Prediksi bukan objek";
  const p = raw as BackupPrediction;
  if (typeof p.created_at !== "string" || p.created_at.length === 0) return "created_at tidak valid";
  if (!isFiniteNumber(p.predicted_interval)) return "predicted_interval tidak valid";
  if (!isIsoDate(p.predicted_date)) return "predicted_date tidak valid";
  if (!isFiniteNumber(p.predicted_reward)) return "predicted_reward tidak valid";
  if (!isFiniteNumber(p.range_low_days) || !isFiniteNumber(p.range_high_days)) return "range days tidak valid";
  if (!isFiniteNumber(p.range_low_reward) || !isFiniteNumber(p.range_high_reward)) return "range reward tidak valid";
  if (!isFiniteNumber(p.reliability_arrival) || !isFiniteNumber(p.reliability_reward)) return "reliability tidak valid";
  if (typeof p.model_version_arrival !== "string" || typeof p.model_version_reward !== "string") {
    return "model_version tidak valid";
  }
  if (typeof p.status !== "string" || !PREDICTION_STATUSES.includes(p.status as PredictionStatus)) {
    return "status tidak valid";
  }
  if (!isNullableDate(p.actual_date)) return "actual_date tidak valid";
  if (!isNullableNumber(p.actual_reward)) return "actual_reward tidak valid";
  if (!isNullableNumber(p.arrival_error)) return "arrival_error tidak valid";
  if (!isNullableNumber(p.reward_error)) return "reward_error tidak valid";
  return null;
}

function validateSurvey(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null) return "Survei bukan objek";
  const s = raw as BackupSurvey;
  if (!isIsoDate(s.date)) return "tanggal tidak valid";
  if (!isFiniteNumber(s.reward) || s.reward < 0) return "reward tidak valid";
  return null;
}

function parseBackup(data: unknown): { surveys: Array<{ date: string; reward: number }>; predictions: unknown[] } | { error: string } {
  let parsed: unknown = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      return { error: "File bukan JSON yang valid" };
    }
  }
  if (typeof parsed !== "object" || parsed === null) return { error: "Format backup tidak dikenal" };
  const file = parsed as BackupFile;
  if (file.version !== BACKUP_VERSION) return { error: `Versi backup tidak didukung (diterima: v${BACKUP_VERSION})` };
  if (!Array.isArray(file.surveys)) return { error: "Field surveys tidak ditemukan" };
  if (!Array.isArray(file.predictions)) return { error: "Field predictions tidak ditemukan" };

  const seen = new Set<string>();
  const surveys: Array<{ date: string; reward: number }> = [];
  for (let i = 0; i < file.surveys.length; i++) {
    const err = validateSurvey(file.surveys[i]);
    if (err) return { error: `Survei ke-${i + 1}: ${err}` };
    const s = file.surveys[i] as { date: string; reward: number };
    if (seen.has(s.date)) return { error: `Duplikat tanggal pada backup: ${s.date}` };
    seen.add(s.date);
    surveys.push({ date: s.date, reward: s.reward });
  }

  for (let i = 0; i < file.predictions.length; i++) {
    const err = validatePrediction(file.predictions[i]);
    if (err) return { error: `Prediksi ke-${i + 1}: ${err}` };
  }

  return { surveys, predictions: file.predictions };
}

export async function GET() {
  const db = getDb();
  const surveys = db.prepare("SELECT date, reward FROM surveys ORDER BY date ASC").all();
  const predictions = db
    .prepare(
      `SELECT created_at, predicted_interval, predicted_date, predicted_reward,
              range_low_days, range_high_days, range_low_reward, range_high_reward,
              reliability_arrival, reliability_reward, model_version_arrival, model_version_reward,
              status, actual_date, actual_reward, arrival_error, reward_error
       FROM predictions ORDER BY created_at ASC`,
    )
    .all();

  const payload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: "GoogleSurveyArrivalPredictor",
    surveys,
    predictions,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="backup-${date}.json"`,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || body.action !== "restore") {
    return Response.json({ ok: false, error: "Body tidak valid" }, { status: 400 });
  }

  const result = parseBackup(body.data);
  if ("error" in result) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }

  const { surveys, predictions } = result;
  const db = getDb();

  const insertSurvey = db.prepare("INSERT INTO surveys (date, reward) VALUES (?, ?)");
  const insertPrediction = db.prepare(
    `INSERT INTO predictions (
      created_at, predicted_interval, predicted_date, predicted_reward,
      range_low_days, range_high_days, range_low_reward, range_high_reward,
      reliability_arrival, reliability_reward, model_version_arrival, model_version_reward,
      status, actual_date, actual_reward, arrival_error, reward_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  try {
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM surveys").run();
      db.prepare("DELETE FROM predictions").run();
      db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('surveys', 'predictions')").run();
      for (const s of surveys) insertSurvey.run(s.date, s.reward);
      for (const p of predictions as BackupPrediction[]) {
        insertPrediction.run(
          p.created_at as string,
          p.predicted_interval as number,
          p.predicted_date as string,
          p.predicted_reward as number,
          p.range_low_days as number,
          p.range_high_days as number,
          p.range_low_reward as number,
          p.range_high_reward as number,
          p.reliability_arrival as number,
          p.reliability_reward as number,
          p.model_version_arrival as string,
          p.model_version_reward as string,
          p.status as string,
          p.actual_date as string | null,
          p.actual_reward as number | null,
          p.arrival_error as number | null,
          p.reward_error as number | null,
        );
      }
    });
    tx();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gagal restore";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }

  return Response.json({ ok: true, surveys: surveys.length, predictions: predictions.length });
}
