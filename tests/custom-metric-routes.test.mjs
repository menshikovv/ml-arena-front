import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let api;

before(async () => {
  server = await createServer({ configLoader: "runner", mode: "test", server: { middlewareMode: true }, appType: "custom" });
  ({ api } = await server.ssrLoadModule("/src/api/mlArenaApi.js"));
});

after(async () => {
  await server?.close();
});

test("custom version creation preserves its body and uses the custom endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url, method: init.method, body: init.body });
    return new Response(JSON.stringify({ data: { id: "version-2", version: 2, moderation_status: "draft" } }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const body = {
      source_upload_id: "source-id",
      validation_solution_upload_id: "solution-id",
      validation_submission_upload_id: "submission-id",
      direction: "maximize",
      display_format: "0.0000",
      allowed_task_types: ["classification"],
      forked_from_metric_version_id: null,
    };
    const version = await api.admin.createCustomMetricVersion("metric-id", body);
    await api.admin.submitMetricVersion("metric-id", version.id);
    await api.admin.createMetricVersion("builtin-id", { implementation_key: "roc_auc" });

    assert.deepEqual(requests.map(({ url, method }) => [new URL(url, "http://localhost").pathname, method]), [
      ["/api/v1/admin/metrics/metric-id/custom-versions", "POST"],
      ["/api/v1/admin/metrics/metric-id/versions/version-2/submit-for-moderation", "POST"],
      ["/api/v1/admin/metrics/builtin-id/versions", "POST"],
    ]);
    assert.deepEqual(JSON.parse(requests[0].body), body);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
