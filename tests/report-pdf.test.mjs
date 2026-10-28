import assert from "node:assert/strict";
import { test } from "node:test";
import { competitionReport, competitionResultStats, duelReport, passportReport, reportDate, resultScore } from "../src/lib/reportPdfModel.js";

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
  assert.equal(data.stats[1].value, "—");
  assert.equal(data.stats[2].value, "—");
  assert.equal(data.stats[3].value, "—");
  assert.equal(data.sections[0].items[0].value, "—");
  assert.equal(data.sections[0].items[1].value, "—");
  assert.match(data.sections[0].items[0].detail, /недоступна/);
  assert.doesNotMatch(serialized(data), /Founder Season/);
  assert.match(data.filename, /Алексей/);
});

test("passport PDF treats legacy zero and missing skills equally without hiding real result zeros", () => {
  const empty = { complete: true, official: [], duels: [], competitions: [] };
  const directions = ["Классификация", "Регрессия", "NLP", "CV", "Временные ряды", "Ранжирование", "Кластеризация", "RecSys"].map((title, index) => ({ title, score: index < 5 ? 0 : undefined, evidence: empty }));
  const data = passport({ rating: 0, directions });
  assert.ok(data.sections[0].items.every((item) => item.value === "—" && item.detail === "Нет результатов"));
  assert.equal(data.stats[0].value, "0");
  const results = { ...empty, official: [{ competition: { id: "a", title: "Zero result" }, result: { score: 0, leaderboard_kind: "private" } }] };
  const withResults = passport({ directions: [{ title: "NLP", score: 0, evidence: results }, { title: "CV", score: 42, evidence: empty }] });
  assert.equal(withResults.sections[0].items[0].value, "—");
  assert.match(withResults.sections[0].items[0].detail, /Индекс не рассчитан/);
  assert.equal(withResults.sections[0].items[1].value, "42");
  assert.match(serialized(withResults), /"Итоговая оценка","value":"0"/);
  const incomplete = passport({ directions, evidenceIncomplete: true });
  assert.ok(incomplete.sections[0].items.every((item) => item.detail === "История недоступна"));
});

test("passport deduplicates final evidence and discloses incomplete history", () => {
  const evidence = { official: [{ competition: { id: "one", title: "Final" }, result: { rank: 1, score: 0, participants_count: 20, leaderboard_kind: "private" } }], duels: [] };
  const data = passport({ evidenceIncomplete: true, directions: [{ title: "NLP", evidence }, { title: "CV", evidence }] });
  assert.equal(data.sections.find((item) => item.kind === "competitions").items.length, 1);
  assert.match(serialized(data), /"Итоговая оценка","value":"0"/);
  assert.match(serialized(data), /Часть истории недоступна/);
});

test("passport includes active and community participations without claiming a final result", () => {
  const data = passport({ history: { participations: [
    { competition: { id: "active", title: "Active challenge", status: "active", deadline: "2099-01-01", metric: "custom", user_best_public_score: 0 }, result: null },
    { competition: { id: "community", title: "Community challenge", status: "completed", origin: "community", metric: "mae" }, result: { rank: 3, score: 0.3, leaderboard_kind: "public" } },
  ] }, metrics: [{ code: "custom", name: "Custom metric name" }], url: "https://mlarena.ru/profile/me" });
  const section = data.sections.find((item) => item.kind === "competitions");
  assert.equal(section.items.length, 2);
  assert.equal(section.items[0].badge, "УЧАСТВУЕТ");
  assert.equal(section.items[0].facts.find((item) => item.label === "Открытая оценка").value, "0");
  assert.equal(section.items[0].url, "https://mlarena.ru/competitions/active");
  assert.match(section.items[0].detail, /Custom metric name/);
  assert.notEqual(section.items[1].badge, "ФИНАЛЬНЫЙ РЕЗУЛЬТАТ");
  assert.match(section.items[1].detail, /Сообщество/);
  const staleCount = passport({ profile: { ...profile, stats: { competitions_participated: 0 } }, history: { participations: [{ competition: { id: "a", title: "Known participation" }, result: null }] } });
  assert.equal(staleCount.stats[2].value, "1");
});

test("confirmed empty data stays zero while unavailable history is not fabricated", () => {
  const empty = passport({ history: { participations: [] }, rating: 0, rank: null, badges: [] });
  assert.deepEqual(empty.stats.map((item) => item.value), ["0", "—", "0", "0"]);
  assert.match(empty.stats[1].detail, /Место пока не присвоено/);
  assert.match(serialized(empty), /Участий в соревнованиях пока нет/);
  const failed = passport({ history: { participations: [], competitionsError: true }, ratingLoaded: false, badgesLoaded: false });
  assert.deepEqual(failed.stats.map((item) => item.value), ["—", "—", "—", "—"]);
  assert.match(serialized(failed), /История соревнований недоступна/);
  assert.doesNotMatch(serialized(failed), /Нет данных/);
});

test("private achievements and evidence are not embedded in exported passport", () => {
  const data = passport({ options: { includeExternal: true }, externalAchievements: [{ title: "PRIVATE achievement", verified: true, is_public: false, evidence_url: "https://storage.example/SECRET" }, { title: "Public achievement", verified: true, is_public: true, evidence_url: "https://storage.example/SECRET" }] });
  assert.doesNotMatch(serialized(data), /PRIVATE|SECRET/);
  assert.match(serialized(data), /Public achievement/);
});

test("duel results distinguish unknown, win, loss and draw", () => {
  const input = { duel: { status: "completed", player1_name: "First", player2_name: "Second" } };
  assert.equal(duelReport(input).stats[0].value, "Не определён");
  assert.equal(duelReport(input).stats[1].value, "—");
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
  assert.match(serialized(data), /Сервер не передал статус/);
  assert.doesNotMatch(serialized(data), /16.10.2026/);
  assert.throws(() => competitionReport({ ...input, competition: { status: "active" } }), /ещё не опубликованы/);
  assert.equal(competitionReport({ ...input, result: { leaderboard_kind: "private" } }).stats[1].label, "Итоговая оценка");
  assert.equal(competitionReport({ ...input, score: "—" }).stats[1].value, "—");
  assert.equal(competitionReport({ ...input, score: NaN }).stats[1].value, "—");
  const unknown = competitionReport({ ...input, result: {} });
  assert.equal(unknown.stats[1].label, "Оценка");
  assert.match(serialized(unknown), /Тип таблицы не указан/);
});

test("published competition cards accept API decimal strings without inventing code verification", () => {
  const result = { rank: 1, score: "0.88163", leaderboard_kind: "private", participants_count: 2, evidence_level: "arena_verified" };
  const stats = competitionResultStats(result, "custom");
  assert.equal(stats[0].value, "#1");
  assert.equal(stats[1].value, "0.8816");
  assert.equal(stats[1].label, "Итоговая оценка");
  assert.equal(stats[3].value, "Не указана");
  assert.equal(competitionResultStats({ ...result, score: "0" }, "custom")[1].value, "0.0000");
  assert.equal(competitionResultStats({ ...result, code_reviewed: true }, "custom")[3].value, "Пройдена");
  assert.equal(competitionResultStats({ ...result, verification_status: "pending_review" }, "custom")[3].value, "Ожидает проверки");
  for (const invalid of [null, undefined, "", "  ", false, {}, NaN, Infinity, "invalid"]) assert.equal(resultScore(invalid, "custom"), "—");
  const pdf = competitionReport({ competition: { status: "completed", metric: "custom" }, result });
  assert.deepEqual(pdf.stats, stats);
});

test("duel cards and PDF share decimal score handling and four summary columns", () => {
  const data = duelReport({ duel: { status: "completed", metric: "rmse", player1_score: "0", player2_score: "0.235", current_user_rating_change: "0", winner_name: "Ты" } });
  assert.equal(data.stats.length, 4);
  assert.equal(data.stats[1].value, "0");
  assert.equal(data.stats[2].value, "0.0000");
  assert.equal(data.stats[3].value, "0.2350");
});

test("report links reject executable URLs and dates reject invalid input", () => {
  assert.equal(passport({ url: "javascript:alert(1)" }).url, null);
  assert.equal(passport({ url: "https://mlarena.ru/profile/me" }).url, "https://mlarena.ru/profile/me");
  assert.equal(reportDate("garbage"), "Нет данных");
  assert.equal(reportDate(null), "Нет данных");
});
