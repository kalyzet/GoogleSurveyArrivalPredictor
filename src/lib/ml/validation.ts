import type { Sample } from "../features";
import {
  LinearRegressionModel,
  MedianBaseline,
  MovingAverageBaseline,
  RandomForestModel,
  type Regressor,
} from "./models";

export interface WalkForwardResult {
  algorithm: string;
  actuals: number[];
  predictions: number[];
}

async function createModels(): Promise<Regressor[]> {
  const rf = new RandomForestModel();
  await rf.prepare();
  return [
    new MedianBaseline(),
    new MovingAverageBaseline(5),
    new LinearRegressionModel(),
    rf,
  ];
}

function walkForward(
  model: Regressor,
  samples: Sample[],
  targetKey: "targetArrival" | "targetReward",
  minTrain: number,
): WalkForwardResult {
  const actuals: number[] = [];
  const predictions: number[] = [];
  for (let i = minTrain; i < samples.length; i++) {
    const train = samples.slice(0, i);
    model.fit(
      train.map((s) => s.features),
      train.map((s) => s[targetKey]),
    );
    actuals.push(samples[i][targetKey]);
    predictions.push(model.predict(samples[i].features));
  }
  return { algorithm: model.name, actuals, predictions };
}

export async function evaluateAllModels(
  samples: Sample[],
  targetKey: "targetArrival" | "targetReward",
): Promise<{ results: WalkForwardResult[]; tolerances: number[] }> {
  const models = await createModels();
  const n = samples.length;
  const minTrain = Math.max(8, Math.floor(n * 0.4));
  const results: WalkForwardResult[] = [];
  for (const model of models) {
    results.push(walkForward(model, samples, targetKey, minTrain));
  }
  return { results, tolerances: targetKey === "targetArrival" ? [1, 3, 7] : [500, 1000, 2000] };
}
