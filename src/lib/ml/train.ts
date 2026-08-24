import { getDb } from "../db";
import { listSurveys } from "../dataService";
import { buildDataset, FEATURE_NAMES } from "../features";
import { evaluateAllModels } from "./validation";
import { computeRegressionMetrics } from "./metrics";
import { quantile } from "../stats";
import type { ModelVersion } from "../types";

export interface TrainSummary {
  trainedAt: string;
  datasetSize: number;
  sampleCount: number;
  arrival: Array<{ algorithm: string; mae: number; rmse: number; r2: number; within: number[]; selected: boolean }>;
  reward: Array<{ algorithm: string; mae: number; rmse: number; r2: number; within: number[]; selected: boolean }>;
}

function percentileAbsResiduals(actuals: number[], predictions: number[], q: number): number {
  return quantile(
    actuals.map((a, i) => Math.abs(predictions[i] - a)),
    q,
  );
}

export async function trainAllModels(): Promise<TrainSummary> {
  const db = getDb();
  const surveys = listSurveys();
  if (surveys.length < 10) {
    throw new Error("Data terlalu sedikit untuk training (minimal 10 record).");
  }
  const { samples } = buildDataset(surveys);
  if (samples.length < 8) {
    throw new Error("Sample training terlalu sedikit. Tambahkan histori lebih banyak.");
  }
  const trainedAt = new Date().toISOString();

  const summary: TrainSummary = {
    trainedAt,
    datasetSize: surveys.length,
    sampleCount: samples.length,
    arrival: [],
    reward: [],
  };

  db.prepare("UPDATE model_versions SET is_active = 0").run();
  const insertVersion = db.prepare(`
    INSERT INTO model_versions (target, algorithm, metrics_json, trained_at, dataset_size, features_used, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const targets = [
    { key: "targetArrival" as const, target: "arrival" as const },
    { key: "targetReward" as const, target: "reward" as const },
  ];

  for (const t of targets) {
    const { results, tolerances } = await evaluateAllModels(samples, t.key);
    const evaluated = results.map((r) => ({
      ...r,
      metrics: computeRegressionMetrics(r.actuals, r.predictions, tolerances),
    }));
    let bestIdx = 0;
    for (let i = 1; i < evaluated.length; i++) {
      if (evaluated[i].metrics.mae < evaluated[bestIdx].metrics.mae) bestIdx = i;
    }
    evaluated.forEach((entry, idx) => {
      const selected = idx === bestIdx;
      const payload = {
        mae: entry.metrics.mae,
        rmse: entry.metrics.rmse,
        r2: entry.metrics.r2,
        toleranceLabels:
          t.target === "arrival"
            ? ["within1", "within3", "within7"]
            : ["within500", "within1000", "within2000"],
        toleranceHits: entry.metrics.toleranceHits,
        evalPoints: entry.actuals.length,
        q80Residual: percentileAbsResiduals(entry.actuals, entry.predictions, 0.8),
        medianResidual: percentileAbsResiduals(entry.actuals, entry.predictions, 0.5),
      };
      insertVersion.run(
        t.target,
        entry.algorithm,
        JSON.stringify(payload),
        trainedAt,
        samples.length,
        FEATURE_NAMES.length,
        selected ? 1 : 0,
      );
      const row = {
        algorithm: entry.algorithm,
        mae: entry.metrics.mae,
        rmse: entry.metrics.rmse,
        r2: entry.metrics.r2,
        within: entry.metrics.toleranceHits,
        selected,
      };
      if (t.target === "arrival") summary.arrival.push(row);
      else summary.reward.push(row);
    });
  }

  return summary;
}

export function getActiveModel(target: "arrival" | "reward"): ModelVersion | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT * FROM model_versions WHERE target = ? AND is_active = 1 ORDER BY trained_at DESC LIMIT 1",
    )
    .get(target) as ModelVersion | undefined;
  return row ?? null;
}

export function getActiveMetricPayload(target: "arrival" | "reward"):
  | { mae: number; rmse: number; r2: number; toleranceHits: number[]; q80Residual: number; medianResidual: number; evalPoints: number }
  | null {
  const active = getActiveModel(target);
  if (!active) return null;
  return JSON.parse(active.metrics_json);
}
