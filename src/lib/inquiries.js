export const INQUIRY_TYPES = { support: "Поддержка", cooperation: "Сотрудничество", competition_request: "Проведение соревнования" };
export const INQUIRY_STATUSES = { new: "Новое", in_progress: "В работе", resolved: "Обработано", rejected: "Отклонено" };
export const INQUIRY_CONSENT_VERSION = "2026-08-14";
export const INQUIRY_CATEGORIES = { account_profile: "Аккаунт и профиль", technical: "Техническая проблема", founder_season: "Founder Season", privacy_legal: "Данные и документы", security: "Безопасность" };

export function inquirySource() {
  const params = new URLSearchParams(window.location.search);
  let referrer = null;
  try {
    const url = new URL(document.referrer);
    if (["http:", "https:"].includes(url.protocol)) referrer = `${url.origin}${url.pathname}`;
  } catch { /* An empty referrer is normal. */ }
  return {
    landing_path: window.location.pathname,
    referrer,
    utm_source: params.get("utm_source")?.slice(0, 200) || null,
    utm_medium: params.get("utm_medium")?.slice(0, 200) || null,
    utm_campaign: params.get("utm_campaign")?.slice(0, 200) || null,
  };
}

export function inquiryAttempt(ref, body) {
  const fingerprint = JSON.stringify(body);
  if (ref.current?.fingerprint !== fingerprint) {
    ref.current = { fingerprint, key: globalThis.crypto.randomUUID() };
  }
  return ref.current.key;
}

export function inquiryError(error) {
  const code = String(error?.code || "").toLowerCase();
  if (error?.status === 404 || error?.status === 405 || error?.status === 501) return "Приём обращений временно недоступен. Попробуйте позже или напишите на support@mlarena.ru.";
  if (error?.status === 401) return "Сессия истекла. Войдите в аккаунт и повторите отправку.";
  if (error?.status === 403) return "Недостаточно прав для этого действия.";
  if (error?.status === 429) return "Слишком много запросов. Подождите немного и повторите попытку.";
  if (code === "inquiry_version_conflict") return "Обращение уже изменил другой сотрудник. Обновите данные перед сохранением.";
  if (error?.status === 409) return "Запрос конфликтует с сохранёнными данными. Обновите страницу и повторите попытку.";
  if (error?.status === 422) return "Проверьте заполненные поля и согласие на обработку данных.";
  if (code === "inquiry_receipt_missing") return "Сервер не подтвердил сохранение обращения. Повторите отправку без изменения полей или свяжитесь с поддержкой.";
  return "Не удалось выполнить запрос. Попробуйте ещё раз.";
}
