import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships semantic static HTML with external assets", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<main class="login-page">/);
  assert.match(html, /id="today-page"/);
  assert.match(html, /id="competitions-page"/);
  assert.match(html, /type="module" src="\.\/js\/app\.js"/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(html, /\sstyle=/i);
});

test("build contains deployable static assets and a worker entrypoint", async () => {
  await Promise.all([
    access(new URL("dist/client/index.html", root)),
    access(new URL("dist/server/index.js", root)),
    access(new URL("dist/.openai/hosting.json", root)),
  ]);
});
