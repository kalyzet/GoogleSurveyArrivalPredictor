import { getDb } from "../db";
import type { Survey, SurveyWithInterval } from "../types";
import { daysBetween } from "../stats";

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateSurveyInput(date: unknown, reward: unknown): ValidationResult {
  if (typeof date !== "string" || !ISO_DATE.test(date) || Number.isNaN(Date.parse(date))) {
    return { ok: false, error: "Format tanggal tidak valid (harus YYYY-MM-DD)" };
  }
  const parsed = new Date(date + "T00:00:00");
  if (parsed.getFullYear() < 2000 || parsed.getFullYear() > 2100) {
    return { ok: false, error: "Tanggal di luar rentang wajar" };
  }
  if (reward === null || reward === undefined || reward === "") {
    return { ok: false, error: "Reward tidak boleh kosong" };
  }
  const num = Number(reward);
  if (!Number.isFinite(num)) {
    return { ok: false, error: "Reward harus berupa angka" };
  }
  if (!Number.isInteger(num)) {
    return { ok: false, error: "Reward harus bilangan bulat" };
  }
  if (num < 0) {
    return { ok: false, error: "Reward tidak boleh negatif" };
  }
  return { ok: true };
}

export function isDuplicateDate(date: string, excludeId?: number): boolean {
  const db = getDb();
  if (excludeId !== undefined) {
    const row = db
      .prepare("SELECT id FROM surveys WHERE date = ? AND id != ?")
      .get(date, excludeId);
    return !!row;
  }
  return !!db.prepare("SELECT id FROM surveys WHERE date = ?").get(date);
}

export function listSurveys(): SurveyWithInterval[] {
  const rows = getDb()
    .prepare("SELECT id, date, reward FROM surveys ORDER BY date ASC")
    .all() as Survey[];
  return rows.map((row, i) => ({
    ...row,
    interval: i === 0 ? null : daysBetween(rows[i - 1].date, row.date),
  }));
}

export interface InsertResult {
  inserted: boolean;
  reason?: string;
}

export function insertSurvey(date: string, reward: number): InsertResult {
  const db = getDb();
  if (isDuplicateDate(date)) {
    return { inserted: false, reason: "duplicate" };
  }
  db.prepare("INSERT INTO surveys (date, reward) VALUES (?, ?)").run(date, reward);
  return { inserted: true };
}

export function updateSurvey(id: number, date: string, reward: number): InsertResult {
  const db = getDb();
  if (isDuplicateDate(date, id)) {
    return { inserted: false, reason: "duplicate" };
  }
  const result = db
    .prepare("UPDATE surveys SET date = ?, reward = ? WHERE id = ?")
    .run(date, reward, id);
  return { inserted: result.changes > 0, reason: result.changes === 0 ? "not-found" : undefined };
}

export function deleteSurvey(id: number): boolean {
  const result = getDb().prepare("DELETE FROM surveys WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface DatasetHealth {
  records: number;
  dateRange: { start: string; end: string } | null;
  duplicates: number;
  invalidRewards: number;
  warnings: string[];
}

export function getDatasetHealth(): DatasetHealth {
  const db = getDb();
  const rows = db
    .prepare("SELECT date, reward FROM surveys ORDER BY date ASC")
    .all() as Array<{ date: string; reward: number }>;
  const dates = rows.map((r) => r.date);
  const duplicates = dates.length - new Set(dates).size;
  const invalidRewards = rows.filter((r) => !Number.isInteger(r.reward) || r.reward < 0).length;
  const warnings: string[] = [];
  if (rows.length < 30) {
    warnings.push(`Data masih sedikit (${rows.length} record). Direkomendasikan 50+ untuk model yang andal.`);
  }
  if (rows.length >= 2) {
    let maxGap = 0;
    for (let i = 1; i < dates.length; i++) {
      maxGap = Math.max(maxGap, daysBetween(dates[i - 1], dates[i]));
    }
    if (maxGap > 90) {
      warnings.push(`Ada gap histori yang besar (${maxGap} hari). Prediksi bisa kurang akurat.`);
    }
  }
  const rewards = rows.map((r) => r.reward);
  if (rewards.length > 0 && new Set(rewards).size <= Math.max(1, Math.floor(rewards.length / 20))) {
    warnings.push("Variasi reward sangat sedikit. Model reward mungkin tidak informatif.");
  }
  return {
    records: rows.length,
    dateRange:
      rows.length > 0
        ? { start: dates[0], end: dates[dates.length - 1] }
        : null,
    duplicates,
    invalidRewards,
    warnings,
  };
}
