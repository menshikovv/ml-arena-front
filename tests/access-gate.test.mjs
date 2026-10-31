import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const file = ts.createSourceFile("App.jsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
const routes = [];
function inspect(node, protectedBranch = false) {
  const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
  if (opening?.tagName.getText(file) === "Route") {
    const attrs = opening.attributes.properties;
    const element = attrs.find((attr) => ts.isJsxAttribute(attr) && attr.name.getText(file) === "element");
    const guarded = protectedBranch || element?.initializer?.getText(file).includes("<ProtectedRoute");
    const path = attrs.find((attr) => ts.isJsxAttribute(attr) && attr.name.getText(file) === "path")?.initializer;
    if (path && ts.isStringLiteral(path)) routes.push({ path: path.text, guarded: Boolean(guarded), element: element?.initializer?.getText(file) });
    ts.forEachChild(node, (child) => inspect(child, Boolean(guarded)));
  } else ts.forEachChild(node, (child) => inspect(child, protectedBranch));
}
inspect(file);

test("only login, disabled registration and account recovery routes are accessible anonymously", () => {
  assert.deepEqual(routes.filter((route) => !route.guarded).map((route) => route.path).sort(), ["/forgot-password", "/login", "/register", "/reset-password", "/verify-email"]);
  assert.match(routes.find((route) => route.path === "/register").element, /Navigate to="\/login"/);
});

test("all content routes, legacy contacts aliases and the fallback require an account", () => {
  for (const path of ["/", "/blog", "/blog/:slug", "/companies", "/support", "/help", "/contacts", "/contacts/cooperation", "/cooperation", "/pricing", "/terms", "/privacy", "/competitions", "/rating", "/profile", "/admin", "*"]) {
    assert.equal(routes.find((route) => route.path === path)?.guarded, true, path);
  }
});
