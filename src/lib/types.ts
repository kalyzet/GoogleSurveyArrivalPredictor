export interface Survey {
  id: number;
  date: string;
  reward: number;
}

export interface SurveyWithInterval extends Survey {
  interval: number | null;
}

export type PredictionStatus = "pending" | "evaluated" | "missed";

export interface PredictionRecord {
  id: number;
  created_at: string;
  predicted_interval: number;
  predicted_date: string;
  predicted_reward: number;
  range_low_days: number;
  range_high_days: number;
  range_low_reward: number;
  range_high_reward: number;
  reliability_arrival: number;
  reliability_reward: number;
  model_version_arrival: string;
  model_version_reward: string;
  status: PredictionStatus;
  actual_date: string | null;
  actual_reward: number | null;
  arrival_error: number | null;
  reward_error: number | null;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
  within1: number;
  within3: number;
  within7: number;
}

export interface RewardModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
  within500: number;
  within1000: number;
  within2000: number;
}

export interface ModelVersion {
  id: number;
  target: "arrival" | "reward";
  algorithm: string;
  metrics_json: string;
  trained_at: string;
  dataset_size: number;
  features_used: number;
  is_active: number;
}

export interface HorizonProbability {
  days: number;
  probability: number;
}

export interface PredictionResult {
  predictedIntervalDays: number;
  predictedDate: string;
  windowLow: string;
  windowHigh: string;
  predictedReward: number;
  rewardLow: number;
  rewardHigh: number;
  reliabilityArrival: number;
  reliabilityReward: number;
  horizonProbabilities: HorizonProbability[];
  explanations: string[];
  modelArrival: string;
  modelReward: string;
}
