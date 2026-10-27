import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StaticRouter } from "react-router-dom/server.js";
import { createServer } from "vite";
import { achievementForm, achievementPayload, validateAchievementEvidence, EVIDENCE_MAX_BYTES, safeAchievementUrl } from "../src/lib/profileAchievements.js";
import { publicationReady, publicationError, sourceCodePolicyPayload, sourceCodeDeadlineInput } from "../src/lib/competitionPublication.js";
import { canShowPrivateScore } from "../src/lib/ml-arena.js";

let server, api, uploadAchievementEvidence, clientModule, AchievementCard, Moderation, Publication;
before(async () => {
  globalThis.window = { self: null, top: null };
  server = await createServer({ configFile: false, cacheDir: fileURLToPath(new URL("../node_modules/.vite-tests/achievements", import.meta.url)), esbuild: { jsx: "automatic" }, resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } }, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  ({ api, uploadAchievementEvidence } = await server.ssrLoadModule("/src/api/mlArenaApi.js"));
  clientModule = await server.ssrLoadModule("/src/api/client.js");
  ({ AchievementCard } = await server.ssrLoadModule("/src/components/ml/ProfileAchievements.jsx"));
  ({ default: Moderation } = await server.ssrLoadModule("/src/components/ml/ProfileAchievementModeration.jsx"));
  ({ default: Publication } = await server.ssrLoadModule("/src/components/ml/CompetitionPublicationReadiness.jsx"));
});
after(async () => { await server?.close(); delete globalThis.window; });

const item = { id: "a", achievement_type: "kaggle", title: "Competition", result: "Top 5%", description: null, achievement_url: "https://example.org/results", achieved_at: "2026-10-01", is_public: true, verification_status: "verified", evidence_attached: true };

test("achievement PATCH only sends changed fields and clears nullable fields explicitly", () => {
  assert.deepEqual(achievementPayload({ ...achievementForm(item), is_public: false }, item), { is_public: false });
  assert.deepEqual(achievementPayload(achievementForm(item), item), {});
  assert.deepEqual(achievementPayload({ ...achievementForm(item), achieved_at: "", achievement_url: "", description: " " }, item), { achievement_url: null, achieved_at: null });
  const body = achievementPayload({ ...achievementForm(item), title: "  Changed  " }, item);
  assert.deepEqual(body, { title: "Changed" });
  assert.equal(Object.hasOwn(body, "verification_status"), false);
});

test("achievement field validation rejects malformed URLs, dates and oversized strings", () => {
  for (const change of [{ title: " " }, { result: " " }, { description: "a".repeat(4001) }, { achieved_at: "2026-02-30" }, { achieved_at: "bad" }, { achievement_url: "javascript:alert(1)" }, { achievement_type: "wrong" }]) assert.throws(() => achievementPayload({ ...achievementForm(item), ...change }));
  assert.equal(safeAchievementUrl("data:text/html,x"), null);
});

test("evidence MIME and extension must agree and size is bounded", () => {
  for (const [name, type] of [["x.png", "image/png"], ["x.JPG", "image/jpeg"], ["x.jpeg", "image/jpeg"], ["x.webp", "image/webp"], ["x.pdf", "application/pdf"]]) assert.equal(validateAchievementEvidence({ name, type, size: EVIDENCE_MAX_BYTES }), type);
  assert.equal(validateAchievementEvidence({ name: "proof.pdf", type: "", size: 1 }), "application/pdf");
  for (const file of [{ name: "x.svg", size: 1 }, { name: "x.pdf", type: "image/png", size: 1 }, { name: "x.png", size: 0 }, { name: "x.pdf", size: EVIDENCE_MAX_BYTES + 1 }]) assert.throws(() => validateAchievementEvidence(file));
});

test("achievement evidence upload uses authenticated API and raw unauthenticated storage PUT", async () => {
  const original = globalThis.fetch;
  const requests = [];
  clientModule.setAccessToken("test-token");
  globalThis.fetch = async (url, init) => {
    requests.push({ url, ...init });
    if (String(url).includes("upload-intents")) return new Response(JSON.stringify({ data: { id: "upload", method: "PUT", upload_url: "https://storage.example/proof", required_headers: { "Content-Type": "application/pdf", "x-amz-meta-sha256": "meta" }, expires_at: new Date(Date.now() + 600000).toISOString(), max_size_bytes: EVIDENCE_MAX_BYTES } }));
    if (String(url).includes("/complete")) return new Response(JSON.stringify({ data: { id: "upload", status: "ready" } }));
    return new Response(null, { status: 200 });
  };
  try {
    const file = new File(["test"], "proof.pdf", { type: "application/pdf" });
    assert.equal(await uploadAchievementEvidence(file), "upload");
    const body = JSON.parse(requests[0].body);
    assert.equal(body.purpose, "achievement_evidence");
    assert.deepEqual(body.context, {});
    assert.equal(body.content_type, "application/pdf");
    assert.match(body.checksum_sha256, /^[a-f0-9]{64}$/);
    assert.equal(new Headers(requests[0].headers).get("Authorization"), "Bearer test-token");
    assert.equal(requests[1].body, file);
    assert.equal(new Headers(requests[1].headers).get("Authorization"), null);
    assert.equal(new Headers(requests[1].headers).get("x-amz-meta-sha256"), "meta");
    assert.deepEqual(JSON.parse(requests[2].body), { checksum_sha256: body.checksum_sha256 });
  } finally { globalThis.fetch = original; clientModule.clearAccessToken(); }
});

test("non-ready evidence is never returned as attachable upload", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => new Response(JSON.stringify({ data: String(url).includes("upload-intents") ? { id: "u", upload_url: "https://storage.example/u" } : { id: "u", status: "pending" } }));
  try { await assert.rejects(uploadAchievementEvidence(new File(["x"], "x.pdf", { type: "application/pdf" })), (error) => error.code === "UPLOAD_NOT_READY"); }
  finally { globalThis.fetch = original; }
});

test("achievement CRUD, moderation and evidence endpoints preserve exact contracts", async () => {
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init) => { requests.push({ path: new URL(url, "http://local").pathname, method: init.method || "GET", body: init.body }); return new Response(JSON.stringify({ data: [], meta: { total: 41, has_more: true } })); };
  try {
    await api.profiles.achievementTypes(); await api.profiles.myAchievements();
    await api.profiles.createAchievement({ title: "New", evidence_upload_id: "upload" });
    await api.profiles.updateAchievement("a", { is_public: false }); await api.profiles.deleteAchievement("a");
    await api.profiles.achievementEvidence("a");
    const envelope = await api.admin.profileAchievements({ status: "pending_review", limit: 20, offset: 20 });
    await api.admin.profileAchievementEvidence("a"); await api.admin.verifyProfileAchievement("a"); await api.admin.rejectProfileAchievement("a", "Плохое подтверждение");
    assert.equal(envelope.meta.total, 41);
    assert.deepEqual(requests.map(({ path, method }) => [path, method]), [["/api/v1/profiles/achievement-types", "GET"], ["/api/v1/profiles/me/achievements", "GET"], ["/api/v1/profiles/me/achievements", "POST"], ["/api/v1/profiles/me/achievements/a", "PATCH"], ["/api/v1/profiles/me/achievements/a", "DELETE"], ["/api/v1/profiles/me/achievements/a/evidence", "GET"], ["/api/v1/admin/profile-achievements", "GET"], ["/api/v1/admin/profile-achievements/a/evidence", "GET"], ["/api/v1/admin/profile-achievements/a/verify", "POST"], ["/api/v1/admin/profile-achievements/a/reject", "POST"]]);
    assert.equal(requests[8].body, undefined);
    assert.deepEqual(JSON.parse(requests[9].body), { reason: "Плохое подтверждение" });
  } finally { globalThis.fetch = original; }
});

test("public achievement card never renders review notes or private evidence links", () => {
  const data = { ...item, review_note: "PRIVATE REVIEW", evidence_download_url: "https://storage.example/SECRET", evidence_url: "https://storage.example/SECRET" };
  const html = renderToStaticMarkup(React.createElement(AchievementCard, { achievement: data }));
  assert.match(html, /Top 5%|Подтверждено|Kaggle/);
  assert.doesNotMatch(html, /PRIVATE REVIEW|SECRET|Скачать подтверждение|Изменить|Удалить/);
  const owner = renderToStaticMarkup(React.createElement(AchievementCard, { achievement: data, owner: true }));
  assert.match(owner, /PRIVATE REVIEW/);
});

test("moderator read-only role cannot verify or reject and list retains pagination", () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
  client.setQueryData(["admin", "profile-achievements", "pending_review", 0], { data: [item], meta: { total: 41, has_more: true } });
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(StaticRouter, null, React.createElement(Moderation, { permissions: new Set(["moderation.read"]) }))));
  assert.match(html, /Рассмотреть|Всего: 41/);
  assert.doesNotMatch(html, />Подтвердить<|>Отклонить</);
  client.clear();
});

test("publication requires matching id, explicit ready and no blockers", () => {
  const competition = { id: "c", status: "finalizing" };
  const ready = { competition_id: "c", status: "finalizing", publication_ready: true, publication_blockers: [] };
  assert.equal(publicationReady(competition, ready), true);
  for (const change of [{ competition_id: "other" }, { status: "active" }, { publication_ready: "true" }, { publication_blockers: null }, { publication_blockers: [{ code: "source_code_window_open" }] }]) assert.equal(publicationReady(competition, { ...ready, ...change }), false);
  const data = { ...ready, publication_ready: false, eligible_participants_count: 0, excluded_participants_count: 4, publication_blockers: [{ code: "finalization_in_progress", details: { unfinished_submissions: 2, unfinished_scoring_jobs: 1, unfinished_recalculations: 0 } }, { code: "source_code_window_open", details: { source_code_deadline: "2026-10-30T18:00:00Z" } }] };
  const html = renderToStaticMarkup(React.createElement(Publication, { competition, data }));
  assert.match(html, /Отправки: 2/); assert.match(html, /Задачи оценки: 1/); assert.match(html, /Окно загрузки итогового кода ещё открыто/); assert.match(html, /Допущено: 0/); assert.match(html, /Не допущено: 4/);
  assert.match(publicationError({ code: "competition_deadline_not_reached" }), /времени сервера/);
});

test("source-code policy omits unchanged locked fields and validates edited deadlines", () => {
  const form = { source_code_required: true, source_code_deadline: "2026-10-30T18:00:00Z", submission_deadline: "2026-10-29T18:00:00Z" };
  assert.deepEqual(sourceCodePolicyPayload(form), { source_code_required: true, source_code_deadline: "2026-10-30T18:00:00.000Z" });
  assert.deepEqual(sourceCodePolicyPayload(form, { ...form, status: "finalizing" }), {});
  const precise = "2026-10-30T18:00:45.123Z";
  assert.deepEqual(sourceCodePolicyPayload({ ...form, source_code_deadline: sourceCodeDeadlineInput(precise) }, { ...form, source_code_deadline: precise, status: "finalizing" }), {});
  assert.throws(() => sourceCodePolicyPayload({ ...form, source_code_required: false }, { ...form, status: "completed" }));
  assert.throws(() => sourceCodePolicyPayload({ ...form, source_code_deadline: "" }));
  assert.throws(() => sourceCodePolicyPayload({ ...form, source_code_deadline: "2026-10-28T18:00:00Z" }));
});

test("archived status or service snapshot alone never reveals private scores", () => {
  const submission = { private_score: 0.9, private_score_revealed: true };
  const competition = { status: "archived", final_results_at: "2020-01-01" };
  assert.equal(canShowPrivateScore(competition, submission), false);
  assert.equal(canShowPrivateScore({ ...competition, _privateLeaderboard: { kind: "private", private_locked: true } }, submission), false);
  assert.equal(canShowPrivateScore({ ...competition, _privateLeaderboard: { kind: "private", private_locked: false } }, submission), true);
});
