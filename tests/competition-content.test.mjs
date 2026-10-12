import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

let server;
let CompetitionContent;
let CompetitionSummary;

before(async () => {
  globalThis.window = { self: null, top: null };
  server = await createServer({ configFile: false, resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } }, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: "custom" });
  ({ CompetitionContent, CompetitionSummary } = await server.ssrLoadModule("/src/components/ml/CompetitionContent.jsx"));
});

after(async () => { await server?.close(); delete globalThis.window; });

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
