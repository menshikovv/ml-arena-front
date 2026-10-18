import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.js";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { getSubmissionScore, SUBMISSION_STATUS_LABELS, canShowPrivateScore, getCompetitionMetricDirection, getCompetitionMetricName, getCompetitionDeadlineTime, getCompetitionStatus, canChangeCompetitionTask, getCompetitionTaskPayload } from "../src/lib/ml-arena.js";
import { composeCompetitionDescription, getCompetitionMetricDescription, splitCompetitionDescription } from "../src/lib/competitionMetricContent.js";

let server;
let CompetitionContent;
let CompetitionSummary;
let CompetitionCodeSample;
let CompetitionCard;
let CompetitionMetricExplanation;

before(async () => {
  globalThis.window = { self: null, top: null };
  server = await createServer({ configFile: false, resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } }, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  ({ CompetitionContent, CompetitionSummary, CompetitionCodeSample, CompetitionMetricExplanation } = await server.ssrLoadModule("/src/components/ml/CompetitionContent.jsx"));
  ({ default: CompetitionCard } = await server.ssrLoadModule("/src/components/ml/CompetitionCard.jsx"));
});

after(async () => { await server?.close(); delete globalThis.window; });

function renderEvent(overrides = {}, status = "active") {
  return renderToStaticMarkup(React.createElement(StaticRouter, { location: "/competitions" }, React.createElement(CompetitionCard, {
    competition: { id: "event", title: "Техносмена", origin: "official", task_type: "ranking", metric: "custom_ndcg_v1", rated: false, participants_count: 3, submission_deadline: new Date(Date.now() + 3 * 86400000).toISOString(), short_description: "Краткое условие.", description: "Полное условие. ".repeat(500), ...overrides },
    status, meta: { difficulty: "medium", access: "Открыто" },
  })));
}

test("active official event uses the showcase with real facts and a bounded summary", () => {
  const html = renderEvent();
  assert.match(html, /competition-event--showcase/);
  assert.match(html, /src="\/competition-factory-v2.png"/);
  assert.match(html, /Тренировочное соревнование/);
  assert.match(html, /3 участника/);
  assert.match(html, /Осталось 3 дня/);
  assert.match(html, /custom_ndcg_v1/);
  assert.match(html, /href="\/competitions\/event"/);
  assert.doesNotMatch(html, /Полное условие|Дата уточняется/);
});

test("showcase preserves rating, prizes, access and organizer semantics", () => {
  assert.match(renderEvent({ rated: true }), /Рейтинговое соревнование/);
  const html = renderEvent({ prize_type: "non_cash", prize_description: "Стажировка", access: "invite_only", company_name: "Партнёр", participants_count: 1 });
  assert.match(html, /Стажировка/);
  assert.match(html, /Партнёр/);
  assert.match(html, /1 участник</);
  assert.match(html, /Подробнее/);
});

test("competition cards show the metric name instead of its technical code", () => {
  const html = renderEvent({ metric: "ml_arena_tech_smena_ndcg_5_v1", metric_name: "Техносмена — NDCG@5" });
  assert.match(html, /Техносмена — NDCG@5/);
  assert.doesNotMatch(html, /ml_arena_tech_smena_ndcg_5_v1/);
});

test("metric names resolve from the competition or the catalog without changing the code", () => {
  const metric = { code: "ml_arena_tech_smena_ndcg_5_v1", name: "Техносмена — NDCG@5" };
  const competition = { metric: metric.code };
  assert.equal(getCompetitionMetricName(competition, [metric]), metric.name);
  assert.equal(getCompetitionMetricName(competition, { items: [metric] }), metric.name);
  assert.equal(getCompetitionMetricName({ ...competition, metric_name: "Название версии" }, [metric]), "Название версии");
  assert.equal(getCompetitionMetricName({ ...competition, metric_name: metric.code }, [metric]), metric.name);
  assert.equal(getCompetitionMetricName({ metric: "mae" }), "MAE (↓ лучше)");
  assert.equal(getCompetitionMetricName(competition, [{ code: "other", name: "Другая" }]), metric.code);
  assert.equal(getCompetitionMetricName({}, []), "Не указана");
  assert.deepEqual(competition, { metric: metric.code });
});

test("community and non-active events do not gain the active showcase", () => {
  assert.doesNotMatch(renderEvent({ origin: "community" }), /competition-event--showcase|competition-factory/);
  assert.doesNotMatch(renderEvent({}, "finished"), /competition-event--showcase|competition-factory/);
});

test("active competitions close at the exact submission deadline without mutating server status", () => {
  const competition = { status: "active", submission_deadline: "2026-10-16T18:00:00+03:00" };
  const deadline = Date.parse("2026-10-16T15:00:00Z");
  assert.equal(getCompetitionDeadlineTime(competition), deadline);
  assert.equal(getCompetitionStatus(competition, deadline - 1), "active");
  assert.equal(getCompetitionStatus(competition, deadline), "closed");
  assert.equal(getCompetitionStatus(competition, deadline + 1), "closed");
  assert.equal(competition.status, "active");
});

test("deadline resolution prefers the canonical field and supports legacy deadlines", () => {
  const now = Date.parse("2026-10-18T12:00:00Z");
  assert.equal(getCompetitionStatus({ status: "active", deadline: "2026-10-17T12:00:00Z" }, now), "closed");
  assert.equal(getCompetitionStatus({ status: "active", submission_deadline: "2026-10-19T12:00:00Z", deadline: "2026-10-17T12:00:00Z" }, now), "active");
  for (const submission_deadline of [undefined, null, "", "not-a-date"]) {
    assert.equal(getCompetitionDeadlineTime({ submission_deadline }), null);
    assert.equal(getCompetitionStatus({ status: "active", submission_deadline }, now), "active");
  }
});

test("deadline expiration respects server lifecycle states", () => {
  const now = Date.parse("2026-10-18T12:00:00Z");
  for (const status of ["completed", "finished", "archived", "finalizing", "paused", "scheduled", "approved_scheduled", "draft", "moderation", "submitted_for_review", "changes_requested"]) {
    const expected = ["completed", "finished", "archived"].includes(status) ? "finished"
      : ["finalizing", "paused"].includes(status) ? status : "upcoming";
    assert.equal(getCompetitionStatus({ status, submission_deadline: "2020-01-01" }, now), expected);
  }
});

test("competition creation includes the task while unchanged edits omit the task key entirely", () => {
  assert.deepEqual(getCompetitionTaskPayload("v1", null), { task_version_id: "v1" });
  for (const status of ["draft", "moderation", "scheduled", "active", "paused", "finalizing", "completed", "archived"]) {
    assert.deepEqual(getCompetitionTaskPayload("v1", { status, task_version_id: "v1" }), {});
    assert.equal(Object.hasOwn(getCompetitionTaskPayload("v1", { status, task_version_id: "v1" }), "task_version_id"), false);
  }
});

test("task replacements are allowed only before publication, matching the server contract", () => {
  for (const status of ["draft", "moderation"]) {
    const competition = { status, task_version_id: "v1" };
    assert.equal(canChangeCompetitionTask(competition), true);
    assert.deepEqual(getCompetitionTaskPayload("v2", competition), { task_version_id: "v2" });
  }
  for (const status of ["scheduled", "active", "paused", "finalizing", "completed", "archived", "unknown"]) {
    const competition = { status, task_version_id: "v1" };
    assert.equal(canChangeCompetitionTask(competition), false);
    assert.throws(() => getCompetitionTaskPayload("v2", competition), /После публикации нельзя заменить задачу/);
  }
});

test("passing deadline or planned results date never publishes private assessments", () => {
  const competition = { status: "active", submission_deadline: "2020-01-01", final_results_at: "2020-01-02" };
  assert.equal(getCompetitionStatus(competition), "closed");
  assert.equal(canShowPrivateScore(competition, { status: "scored", private_score: 0.55, private_score_revealed: true }), false);
  assert.equal(getCompetitionStatus({ status: "active", final_results_at: "2020-01-02" }), "active");
});

test("closed competition cards distinguish awaiting results from completed events", () => {
  const html = renderEvent({}, "closed");
  assert.match(html, /Приём завершён/);
  assert.match(html, /Ожидаются итоги/);
  assert.match(html, /Открыть соревнование/);
  assert.doesNotMatch(html, /competition-event--showcase|Участвовать|Результаты опубликованы|Осталось/);
});

test("competition preview prefers the short description and removes markdown", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionSummary, { competition: {
    short_description: "**Приоритет** для `станков`. [Данные](https://example.com)",
    description: "Полное условие не должно попасть в карточку.",
  } }));
  assert.match(html, /Приоритет для станков\. Данные/);
  assert.doesNotMatch(html, /<strong|<code|<a |Полное условие/);
});

test("competition preview skips headings and bounds a long fallback paragraph", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionSummary, { competition: {
    description: `# Техносмена\n\n${"Длинное описание задачи. ".repeat(100)}\n\n## Проверка\n\nСкрытый текст.`,
  } }));
  const text = html.replace(/<[^>]*>/g, "");
  assert.ok(text.length <= 261);
  assert.match(text, /…$/);
  assert.doesNotMatch(html, /Техносмена|Проверка|Скрытый текст/);
});

test("full competition content preserves headings, emphasis, lists and code with linked outline", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionContent, null,
    "# Условие\n\nОписание.\n\n## Ответ\n\n**CSV** с `priority_score`.\n\n- Один ответ\n- Все ID\n\n## Метрика\n\n> Больше — лучше.\n\n```csv\nid,priority_score\n1,0.9\n```",
  ));
  assert.match(html, /aria-label="Содержание раздела"/);
  assert.match(html, /href="#competition-section-3"/);
  assert.match(html, /id="competition-section-3"/);
  assert.match(html, /<strong[^>]*>CSV<\/strong>/);
  assert.match(html, /<ul[^>]*>/);
  assert.match(html, /<blockquote[^>]*>/);
  assert.match(html, /<pre[^>]*>/);
  assert.match(html, /id,priority_score/);
});

test("untrusted competition content cannot render raw scripts or unsafe links", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionContent, null,
    "<script>alert(1)</script>\n\n[Ссылка](javascript:alert%281%29)",
  ));
  assert.doesNotMatch(html, /<script|href="javascript:/);
});

test("markdown tables render accessible headers, cell formatting and column alignment", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionContent, null,
    "| Поле | Тип CSV | Пропуски train | Значение |\n| :--- | :---: | ---: | --- |\n| `id` | string | 0 | **Ключ строки** |\n| `vibration_delta_7d` | number | 4099 | Изменение вибрации |",
  ));
  assert.match(html, /role="region" aria-label="Таблица соревнования" tabindex="0"/);
  assert.match(html, /overflow-x-auto/);
  assert.match(html, /<table[^>]*>/);
  assert.match(html, /<thead[^>]*>/);
  assert.equal((html.match(/scope="col"/g) || []).length, 4);
  assert.equal((html.match(/<td\b/g) || []).length, 8);
  assert.match(html, /text-align:center/);
  assert.match(html, /text-align:right/);
  assert.match(html, /<code[^>]*>vibration_delta_7d<\/code>/);
  assert.match(html, /<strong[^>]*>Ключ строки<\/strong>/);
});

test("preview skips markdown tables instead of displaying pipe-delimited text", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionSummary, { competition: {
    description: "| Поле | Тип |\n| --- | --- |\n| id | string |\n\nОписание задачи.",
  } }));
  assert.match(html, /Описание задачи\./);
  assert.doesNotMatch(html, /\||<table/);
});

test("missing or failed submission scores never become a fabricated zero", () => {
  for (const value of [null, undefined, "", " ", "NaN", false]) {
    assert.equal(getSubmissionScore({ status: "scored", public_score: value }), null);
  }
  for (const status of ["failed", "invalid", "error", "rejected", "cancelled"]) {
    assert.equal(getSubmissionScore({ status, public_score: 0, private_score: 0 }), null);
    assert.equal(getSubmissionScore({ status, private_score: 0 }, "private"), null);
    assert.ok(SUBMISSION_STATUS_LABELS[status]);
  }
});

test("valid submission scores preserve zero, decimal strings and private results", () => {
  assert.equal(getSubmissionScore({ status: "scored", public_score: 0 }), 0);
  assert.equal(getSubmissionScore({ status: "evaluated", public_score: "0.55" }), 0.55);
  assert.equal(getSubmissionScore({ status: "scored", public_score: null, score: 0.55 }), 0.55);
  assert.equal(getSubmissionScore({ status: "scored", private_score: "0.63" }, "private"), 0.63);
});

test("private assessment remains hidden until the competition has finished", () => {
  for (const status of ["draft", "scheduled", "active", "paused", "finalizing"]) {
    assert.equal(canShowPrivateScore({ status, final_results_at: "2020-01-01" }, { private_score: 0.55, private_score_revealed: true }), false);
  }
  assert.equal(canShowPrivateScore({ status: "finished" }, { private_score: 0.55 }), true);
  assert.equal(canShowPrivateScore({ status: "completed" }, { private_score: 0.55, private_score_revealed: true }), true);
  assert.equal(canShowPrivateScore({ status: "finished" }, { private_score: 0.55, private_score_revealed: false }), false);
});

test("overview displays every section immediately with heading anchors and no collapsed content", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionContent, { brief: true },
    "# Техносмена\n\nВступление без сокращений.\n\n## Формат ответа\n\nПолные инструкции.\n\n```csv\nid,priority_score\n1,0.55\n```\n\n## Поля\n\n| Поле | Тип |\n| --- | --- |\n| id | string |",
  ));
  assert.match(html, /competition-brief-intro/);
  assert.match(html, /Вступление без сокращений/);
  assert.doesNotMatch(html, /<details|<summary|hidden=/);
  assert.match(html, /<h3 id="competition-section-2"[^>]*>Формат ответа<\/h3>/);
  assert.match(html, /Полные инструкции/);
  assert.match(html, /href="#competition-section-3"/);
  assert.equal((html.match(/id="competition-section-3"/g) || []).length, 1);
  assert.match(html, /<table/);
  assert.match(html, /1,0.55/);
});

test("overview keeps nested heading levels, inline formatting and all section content visible", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionContent, { brief: true },
    "# Задача\n\nВступление.\n\n## Данные\n\n**Описание данных**.\n\n### Проверка\n\n- Сохраните все ID\n- Не меняйте порядок\n\n## Итог\n\nПоследний раздел виден сразу.",
  ));
  assert.doesNotMatch(html, /<details|<summary/);
  assert.match(html, /<h4 id="competition-section-3"/);
  assert.match(html, /<strong[^>]*>Описание данных<\/strong>/);
  assert.match(html, /<ul/);
  assert.match(html, /Последний раздел виден сразу/);
  for (let index = 1; index <= 4; index++) {
    assert.match(html, new RegExp(`href="#competition-section-${index}"`));
    assert.equal((html.match(new RegExp(`id="competition-section-${index}"`, "g")) || []).length, 1);
  }
});

test("startup block uses the actual command from the condition, not a hardcoded recipe", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionCodeSample, null,
    "Описание\n\n```csv\nid,priority_score\n```\n\n```bash\npython custom_start.py --seed 42\n```",
  ));
  assert.match(html, /python custom_start.py --seed 42/);
  assert.match(html, /aria-label="Скопировать код"/);
  assert.doesNotMatch(html, /id,priority_score|baseline.py/);
});

test("metric preference respects API direction and does not invent a direction for unknown metrics", () => {
  assert.equal(getCompetitionMetricDirection({ metric: "ml_arena_tech_smena_ndcg_5_v1" }), "maximize");
  assert.equal(getCompetitionMetricDirection({ metric: "mae" }), "minimize");
  assert.equal(getCompetitionMetricDirection({ metric: "unknown", metric_direction: "maximize" }), "maximize");
  assert.equal(getCompetitionMetricDirection({ metric: "unknown" }), null);
});

test("competition metric explanations round-trip through the existing description contract", () => {
  const description = "# Задача\n\nИсходное условие.\n\n## Данные\n\nВсе признаки.";
  const metricDescription = "Оцениваем **NDCG@5**.\n\n- Первые пять позиций\n- Среднее по группам\n\n```text\nscore = mean(ndcg)\n```";
  const stored = composeCompetitionDescription(description, metricDescription);
  assert.deepEqual(splitCompetitionDescription(stored), { description, metricDescription });
  assert.equal(composeCompetitionDescription(stored), stored);
  assert.equal(composeCompetitionDescription(description, ""), description);
  assert.equal(composeCompetitionDescription(stored, ""), description);
  assert.equal(composeCompetitionDescription(stored, "Новое объяснение"), `${description}\n\n# Метрика и оценка решения\n\nНовое объяснение`);
});

test("metric sections retain nested headings and do not swallow neighboring sections", () => {
  const markdown = "# Задача\n\nНачало.\n\n## Метрика и оценка решения\n\nФормула.\n\n### Пример\n\nРасчёт.\n\n## Правила\n\nОдин аккаунт.";
  assert.deepEqual(splitCompetitionDescription(markdown), { description: "# Задача\n\nНачало.\n\n## Правила\n\nОдин аккаунт.", metricDescription: "Формула.\n\n### Пример\n\nРасчёт." });
  const stored = composeCompetitionDescription("Условие.", "# Формула\n\nNDCG.\n\nПример\n=======\n\nРасчёт.");
  const content = splitCompetitionDescription(stored);
  assert.equal(content.description, "Условие.");
  assert.equal(content.metricDescription, "## Формула\n\nNDCG.\n\nПример\n---\n\nРасчёт.");
  assert.equal(composeCompetitionDescription(content.description, content.metricDescription), stored);
});

test("Markdown parsing ignores fake metric headings inside code and blockquotes", () => {
  const description = "Условие.\n\n```md\n# Метрика и оценка решения\nПример строки.\n```\n\n> # Метрика и оценка решения\n> Цитата.";
  assert.deepEqual(splitCompetitionDescription(description), { description, metricDescription: "" });
  assert.equal(splitCompetitionDescription(composeCompetitionDescription(description, "Настоящее объяснение.")).metricDescription, "Настоящее объяснение.");
  assert.deepEqual(splitCompetitionDescription(null), { description: "", metricDescription: "" });
});

test("metric explanation preserves CRLF, code fences and tables through saving", () => {
  const metric = "Таблица:\n\n| Позиция | Вес |\n| --- | ---: |\n| 1 | 1.0 |\n\n```python\n# Метрика и оценка решения\nscore = 0.5\n```".replaceAll("\n", "\r\n");
  const stored = composeCompetitionDescription("Условие.\r\n\r\nДанные.", metric);
  assert.equal(splitCompetitionDescription(stored).metricDescription, metric);
  assert.equal(splitCompetitionDescription(stored).description, "Условие.\r\n\r\nДанные.");
});

test("competition-specific text overrides catalog description without changing shared metrics", () => {
  const catalog = [{ code: "ndcg", description: "Описание общей метрики." }];
  const competition = { metric: "ndcg", description: composeCompetitionDescription("Условие.", "Пояснение организатора.") };
  assert.equal(getCompetitionMetricDescription(competition, catalog), "Пояснение организатора.");
  assert.equal(getCompetitionMetricDescription({ metric: "ndcg" }, { items: catalog }), "Описание общей метрики.");
  assert.equal(getCompetitionMetricDescription({ metric: "unknown" }, catalog), "");
  assert.equal(catalog[0].description, "Описание общей метрики.");
});

test("metric block renders rich content with separate anchors and safe links", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionMetricExplanation, { competition: {
    description: composeCompetitionDescription("Условие.", "## Формула\n\n**NDCG@5** для `priority_score`.\n\n## Пример\n\n| Позиция | Вес |\n| --- | ---: |\n| 1 | 1 |\n\n## Ограничения\n\n[Ссылка](javascript:alert%281%29)\n\n<script>alert(1)</script>"),
  } }));
  assert.match(html, /<strong[^>]*>NDCG@5/);
  assert.match(html, /<code[^>]*>priority_score/);
  assert.match(html, /<table/);
  assert.match(html, /id="competition-metric-section-1"/);
  assert.doesNotMatch(html, /<nav|id="competition-section-1"|<script|href="javascript:|Условие\./);
});

test("metric block uses the catalog description or the existing fallback for old competitions", () => {
  const catalog = [{ code: "ndcg", name: "NDCG@5", description: "**Пять** первых позиций." }];
  const html = renderToStaticMarkup(React.createElement(CompetitionMetricExplanation, { competition: { metric: "ndcg" }, catalog }));
  assert.match(html, /<strong[^>]*>Пять/);
  const fallback = renderToStaticMarkup(React.createElement(CompetitionMetricExplanation, { competition: { metric: "ndcg", description: "Условие." } }));
  assert.match(fallback, /Оценка рассчитывается по метрике/);
});
