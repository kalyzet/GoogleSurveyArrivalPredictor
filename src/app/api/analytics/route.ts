import { listSurveys } from "@/lib/dataService";
import { daysBetween, mean, median, quantile } from "@/lib/stats";

export async function GET() {
  const surveys = listSurveys();

  const perMonth = new Map<string, number>();
  const rewardPerMonth = new Map<string, number[]>();
  for (const s of surveys) {
    const key = s.date.slice(0, 7);
    perMonth.set(key, (perMonth.get(key) ?? 0) + 1);
    if (!rewardPerMonth.has(key)) rewardPerMonth.set(key, []);
    rewardPerMonth.get(key)!.push(s.reward);
  }

  const perWeekday = new Array(7).fill(0);
  for (const s of surveys) {
    perWeekday[new Date(s.date + "T00:00:00").getDay()]++;
  }

  const intervals = surveys.slice(1).map((s) => s.interval ?? 0);

  const intervalBuckets = [
    { label: "1–2 hari", min: 1, max: 2 },
    { label: "3–5 hari", min: 3, max: 5 },
    { label: "6–8 hari", min: 6, max: 8 },
    { label: "9–14 hari", min: 9, max: 14 },
    { label: "15+ hari", min: 15, max: Infinity },
  ].map((b) => ({
    label: b.label,
    count: intervals.filter((x) => x >= b.min && x <= b.max).length,
  }));

  return Response.json({
    surveyPerMonth: [...perMonth.entries()].map(([month, count]) => ({ month, count })),
    rewardPerMonth: [...rewardPerMonth.entries()].map(([month, values]) => ({
      month,
      avg: Math.round(mean(values)),
      max: Math.max(...values),
      min: Math.min(...values),
    })),
    perWeekday: perWeekday.map((count, day) => ({ day, count })),
    rewardTimeline: surveys.map((s) => ({ date: s.date, reward: s.reward })),
    intervalStats: {
      avg: intervals.length ? Math.round(mean(intervals) * 10) / 10 : null,
      median: intervals.length ? quantile(intervals, 0.5) : null,
      min: intervals.length ? Math.min(...intervals) : null,
      max: intervals.length ? Math.max(...intervals) : null,
    },
    intervalBuckets,
    summary: {
      totalSurveys: surveys.length,
      avgReward: surveys.length ? Math.round(mean(surveys.map((s) => s.reward))) : null,
      medianGap: intervals.length ? quantile(intervals, 0.5) : null,
      bestReward: surveys.length ? Math.max(...surveys.map((s) => s.reward)) : null,
      longestGap: intervals.length ? Math.max(...intervals) : null,
    },
  });
}
