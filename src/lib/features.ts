import type { Survey } from "./types";
import { addDays, daysBetween, mean } from "./stats";

export interface Sample {
  features: number[];
  targetArrival: number;
  targetReward: number;
}

export const FEATURE_NAMES = [
  "day_of_week",
  "day_of_month",
  "week_of_year",
  "month",
  "year_index",
  "previous_interval",
  "previous_reward",
  "avg_reward_last_3",
  "avg_reward_last_5",
  "avg_reward_last_10",
  "avg_interval_last_3",
  "avg_interval_last_5",
  "avg_interval_last_10",
  "survey_count_last_7_days",
  "survey_count_last_30_days",
  "reward_trend",
  "interval_trend",
];

function isoWeekOfYear(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function lastN<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

function slope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xm = (n - 1) / 2;
  const ym = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xm) * (values[i] - ym);
    den += (i - xm) * (i - xm);
  }
  return den === 0 ? 0 : num / den;
}

function buildFeatureVector(surveys: Survey[], index: number, minYear: number): number[] {
  const s = surveys[index];
  const d = new Date(s.date + "T00:00:00");
  const intervals: number[] = [];
  for (let j = 1; j <= index; j++) {
    intervals.push(daysBetween(surveys[j - 1].date, surveys[j].date));
  }
  const rewards = surveys.slice(0, index + 1).map((x) => x.reward);

  const prevInterval = index > 0 ? intervals[intervals.length - 1] : -1;
  const prevReward = index > 0 ? rewards[rewards.length - 2] : s.reward;

  const countSince = (days: number): number => {
    const cutoff = addDays(s.date, -days);
    let count = 0;
    for (let j = 0; j < index; j++) {
      if (surveys[j].date >= cutoff && surveys[j].date < s.date) count++;
    }
    return count;
  };

  const avgInterval = (n: number) =>
    intervals.length === 0 ? -1 : mean(lastN(intervals, n));

  return [
    d.getDay(),
    d.getDate(),
    isoWeekOfYear(s.date),
    d.getMonth() + 1,
    d.getFullYear() - minYear,
    prevInterval,
    prevReward,
    mean(lastN(rewards, 3)),
    mean(lastN(rewards, 5)),
    mean(lastN(rewards, 10)),
    avgInterval(3),
    avgInterval(5),
    avgInterval(10),
    countSince(7),
    countSince(30),
    slope(lastN(rewards, 5)),
    slope(lastN(intervals, 5)),
  ];
}

export function buildDataset(surveys: Survey[]): { samples: Sample[]; minYear: number } {
  if (surveys.length === 0) return { samples: [], minYear: 0 };
  const minYear = new Date(surveys[0].date + "T00:00:00").getFullYear();
  const samples: Sample[] = [];
  for (let i = 0; i < surveys.length - 1; i++) {
    const targetArrival = daysBetween(surveys[i].date, surveys[i + 1].date);
    samples.push({
      features: buildFeatureVector(surveys, i, minYear),
      targetArrival,
      targetReward: surveys[i + 1].reward,
    });
  }
  return { samples, minYear };
}

export function buildPredictionVector(surveys: Survey[], minYear: number): number[] | null {
  if (surveys.length === 0) return null;
  return buildFeatureVector(surveys, surveys.length - 1, minYear);
}
