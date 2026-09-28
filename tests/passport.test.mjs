import assert from "node:assert/strict";
import { test } from "node:test";
import { allPages, directionEvidence, directionKey, loadPassportEvidence, median, safeArtifactUrl, submissionStatistics } from "../src/lib/passport.js";

const now = Date.parse("2026-09-28T12:00:00Z");
const result = (id, rank, origin = "official_platform", extra = {}) => ({ competition: { id, task_type: "classification", status: "finished", origin, deadline: "2026-09-10T12:00:00Z" }, result: { rank, participants_count: 100, origin, score: 0.9, leaderboard_kind: "private", ...extra } });

test("official, community and preliminary results remain separate", () => {
  const data = directionEvidence({ competitions: [result("a", 10), result("b", 20), result("c", 1, "community"), result("d", 2, "official_platform", { leaderboard_kind: "public" })] }, "classification", "me", now);
  assert.equal(data.official.length, 2);
  assert.equal(data.community.length, 1);
  assert.equal(data.peak, 10);
  assert.equal(data.typical, 15);
  assert.equal(data.recent, 15);
  assert.equal(data.status, "Данных достаточно");
  assert.equal(data.reviewed, null);
});

test("recent needs two final results and missing percentiles stay unknown", () => {
  const data = directionEvidence({ competitions: [result("a", null)] }, "classification", "me", now);
  assert.equal(data.peak, null);
  assert.equal(data.typical, null);
  assert.equal(data.recent, null);
  assert.equal(data.status, "Мало данных");
});

test("verified code is necessary for high confirmation and stale evidence is insufficient", () => {
  const competitions = [1, 2, 3, 4].map((id) => result(String(id), id));
  assert.equal(directionEvidence({ competitions }, "classification", "me", now).status, "Данных достаточно");
  competitions[0].result.code_reviewed = true;
  assert.equal(directionEvidence({ competitions }, "classification", "me", now).status, "Высокая подтверждённость");
  competitions.forEach((item) => { item.competition.deadline = "2024-01-01"; });
  assert.equal(directionEvidence({ competitions }, "classification", "me", now).status, "Мало данных");
});

test("duel averages exclude foreign, unrated and missing submissions", () => {
  const duel = { task_type: "computer_vision", status: "completed", mode: "rated", winner_id: "me", started_at: "2026-09-12T12:00:00Z", completed_at: "2026-09-12T13:00:00Z", player1: { user_id: "me", submitted_at: "2026-09-12T12:20:00Z" }, player2: { user_id: "other", rating: 1200 } };
  const data = directionEvidence({ duels: [duel, { ...duel, mode: "unrated" }, { ...duel, mode: "arena_challenge" }, { ...duel, player1: { user_id: "foreign" } }, { ...duel, player1: { user_id: "me" } }] }, "cv", "me", now);
  assert.equal(data.duels.length, 2);
  assert.equal(data.averageSubmissionMinutes, 20);
  assert.equal(data.submissionTimeCount, 1);
  assert.equal(data.averageOpponentRating, 1200);
  assert.equal(directionKey("computer_vision"), "cv");
});

test("submission statistics handle minimizing metrics, zeros and unknown direction", () => {
  const submissions = [8, 6, 4].map((value, index) => ({ id: String(index), status: "scored", public_score: value, created_at: `2026-09-01T12:0${index}:00Z` }));
  const data = submissionStatistics(submissions, { baseline_score: 7, starts_at: "2026-09-01T12:00:00Z" }, "minimize");
  assert.equal(data.best.public_score, 4);
  assert.equal(data.attemptsToBaseline, 2);
  assert.equal(data.minutes, 1);
  assert.equal(data.improvement, 3);
  const unknown = submissionStatistics(submissions, { baseline_score: 7 }, null);
  assert.equal(unknown.baselineKnown, false);
  assert.equal(unknown.best, null);
  const zero = submissionStatistics([{ id: "zero", status: "scored", public_score: 0, created_at: "2026-09-01" }], { baseline_score: 0 }, "maximize");
  assert.equal(zero.valid.length, 1);
  assert.equal(zero.improvementPercent, null);
});

test("pagination reads arrays and nested envelopes without dropping the second page", async () => {
  const items = Array.from({ length: 135 }, (_, id) => ({ id }));
  const pages = [];
  const result = await allPages(async ({ limit, offset }) => { pages.push(offset); return { data: { items: items.slice(offset, offset + limit), total: items.length } }; });
  assert.equal(result.length, 135);
  assert.deepEqual(pages, [0, 100]);
});

test("history skips absent results, reports outages and limits result-card concurrency", async () => {
  const competitions = Array.from({ length: 9 }, (_, id) => ({ id, status: "finished" }));
  let active = 0;
  let peak = 0;
  const api = { competitions: { list: async () => ({ data: competitions }), resultCard: async (id) => { active++; peak = Math.max(peak, active); await new Promise((resolve) => setTimeout(resolve, 5)); active--; if (id === 0) throw { status: 404 }; if (id === 1) throw { status: 500 }; return { rank: 1 }; } }, duels: { list: async () => ({ data: [] }) } };
  const data = await loadPassportEvidence(api);
  assert.equal(data.competitions.length, 7);
  assert.equal(data.errors, 1);
  assert.ok(peak <= 4);
});

test("artifact links reject executable URLs and medians do not mutate input", () => {
  assert.equal(safeArtifactUrl("javascript:alert(1)"), null);
  assert.equal(safeArtifactUrl("data:text/html,hello"), null);
  assert.equal(safeArtifactUrl("https://example.com/predictions.csv"), "https://example.com/predictions.csv");
  const values = [5, 1, 3];
  assert.equal(median(values), 3);
  assert.deepEqual(values, [5, 1, 3]);
});
