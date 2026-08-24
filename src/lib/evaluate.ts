import { getDb } from "./db";
import { daysBetween } from "./stats";

export interface EvaluationSummary {
  evaluated: number;
}

export function evaluatePendingPredictions(newSurveyDate: string, newSurveyReward: number): EvaluationSummary {
  const db = getDb();
  const pending = db
    .prepare(
      "SELECT id, created_at, predicted_date FROM predictions WHERE status = 'pending' AND created_at <= ?",
    )
    .all(`${newSurveyDate}T23:59:59.999Z`) as Array<{
    id: number;
    created_at: string;
    predicted_date: string;
  }>;
  if (pending.length === 0) return { evaluated: 0 };
  const update = db.prepare(`
    UPDATE predictions
    SET status = 'evaluated',
        actual_date = ?,
        actual_reward = ?,
        arrival_error = ?,
        reward_error = ?
    WHERE id = ?
  `);
  const getReward = db.prepare(
    "SELECT predicted_reward FROM predictions WHERE id = ?",
  );
  const tx = db.transaction(() => {
    for (const p of pending) {
      const { predicted_reward } = getReward.get(p.id) as { predicted_reward: number };
      update.run(
        newSurveyDate,
        newSurveyReward,
        daysBetween(p.predicted_date, newSurveyDate),
        newSurveyReward - predicted_reward,
        p.id,
      );
    }
  });
  tx();
  return { evaluated: pending.length };
}
