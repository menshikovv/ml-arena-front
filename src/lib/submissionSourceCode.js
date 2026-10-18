import { canShowPrivateScore, getCompetitionMetricDirection, getSubmissionScore } from "./ml-arena.js";

export const SOURCE_CODE_MAX_BYTES = 100 * 1024 * 1024;
export const SOURCE_CODE_TYPES = {
  py: "text/x-python",
  ipynb: "application/x-ipynb+json",
  zip: "application/zip",
};

export function validateSourceCodeFile(file) {
  const extension = file?.name?.split(".").pop()?.toLowerCase();
  if (!Object.hasOwn(SOURCE_CODE_TYPES, extension)) throw new Error("Нужен файл .py, .ipynb или .zip.");
  if (!file.size) throw new Error("Файл пустой.");
  if (file.size > SOURCE_CODE_MAX_BYTES) throw new Error("Максимальный размер файла — 100 МиБ.");
  return SOURCE_CODE_TYPES[extension];
}

export function isEvaluatedSubmission(submission) {
  return Boolean(submission.id) && ["scored", "evaluated", "completed"].includes(submission.status);
}

export function findBestSourceSubmission(submissions, competition, participation) {
  const eligible = submissions.filter(isEvaluatedSubmission);
  const usePrivate = eligible.length > 0 && eligible.every((item) => canShowPrivateScore(competition, item) && getSubmissionScore(item, "private") != null);
  const kind = usePrivate ? "private" : "public";
  if (!usePrivate && participation?.best_public_score != null && String(participation.best_public_score).trim() !== "") {
    const authoritative = eligible.find((item) => getSubmissionScore(item) === Number(participation.best_public_score));
    if (authoritative) return authoritative;
  }
  const direction = getCompetitionMetricDirection(competition);
  if (!direction) return null;
  return eligible.filter((item) => getSubmissionScore(item, kind) != null).reduce((best, item) => {
    if (!best) return item;
    const score = getSubmissionScore(item, kind);
    const current = getSubmissionScore(best, kind);
    return (direction === "maximize" ? score > current : score < current) ? item : best;
  }, null);
}

export function canReplaceSourceCode(source, now = Date.now()) {
  if (!source || source.replacement_allowed !== true) return false;
  if (!source.replace_until) return true;
  const deadline = Date.parse(source.replace_until);
  return Number.isFinite(deadline) && deadline > now;
}

export function isSourceCodeWindowClosedError(error) {
  return /^Source code can no longer be attached or replaced[.!]?$/i.test(error?.message?.trim() || "");
}

export function getSourceCodeErrorMessage(error, fallback = "Не удалось прикрепить итоговый код.") {
  if (isSourceCodeWindowClosedError(error)) return "Срок загрузки и замены итогового кода истёк. Прикрепить файл больше нельзя.";
  if (/[а-яё]/i.test(error?.message || "")) return error.message;
  if (error?.status === 413) return "Файл превышает допустимый размер.";
  if (error?.status === 415) return "Формат файла не поддерживается. Нужен .py, .ipynb или .zip.";
  if (error?.status === 403) return "Нет доступа к итоговому коду этого решения.";
  return fallback;
}
