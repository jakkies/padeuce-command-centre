import { matchOperationsSeed } from "../data.js";
import { renderMatchDetail } from "../components/match-detail.js";
import {
  renderKanbanCard,
  renderMatchMobileCard,
  renderMatchRow,
  renderTimelineGroup,
} from "../components/match-row.js";
import {
  escapeMatchMarkup,
  matchStatusLabels,
} from "../components/match-utils.js";

const viewModes = ["table", "timeline", "kanban"];
const wizardSteps = ["Teams", "Tournament", "Court", "Schedule", "Review"];

function savedView() {
  const stored = sessionStorage.getItem("padeuce-match-view");
  return viewModes.includes(stored) ? stored : "table";
}

function qrPattern() {
  const darkCells = new Set([0,1,2,3,4,6,8,9,13,15,16,17,18,22,24,26,27,28,30,32,34,36,37,38,39,40,41,44,45,47,48,50,52,54,56,57,58,60,62,64,66,68,69,70,71,72,73,75,77,78,79,80]);
  return `<div class="prototype-qr" aria-label="Prototype QR code">${Array.from({ length: 81 }, (_, index) => `<i class="${darkCells.has(index) ? "filled" : ""}"></i>`).join("")}</div>`;
}

export function initMatchesScreen(host) {
  const state = {
    matches: structuredClone(matchOperationsSeed),
    selectedId: "match-4",
    view: savedView(),
    quickStatus: "all",
    modalMatchId: null,
    wizardStep: 0,
    routeActive: false,
    initialized: false,
    draggedMatchId: null,
    summary: { total: 32, live: 6, waiting: 8, completed: 14, delayed: 2, issues: 2 },
    draft: {
      tournament: "Challenger 2026",
      round: "Quarter Final",
      court: "Court 5",
      date: "2026-07-28",
      time: "14:00",
      teamA: "",
      teamB: "",
      official: "Amelia Ross",
      notes: "",
    },
  };

  const elements = {
    page: document.querySelector("#matches-page"),
    summary: document.querySelector("#matches-summary"),
    collection: document.querySelector("#match-collection"),
    detail: document.querySelector("#match-detail-panel"),
    count: document.querySelector("#match-results-count"),
    sheet: document.querySelector("#match-detail-sheet"),
    sheetScrim: document.querySelector("#match-sheet-scrim"),
    search: document.querySelector("#match-search"),
    tournament: document.querySelector("#match-tournament-filter"),
    round: document.querySelector("#match-round-filter"),
    court: document.querySelector("#match-court-filter"),
    status: document.querySelector("#match-status-filter"),
    player: document.querySelector("#match-player-filter"),
    date: document.querySelector("#match-date-filter"),
    format: document.querySelector("#match-format-filter"),
    official: document.querySelector("#match-official-filter"),
  };

  function selectedMatch() {
    return state.matches.find((match) => match.id === state.selectedId) || state.matches[0];
  }

  function modalMatch() {
    return state.matches.find((match) => match.id === state.modalMatchId) || selectedMatch();
  }

  function renderSummary() {
    const metrics = [
      ["total", "◎", state.summary.total, "Matches Today", "Across 4 tournaments"],
      ["live", "●", state.summary.live, "Live", "Scoring now"],
      ["waiting", "◷", state.summary.waiting, "Waiting", "Ready or scheduled"],
      ["completed", "✓", state.summary.completed, "Completed", "Results published"],
      ["delayed", "⌛", state.summary.delayed, "Delayed", "Operational holds"],
      ["issues", "!", state.summary.issues, "Issues", "Needs intervention"],
    ];
    elements.summary.innerHTML = metrics.map(([key, icon, value, label, copy]) => `
      <div class="match-summary-metric summary-${key}"><span aria-hidden="true">${icon}</span><div><strong>${value}</strong><b>${label}</b><small>${copy}</small></div></div>
    `).join("");
  }

  function currentFilters() {
    return {
      tournament: elements.tournament.value,
      round: elements.round.value,
      court: elements.court.value,
      status: elements.status.value,
      player: elements.player.value.trim().toLowerCase(),
      date: elements.date.value,
      format: elements.format.value,
      official: elements.official.value,
      search: elements.search.value.trim().toLowerCase(),
    };
  }

  function filteredMatches() {
    const filter = currentFilters();
    return state.matches.filter((match) => {
      const playerHaystack = `${match.teamA.players.join(" ")} ${match.teamB.players.join(" ")} ${match.teamA.short} ${match.teamB.short}`.toLowerCase();
      const searchHaystack = `${match.id} ${match.tournament} ${match.round} ${match.court} ${playerHaystack}`.toLowerCase();
      const status = state.quickStatus !== "all" ? state.quickStatus : filter.status;
      return (filter.tournament === "all" || match.tournament === filter.tournament)
        && (filter.round === "all" || match.round === filter.round)
        && (filter.court === "all" || match.court === filter.court)
        && (status === "all" || match.status === status)
        && (!filter.player || playerHaystack.includes(filter.player))
        && (filter.date === "all" || match.date === filter.date)
        && (filter.format === "all" || match.format === filter.format)
        && (filter.official === "all" || match.official === filter.official)
        && (!filter.search || searchHaystack.includes(filter.search));
    }).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }

  function renderTable(matches) {
    elements.collection.className = "match-collection match-table-view";
    elements.collection.innerHTML = `
      <div class="match-table-header" aria-hidden="true"><span>Status</span><span>Time</span><span>Court</span><span>Tournament</span><span>Round</span><span>Team A</span><span>Score</span><span>Team B</span><span>Duration</span><span>Actions</span></div>
      <div class="desktop-match-rows">${matches.map((match) => renderMatchRow(match, match.id === state.selectedId)).join("")}</div>
      <div class="mobile-match-cards">${matches.map((match) => renderMatchMobileCard(match, match.id === state.selectedId)).join("")}</div>
    `;
  }

  function renderTimeline(matches) {
    const groups = matches.reduce((result, match) => {
      if (!result.has(match.start)) result.set(match.start, []);
      result.get(match.start).push(match);
      return result;
    }, new Map());
    elements.collection.className = "match-collection match-timeline-view";
    elements.collection.innerHTML = [...groups.entries()].map(([time, items]) => renderTimelineGroup(time, items, state.selectedId)).join("");
  }

  function kanbanBucket(match) {
    if (["waiting", "warm-up", "scheduled", "delayed", "paused"].includes(match.status)) return "waiting";
    if (match.status === "live") return "live";
    if (["review", "cancelled"].includes(match.status)) return "review";
    return "completed";
  }

  function renderKanban(matches) {
    const columns = [
      ["waiting", "Waiting", "◷"],
      ["live", "Live", "●"],
      ["review", "Needs Review", "!"],
      ["completed", "Completed", "✓"],
    ];
    elements.collection.className = "match-collection match-kanban-view";
    elements.collection.innerHTML = columns.map(([key, label, icon]) => {
      const items = matches.filter((match) => kanbanBucket(match) === key);
      return `<section class="kanban-column" data-kanban-status="${key}"><header><span>${icon}</span><h3>${label}</h3><b>${items.length}</b></header><div class="kanban-dropzone">${items.map((match) => renderKanbanCard(match, match.id === state.selectedId)).join("") || '<p class="kanban-empty">Drop a match here</p>'}</div></section>`;
    }).join("");
  }

  function renderEmpty() {
    elements.collection.className = "match-collection";
    elements.collection.innerHTML = `<div class="empty-state match-empty-state"><span>◎</span><h3>No matches found.</h3><p>Clear the current filters to return to the full schedule.</p><button class="button secondary" type="button" data-clear-match-filters>Clear filters</button></div>`;
  }

  function renderDetail() {
    const match = selectedMatch();
    elements.detail.innerHTML = renderMatchDetail(match);
    elements.sheet.innerHTML = renderMatchDetail(match, true);
  }

  function updateViewToggle() {
    document.querySelectorAll("[data-match-view]").forEach((button) => {
      const active = button.dataset.matchView === state.view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    sessionStorage.setItem("padeuce-match-view", state.view);
  }

  function render() {
    const matches = filteredMatches();
    elements.count.textContent = `${matches.length} match${matches.length === 1 ? "" : "es"}`;
    updateViewToggle();
    renderSummary();
    renderDetail();
    document.querySelectorAll("[data-match-chip]").forEach((chip) => {
      const active = chip.dataset.matchChip === state.quickStatus;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    if (!matches.length) renderEmpty();
    else if (state.view === "timeline") renderTimeline(matches);
    else if (state.view === "kanban") renderKanban(matches);
    else renderTable(matches);
  }

  function showLoading() {
    elements.collection.className = "match-collection match-loading-grid";
    elements.collection.innerHTML = Array.from({ length: 6 }, () => '<article class="match-card-skeleton"><i></i><i></i><b></b><i></i></article>').join("");
  }

  function clearFilters() {
    [elements.tournament, elements.round, elements.court, elements.status, elements.date, elements.format, elements.official].forEach((control) => { control.value = "all"; });
    elements.player.value = "";
    elements.search.value = "";
    state.quickStatus = "all";
    render();
  }

  function selectMatch(id, openSheet = true) {
    const match = state.matches.find((item) => item.id === id);
    if (!match) return;
    state.selectedId = id;
    render();
    if (openSheet && window.innerWidth < 1200) openMatchSheet();
  }

  function openMatchSheet() {
    elements.sheet.hidden = false;
    elements.sheetScrim.hidden = false;
    document.body.classList.add("match-sheet-open");
    elements.sheet.querySelector("[data-close-match-sheet]")?.focus();
  }

  function closeMatchSheet() {
    if (elements.sheet.hidden) return;
    elements.sheet.hidden = true;
    elements.sheetScrim.hidden = true;
    document.body.classList.remove("match-sheet-open");
    document.querySelector(`[data-match-id="${CSS.escape(state.selectedId)}"]`)?.focus();
  }

  function openQr(match, share = false) {
    state.modalMatchId = match.id;
    const url = `padeuce.live/${match.id}`;
    host.openDialog({
      title: share ? "Share live match" : "Launch mobile scoring",
      body: `<div class="match-qr-dialog">${qrPattern()}<span class="eyebrow electric">${share ? "Public results link" : "Open Padeuce App"}</span><h3>${escapeMatchMarkup(match.teamA.short)} vs ${escapeMatchMarkup(match.teamB.short)}</h3><p>${share ? "Spectators can follow every point live." : "Scan this code with a phone to take control of scoring."}</p><label>Live link<div class="copy-link-field"><input value="https://${url}" readonly><button class="button primary compact" type="button" data-match-modal-action="copy">Copy</button></div></label>${share ? '<button class="button secondary full" type="button" data-match-modal-action="native-share">Share link</button>' : '<button class="button primary full" type="button" data-match-modal-action="open-app">Open Padeuce App</button>'}</div>`,
    });
  }

  function openPause(match) {
    state.modalMatchId = match.id;
    host.openDialog({
      title: "Pause match?",
      body: `<form class="match-modal-form" data-match-form="pause"><p>Live scoring and the match timer will pause immediately.</p><label>Reason<select name="reason"><option>Weather</option><option>Medical</option><option>Equipment</option><option>Other</option></select></label><label>Official notes<textarea name="notes" rows="3" placeholder="Add operational context…"></textarea></label><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Pause Match</button></div></form>`,
    });
  }

  function openMove(match) {
    state.modalMatchId = match.id;
    const courts = ["Court 5", "Court 7", "Court 10"].filter((court) => court !== match.court);
    host.openDialog({
      title: `Move ${match.id.toUpperCase()} to another court`,
      body: `<form class="match-modal-form" data-match-form="move"><div class="move-summary"><span>Current court</span><strong>${escapeMatchMarkup(match.court)}</strong></div><label>Available court<select name="court">${courts.map((court) => `<option>${court}</option>`).join("")}</select></label><label>Reason<select name="reason"><option>Schedule optimisation</option><option>Weather</option><option>Equipment issue</option><option>Official request</option></select></label><label class="check-panel"><input type="checkbox" checked> Notify players and officials</label><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Move Match</button></div></form>`,
    });
  }

  function openReschedule(match) {
    state.modalMatchId = match.id;
    host.openDialog({
      title: `Edit schedule · ${match.id.toUpperCase()}`,
      body: `<form class="match-modal-form" data-match-form="reschedule"><div class="form-grid"><label>Date<input name="date" type="date" value="${escapeMatchMarkup(match.date)}" required></label><label>Start time<input name="time" type="time" value="${escapeMatchMarkup(match.start)}" required></label><label class="span-2">Round<input name="round" value="${escapeMatchMarkup(match.round)}" required></label><label class="span-2">Official<select name="official"><option${match.official === "Amelia Ross" ? " selected" : ""}>Amelia Ross</option><option${match.official === "Noah Williams" ? " selected" : ""}>Noah Williams</option><option${match.official === "Mia Daniels" ? " selected" : ""}>Mia Daniels</option><option${match.official === "Unassigned" ? " selected" : ""}>Unassigned</option></select></label><label class="check-panel span-2"><input type="checkbox" checked> Notify players of schedule changes</label></div><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Update Schedule</button></div></form>`,
    });
  }

  function openConfirm(match) {
    state.modalMatchId = match.id;
    const setA = match.score.setsA.join(",") || "6,6";
    const setB = match.score.setsB.join(",") || "4,3";
    host.openDialog({
      title: `Confirm result · ${match.id.toUpperCase()}`,
      body: `<form class="match-modal-form" data-match-form="confirm"><div class="winner-preview"><span>Winner preview</span><strong>${escapeMatchMarkup(match.teamA.short)}</strong></div><div class="form-grid"><label>Team A set scores<input name="setsA" value="${escapeMatchMarkup(setA)}" required></label><label>Team B set scores<input name="setsB" value="${escapeMatchMarkup(setB)}" required></label><label class="check-panel span-2"><input name="publish" type="checkbox" checked> Publish result publicly</label><label class="check-panel span-2"><input name="notify" type="checkbox" checked> Notify all players</label></div><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Complete Match</button></div></form>`,
    });
  }

  function openCancel(match) {
    state.modalMatchId = match.id;
    host.openDialog({
      title: `Cancel ${match.id.toUpperCase()}?`,
      body: `<form class="match-modal-form" data-match-form="cancel"><div class="cancel-warning"><span>!</span><p>This removes the match from active operations. Its audit history will be retained.</p></div><label>Cancellation reason<select name="reason"><option>Weather</option><option>Player withdrawal</option><option>Court unavailable</option><option>Administrative decision</option></select></label><label>Notes<textarea name="notes" rows="3" required></textarea></label><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Keep Match</button><button class="button danger-button" type="submit">Cancel Match</button></div></form>`,
    });
  }

  function wizardTemplate() {
    return `
      <div class="match-wizard">
        <ol>${wizardSteps.map((step, index) => `<li class="${index === state.wizardStep ? "active" : index < state.wizardStep ? "complete" : ""}"><span>${index < state.wizardStep ? "✓" : index + 1}</span><b>${step}</b></li>`).join("")}</ol>
        <p class="modal-step-title">Step ${state.wizardStep + 1} of 5 · ${wizardSteps[state.wizardStep]}</p>
        <div class="match-wizard-content">${wizardStepContent()}</div>
        <div class="step-actions"><button class="button secondary" type="button" data-match-wizard-back>${state.wizardStep ? "Back" : "Cancel"}</button><button class="button primary" type="button" data-match-wizard-next>${state.wizardStep === 4 ? "Save Match" : "Continue"} <span>→</span></button></div>
      </div>
    `;
  }

  function wizardStepContent() {
    const draft = state.draft;
    if (state.wizardStep === 0) return `<div class="form-grid"><label class="span-2">Team A<input data-match-draft="teamA" value="${escapeMatchMarkup(draft.teamA)}" placeholder="Player / Player" autofocus></label><label class="span-2">Team B<input data-match-draft="teamB" value="${escapeMatchMarkup(draft.teamB)}" placeholder="Player / Player"></label></div>`;
    if (state.wizardStep === 1) return `<div class="form-grid"><label class="span-2">Tournament<select data-match-draft="tournament">${["Challenger 2026", "Schools Cup 2026", "Club Championships", "Winter League"].map((item) => `<option${draft.tournament === item ? " selected" : ""}>${item}</option>`).join("")}</select></label><label class="span-2">Round<input data-match-draft="round" value="${escapeMatchMarkup(draft.round)}"></label></div>`;
    if (state.wizardStep === 2) return `<div class="form-grid"><label class="span-2">Court<select data-match-draft="court">${Array.from({ length: 10 }, (_, index) => `<option${draft.court === `Court ${index + 1}` ? " selected" : ""}>Court ${index + 1}</option>`).join("")}</select></label><label class="span-2">Official<select data-match-draft="official">${["Amelia Ross", "Noah Williams", "Mia Daniels", "Unassigned"].map((item) => `<option${draft.official === item ? " selected" : ""}>${item}</option>`).join("")}</select></label></div>`;
    if (state.wizardStep === 3) return `<div class="form-grid"><label>Date<input data-match-draft="date" type="date" value="${escapeMatchMarkup(draft.date)}"></label><label>Time<input data-match-draft="time" type="time" value="${escapeMatchMarkup(draft.time)}"></label><label class="span-2">Notes<textarea data-match-draft="notes" rows="3">${escapeMatchMarkup(draft.notes)}</textarea></label></div>`;
    return `<div class="match-review"><div><span>Match</span><strong>${escapeMatchMarkup(draft.teamA || "Team A")} vs ${escapeMatchMarkup(draft.teamB || "Team B")}</strong></div><div><span>Tournament</span><strong>${escapeMatchMarkup(draft.tournament)} · ${escapeMatchMarkup(draft.round)}</strong></div><div><span>Court</span><strong>${escapeMatchMarkup(draft.court)}</strong></div><div><span>Schedule</span><strong>${escapeMatchMarkup(draft.date)} at ${escapeMatchMarkup(draft.time)}</strong></div><div><span>Official</span><strong>${escapeMatchMarkup(draft.official)}</strong></div></div>`;
  }

  function openNewMatch() {
    state.wizardStep = 0;
    state.draft.teamA = "";
    state.draft.teamB = "";
    host.openDialog({ title: "Create a new match", body: wizardTemplate(), wide: true });
  }

  function updateWizard() {
    document.querySelector("#modal-body").innerHTML = wizardTemplate();
  }

  function createMatch() {
    const id = `match-${state.matches.length + 4}`;
    const match = {
      id,
      tournament: state.draft.tournament,
      round: state.draft.round,
      court: state.draft.court,
      status: "scheduled",
      start: state.draft.time,
      date: state.draft.date,
      duration: 0,
      format: "Best of 3",
      official: state.draft.official,
      teamA: { players: state.draft.teamA.split("/").map((value) => value.trim()), short: state.draft.teamA || "TBC", seed: 0, club: "TBC", server: false },
      teamB: { players: state.draft.teamB.split("/").map((value) => value.trim()), short: state.draft.teamB || "TBC", seed: 0, club: "TBC", server: false },
      score: { pointsA: "0", pointsB: "0", setsA: [], setsB: [], currentSet: 1 },
      history: [["Now", "Match created"]],
      notes: { tournament: state.draft.notes || "Newly created match.", official: "Pre-match checks pending.", incident: "No incidents." },
    };
    state.matches.push(match);
    state.selectedId = id;
    if (match.date === "2026-07-28") state.summary.total += 1;
    state.summary.waiting += 1;
    host.closeDialog();
    render();
    host.showToast("New match added to the schedule");
    host.announce("New match created successfully");
  }

  function openImport() {
    host.openDialog({
      title: "Import match schedule",
      body: `<form class="match-modal-form" data-match-form="import"><p>Upload a CSV schedule exported from your tournament system.</p><label>Schedule file<input name="schedule" type="file" accept=".csv,.xlsx" required></label><label>Duplicate handling<select name="duplicates"><option>Skip existing matches</option><option>Update existing matches</option></select></label><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Import Schedule</button></div></form>`,
    });
  }

  function handleAction(action, match) {
    state.selectedId = match.id;
    state.modalMatchId = match.id;
    if (action === "select") selectMatch(match.id);
    if (action === "open") host.navigate(`matches/${match.id}`);
    if (action === "mobile") openQr(match);
    if (action === "share") openQr(match, true);
    if (action === "pause") openPause(match);
    if (action === "reschedule") openReschedule(match);
    if (action === "move") openMove(match);
    if (action === "confirm") openConfirm(match);
    if (action === "cancel") openCancel(match);
    if (action === "resume") {
      match.status = "live";
      match.history.push(["Now", "Match resumed"]);
      state.summary.delayed = Math.max(0, state.summary.delayed - 1);
      state.summary.live += 1;
      render();
      host.showToast(`${match.id.toUpperCase()} resumed`);
      host.announce("Match resumed");
    }
    if (action === "start") {
      match.status = "live";
      match.history.push(["Now", "Match started"]);
      state.summary.waiting = Math.max(0, state.summary.waiting - 1);
      state.summary.live += 1;
      render();
      host.showToast(`${match.id.toUpperCase()} is now live`);
      host.announce("Match started");
    }
  }

  function applyForm(form) {
    const match = modalMatch();
    const data = new FormData(form);
    if (form.dataset.matchForm === "pause") {
      match.status = "paused";
      match.notes.incident = `${data.get("reason")} pause · ${data.get("notes") || "No notes"}`;
      match.history.push(["Now", `Match paused · ${data.get("reason")}`]);
      state.summary.live = Math.max(0, state.summary.live - 1);
      state.summary.delayed += 1;
      host.showToast(`${match.id.toUpperCase()} paused`);
    }
    if (form.dataset.matchForm === "move") {
      const previous = match.court;
      match.court = data.get("court");
      match.history.push(["Now", `Moved from ${previous} to ${match.court}`]);
      host.showToast(`Match moved to ${match.court}`);
    }
    if (form.dataset.matchForm === "reschedule") {
      match.date = data.get("date");
      match.start = data.get("time");
      match.round = data.get("round");
      match.official = data.get("official");
      match.history.push(["Now", `Schedule updated · ${match.start}`]);
      host.showToast("Match schedule updated");
    }
    if (form.dataset.matchForm === "confirm") {
      match.status = "completed";
      match.score.setsA = String(data.get("setsA")).split(",").map(Number);
      match.score.setsB = String(data.get("setsB")).split(",").map(Number);
      match.score.pointsA = "FINAL";
      match.score.pointsB = "";
      match.history.push(["Now", "Result confirmed and published"]);
      state.summary.issues = Math.max(0, state.summary.issues - 1);
      state.summary.completed += 1;
      host.showToast("Match result confirmed");
    }
    if (form.dataset.matchForm === "cancel") {
      match.status = "cancelled";
      match.notes.incident = `${data.get("reason")} · ${data.get("notes")}`;
      match.history.push(["Now", `Match cancelled · ${data.get("reason")}`]);
      state.summary.issues += 1;
      host.showToast("Match cancelled");
    }
    if (form.dataset.matchForm === "import") {
      host.closeDialog();
      host.showToast("Schedule imported successfully");
      return;
    }
    host.closeDialog();
    render();
    host.announce(`${match.id.toUpperCase()} updated`);
  }

  function populateFilters() {
    const fill = (element, values) => {
      const current = element.value || "all";
      element.innerHTML = '<option value="all">All</option>' + [...new Set(values)].sort().map((value) => `<option>${escapeMatchMarkup(value)}</option>`).join("");
      element.value = [...element.options].some((option) => option.value === current) ? current : "all";
    };
    fill(elements.tournament, state.matches.map((match) => match.tournament));
    fill(elements.round, state.matches.map((match) => match.round));
    fill(elements.court, state.matches.map((match) => match.court));
    fill(elements.format, state.matches.map((match) => match.format));
    fill(elements.official, state.matches.map((match) => match.official));
  }

  function bindEvents() {
    [elements.tournament, elements.round, elements.court, elements.status, elements.date, elements.format, elements.official].forEach((control) => control.addEventListener("change", render));
    [elements.player, elements.search].forEach((control) => control.addEventListener("input", render));
    elements.page.addEventListener("click", (event) => {
      const view = event.target.closest("[data-match-view]");
      if (view) {
        state.view = view.dataset.matchView;
        render();
        return;
      }
      const chip = event.target.closest("[data-match-chip]");
      if (chip) {
        state.quickStatus = state.quickStatus === chip.dataset.matchChip ? "all" : chip.dataset.matchChip;
        elements.status.value = "all";
        render();
        return;
      }
      if (event.target.closest("[data-clear-match-filters]")) {
        clearFilters();
        return;
      }
      const more = event.target.closest("[data-match-more]");
      if (more) {
        const menu = document.querySelector(`[data-match-menu="${CSS.escape(more.dataset.matchMore)}"]`);
        const open = menu.hidden;
        document.querySelectorAll("[data-match-menu]").forEach((item) => { item.hidden = true; });
        menu.hidden = !open;
        more.setAttribute("aria-expanded", String(open));
        return;
      }
      const action = event.target.closest("[data-match-action]");
      if (action) {
        const match = state.matches.find((item) => item.id === action.dataset.match);
        if (match) handleAction(action.dataset.matchAction, match);
        return;
      }
      const selectable = event.target.closest("[data-match-id]");
      if (selectable) selectMatch(selectable.dataset.matchId);
    });
    elements.page.addEventListener("keydown", (event) => {
      const selectable = event.target.closest("[data-match-id]");
      if (selectable && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        selectMatch(selectable.dataset.matchId);
      }
    });
    elements.collection.addEventListener("dragstart", (event) => {
      state.draggedMatchId = event.target.closest("[data-match-id]")?.dataset.matchId || null;
    });
    elements.collection.addEventListener("dragover", (event) => {
      if (event.target.closest("[data-kanban-status]")) event.preventDefault();
    });
    elements.collection.addEventListener("drop", (event) => {
      event.preventDefault();
      const column = event.target.closest("[data-kanban-status]");
      const match = state.matches.find((item) => item.id === state.draggedMatchId);
      if (!column || !match) return;
      match.status = { waiting: "waiting", live: "live", review: "review", completed: "completed" }[column.dataset.kanbanStatus];
      match.history.push(["Now", `Moved to ${matchStatusLabels[match.status]}`]);
      render();
      host.showToast(`${match.id.toUpperCase()} moved to ${matchStatusLabels[match.status]}`);
    });
    document.querySelector("#new-match-button").addEventListener("click", openNewMatch);
    document.querySelector("#generate-round-button").addEventListener("click", () => host.showToast("Next round generated with 8 matches"));
    document.querySelector("#import-schedule-button").addEventListener("click", openImport);
    document.querySelector("#export-matches-button").addEventListener("click", () => host.showToast("Match schedule exported"));
    document.querySelector("#match-filter-toggle").addEventListener("click", () => document.querySelector("#match-filter-grid").classList.toggle("expanded"));
    elements.sheetScrim.addEventListener("click", closeMatchSheet);
    elements.sheet.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-match-sheet]")) {
        event.stopPropagation();
        closeMatchSheet();
        return;
      }
      const action = event.target.closest("[data-match-action]");
      if (action) {
        event.stopPropagation();
        const match = state.matches.find((item) => item.id === action.dataset.match);
        if (match) handleAction(action.dataset.matchAction, match);
      }
    });
    document.addEventListener("click", (event) => {
      const modalAction = event.target.closest("[data-match-modal-action]");
      if (modalAction) {
        if (modalAction.dataset.matchModalAction === "copy") host.showToast("Live link copied");
        if (modalAction.dataset.matchModalAction === "native-share") host.showToast("Share options opened");
        if (modalAction.dataset.matchModalAction === "open-app") host.showToast("Padeuce App opened");
      }
      if (event.target.closest("[data-match-wizard-back]")) {
        if (!state.wizardStep) host.closeDialog();
        else {
          state.wizardStep -= 1;
          updateWizard();
        }
      }
      if (event.target.closest("[data-match-wizard-next]")) {
        if (state.wizardStep < 4) {
          state.wizardStep += 1;
          updateWizard();
        } else createMatch();
      }
    });
    document.addEventListener("input", (event) => {
      const field = event.target.closest("[data-match-draft]");
      if (field) state.draft[field.dataset.matchDraft] = field.value;
    });
    document.addEventListener("change", (event) => {
      const field = event.target.closest("[data-match-draft]");
      if (field) state.draft[field.dataset.matchDraft] = field.value;
    });
    document.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-match-form]");
      if (!form) return;
      event.preventDefault();
      applyForm(form);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.sheet.hidden) {
        event.preventDefault();
        closeMatchSheet();
      }
      if (event.key !== "Tab" || elements.sheet.hidden) return;
      const focusable = [...elements.sheet.querySelectorAll("button, input, select, textarea, a[href]")].filter((item) => !item.disabled && !item.hidden);
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault();
        focusable[0].focus();
      }
    });
  }

  function selectFromRoute(id) {
    if (state.matches.some((match) => match.id === id)) state.selectedId = id;
  }

  function activate(routeId = "") {
    state.routeActive = true;
    if (routeId) selectFromRoute(routeId);
    if (!state.initialized) {
      state.initialized = true;
      showLoading();
      window.setTimeout(render, 260);
    } else render();
  }

  function deactivate() {
    state.routeActive = false;
    closeMatchSheet();
  }

  populateFilters();
  bindEvents();
  renderSummary();
  renderDetail();
  return { activate, deactivate, render, selectFromRoute };
}
