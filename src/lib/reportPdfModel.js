import { directionIndex, numberOrNull, safeArtifactUrl } from "./passport.js";
import { ACHIEVEMENT_TYPES } from "./profileAchievements.js";
import { formatScore, getCompetitionMetricName, TASK_TYPE_LABELS } from "./ml-arena.js";

const shown = (value) => value == null || value === "" || value === "—" || (typeof value === "number" && !Number.isFinite(value)) ? "Нет данных" : String(value);
const numeric = (value) => numberOrNull(value) == null ? "Нет данных" : String(Number(value));
const place = (value) => numberOrNull(value) > 0 ? `#${Number(value)}` : "Нет данных";
const list = (value) => Array.isArray(value) ? value : [];
const verified = (item) => item.verified === true || ["verified", "approved", "confirmed"].includes(item.verification_status || item.status);
const finalStatuses = ["completed", "finished", "archived"];

const cardValue = (value) => shown(value) === "Нет данных" ? "—" : shown(value);
export const resultScore = (value, metric) => !["number", "string"].includes(typeof value) || String(value).trim() === "" || numberOrNull(value) === null ? "—" : formatScore(Number(value), metric);

export function competitionResultStats(result, metric, formattedScore) {
  const final = result.leaderboard_kind === "private";
  const open = result.leaderboard_kind === "public";
  const verification = { verified: "Подтверждена", approved: "Подтверждена", confirmed: "Подтверждена", pending: "Ожидает проверки", pending_review: "Ожидает проверки", rejected: "Отклонена" }[result.verification_status];
  return [
    { label: final ? "Итоговое место" : open ? "Место в открытой таблице" : "Место", value: cardValue(place(result.rank)), detail: final ? "По закрытой выборке" : open ? "По открытой выборке" : "Тип таблицы не указан" },
    { label: final ? "Итоговая оценка" : open ? "Открытая оценка" : "Оценка", value: formattedScore === undefined ? resultScore(result.score ?? result.final_score, metric) : cardValue(formattedScore), detail: final ? "Опубликованный итог" : open ? "Промежуточный результат" : "Тип оценки не указан" },
    { label: "Участников в таблице", value: cardValue(numeric(result.participants_count)), detail: "С оценённым результатом" },
    { label: "Проверка кода", value: verification || (result.code_reviewed === true ? "Пройдена" : result.code_reviewed === false ? "Не пройдена" : "Не указана"), detail: result.code_reviewed === true ? "Код проверен отдельно" : result.code_reviewed === false ? "Проверка не подтверждена" : verification ? "Статус от организатора" : "Сервер не передал статус" },
  ];
}

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

export function passportReport({ profile, name, rating, rank, ratingLoaded = true, directions = [], badges = [], badgesLoaded = true, externalAchievements = [], options = {}, seasonName, evidenceIncomplete = false, history = null, metrics = [], url }) {
  const career = options.includeCareer ? [["Город", profile.city], ["Университет", profile.university], ["Компания", profile.company]] : [];
  const contacts = options.includeContacts ? [["Email", profile.email], ["GitHub", profile.github_url], ["Kaggle", profile.kaggle_url]] : [];
  const facts = [...career, ...contacts].filter(([, value]) => value).map(([label, value]) => ({ label, value }));
  const external = options.includeExternal ? externalAchievements.filter((item) => verified(item) && item.is_public !== false) : [];
  const finals = [...new Map(directions.flatMap((item) => list(item.evidence?.official)).map((item) => [item.competition.id, item])).values()];
  const participationRows = history?.participations || history?.competitions || finals;
  const participations = [...new Map(participationRows.filter((item) => item?.competition?.id).map((item) => [item.competition.id, item])).values()];
  const historyAvailable = history !== null && !history.competitionsError;
  const participationComplete = historyAvailable && (history.competitionsIncomplete === false || !evidenceIncomplete);
  const profileCount = numberOrNull(profile.stats?.competitions_participated);
  const count = profileCount !== null ? Math.max(profileCount, participations.length) : participationComplete ? participations.length : participations.length || null;
  const countPartial = profileCount === null && !participationComplete && participations.length > 0;
  const historyGap = count !== null && count > participations.length;
  const missing = "—";
  const profileUrl = safeArtifactUrl(url);
  const participationItems = participations.map(({ competition, result }) => {
    const final = result?.leaderboard_kind === "private";
    const state = competition.status;
    const status = ["active", "paused"].includes(state) && Date.parse(competition.submission_deadline || competition.deadline) <= Date.now() ? "Приём завершён"
      : { active: "Участвует", paused: "На паузе", finalizing: "Подведение итогов", completed: "Завершено", finished: "Завершено", archived: "В архиве" }[state] || "Участие подтверждено";
    const score = numberOrNull(result?.score ?? result?.final_score ?? competition.user_best_public_score);
    return {
      label: competition.title || result?.competition_title || "Соревнование",
      badge: final ? "ФИНАЛЬНЫЙ РЕЗУЛЬТАТ" : status.toUpperCase(),
      detail: [TASK_TYPE_LABELS[competition.task_type], competition.metric || competition.metric_name ? getCompetitionMetricName(competition, metrics) : null, (result?.origin || competition.origin) === "community" ? "Сообщество" : ["official", "official_platform", "official_partner"].includes(result?.origin || competition.origin) ? "Официальное" : null].filter(Boolean).join(" / "),
      facts: [
        ...(numberOrNull(result?.rank) > 0 ? [{ label: final ? "Итоговое место" : "Открытое место", value: `#${result.rank}${numberOrNull(result.participants_count) > 0 ? ` из ${result.participants_count}` : ""}` }] : []),
        ...(score !== null ? [{ label: final ? "Итоговая оценка" : "Открытая оценка", value: String(score) }] : []),
        ...(!result && score === null ? [{ label: "Результат", value: "Оценённый результат пока отсутствует" }] : []),
        ...(competition.deadline || competition.submission_deadline ? [{ label: "Дедлайн", value: reportDate(competition.submission_deadline || competition.deadline) }] : []),
        ...(result?.code_reviewed === true ? [{ label: "Проверка кода", value: "Пройдена" }] : []),
        ...(result?.reproduced === true ? [{ label: "Воспроизводимость", value: "Подтверждена" }] : []),
      ],
      url: profileUrl && competition.id ? new URL(`/competitions/${encodeURIComponent(competition.id)}`, profileUrl).href : null,
    };
  });
  return report({
    kind: "passport", type: "ML-паспорт", title: name || profile.user_name || "Участник",
    context: seasonName || "Сезон не выбран",
    eyebrow: profile.user_name ? `@${profile.user_name}` : "Профиль участника",
    subtitle: profile.bio || "Практические результаты в машинном обучении",
    avatarUrl: profile.avatar_url,
    stats: [
      { label: "Рейтинг сезона", value: numberOrNull(rating) === null ? missing : String(Number(rating)), detail: ratingLoaded ? numberOrNull(rating) === null ? "Рейтинг пока не присвоен" : seasonName || "Сезон не выбран" : "Не удалось загрузить" },
      { label: "Место в сезоне", value: numberOrNull(rank) > 0 ? `#${rank}` : missing, detail: ratingLoaded ? numberOrNull(rank) > 0 ? "В сезонной таблице" : "Место пока не присвоено" : "Не удалось загрузить" },
      { label: "Участий в соревнованиях", value: count === null ? missing : `${count}${countPartial ? "+" : ""}`, detail: count === null ? "История недоступна" : count === 0 ? "Участий пока нет" : historyGap ? historyAvailable ? "Список участий неполный" : "По сведениям профиля" : countPartial ? "Не менее, история неполная" : "За всю историю" },
      { label: "Бейджи платформы", value: badgesLoaded ? String(badges.length) : missing, detail: badgesLoaded ? badges.length ? "Полученные награды" : "Наград пока нет" : "Не удалось загрузить" },
    ],
    sections: [
      { title: "Направления машинного обучения", kind: "directions", items: directions.map((item) => {
        const index = directionIndex(item.score, item.evidence, { unavailable: evidenceIncomplete });
        return { label: item.title, value: index.value === null ? missing : String(index.value), detail: index.detail };
      }) },
      { title: "Соревнования и результаты", kind: "competitions", items: participationItems.length ? participationItems : [{ label: participationComplete ? "Участий в соревнованиях пока нет" : "История соревнований недоступна", detail: participationComplete ? "После участия здесь появятся название соревнования, место и оценка." : "Список не удалось загрузить целиком. Он не заменяется нулевым числом участий." }] },
      ...(badges.length ? [{ title: "Достижения ML-Арены", kind: "list", items: badges.map((grant) => ({ label: grant.badge?.name || grant.name || grant.title || "Достижение", detail: grant.badge?.description || grant.description || "" })) }] : []),
      ...(external.length ? [{ title: "Подтверждённые внешние достижения", kind: "list", items: external.map((item) => ({ label: item.title || item.name || item.competition_name || "Достижение", detail: [ACHIEVEMENT_TYPES[item.achievement_type] || item.source || item.platform || item.provider, item.result, item.achieved_at ? reportDate(item.achieved_at) : null].filter(Boolean).join(" / ") })) }] : []),
      ...(facts.length ? [{ title: "Профиль и контакты", kind: "facts", items: facts }] : []),
    ],
    note: `Снимок профиля, не официальный сертификат. Начальные нули направлений не считаются рассчитанными индексами. Прочерк - индекс не рассчитан или недоступен; нулевые оценки и счётчики сохраняются.${evidenceIncomplete ? " Часть истории недоступна: показаны только загруженные участия и результаты." : historyGap ? " Подробности доступны не для всех участий." : ""}`, url,
  }, profile.user_name);
}

export function competitionReport({ competition, result, score, metric, url }) {
  if (!finalStatuses.includes(competition.status)) throw new Error("Итоги соревнования ещё не опубликованы");
  const isFinal = result.leaderboard_kind === "private";
  const isOpen = result.leaderboard_kind === "public";
  const origins = { community: "Соревнование сообщества", official: "Официальное соревнование", official_platform: "Официальное соревнование", official_partner: "Официальное соревнование партнёра" };
  const evidenceLabels = { arena_verified: "Результат ML-Арены", community_activity: "Активность сообщества" };
  const stats = competitionResultStats(result, competition.metric, score);
  return report({
    kind: "competition", type: "Карточка соревнования", eyebrow: isFinal ? "Опубликованные финальные итоги" : "Опубликованный результат",
    title: result.competition_title || competition.title || "Соревнование",
    subtitle: `Участник: ${shown(result.user_name || result.user_id)}`,
    context: "Результат соревнования",
    stats,
    sections: [
      { title: "Оценка и условия", kind: "facts", items: [
        { label: "Метрика", value: metric || getCompetitionMetricName(competition) },
        { label: "Таблица результатов", value: isFinal ? "Закрытая (финальная)" : result.leaderboard_kind === "public" ? "Открытая" : "Не указана" },
        { label: isFinal ? "Финальные итоги" : "Дата публикации итога", value: isFinal ? cardValue(reportDate(competition.final_results_at || competition.completed_at)) : "Ещё не опубликован" },
        { label: "Тип соревнования", value: origins[result.origin || competition.origin] || "Не указан" },
      ] },
      { title: "Подтверждение результата", kind: "facts", items: [
        { label: "Источник результата", value: evidenceLabels[result.evidence_level] || "Уровень подтверждения не указан" },
        { label: "Проверка кода", value: stats[3].value, detail: stats[3].detail },
        { label: "Воспроизводимость", value: result.reproduced === true ? "Подтверждена" : result.reproduced === false ? "Не подтверждена" : "Не указана" },
        { label: "Дата подтверждения", value: cardValue(reportDate(result.confirmed_at)) },
      ] },
      { title: "Об этом результате", kind: "text", items: [{ label: isFinal ? "Место и оценка приведены по опубликованной финальной таблице соревнования." : isOpen ? "Это результат открытой таблицы. Он не подменяет итог по закрытой части тестовой выборки." : "Тип таблицы не указан источником данных. Финальность этой оценки отдельно не подтверждена." }] },
      { title: "Идентификаторы", kind: "facts", items: [{ label: "Соревнование", value: shown(competition.id) }, { label: "Участник", value: shown(result.user_id) }] },
    ],
    note: "Снимок опубликованных данных. 0 - нулевой результат; прочерк - показатель недоступен. Публикация итога сама по себе не подтверждает проверку кода.", url,
  }, competition.id);
}

export function duelReport({ duel, player1Score, player2Score, metric, taskType, url }) {
  if (duel.status !== "completed") throw new Error("Дуэль ещё не завершена");
  const outcome = duel.is_draw ? "Ничья" : duel.winner_name === "Ты" ? "Победа" : duel.winner_name ? "Поражение" : "Не определён";
  const delta = numberOrNull(duel.current_user_rating_change);
  return report({
    kind: "duel", type: "Карточка дуэли", eyebrow: "Опубликованные итоги / дуэль 1 на 1", context: "Результат дуэли",
    title: `${shown(duel.player1_name)} против ${shown(duel.player2_name)}`,
    subtitle: duel.task_title || "Одинаковая задача и единые условия для обоих участников",
    stats: [
      { label: "Результат участника", value: outcome, detail: cardValue(duel.player1_name), tone: outcome === "Победа" ? "green" : undefined },
      { label: "Изменение рейтинга", value: delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`, detail: duel.mode === "unrated" ? "Дуэль без рейтинга" : "По итогам матча", tone: delta > 0 ? "green" : undefined },
      { label: "Оценка участника", value: player1Score === undefined ? resultScore(duel.player1_score, duel.metric) : cardValue(player1Score), detail: cardValue(duel.player1_name) },
      { label: "Оценка соперника", value: player2Score === undefined ? resultScore(duel.player2_score, duel.metric) : cardValue(player2Score), detail: cardValue(duel.player2_name) },
    ],
    sections: [
      { title: "Сравнение участников", kind: "facts", items: [
        { label: cardValue(duel.player1_name), value: `Оценка: ${player1Score === undefined ? resultScore(duel.player1_score, duel.metric) : cardValue(player1Score)}`, detail: `Рейтинг: ${cardValue(numeric(duel.player1_rating))}` },
        { label: cardValue(duel.player2_name), value: `Оценка: ${player2Score === undefined ? resultScore(duel.player2_score, duel.metric) : cardValue(player2Score)}`, detail: `Рейтинг: ${cardValue(numeric(duel.player2_rating))}` },
      ] },
      { title: "Задача и метрика", kind: "facts", items: [{ label: "Метрика", value: shown(metric) }, { label: "Направление", value: shown(taskType) }, { label: "Режим", value: duel.mode === "rated" ? "Рейтинговая дуэль" : duel.mode === "unrated" ? "Без рейтинга" : "Не указан" }, { label: "Победитель", value: duel.is_draw ? "Ничья" : duel.winner_name === "Ты" ? shown(duel.player1_name) : shown(duel.winner_name) }] },
      { title: "Параметры матча", kind: "facts", items: [{ label: "ID дуэли", value: cardValue(duel.id) }, { label: "Дата завершения", value: cardValue(reportDate(duel.completed_at)) }] },
      { title: "Об этом результате", kind: "text", items: [{ label: "Результат и изменение рейтинга приведены для первого участника в этой карточке. Оценки показаны в шкале метрики задачи; исходные решения участников не включены." }] },
    ],
    note: "Снимок итогов дуэли. 0 - нулевой результат; прочерк - показатель недоступен. Актуальный результат доступен на странице матча.", url,
  }, duel.id);
}
