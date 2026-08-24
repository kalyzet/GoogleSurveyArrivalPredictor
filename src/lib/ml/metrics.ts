import { mean } from "../stats";

export function computeRegressionMetrics(
  actuals: number[],
  predictions: number[],
  tolerances: number[],
): { mae: number; rmse: number; r2: number; toleranceHits: number[] } {
  const n = actuals.length;
  if (n === 0) {
    return { mae: 0, rmse: 0, r2: 0, toleranceHits: tolerances.map(() => 0) };
  }
  let absSum = 0;
  let sqSum = 0;
  for (let i = 0; i < n; i++) {
    const err = predictions[i] - actuals[i];
    absSum += Math.abs(err);
    sqSum += err * err;
  }
  const mae = absSum / n;
  const rmse = Math.sqrt(sqSum / n);
  const yMean = mean(actuals);
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssTot += (actuals[i] - yMean) ** 2;
    ssRes += (actuals[i] - predictions[i]) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const toleranceHits = tolerances.map((tol) =>
    actuals.filter((_, i) => Math.abs(predictions[i] - actuals[i]) <= tol).length / n,
  );
  return { mae, rmse, r2, toleranceHits };
}
