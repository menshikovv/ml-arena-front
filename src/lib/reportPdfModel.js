import { numberOrNull, safeArtifactUrl } from "./passport.js";

const shown = (value) => value == null || value === "" || value === "—" || (typeof value === "number" && !Number.isFinite(value)) ? "Нет данных" : String(value);
const numeric = (value) => numberOrNull(value) == null ? "Нет данных" : String(Number(value));
const place = (value) => numberOrNull(value) > 0 ? `#${Number(value)}` : "Нет данных";
const list = (value) => Array.isArray(value) ? value : [];
const verified = (item) => item.verified === true || ["verified", "approved", "confirmed"].includes(item.verification_status || item.status);
const finalStatuses = ["completed", "finished", "archived"];

export function reportDate(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString("ru-RU") : "Нет данных";
}

function filenamePart(value) {
  return String(value || "report").replace(/[^\p{L}\p{N}_-]/gu, "-").slice(0, 64) || "report";
}

function report(base, id) {
  return { ...base, url: safeArtifactUrl(base.url), filename: `ml-arena-${base.kind}-${filenamePart(id)}.pdf` };
}

export function passportReport({ profile, name, rating, rank, directions = [], badges = [], badgesLoaded = true, externalAchievements = [], options = {}, seasonName, evidenceIncomplete = false, url }) {
  const career = options.includeCareer ? [["Город", profile.city], ["Университет", profile.university], ["Компания", profile.company]] : [];
  const contacts = options.includeContacts ? [["Email", profile.email], ["GitHub", profile.github_url], ["Kaggle", profile.kaggle_url]] : [];
  const facts = [...career, ...contacts].filter(([, value]) => value).map(([label, value]) => ({ label, value }));
  const external = options.includeExternal ? externalAchievements.filter(verified) : [];
  const finals = [...new Map(directions.flatMap((item) => list(item.evidence?.official)).map((item) => [item.competition.id, item])).values()];
  return report({
    kind: "passport", type: "ML-паспорт", title: name || profile.user_name || "Участник",
    eyebrow: profile.user_name ? `@${profile.user_name}` : "Профиль участника",
    subtitle: profile.bio || "Практические результаты в машинном обучении",
    avatarUrl: profile.avatar_url,
    stats: [
      { label: "Рейтинг сезона", value: numeric(rating), detail: seasonName || "Сезон не указан" },
      { label: "Место в сезоне", value: place(rank) },
      { label: "Участий в соревнованиях", value: numeric(profile.stats?.competitions_participated) },
      { label: "Достижения платформы", value: badgesLoaded ? String(badges.length) : "Нет данных" },
    ],
    sections: [
      { title: "Направления машинного обучения", kind: "directions", items: directions.map((item) => ({
        label: item.title, value: numeric(item.score),
        detail: item.evidence ? `${list(item.evidence.official).length} офиц. финалов / ${list(item.evidence.duels).length} рейтинг. дуэлей` : "История подтверждений недоступна",
      })) },
      { title: "Как читать паспорт", kind: "text", items: [{ label: "Индексы направлений отражают данные профиля, а не независимую сертификацию навыков. Рейтинг относится к выбранному сезону; участия и достижения - ко всей истории профиля." }, ...(evidenceIncomplete ? [{ label: "Часть истории недоступна. Число подтверждений указано только по загруженным результатам." }] : [])] },
      ...(finals.length ? [{ title: "Официальные финальные результаты", kind: "list", items: finals.map(({ competition, result }) => ({
        label: competition.title || result.competition_title || "Соревнование",
        detail: [`Место ${place(result.rank)}`, numberOrNull(result.participants_count) > 0 ? `из ${result.participants_count} участников` : null, `Оценка: ${shown(result.score ?? result.final_score)}`, reportDate(result.confirmed_at || result.completed_at || competition.final_results_at || competition.deadline)].filter(Boolean).join(" / "),
      })) }] : []),
      ...(badges.length ? [{ title: "Достижения ML-Арены", kind: "list", items: badges.map((grant) => ({ label: grant.badge?.name || grant.name || grant.title || "Достижение", detail: grant.badge?.description || grant.description || "" })) }] : []),
      ...(external.length ? [{ title: "Подтверждённые внешние достижения", kind: "list", items: external.map((item) => ({ label: item.title || item.name || item.competition_name || "Достижение", detail: item.source || item.platform || item.provider || "" })) }] : []),
      ...(facts.length ? [{ title: "Профиль и контакты", kind: "facts", items: facts }] : []),
    ],
    note: "Снимок данных профиля, не официальный сертификат. Актуальные результаты и историю проверяйте на ML-Арене.", url,
  }, profile.user_name);
}

export function competitionReport({ competition, result, score, metric, url }) {
  if (!finalStatuses.includes(competition.status)) throw new Error("Итоги соревнования ещё не опубликованы");
  const isFinal = result.leaderboard_kind === "private";
  const isOpen = result.leaderboard_kind === "public";
  const origins = { community: "Соревнование сообщества", official: "Официальное соревнование", official_platform: "Официальное соревнование", official_partner: "Официальное соревнование партнёра" };
  const evidenceLabels = { arena_verified: "Результат ML-Арены", community_activity: "Активность сообщества" };
  return report({
    kind: "competition", type: "Карточка соревнования", eyebrow: isFinal ? "Опубликованные финальные итоги" : "Опубликованный результат",
    title: result.competition_title || competition.title || "Соревнование",
    subtitle: `Участник: ${shown(result.user_name || result.user_id)}`,
    stats: [
      { label: isFinal ? "Итоговое место" : isOpen ? "Место в открытой таблице" : "Место", value: place(result.rank) },
      { label: isFinal ? "Итоговая оценка" : isOpen ? "Открытая оценка" : "Оценка", value: shown(score) },
      { label: "Участников", value: numeric(result.participants_count) },
    ],
    sections: [
      { title: "Оценка и условия", kind: "facts", items: [
        { label: "Метрика", value: shown(metric) },
        { label: "Таблица результатов", value: isFinal ? "Закрытая (финальная)" : result.leaderboard_kind === "public" ? "Открытая" : "Нет данных" },
        { label: "Финальные итоги", value: reportDate(competition.final_results_at || competition.completed_at) },
        { label: "Тип соревнования", value: origins[result.origin || competition.origin] || "Не указан" },
      ] },
      { title: "Подтверждение результата", kind: "facts", items: [
        { label: "Источник результата", value: evidenceLabels[result.evidence_level] || "Уровень подтверждения не указан" },
        { label: "Проверка кода", value: result.code_reviewed === true ? "Код проверен" : result.code_reviewed === false ? "Код не проверен" : "Нет данных о проверке" },
        { label: "Воспроизводимость", value: result.reproduced === true ? "Подтверждена" : result.reproduced === false ? "Не подтверждена" : "Нет данных" },
        { label: "Подтверждено", value: reportDate(result.confirmed_at) },
      ] },
      { title: "Об этом результате", kind: "text", items: [{ label: isFinal ? "Место и оценка приведены по опубликованной финальной таблице соревнования." : isOpen ? "Это результат открытой таблицы. Он не подменяет итог по закрытой части тестовой выборки." : "Тип таблицы не указан источником данных. Финальность этой оценки отдельно не подтверждена." }] },
      { title: "Идентификаторы", kind: "facts", items: [{ label: "Соревнование", value: shown(competition.id) }, { label: "Участник", value: shown(result.user_id) }] },
    ],
    note: "Снимок опубликованных данных. Карточка не подтверждает проверку кода, если она не указана отдельно.", url,
  }, competition.id);
}

export function duelReport({ duel, player1Score, player2Score, metric, taskType, url }) {
  if (duel.status !== "completed") throw new Error("Дуэль ещё не завершена");
  const outcome = duel.is_draw ? "Ничья" : duel.winner_name === "Ты" ? "Победа" : duel.winner_name ? "Поражение" : "Не определён";
  const delta = numberOrNull(duel.current_user_rating_change);
  return report({
    kind: "duel", type: "Карточка дуэли", eyebrow: "Завершённая дуэль / 1 на 1",
    title: `${shown(duel.player1_name)} против ${shown(duel.player2_name)}`,
    subtitle: duel.task_title || "Одинаковая задача и единые условия для обоих участников",
    stats: [
      { label: "Результат участника", value: outcome, tone: outcome === "Победа" ? "green" : undefined },
      { label: "Изменение рейтинга", value: delta == null ? "Нет данных" : `${delta > 0 ? "+" : ""}${delta}`, tone: delta > 0 ? "green" : undefined },
      { label: "Дата завершения", value: reportDate(duel.completed_at) },
    ],
    sections: [
      { title: "Сравнение участников", kind: "facts", items: [
        { label: shown(duel.player1_name), value: `Оценка: ${shown(player1Score)}`, detail: `Рейтинг: ${numeric(duel.player1_rating)}` },
        { label: shown(duel.player2_name), value: `Оценка: ${shown(player2Score)}`, detail: `Рейтинг: ${numeric(duel.player2_rating)}` },
      ] },
      { title: "Задача и метрика", kind: "facts", items: [{ label: "Метрика", value: shown(metric) }, { label: "Направление", value: shown(taskType) }, { label: "Режим", value: duel.mode === "rated" ? "Рейтинговая дуэль" : duel.mode === "unrated" ? "Без рейтинга" : "Не указан" }, { label: "Победитель", value: duel.is_draw ? "Ничья" : duel.winner_name === "Ты" ? shown(duel.player1_name) : shown(duel.winner_name) }] },
      { title: "Параметры матча", kind: "facts", items: [{ label: "ID дуэли", value: shown(duel.id) }, { label: "Статус", value: "Завершена" }] },
      { title: "Об этом результате", kind: "text", items: [{ label: "Результат и изменение рейтинга приведены для первого участника в этой карточке. Оценки показаны в шкале метрики задачи; исходные решения участников не включены." }] },
    ],
    note: "Снимок итогов дуэли. Актуальный результат доступен на странице матча.", url,
  }, duel.id);
}
