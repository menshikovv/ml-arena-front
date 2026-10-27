export const PUBLICATION_BLOCKERS = {
  invalid_competition_state: "Соревнование ещё не находится на этапе финализации.",
  finalization_in_progress: "Проверки решений или пересчёт рейтинга ещё выполняются.",
  source_code_window_open: "Окно загрузки итогового кода ещё открыто.",
  source_code_configuration_invalid: "Итоговый код обязателен, но срок его загрузки не задан. Требуется исправить настройки на сервере.",
};

export function publicationReady(competition, data) {
  return competition.status === "finalizing" && data?.competition_id === competition.id && data.status === "finalizing"
    && data.publication_ready === true && Array.isArray(data.publication_blockers) && data.publication_blockers.length === 0;
}

export function publicationError(error) {
  const messages = {
    ...PUBLICATION_BLOCKERS,
    competition_deadline_not_reached: "Дедлайн приёма решений ещё не наступил по времени сервера.",
    SOURCE_CODE_POLICY_LOCKED: "Правила итогового кода уже закреплены. На этом этапе их нельзя менять.",
    PERMISSION_DENIED: "Недостаточно прав для подведения итогов.",
    RESOURCE_NOT_FOUND: "Соревнование или ресурс рейтинга не найдены.",
    RESOURCE_CONFLICT: "Публикация конфликтует с состоянием сезона или ресурсов оценки. Проверьте сезон и метрику.",
    VALIDATION_ERROR: "Укажите основание длиной от 3 до 1000 символов.",
    INTERNAL_ERROR: "Сервер не смог завершить операцию. Обновите данные перед повтором.",
  };
  return messages[error?.code] || (/[а-яё]/i.test(error?.message || "") ? error.message : "Не удалось выполнить операцию. Обновите данные и повторите запрос.");
}

export function sourceCodePolicyPayload(form, original = null) {
  const required = form.source_code_required === true;
  const rawDeadline = form.source_code_deadline;
  const deadline = rawDeadline ? Date.parse(rawDeadline) : null;
  const previousDeadline = original?.source_code_deadline ? Date.parse(original.source_code_deadline) : null;
  if (original && required === (original.source_code_required === true) && deadline === previousDeadline) return {};
  if (original && ["finalizing", "completed", "finished", "archived"].includes(original.status)) throw new Error("Правила итогового кода уже закреплены. На этом этапе их нельзя менять.");
  if (rawDeadline && !Number.isFinite(deadline)) throw new Error("Укажите корректный срок загрузки итогового кода.");
  if (required && deadline === null) throw new Error("Для обязательного итогового кода укажите срок загрузки.");
  const submissions = Date.parse(form.submission_deadline);
  if (deadline !== null && Number.isFinite(submissions) && deadline < submissions) throw new Error("Срок загрузки кода не может быть раньше дедлайна отправок.");
  return { source_code_required: required, source_code_deadline: deadline === null ? null : new Date(deadline).toISOString() };
}

export function sourceCodeDeadlineInput(value) {
  const timestamp = value ? Date.parse(value) : NaN;
  if (!Number.isFinite(timestamp)) return "";
  const date = new Date(timestamp);
  return new Date(timestamp - date.getTimezoneOffset() * 60000).toISOString().slice(0, -1);
}
