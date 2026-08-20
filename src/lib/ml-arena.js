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
  regression: "Регрессия",
  classification: "Классификация",
  nlp: "NLP",
  cv: "Компьютерное зрение",
  tabular: "Табличные данные",
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

export const COMMUNITY_COMPETITIONS = [
  {
    id: "community-churn",
    title: "Прогноз оттока в подписном сервисе",
    description: "Предскажите вероятность ухода пользователя по истории активности и платежей.",
    status: "active",
    task_type: "classification",
    metric: "roc_auc",
    deadline: "2026-09-12T20:59:00Z",
    participants_count: 86,
    valid_submissions_count: 54,
    max_submits_free: 5,
    prize_fund: 0,
    company_name: "feature_maker",
    organizer: { name: "feature_maker", profile_id: "p7" },
    origin: "community",
    access_type: "open",
    difficulty: "Средняя",
    domain: "Продукты",
    rated: false,
    passport_evidence_level: "community_activity",
    rules: "Открытое соревнование сообщества. Решения принимаются только в формате CSV. Денежных призов и сезонных рейтинговых очков нет.",
  },
  {
    id: "community-demand",
    title: "Спрос на велосипеды по часам",
    description: "Постройте прогноз количества аренд с учётом погоды, календаря и времени суток.",
    status: "active",
    task_type: "time_series",
    metric: "rmse",
    deadline: "2026-09-28T20:59:00Z",
    participants_count: 43,
    valid_submissions_count: 31,
    max_submits_free: 3,
    prize_fund: 0,
    company_name: "time_series_lab",
    organizer: { name: "time_series_lab", profile_id: "p12" },
    origin: "community",
    access_type: "application",
    difficulty: "Лёгкая",
    domain: "Транспорт",
    rated: false,
    passport_evidence_level: "community_activity",
    rules: "Участие по заявке. Организатор видит только ник и системный статус заявки. Формат решения — CSV.",
  },
  {
    id: "community-ranking",
    title: "Ранжирование учебных материалов",
    description: "Расположите материалы в порядке релевантности для следующего шага обучения пользователя.",
    status: "draft",
    task_type: "ranking",
    metric: "ndcg",
    deadline: "2026-10-05T20:59:00Z",
    participants_count: 18,
    valid_submissions_count: 0,
    max_submits_free: 5,
    prize_fund: 0,
    company_name: "rec_sys_notes",
    organizer: { name: "rec_sys_notes", profile_id: "p11" },
    origin: "community",
    access_type: "invite_only",
    difficulty: "Высокая",
    domain: "EdTech",
    rated: false,
    passport_evidence_level: "community_activity",
    rules: "Закрытая практика по приглашению. Результат сохраняется в истории сообщества и не влияет на подтверждённые навыки.",
  },
];

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
