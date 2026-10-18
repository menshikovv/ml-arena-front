import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { canReplaceSourceCode, findBestSourceSubmission, getSourceCodeErrorMessage, isSourceCodeWindowClosedError, SOURCE_CODE_MAX_BYTES, validateSourceCodeFile } from "../src/lib/submissionSourceCode.js";

let server;
let api;
let uploadSubmissionSourceCode;
before(async () => {
  server = await createServer({ configFile: false, resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } }, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  ({ api, uploadSubmissionSourceCode } = await server.ssrLoadModule("/src/api/mlArenaApi.js"));
  const { setAccessToken } = await server.ssrLoadModule("/src/api/client.js");
  setAccessToken("test-source-token");
});
after(async () => { await server?.close(); });

test("source files use canonical MIME, allow 100 MiB and reject unsupported, empty or oversized files", () => {
  assert.equal(validateSourceCodeFile({ name: "solution.PY", type: "", size: 1 }), "text/x-python");
  assert.equal(validateSourceCodeFile({ name: "solution.ipynb", type: "text/plain", size: 1 }), "application/x-ipynb+json");
  assert.equal(validateSourceCodeFile({ name: "solution.zip", size: SOURCE_CODE_MAX_BYTES }), "application/zip");
  assert.throws(() => validateSourceCodeFile({ name: "solution.csv", size: 10 }));
  assert.throws(() => validateSourceCodeFile({ name: "solution.constructor", size: 10 }));
  assert.throws(() => validateSourceCodeFile({ name: "solution.py", size: 0 }));
  assert.throws(() => validateSourceCodeFile({ name: "solution.zip", size: SOURCE_CODE_MAX_BYTES + 1 }));
});

test("best selection excludes failed records, respects server best public score and minimization", () => {
  const submissions = [{ id: "bad", status: "failed", public_score: 9 }, { id: "one", status: "scored", public_score: 0.5 }, { id: "two", status: "evaluated", public_score: 0.55 }];
  assert.equal(findBestSourceSubmission(submissions, { metric: "ndcg", status: "active" }, {})?.id, "two");
  assert.equal(findBestSourceSubmission(submissions, { metric: "unknown", status: "active" }, { best_public_score: 0.5 })?.id, "one");
  assert.equal(findBestSourceSubmission(submissions, { metric: "mae", status: "active" }, {})?.id, "one");
  assert.equal(findBestSourceSubmission(submissions, { metric: "unknown", status: "active" }, {}), null);
});

test("best selection only uses private scores after they are published", () => {
  const rows = [{ id: "public-best", status: "scored", public_score: 0.9, private_score: 0.5 }, { id: "private-best", status: "scored", public_score: 0.8, private_score: 0.95 }];
  assert.equal(findBestSourceSubmission(rows, { metric: "ndcg", status: "active" }, {})?.id, "public-best");
  assert.equal(findBestSourceSubmission(rows, { metric: "ndcg", status: "finished" }, { best_public_score: 0.9 })?.id, "private-best");
});

test("replacement respects both server permission and the code-specific deadline", () => {
  assert.equal(canReplaceSourceCode({ replacement_allowed: false, replace_until: "2099-01-01" }), false);
  assert.equal(canReplaceSourceCode({ replacement_allowed: true, replace_until: "2026-10-20T18:00:00Z" }, Date.parse("2026-10-20T18:00:00Z")), false);
  assert.equal(canReplaceSourceCode({ replacement_allowed: true, replace_until: "2026-10-20T18:00:00Z" }, Date.parse("2026-10-20T17:59:59Z")), true);
  assert.equal(canReplaceSourceCode({ replacement_allowed: true, replace_until: "invalid" }), false);
});

test("closed source-code windows are identified by the server response, not unrelated upload errors", () => {
  for (const message of ["Source code can no longer be attached or replaced", "Source code can no longer be attached or replaced."]) {
    assert.equal(isSourceCodeWindowClosedError({ message }), true);
    assert.match(getSourceCodeErrorMessage({ message }), /Срок загрузки и замены итогового кода истёк/);
  }
  for (const error of [null, { status: 403, message: "Permission denied" }, { status: 410, message: "Upload intent expired" }]) {
    assert.equal(isSourceCodeWindowClosedError(error), false);
  }
});

test("source errors use Russian messages and preserve localized server details", () => {
  assert.equal(getSourceCodeErrorMessage({ message: "Проверка файла не пройдена" }), "Проверка файла не пройдена");
  assert.equal(getSourceCodeErrorMessage({ message: "Internal server error" }), "Не удалось прикрепить итоговый код.");
  assert.equal(getSourceCodeErrorMessage({ status: 500, message: "Internal server error" }, "Не удалось скачать итоговый код."), "Не удалось скачать итоговый код.");
  assert.match(getSourceCodeErrorMessage({ status: 413, message: "Too large" }), /размер/);
  assert.match(getSourceCodeErrorMessage({ status: 415, message: "Unsupported media type" }), /Формат/);
  assert.match(getSourceCodeErrorMessage({ status: 403, message: "Forbidden" }), /Нет доступа/);
});

function response(data, status = 200) {
  return new Response(JSON.stringify({ data }), { status, headers: { "Content-Type": "application/json" } });
}

for (const [extension, type] of [["py", "text/x-python"], ["ipynb", "application/x-ipynb+json"], ["zip", "application/zip"]]) {
  test(`source upload follows all four steps with correct binding and headers for .${extension}`, async () => {
    const originalFetch = globalThis.fetch;
    const file = new File(["source-fixture"], `solution.${extension}`, { type: "application/octet-stream" });
    const checksum = createHash("sha256").update("source-fixture").digest("hex");
    const headers = { "Content-Type": type, "x-amz-meta-sha256": checksum, "x-amz-checksum-sha256": createHash("sha256").update("source-fixture").digest("base64") };
    const calls = [];
    const stages = [];
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ path: new URL(url, "http://localhost").pathname, url, init });
      if (String(url).includes("upload-intents")) return response({ id: "upload-1", method: "PUT", upload_url: "https://storage.example/upload", required_headers: headers, expires_at: "2099-01-01T00:00:00Z", max_size_bytes: SOURCE_CODE_MAX_BYTES }, 201);
      if (url === "https://storage.example/upload") return new Response(null, { status: 200 });
      if (String(url).endsWith("/complete")) return response({ id: "upload-1", status: "ready" });
      return response({ submission_id: "submission-55", version: 1, replacement_allowed: true });
    };
    try {
      const result = await uploadSubmissionSourceCode("submission-55", file, { onStage: stage => stages.push(stage) });
      assert.equal(result.submission_id, "submission-55");
      assert.deepEqual(calls.map(({ path, init }) => [path, init.method]), [
        ["/api/v1/files/upload-intents", "POST"], ["/upload", "PUT"], ["/api/v1/files/uploads/upload-1/complete", "POST"], ["/api/v1/submissions/submission-55/source-code", "PUT"],
      ]);
      assert.deepEqual(JSON.parse(calls[0].init.body), { purpose: "submission_source_code", filename: file.name, content_type: type, size_bytes: file.size, checksum_sha256: checksum, context: { submission_id: "submission-55" } });
      assert.deepEqual(calls[1].init.headers, headers);
      assert.equal(calls[1].init.body, file);
      assert.equal(new Headers(calls[1].init.headers).has("Authorization"), false);
      assert.deepEqual(JSON.parse(calls[2].init.body), { checksum_sha256: checksum });
      assert.deepEqual(JSON.parse(calls[3].init.body), { upload_id: "upload-1" });
      for (const index of [0, 2, 3]) assert.equal(calls[index].init.headers.get("Authorization"), "Bearer test-source-token");
      assert.deepEqual(stages, ["hashing", "creating_intent", "uploading", "completing", "attaching"]);
    } finally { globalThis.fetch = originalFetch; }
  });
}

test("an upload that is not ready is never attached to the solution", async () => {
  const originalFetch = globalThis.fetch;
  let attached = false;
  globalThis.fetch = async (url) => {
    if (String(url).includes("upload-intents")) return response({ id: "pending", upload_url: "https://storage.example/upload" }, 201);
    if (url === "https://storage.example/upload") return new Response(null, { status: 200 });
    if (String(url).endsWith("/complete")) return response({ id: "pending", status: "pending" });
    attached = true;
    return response({});
  };
  try {
    await assert.rejects(uploadSubmissionSourceCode("submission-55", new File(["x"], "solution.py")), error => error.code === "UPLOAD_NOT_READY");
    assert.equal(attached, false);
  } finally { globalThis.fetch = originalFetch; }
});

test("expired upload intents are rejected before contacting storage", async () => {
  const originalFetch = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async () => { count++; return response({ id: "expired", upload_url: "https://storage.example/upload", expires_at: "2020-01-01T00:00:00Z" }, 201); };
  try {
    await assert.rejects(uploadSubmissionSourceCode("submission-55", new File(["x"], "solution.py")), error => error.code === "UPLOAD_INTENT_EXPIRED");
    assert.equal(count, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test("attached source retrieval uses authenticated GET and preserves permission metadata", async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url, init) => { urls.push(url); assert.equal(init.headers.get("Authorization"), "Bearer test-source-token"); return response({ replacement_allowed: false, download_url: `https://storage.example/fresh-${urls.length}`, expires_in: 300 }); };
  try {
    const first = await api.submissions.sourceCode("submission-55");
    const second = await api.submissions.sourceCode("submission-55");
    assert.equal(first.replacement_allowed, false);
    assert.notEqual(first.download_url, second.download_url);
    assert.ok(urls.every(url => String(url).endsWith("/api/v1/submissions/submission-55/source-code")));
  } finally { globalThis.fetch = originalFetch; }
});
