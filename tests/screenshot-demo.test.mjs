import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveConfig } from "vite";
import { strFromU8, unzipSync } from "fflate";
import { createScreenshotDemo, screenshotDemoPlugin } from "../scripts/screenshot-demo.mjs";

const demo = createScreenshotDemo(Date.parse("2026-10-29T12:00:00Z"));
const get = (path) => demo.respond("GET", path).body.data;

test("screenshot demo uses a fictitious account, marked data and a consistent current user", () => {
  const auth = demo.respond("POST", "/api/v1/auth/refresh").body.data;
  assert.match(auth.user.email, /@example\.test$/);
  const profile = get("/api/v1/profiles/me");
  assert.equal(profile.user_id, auth.user.id);
  assert.match(profile.bio, /демонстрационные данные/);
  const rating = get("/api/v1/rating?tab=overall");
  assert.equal(rating.current_user.user_id, profile.user_id);
  assert.equal(rating.items.find((item) => item.user_id === profile.user_id).rank, 3);
  assert.equal(rating.current_user.score, 856);
  assert.match(rating.season.description, /вымышлены/);
});

test("competition results and code verification are separate and private scores remain locked", () => {
  const active = get("/api/v1/competitions/demo-techsmena");
  assert.equal(active.status, "active");
  assert.match(active.description, /Демонстрационные данные/);
  assert.match(active.description, /NDCG@5/);
  assert.match(active.description, /row_id,prediction/);
  assert.equal(get(`/api/v1/competitions/${active.id}/leaderboard?kind=private`).private_locked, true);
  const board = get(`/api/v1/competitions/${active.id}/leaderboard?kind=public`);
  assert.equal(board.current_user.best_score, active.user_best_public_score);
  const verified = get("/api/v1/competitions/demo-maintenance-final/result-card");
  const pending = get("/api/v1/competitions/demo-logistics-final/result-card");
  const community = get("/api/v1/competitions/demo-community/result-card");
  assert.equal(verified.code_reviewed, true);
  assert.equal(pending.code_reviewed, false);
  assert.equal(community.evidence_level, "community_activity");
  assert.equal(get("/api/v1/competitions/demo-maintenance-final/leaderboard?kind=private").current_user.best_score, verified.score);
});

test("demo is loopback-only, blocks unrelated writes and does not provide real credentials", () => {
  assert.equal(demo.respond("GET", "/api/v1/profiles/me", "example.com").status, 403);
  assert.equal(demo.respond("PATCH", "/api/v1/profiles/me").status, 409);
  assert.equal(demo.respond("POST", "/api/v1/files/upload-intents").status, 409);
  assert.equal(demo.respond("GET", "/api/v1/admin/me").status, 404);
  assert.equal(screenshotDemoPlugin().apply, "serve");
});

test("demo dataset download is a real synthetic ZIP and table facts are populated", () => {
  const archive = unzipSync(demo.respond("GET", "/__demo__/dataset.zip").raw);
  assert.match(strFromU8(archive["README.txt"]), /DEMONSTRATION DATA ONLY/);
  assert.match(strFromU8(archive["sample_submission.csv"]), /row_id,prediction/);
  const board = get("/api/v1/competitions/demo-techsmena/leaderboard");
  assert.ok(board.items.every((item) => item.attempts > 0 && Number.isFinite(Date.parse(item.submitted_at))));
  assert.equal(get("/api/v1/competitions/demo-techsmena/participation/me").public_rank, board.current_user.rank);
  assert.equal(get("/api/v1/duels/demo-duel").ends_at, get("/api/v1/duels/demo-duel").ends_at);
});

test("screenshot fixtures and API override are absent from a production-mode configuration", async () => {
  const config = await resolveConfig({ configFile: fileURLToPath(new URL("../vite.config.js", import.meta.url)), mode: "screenshots", logLevel: "silent" }, "build");
  assert.ok(!config.plugins.some((plugin) => plugin.name === "local-screenshot-demo"));
  assert.equal(config.define?.["import.meta.env.VITE_API_URL"], undefined);
});
