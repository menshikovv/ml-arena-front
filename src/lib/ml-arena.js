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

export function getCompetitionMetricName(competition, catalog = []) {
  const code = competition.metric;
  const name = typeof competition.metric_name === "string" ? competition.metric_name.trim() : "";
  if (name && name !== code) return name;
  const entries = Array.isArray(catalog) ? catalog : catalog?.items;
  const metric = Array.isArray(entries) ? entries.find((item) => code && item.code === code) : null;
  return metric?.name?.trim() || METRIC_LABELS[code] || name || code || "Не указана";
}

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

export function getCompetitionDeadlineTime(competition) {
  const deadline = Date.parse(competition.submission_deadline || competition.deadline || "");
  return Number.isFinite(deadline) ? deadline : null;
}

export function getCompetitionStatus(competition, now = Date.now()) {
  if (["completed", "finished", "archived"].includes(competition.status)) return "finished";
  if (["scheduled", "approved_scheduled", "draft", "moderation", "submitted_for_review", "changes_requested"].includes(competition.status)) return "upcoming";
  const deadline = getCompetitionDeadlineTime(competition);
  if (competition.status === "active" && deadline !== null && deadline <= now) return "closed";
  return competition.status;
}

export function getAdminCompetitionStatus(competition, now = Date.now()) {
  return getCompetitionStatus(competition, now) === "closed" ? "closed" : competition.status;
}

export function canChangeCompetitionTask(competition) {
  return !competition || ["draft", "moderation"].includes(competition.status);
}

export function getCompetitionTaskPayload(taskVersionId, competition) {
  if (!taskVersionId || taskVersionId === competition?.task_version_id) return {};
  if (!canChangeCompetitionTask(competition)) throw new Error("После публикации нельзя заменить задачу соревнования. Остальные изменения можно сохранить отдельно.");
  return { task_version_id: taskVersionId };
}

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

export const SUBMISSION_STATUS_LABELS = {
  pending: "Ожидает проверки", received: "Получено", uploaded: "Загружено",
  queued: "В очереди", validating: "Проверка файла", running: "Проверяется",
  processing: "Обрабатывается", scoring: "Расчёт оценки", evaluating: "Расчёт оценки",
  scored: "Проверено", evaluated: "Проверено", completed: "Проверено",
  failed: "Ошибка проверки", error: "Ошибка проверки", invalid: "Неверный формат",
  rejected: "Отклонено", cancelled: "Отменено", canceled: "Отменено",
};

export function getSubmissionScore(submission, kind = "public") {
  if (["failed", "error", "invalid", "rejected", "cancelled", "canceled"].includes(submission.status)) return null;
  const value = kind === "private" ? submission.private_score : submission.public_score ?? submission.score;
  if (value == null || (typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

export function canShowPrivateScore(competition, submission) {
  return ["completed", "finished", "archived"].includes(competition.status)
    && submission.private_score_revealed !== false;
}

export function shouldCheckPrivateLeaderboard(competition, now = Date.now()) {
  if (["completed", "finished", "archived", "finalizing"].includes(competition.status)) return true;
  const deadline = getCompetitionDeadlineTime(competition);
  return ["active", "paused"].includes(competition.status) && deadline !== null && deadline <= now;
}

export function isPrivateLeaderboardPublished(competition, response, now = Date.now()) {
  return shouldCheckPrivateLeaderboard(competition, now)
    && response?.kind === "private" && response.private_locked === false;
}

export function getCompetitionMetricDirection(competition) {
  if (["maximize", "minimize"].includes(competition.metric_direction)) return competition.metric_direction;
  const metric = String(competition.metric || "").toLowerCase();
  if (/(^|[_\s-])(ndcg|accuracy|roc_auc|f1|silhouette)([_\s@-]|$)/.test(metric)) return "maximize";
  if (/(^|[_\s-])(mse|rmse|mae)([_\s@-]|$)/.test(metric)) return "minimize";
  return null;
}
