import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.js";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { getSubmissionScore, SUBMISSION_STATUS_LABELS, canShowPrivateScore, getCompetitionMetricDirection } from "../src/lib/ml-arena.js";

let server;
let CompetitionContent;
let CompetitionSummary;
let CompetitionCodeSample;
let CompetitionCard;

before(async () => {
  globalThis.window = { self: null, top: null };
  server = await createServer({ configFile: false, resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } }, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  ({ CompetitionContent, CompetitionSummary, CompetitionCodeSample } = await server.ssrLoadModule("/src/components/ml/CompetitionContent.jsx"));
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

test("community and non-active events do not gain the active showcase", () => {
  assert.doesNotMatch(renderEvent({ origin: "community" }), /competition-event--showcase|competition-factory/);
  assert.doesNotMatch(renderEvent({}, "finished"), /competition-event--showcase|competition-factory/);
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

test("compact overview keeps its introduction and preserves every linked full section", () => {
  const html = renderToStaticMarkup(React.createElement(CompetitionContent, { brief: true },
    "# Техносмена\n\nВступление без сокращений.\n\n## Формат ответа\n\nПолные инструкции.\n\n```csv\nid,priority_score\n1,0.55\n```\n\n## Поля\n\n| Поле | Тип |\n| --- | --- |\n| id | string |",
  ));
  assert.match(html, /competition-brief-intro/);
  assert.match(html, /Вступление без сокращений/);
  assert.match(html, /<details id="competition-section-2"/);
  assert.match(html, /<summary>Формат ответа<\/summary>/);
  assert.match(html, /href="#competition-section-3"/);
  assert.match(html, /<table/);
  assert.match(html, /1,0.55/);
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
