import { getDb } from "../db";
import { listSurveys } from "../dataService";
import { buildDataset, buildPredictionVector } from "../features";
import {
  LinearRegressionModel,
  MedianBaseline,
  MovingAverageBaseline,
  RandomForestModel,
} from "./models";
import { getActiveMetricPayload, getActiveModel } from "./train";
import { addDays, daysBetween, mean, quantile } from "../stats";
import type { HorizonProbability, PredictionResult, Survey } from "../types";

function createArrivalRegressor(algorithm: string) {
  switch (algorithm) {
    case "Moving Average":
      return new MovingAverageBaseline(5);
    case "Linear Regression":
      return new LinearRegressionModel();
    case "Random Forest":
      return new RandomForestModel();
    default:
      return new MedianBaseline();
  }
}

function createRewardRegressor(algorithm: string) {
  return createArrivalRegressor(algorithm);
}

function reliabilityFromAccuracy(accuracy: number, sampleCount: number): number {
  const dataFactor = Math.min(1, sampleCount / 50);
  return Math.round(Math.max(0, Math.min(100, accuracy * dataFactor * 100)));
}

function computeHorizonProbabilities(surveys: Survey[]): HorizonProbability[] {
  const intervals: number[] = [];
  for (let i = 1; i < surveys.length; i++) {
    intervals.push(daysBetween(surveys[i - 1].date, surveys[i].date));
  }
  if (intervals.length === 0) {
    return [1, 3, 7, 14].map((d) => ({ days: d, probability: 0 }));
  }
  const recent = intervals.slice(-12);
  const weighted: number[] = [...intervals];
  for (const r of recent) weighted.push(r, r);
  return [1, 3, 7, 14].map((d) => ({
    days: d,
    probability: Math.round((weighted.filter((x) => x <= d).length / weighted.length) * 100),
  }));
}

export async function runPrediction(): Promise<PredictionResult> {
  const db = getDb();
  const surveys = listSurveys();
  if (surveys.length < 10) {
    throw new Error("Minimal 10 record histori diperlukan untuk prediksi.");
  }

  const arrivalActive = getActiveModel("arrival");
  const rewardActive = getActiveModel("reward");
  if (!arrivalActive || !rewardActive) {
    throw new Error("Model belum dilatih. Jalankan Latih Model terlebih dahulu.");
  }

  const { minYear } = buildDataset(surveys);
  const vector = buildPredictionVector(surveys, minYear);
  if (!vector) throw new Error("Gagal membuat fitur prediksi.");

  const lastSurvey = surveys[surveys.length - 1];

  const arrivalModel = createArrivalRegressor(arrivalActive.algorithm);
  if (arrivalModel instanceof RandomForestModel) await arrivalModel.prepare();
  arrivalModel.fit(
    samplesFeaturesOf(surveys),
    targetsOf(surveys, "arrival"),
  );
  const predictedIntervalRaw = arrivalModel.predict(vector);

  const rewardModel = createRewardRegressor(rewardActive.algorithm);
  if (rewardModel instanceof RandomForestModel) await rewardModel.prepare();
  rewardModel.fit(
    samplesFeaturesOf(surveys),
    targetsOf(surveys, "reward"),
  );
  const predictedRewardRaw = rewardModel.predict(vector);

  const predictedInterval = Math.max(0, Math.round(predictedIntervalRaw * 10) / 10);
  const predictedDate = addDays(lastSurvey.date, Math.round(predictedInterval));
  const predictedReward = Math.max(0, Math.round(predictedRewardRaw));

  const arrMetrics = getActiveMetricPayload("arrival");
  const rewMetrics = getActiveMetricPayload("reward");

  const q80Days = arrMetrics ? Math.max(1, Math.ceil(arrMetrics.q80Residual)) : 3;
  const rangeLowDays = Math.max(0, Math.round(predictedInterval) - q80Days);
  const rangeHighDays = Math.round(predictedInterval) + q80Days;

  const q80Reward = rewMetrics ? Math.max(200, Math.round(rewMetrics.q80Residual)) : 1500;
  const rewardLow = Math.max(0, predictedReward - q80Reward);
  const rewardHigh = predictedReward + q80Reward;

  const reliabilityArrival = reliabilityFromAccuracy(
    arrMetrics ? arrMetrics.toleranceHits[1] : 0,
    arrMetrics?.evalPoints ?? 0,
  );
  const reliabilityReward = reliabilityFromAccuracy(
    rewMetrics ? rewMetrics.toleranceHits[1] : 0,
    rewMetrics?.evalPoints ?? 0,
  );

  const horizonProbabilities = computeHorizonProbabilities(surveys);

  const recentIntervals: number[] = [];
  for (let i = Math.max(1, surveys.length - 6); i < surveys.length; i++) {
    recentIntervals.push(daysBetween(surveys[i - 1].date, surveys[i].date));
  }
  const recentRewards = surveys.slice(-5).map((s) => s.reward);

  const explanations = [
    `Survei terakhir masuk ${lastSurvey.date}.`,
    recentIntervals.length > 0
      ? `Rata-rata interval ${recentIntervals.length} survei terakhir: ${mean(recentIntervals).toFixed(1)} hari (median ${quantile(recentIntervals, 0.5)} hari).`
      : "",
    `Rata-rata reward 5 survei terakhir: Rp${Math.round(mean(recentRewards)).toLocaleString("id-ID")}.`,
    `Model dipilih otomatis berdasarkan MAE terendah dari walk-forward validation.`,
  ].filter(Boolean);

  const createdAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO predictions (
      created_at, predicted_interval, predicted_date, predicted_reward,
      range_low_days, range_high_days, range_low_reward, range_high_reward,
      reliability_arrival, reliability_reward,
      model_version_arrival, model_version_reward, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    createdAt,
    predictedInterval,
    predictedDate,
    predictedReward,
    rangeLowDays,
    rangeHighDays,
    rewardLow,
    rewardHigh,
    reliabilityArrival,
    reliabilityReward,
    `${arrivalActive.algorithm} #${arrivalActive.id}`,
    `${rewardActive.algorithm} #${rewardActive.id}`,
  );

  return {
    predictedIntervalDays: predictedInterval,
    predictedDate,
    windowLow: addDays(lastSurvey.date, rangeLowDays),
    windowHigh: addDays(lastSurvey.date, rangeHighDays),
    predictedReward,
    rewardLow,
    rewardHigh,
    reliabilityArrival,
    reliabilityReward,
    horizonProbabilities,
    explanations,
    modelArrival: arrivalActive.algorithm,
    modelReward: rewardActive.algorithm,
  };
}

function samplesFeaturesOf(surveys: Survey[]): number[][] {
  const { samples } = buildDataset(surveys);
  return samples.map((s) => s.features);
}

function targetsOf(
  surveys: Survey[],
  which: "arrival" | "reward",
): number[] {
  const { samples } = buildDataset(surveys);
  return samples.map((s) => (which === "arrival" ? s.targetArrival : s.targetReward));
}
