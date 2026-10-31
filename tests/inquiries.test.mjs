import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { INQUIRY_STATUSES, INQUIRY_TYPES, inquiryAttempt, inquiryError, inquirySource } from "../src/lib/inquiries.js";

let server;
let api;
let client;
let AdminInquiries;
let InquiryFields;

before(async () => {
  globalThis.window = { self: null, top: null };
  server = await createServer({ configFile: false, esbuild: { jsx: "automatic" }, resolve: { alias: { "@": new URL("../src", import.meta.url).pathname.replace(/^\/([A-Z]:)/i, "$1") } }, cacheDir: "node_modules/.vite-tests/inquiries", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  ({ api } = await server.ssrLoadModule("/src/api/mlArenaApi.js"));
  client = await server.ssrLoadModule("/src/api/client.js");
  ({ default: AdminInquiries, InquiryFields } = await server.ssrLoadModule("/src/components/ml/AdminInquiries.jsx"));
});
after(async () => { client?.clearAccessToken(); await server?.close(); delete globalThis.window; });

test("all intake forms have distinct types and workflow labels", () => {
  assert.deepEqual(Object.keys(INQUIRY_TYPES), ["support", "cooperation", "competition_request"]);
  assert.deepEqual(Object.keys(INQUIRY_STATUSES), ["new", "in_progress", "resolved", "rejected"]);
});

test("retry keeps its idempotency key and changed fields get a new key", () => {
  const ref = { current: null };
  const body = { subject: "test", message: "private text" };
  const first = inquiryAttempt(ref, body);
  assert.equal(inquiryAttempt(ref, { ...body }), first);
  assert.notEqual(inquiryAttempt(ref, { ...body, message: "edited" }), first);
  assert.match(first, /^[0-9a-f-]{36}$/i);
});

test("source metadata excludes full referrer query and fragment", () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = { location: { pathname: "/support", search: "?token=secret&utm_source=test" } };
  globalThis.document = { referrer: "https://example.com/page?private=secret#secret" };
  try {
    assert.deepEqual(inquirySource(), { landing_path: "/support", referrer: "https://example.com/page", utm_source: "test", utm_medium: null, utm_campaign: null });
  } finally { globalThis.window = previousWindow; globalThis.document = previousDocument; }
});

test("missing backend, conflicts, validation and rate limits have localizable errors", () => {
  assert.match(inquiryError({ status: 404 }), /недоступен/);
  assert.match(inquiryError({ status: 429 }), /Подождите/);
  assert.match(inquiryError({ status: 422 }), /Проверьте/);
  assert.match(inquiryError({ code: "inquiry_version_conflict" }), /другой сотрудник/);
  assert.match(inquiryError({ code: "inquiry_receipt_missing" }), /не подтвердил/);
});

async function withFetch(handler, run) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try { await run(); } finally { globalThis.fetch = original; client.clearAccessToken(); }
}

test("support and both lead types send auth, consent and idempotency and return receipts", async () => {
  const requests = [];
  await withFetch(async (url, init) => {
    requests.push({ path: new URL(url, "http://localhost").pathname, ...init });
    return new Response(JSON.stringify({ data: { id: "saved-id", status: "new", created_at: "2026-10-31T12:00:00Z" } }), { status: 201 });
  }, async () => {
    client.setAccessToken("test-token");
    const source = { landing_path: "/support" };
    const support = { category: "technical", subject: "Ошибка", message: "Достаточно подробное описание ошибки", reply_email: "test@example.com", consent_privacy: true, consent_document_version: "2026-08-14", source };
    assert.equal((await api.support.createRequest(support, "stable-key")).id, "saved-id");
    await api.cooperation.createLead({ request_type: "cooperation", consent_privacy: true }, "company-key");
    await api.cooperation.createLead({ request_type: "competition_request", consent_privacy: true }, "competition-key");
    assert.deepEqual(requests.map((request) => request.path), ["/api/v1/support/requests", "/api/v1/cooperation/leads", "/api/v1/cooperation/leads"]);
    assert.deepEqual(JSON.parse(requests[0].body), support);
    for (const request of requests) {
      assert.equal(request.method, "POST");
      assert.equal(request.headers.get("Authorization"), "Bearer test-token");
      assert.ok(request.headers.get("Idempotency-Key"));
    }
  });
});

test("a successful HTTP response without a saved receipt is not considered success", async () => {
  await withFetch(async () => new Response(JSON.stringify({ data: {} }), { status: 200 }), async () => {
    await assert.rejects(api.support.createRequest({}, "key"), (error) => error.code === "inquiry_receipt_missing");
    await assert.rejects(api.cooperation.createLead({}, "key"), (error) => error.code === "inquiry_receipt_missing");
  });
});

test("missing backend propagates a failure rather than creating a local submission", async () => {
  await withFetch(async () => new Response(JSON.stringify({ error: { code: "not_found" } }), { status: 404 }), async () => {
    await assert.rejects(api.support.createRequest({}, "key"), (error) => error.status === 404);
  });
});

test("admin list preserves pagination envelope and sends filters", async () => {
  await withFetch(async (url) => {
    const parsed = new URL(url, "http://localhost");
    assert.equal(parsed.pathname, "/api/v1/admin/inquiries");
    assert.equal(parsed.searchParams.get("kind"), "support");
    assert.equal(parsed.searchParams.get("status"), "in_progress");
    assert.equal(parsed.searchParams.get("offset"), "20");
    assert.equal(parsed.searchParams.get("q"), "test@example.com");
    return new Response(JSON.stringify({ data: [], meta: { total: 40, has_more: false } }));
  }, async () => {
    assert.deepEqual(await api.admin.inquiries({ kind: "support", status: "in_progress", q: "test@example.com", limit: 20, offset: 20 }), { data: [], meta: { total: 40, has_more: false } });
  });
});

test("admin patch passes server version and only changes processing fields", async () => {
  const payload = { status: "resolved", internal_note: "Связались с участником", version: 3 };
  await withFetch(async (url, init) => {
    assert.equal(new URL(url, "http://localhost").pathname, "/api/v1/admin/inquiries/inquiry-id");
    assert.equal(init.method, "PATCH");
    assert.deepEqual(JSON.parse(init.body), payload);
    return new Response(JSON.stringify({ error: { code: "inquiry_version_conflict" } }), { status: 409 });
  }, async () => {
    await assert.rejects(api.admin.updateInquiry("inquiry-id", payload), (error) => error.code === "inquiry_version_conflict");
  });
});

test("queue is not rendered without read permission", () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const html = renderToStaticMarkup(createElement(QueryClientProvider, { client: cache }, createElement(AdminInquiries, { permissions: new Set(["inquiries.manage"]) })));
  assert.equal(html, "");
  cache.clear();
});

test("inquiry details escape user markup and show contacts, source and consent", () => {
  const html = renderToStaticMarkup(createElement(InquiryFields, { item: { kind: "support", category: "technical", email: "test@example.com", message: "<script>alert(1)</script>", consent_privacy: true, consent_marketing: false, source: { landing_path: "/support" } } }));
  assert.ok(!html.includes("<script>"));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Техническая проблема/);
  assert.match(html, /mailto:test@example.com/);
  assert.match(html, /Без согласия/);
  assert.match(html, /\/support/);
});
