import { listSurveys, getDatasetHealth } from "@/lib/dataService";
import { getActiveModel } from "@/lib/ml/train";
import { daysBetween, mean, median, quantile } from "@/lib/stats";
import type { HorizonProbability } from "@/lib/types";

export async function GET() {
  const surveys = listSurveys();
  const health = getDatasetHealth();
  const rewards = surveys.map((s) => s.reward);
  const intervals = surveys.slice(1).map((s) => s.interval ?? 0);

  const last = surveys[surveys.length - 1] ?? null;

  const horizonProbabilities: HorizonProbability[] = [];
  if (intervals.length > 0) {
    const recent = intervals.slice(-12);
    const weighted = [...intervals, ...recent, ...recent];
    for (const d of [1, 3, 7, 14]) {
      horizonProbabilities.push({
        days: d,
        probability: Math.round((weighted.filter((x) => x <= d).length / weighted.length) * 100),
      });
    }
  }

  return Response.json({
    totalSurveys: surveys.length,
    totalReward: rewards.reduce((a, b) => a + b, 0),
    avgReward: Math.round(mean(rewards)),
    medianReward: Math.round(median(rewards)),
    lastSurvey: last?.date ?? null,
    lastReward: last?.reward ?? null,
    avgInterval: intervals.length ? Math.round(mean(intervals) * 10) / 10 : null,
    medianInterval: intervals.length ? quantile(intervals, 0.5) : null,
    recent: surveys.slice(-5).reverse(),
    health,
    horizonProbabilities,
    hasModel: !!getActiveModel("arrival") && !!getActiveModel("reward"),
    daysSinceLastSurvey: last ? Math.max(0, daysBetween(last.date, new Date().toISOString().slice(0, 10))) : null,
  });
}
