import assert from "node:assert/strict";
import { test } from "node:test";
import { competitionReport, duelReport, passportReport, reportDate } from "../src/lib/reportPdfModel.js";

const profile = { user_name: "Алексей", email: "private@example.com", company: "Private company", stats: {} };
const passport = (extra = {}) => passportReport({ profile, ...extra });
const serialized = (report) => JSON.stringify(report);

test("passport excludes private and unverified data by default", () => {
  const input = { externalAchievements: [{ title: "Verified external", verified: true }, { title: "Unverified external" }] };
  const hidden = serialized(passport(input));
  assert.doesNotMatch(hidden, /private@example|Private company|Verified external|Unverified external/);
  const included = serialized(passport({ ...input, options: { includeCareer: true, includeContacts: true, includeExternal: true } }));
  for (const expected of ["private@example.com", "Private company", "Verified external"]) assert.ok(included.includes(expected));
  assert.doesNotMatch(included, /Unverified external/);
});

test("zero scores are preserved but unknown values are not invented", () => {
  const data = passport({ rating: 0, directions: [{ title: "NLP", score: 0 }, { title: "CV" }], badgesLoaded: false });
  assert.equal(data.stats[0].value, "0");
  assert.equal(data.stats[1].value, "Нет данных");
  assert.equal(data.stats[2].value, "Нет данных");
  assert.equal(data.stats[3].value, "Нет данных");
  assert.equal(data.sections[0].items[0].value, "0");
  assert.equal(data.sections[0].items[1].value, "Нет данных");
  assert.match(data.sections[0].items[0].detail, /недоступна/);
  assert.doesNotMatch(serialized(data), /Founder Season/);
  assert.match(data.filename, /Алексей/);
});

test("passport deduplicates final evidence and discloses incomplete history", () => {
  const evidence = { official: [{ competition: { id: "one", title: "Final" }, result: { rank: 1, score: 0, participants_count: 20 } }], duels: [] };
  const data = passport({ evidenceIncomplete: true, directions: [{ title: "NLP", evidence }, { title: "CV", evidence }] });
  assert.equal(data.sections.find((item) => item.title === "Официальные финальные результаты").items.length, 1);
  assert.match(serialized(data), /Оценка: 0/);
  assert.match(serialized(data), /Часть истории недоступна/);
});

test("duel results distinguish unknown, win, loss and draw", () => {
  const input = { duel: { status: "completed", player1_name: "First", player2_name: "Second" } };
  assert.equal(duelReport(input).stats[0].value, "Не определён");
  assert.equal(duelReport(input).stats[1].value, "Нет данных");
  assert.equal(duelReport({ duel: { ...input.duel, winner_name: "Ты", current_user_rating_change: 0 } }).stats[0].value, "Победа");
  assert.equal(duelReport({ duel: { ...input.duel, winner_name: "Second" } }).stats[0].value, "Поражение");
  assert.equal(duelReport({ duel: { ...input.duel, is_draw: true } }).stats[0].value, "Ничья");
  assert.throws(() => duelReport({ duel: { status: "active" } }), /не завершена/);
});

test("competition PDF separates open results and does not assert unreported verification", () => {
  const input = { competition: { status: "completed", deadline: "2026-10-16" }, result: { leaderboard_kind: "public" }, score: "0.0000" };
  const data = competitionReport(input);
  assert.equal(data.stats[1].label, "Открытая оценка");
  assert.equal(data.stats[1].value, "0.0000");
  assert.match(serialized(data), /не подменяет итог/);
  assert.match(serialized(data), /Уровень подтверждения не указан/);
  assert.match(serialized(data), /Нет данных о проверке/);
  assert.doesNotMatch(serialized(data), /16.10.2026/);
  assert.throws(() => competitionReport({ ...input, competition: { status: "active" } }), /ещё не опубликованы/);
  assert.equal(competitionReport({ ...input, result: { leaderboard_kind: "private" } }).stats[1].label, "Итоговая оценка");
  assert.equal(competitionReport({ ...input, score: "—" }).stats[1].value, "Нет данных");
  assert.equal(competitionReport({ ...input, score: NaN }).stats[1].value, "Нет данных");
  const unknown = competitionReport({ ...input, result: {} });
  assert.equal(unknown.stats[1].label, "Оценка");
  assert.match(serialized(unknown), /Тип таблицы не указан/);
});

test("report links reject executable URLs and dates reject invalid input", () => {
  assert.equal(passport({ url: "javascript:alert(1)" }).url, null);
  assert.equal(passport({ url: "https://mlarena.ru/profile/me" }).url, "https://mlarena.ru/profile/me");
  assert.equal(reportDate("garbage"), "Нет данных");
  assert.equal(reportDate(null), "Нет данных");
});
