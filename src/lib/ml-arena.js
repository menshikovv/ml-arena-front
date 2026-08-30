import React from "react";

export function getLeague(rating) {
  if (rating >= 1500) return { name: "Платина", class: "league-platinum", color: "#E5E4E2", glow: "rgba(229,228,226,0.5)" };
  if (rating >= 1300) return { name: "Золото", class: "league-gold", color: "#FFD700", glow: "rgba(255,215,0,0.5)" };
  if (rating >= 1100) return { name: "Серебро", class: "league-silver", color: "#C0C0C0", glow: "rgba(192,192,192,0.5)" };
  return { name: "Бронза", class: "league-bronze", color: "#CD7F32", glow: "rgba(205,127,50,0.5)" };
}

export function getLeagueProgress(rating) {
  if (rating >= 1500) return { current: rating - 1500, max: "∞", percent: 100 };
  if (rating >= 1300) return { current: rating - 1300, max: 200, percent: ((rating - 1300) / 200) * 100 };
  if (rating >= 1100) return { current: rating - 1100, max: 200, percent: ((rating - 1100) / 200) * 100 };
  return { current: rating, max: 1100, percent: (rating / 1100) * 100 };
}

export const METRIC_LABELS = {
  mse: "MSE (↓ лучше)",
  rmse: "RMSE (↓ лучше)",
  accuracy: "Accuracy (↑ лучше)",
  roc_auc: "ROC-AUC (↑ лучше)",
  f1: "F1 (↑ лучше)",
  mae: "MAE (↓ лучше)",
  ndcg: "NDCG (↑ лучше)",
  silhouette: "Коэффициент силуэта (↑ лучше)",
};

export const TASK_TYPE_LABELS = {
  classification: "Классификация",
  regression: "Регрессия",
  nlp: "NLP",
  cv: "Компьютерное зрение",
  time_series: "Временные ряды",
  ranking: "Ранжирование",
  clustering: "Кластеризация",
  recsys: "RecSys",
};

export const TASK_TYPE_COLORS = {
  regression: "#06B6D4",
  classification: "#7C3AED",
  nlp: "#EC4899",
  cv: "#F59E0B",
  tabular: "#10B981",
  time_series: "#14B8A6",
  ranking: "#2563EB",
  clustering: "#8B5CF6",
  recsys: "#EC4899",
};

export function isHigherBetter(metric) {
  return ["accuracy", "roc_auc", "f1", "ndcg", "silhouette"].includes(metric);
}

export function formatScore(score, metric) {
  if (metric === "silhouette") return score.toFixed(3);
  if (isHigherBetter(metric)) {
    return (score * 100).toFixed(2) + "%";
  }
  return score.toFixed(4);
}
