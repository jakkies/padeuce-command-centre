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
  assert.match(html, /id="courts-page"/);
  assert.match(html, /id="court-detail-panel"/);
  assert.match(html, /data-court-view="map"/);
  assert.match(html, /id="matches-page"/);
  assert.match(html, /id="match-detail-panel"/);
  assert.match(html, /data-match-view="kanban"/);
  assert.match(html, /id="community-page"/);
  assert.match(html, /id="community-detail-panel"/);
  assert.match(html, /data-community-tab="officials"/);
  assert.equal((html.match(/assets\/logo\/padeuce-brandmark\.svg/g) || []).length, 4);
  assert.doesNotMatch(html, /class="brand-mark"/);
  assert.match(html, /type="module" src="\.\/js\/app\.js"/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(html, /\sstyle=/i);
});

test("includes modular court operations data and interactions", async () => {
  const [data, courtsPage, courtCard, courtDetail, viewToggle] = await Promise.all([
    readFile(new URL("js/data.js", root), "utf8"),
    readFile(new URL("js/pages/courts.js", root), "utf8"),
    readFile(new URL("js/components/court-card.js", root), "utf8"),
    readFile(new URL("js/components/court-detail.js", root), "utf8"),
    readFile(new URL("js/components/view-toggle.js", root), "utf8"),
  ]);
  assert.match(data, /export const courtOperationsSeed/);
  assert.match(data, /id: "court-10"/);
  assert.match(viewToggle, /sessionStorage/);
  assert.match(courtsPage, /data-court-form="add"/);
  assert.match(courtCard, /renderCourtMapBlock/);
  assert.match(courtDetail, /Open Match Command Centre/);
});

test("includes 32-match operations data and modular views", async () => {
  const [dataModule, matchesPage, matchRow, matchDetail, app] = await Promise.all([
    import(new URL("js/data.js", root)),
    readFile(new URL("js/pages/matches.js", root), "utf8"),
    readFile(new URL("js/components/match-row.js", root), "utf8"),
    readFile(new URL("js/components/match-detail.js", root), "utf8"),
    readFile(new URL("js/app.js", root), "utf8"),
  ]);
  assert.equal(dataModule.matchOperationsSeed.length, 32);
  assert.match(matchesPage, /padeuce-match-view/);
  assert.match(matchesPage, /data-match-form="pause"/);
  assert.match(matchesPage, /data-match-form="move"/);
  assert.match(matchesPage, /data-match-form="confirm"/);
  assert.match(matchesPage, /data-match-form="cancel"/);
  assert.match(matchRow, /renderTimelineGroup/);
  assert.match(matchRow, /renderKanbanCard/);
  assert.match(matchDetail, /Open Match Command Centre/);
  assert.match(app, /initMatchesScreen/);
});

test("includes modular community directories and workflows", async () => {
  const [dataModule, communityPage, directory, detail, modals, tabs, app] = await Promise.all([
    import(new URL("js/data.js", root)),
    readFile(new URL("js/pages/community.js", root), "utf8"),
    readFile(new URL("js/components/community-directory.js", root), "utf8"),
    readFile(new URL("js/components/community-detail.js", root), "utf8"),
    readFile(new URL("js/components/community-modals.js", root), "utf8"),
    readFile(new URL("js/components/community-tabs.js", root), "utf8"),
    readFile(new URL("js/app.js", root), "utf8"),
  ]);
  assert.equal(dataModule.communityPlayersSeed.length, 20);
  assert.equal(dataModule.communityTeamsSeed.length, 12);
  assert.ok(dataModule.communityCoachesSeed.length >= 3);
  assert.ok(dataModule.communityOfficialsSeed.length >= 5);
  assert.match(communityPage, /padeuce-community-data/);
  assert.match(communityPage, /data-community-form="assignment"/);
  assert.match(directory, /<table class="community-table/);
  assert.match(detail, /Invite to Tournament/);
  assert.match(modals, /Add & Invite/);
  assert.match(modals, /data-community-form="add-team"/);
  assert.match(tabs, /padeuce-community-tab/);
  assert.match(app, /initCommunityScreen/);
});

test("build contains deployable static assets and a worker entrypoint", async () => {
  await Promise.all([
    access(new URL("dist/client/index.html", root)),
    access(new URL("dist/server/index.js", root)),
    access(new URL("dist/.openai/hosting.json", root)),
  ]);
});
