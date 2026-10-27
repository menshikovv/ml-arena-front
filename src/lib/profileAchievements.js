export const ACHIEVEMENT_TYPES = {
  kaggle: "Kaggle", pet_project: "Пет-проект", hackathon: "Хакатон",
  olympiad: "Олимпиада", other_competition: "Другое соревнование", course: "Курс",
};
export const ACHIEVEMENT_STATUSES = { pending_review: "На проверке", verified: "Подтверждено", rejected: "Отклонено" };
export const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", pdf: "application/pdf" };

export function safeAchievementUrl(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}

export function validateAchievementEvidence(file) {
  const mime = MIME[file?.name?.split(".").pop()?.toLowerCase()];
  if (!mime) throw new Error("Подтверждение должно быть в формате PNG, JPEG, WebP или PDF.");
  if (!Number.isFinite(file.size) || file.size <= 0) throw new Error("Файл подтверждения пустой.");
  if (file.size > EVIDENCE_MAX_BYTES) throw new Error("Размер подтверждения не должен превышать 10 МиБ.");
  if (file.type && file.type !== mime) throw new Error("Тип файла не соответствует его расширению.");
  return mime;
}

export function achievementForm(item = {}) {
  return {
    achievement_type: item.achievement_type || "kaggle", title: item.title || "", result: item.result || "",
    description: item.description || "", achievement_url: item.achievement_url || "", achieved_at: item.achieved_at || "",
    is_public: item.is_public ?? true,
  };
}

export function achievementPayload(form, original = null) {
  const title = form.title.trim();
  const result = form.result.trim();
  if (!Object.hasOwn(ACHIEVEMENT_TYPES, form.achievement_type)) throw new Error("Выберите тип достижения.");
  if (title.length < 2 || title.length > 200) throw new Error("Название должно содержать от 2 до 200 символов.");
  if (!result.length || result.length > 300) throw new Error("Укажите результат длиной до 300 символов.");
  if (form.description.trim().length > 4000) throw new Error("Описание не должно превышать 4000 символов.");
  const url = form.achievement_url.trim();
  if (url && !safeAchievementUrl(url)) throw new Error("Укажите корректную ссылку HTTP или HTTPS.");
  if (form.achieved_at && (!/^\d{4}-\d{2}-\d{2}$/.test(form.achieved_at) || !Number.isFinite(Date.parse(form.achieved_at)) || new Date(form.achieved_at).toISOString().slice(0, 10) !== form.achieved_at)) throw new Error("Укажите корректную дату получения.");
  const body = { achievement_type: form.achievement_type, title, result, description: form.description.trim() || null, achievement_url: url || null, achieved_at: form.achieved_at || null, is_public: Boolean(form.is_public) };
  if (!original) return body;
  return Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== (original[key] ?? null)));
}

export function achievementError(error) {
  const messages = {
    PERMISSION_DENIED: "Недостаточно прав. Для управления достижениями нужна подтверждённая почта и активный аккаунт.",
    RESOURCE_NOT_FOUND: "Достижение или подтверждение недоступно. Обновите список.",
    UPLOAD_NOT_READY: "Подтверждение ещё не готово или уже использовано. Выберите и загрузите файл заново.",
    UPLOAD_EXPIRED: "Срок загрузки истёк. Загрузите файл заново.",
    UPLOAD_INTENT_EXPIRED: "Срок загрузки истёк. Загрузите файл заново.",
    UPLOAD_NOT_FOUND: "Хранилище не получило файл. Повторите загрузку.",
    FILE_TOO_LARGE: "Файл превышает допустимый размер подтверждения.",
    VALIDATION_ERROR: "Проверьте поля и формат подтверждения: PNG, JPEG, WebP или PDF, до 10 МиБ.",
    RESOURCE_CONFLICT: "Данные изменились или загрузка уже использована. Обновите список и повторите действие.",
  };
  return messages[error?.code] || (/[а-яё]/i.test(error?.message || "") ? error.message : "Не удалось выполнить операцию с достижением.");
}
