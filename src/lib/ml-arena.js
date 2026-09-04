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
