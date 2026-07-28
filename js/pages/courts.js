import { courtOperationsSeed } from "../data.js";
import {
  renderCourtCard,
  renderCourtListRow,
  renderCourtMapBlock,
  renderCourtSkeletons,
} from "../components/court-card.js";
import { renderCourtDetail } from "../components/court-detail.js";
import { courtStatusLabels, escapeMarkup } from "../components/court-utils.js";
import { initialCourtView, updateViewToggle } from "../components/view-toggle.js";

const zones = ["Main Courts", "Outdoor Courts", "Academy Courts"];

export function initCourtsScreen(host) {
  const state = {
    courts: structuredClone(courtOperationsSeed),
    selectedId: "court-1",
    view: initialCourtView(),
    summary: {
      total: 10,
      live: 4,
      waiting: 2,
      delayed: 1,
      offline: 1,
      available: 2,
    },
    modalCourtId: null,
    initialized: false,
    timer: null,
  };

  const elements = {
    page: document.querySelector("#courts-page"),
    summary: document.querySelector("#courts-summary"),
    collection: document.querySelector("#court-collection"),
    detail: document.querySelector("#court-detail-panel"),
    count: document.querySelector("#court-results-count"),
    search: document.querySelector("#court-search"),
    status: document.querySelector("#court-status-filter"),
    zone: document.querySelector("#court-zone-filter"),
    sort: document.querySelector("#court-sort"),
    sheet: document.querySelector("#court-detail-sheet"),
    sheetScrim: document.querySelector("#court-sheet-scrim"),
  };

  function selectedCourt() {
    return state.courts.find((court) => court.id === state.selectedId) || state.courts[0];
  }

  function renderSummary() {
    const metrics = [
      ["total", "▦", state.summary.total, "Total Courts", "Across 3 zones"],
      ["live", "●", state.summary.live, "Live", "Scoring now"],
      ["waiting", "◷", state.summary.waiting, "Waiting", "Players ready"],
      ["delayed", "!", state.summary.delayed, "Delayed", "Needs attention"],
      ["offline", "×", state.summary.offline, "Offline", "Device issue"],
      ["available", "✓", state.summary.available, "Available", "Ready to assign"],
    ];
    elements.summary.innerHTML = metrics.map(([key, icon, value, label, detail]) => `
      <div class="court-summary-metric metric-${key}">
        <span class="court-summary-icon" aria-hidden="true">${icon}</span>
        <div><strong>${value}</strong><b>${label}</b><small>${detail}</small></div>
      </div>
    `).join("");
  }

  function filters() {
    return {
      search: elements.search.value.trim().toLowerCase(),
      status: elements.status.value,
      zone: elements.zone.value,
      sort: elements.sort.value,
    };
  }

  function filteredCourts() {
    const current = filters();
    const result = state.courts.filter((court) =>
      (current.status === "all" || court.status === current.status)
      && (current.zone === "all" || court.zone === current.zone)
      && `${court.name} ${court.zone} ${court.currentMatch?.teamA || ""} ${court.currentMatch?.teamB || ""}`.toLowerCase().includes(current.search)
    );
    return result.sort((a, b) => {
      if (current.sort === "status") return a.status.localeCompare(b.status);
      if (current.sort === "zone") return a.zone.localeCompare(b.zone) || a.number - b.number;
      return a.number - b.number;
    });
  }

  function renderGrid(courts) {
    elements.collection.className = "court-collection court-grid-view";
    elements.collection.innerHTML = courts.map((court) => renderCourtCard(court, court.id === state.selectedId)).join("");
  }

  function renderList(courts) {
    elements.collection.className = "court-collection court-list-view";
    elements.collection.innerHTML = `
      <div class="court-list-header" aria-hidden="true"><span>Court</span><span>Status</span><span>Current Match</span><span>Score</span><span>Duration</span><span>Next Match</span><span>Device</span><span>Actions</span></div>
      ${courts.map((court) => renderCourtListRow(court, court.id === state.selectedId)).join("")}
    `;
  }

  function renderMap(courts) {
    elements.collection.className = "court-collection court-map-view";
    elements.collection.innerHTML = `
      <div class="facility-map">
        <div class="map-key"><span><i class="key-live"></i>Live</span><span><i class="key-waiting"></i>Waiting</span><span><i class="key-available"></i>Available</span><span><i class="key-issue"></i>Attention</span></div>
        ${zones.map((zone) => {
          const zoneCourts = courts.filter((court) => court.zone === zone);
          if (!zoneCourts.length) return "";
          return `<section class="court-map-zone"><div class="map-zone-heading"><span>${zone === "Main Courts" ? "01" : zone === "Outdoor Courts" ? "02" : "03"}</span><div><h3>${zone}</h3><p>${zoneCourts.length} courts · ${zone === "Outdoor Courts" ? "Weather monitored" : "Indoor climate controlled"}</p></div></div><div class="map-court-row">${zoneCourts.map((court) => renderCourtMapBlock(court, court.id === state.selectedId)).join("")}</div></section>`;
        }).join("")}
      </div>
    `;
  }

  function renderEmpty() {
    elements.collection.className = "court-collection";
    elements.collection.innerHTML = `<div class="empty-state court-empty-state"><span>▦</span><h3>No courts match these filters.</h3><p>Clear filters to see all courts.</p><button class="button secondary" type="button" data-clear-court-filters>Clear filters</button></div>`;
  }

  function renderError() {
    elements.collection.className = "court-collection";
    elements.collection.innerHTML = `<div class="empty-state court-error-state"><span>!</span><h3>Court data could not be loaded.</h3><p>The live court feed is temporarily unavailable.</p><button class="button secondary" type="button" data-court-retry>Try Again</button></div>`;
  }

  function renderDetail() {
    const court = selectedCourt();
    elements.detail.innerHTML = renderCourtDetail(court);
    elements.sheet.innerHTML = renderCourtDetail(court, true);
  }

  function render() {
    try {
      const courts = filteredCourts();
      elements.count.textContent = `${courts.length} court${courts.length === 1 ? "" : "s"}`;
      document.querySelector("#clear-court-filters").hidden = !(
        elements.search.value || elements.status.value !== "all" || elements.zone.value !== "all"
      );
      updateViewToggle(state.view);
      renderSummary();
      renderDetail();
      if (!courts.length) renderEmpty();
      else if (state.view === "list") renderList(courts);
      else if (state.view === "map") renderMap(courts);
      else renderGrid(courts);
    } catch {
      renderError();
    }
  }

  function showLoading() {
    elements.collection.className = "court-collection court-grid-view";
    elements.collection.innerHTML = renderCourtSkeletons();
  }

  function clearFilters() {
    elements.search.value = "";
    elements.status.value = "all";
    elements.zone.value = "all";
    render();
  }

  function selectCourt(id, openSheet = true) {
    const court = state.courts.find((item) => item.id === id);
    if (!court) return;
    state.selectedId = id;
    render();
    if (openSheet && window.innerWidth < 1200) openCourtSheet();
  }

  function openCourtSheet() {
    elements.sheet.hidden = false;
    elements.sheetScrim.hidden = false;
    document.body.classList.add("sheet-open");
    elements.sheet.querySelector("[data-close-court-sheet]")?.focus();
  }

  function closeCourtSheet() {
    if (elements.sheet.hidden) return;
    elements.sheet.hidden = true;
    elements.sheetScrim.hidden = true;
    document.body.classList.remove("sheet-open");
    document.querySelector(`[data-court-id="${CSS.escape(state.selectedId)}"]`)?.focus();
  }

  function currentModalCourt() {
    return state.courts.find((court) => court.id === state.modalCourtId) || selectedCourt();
  }

  function openStartMatch(court) {
    state.modalCourtId = court.id;
    host.openDialog({
      title: `Start match on ${court.name}?`,
      body: `<div class="court-action-dialog"><span class="confirm-icon">▶</span><div class="dialog-matchup"><strong>${escapeMarkup(court.currentMatch.teamA)}</strong><span>vs</span><strong>${escapeMarkup(court.currentMatch.teamB)}</strong></div><p>All players are checked in. The match clock and live scoring feed will start immediately.</p><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="button" data-court-modal-submit="start">Start Match</button></div></div>`,
    });
  }

  function openResultConfirmation(court) {
    state.modalCourtId = court.id;
    host.openDialog({
      title: `Confirm result · ${court.name}`,
      body: `<form class="court-modal-form" data-court-form="result"><div class="result-confirm-score"><span><small>Winner</small><strong>${escapeMarkup(court.currentMatch.winner)}</strong></span><b>${escapeMarkup(court.currentMatch.scoreA)}</b></div><div class="form-grid"><label class="span-2">Set scores<input value="${escapeMarkup(court.currentMatch.scoreA)}" required></label><label class="check-panel span-2"><input name="publish" type="checkbox" checked> Publish result to the public tournament page</label><label class="check-panel span-2"><input name="notify" type="checkbox" checked> Notify all players</label></div><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Confirm Result</button></div></form>`,
    });
  }

  function openDelayUpdate(court) {
    state.modalCourtId = court.id;
    host.openDialog({
      title: `Update delay · ${court.name}`,
      body: `<form class="court-modal-form" data-court-form="delay"><div class="form-grid"><label class="span-2">Delay reason<select name="reason"><option${court.delay?.reason === "Rain" ? " selected" : ""}>Rain</option><option>Medical timeout</option><option>Technical issue</option><option>Official review</option></select></label><label>Estimated resume time<input name="resume" type="time" value="${escapeMarkup(court.delay?.estimatedResume || "13:15")}" required></label><label>Delay duration<input name="duration" type="number" min="1" value="${court.delay?.durationMinutes || 10}"></label><label class="span-2">Court notes<textarea name="notes" rows="3">${escapeMarkup(court.notes)}</textarea></label><label class="check-panel span-2"><input name="notify" type="checkbox" checked> Notify affected players</label></div><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Update Delay</button></div></form>`,
    });
  }

  function openAssignMatch(court) {
    state.modalCourtId = court.id;
    host.openDialog({
      title: `Assign match to ${court.name}`,
      body: `<form class="court-modal-form" data-court-form="assign"><div class="available-match-list"><label class="available-match-option"><input type="radio" name="match" value="R / S|M / D|Schools Cup 2026" checked><span><strong>R / S vs M / D</strong><small>Schools Cup 2026 · Group B</small></span><b>13:00</b></label><label class="available-match-option"><input type="radio" name="match" value="F / A|R / T|Challenger 2026"><span><strong>F / A vs R / T</strong><small>Challenger 2026 · Round 2</small></span><b>13:20</b></label><label class="available-match-option"><input type="radio" name="match" value="N / K|W / H|Schools Cup 2026"><span><strong>N / K vs W / H</strong><small>Schools Cup 2026 · Group A</small></span><b>13:40</b></label></div><label class="modal-field">Start time<input name="time" type="time" value="13:00" required></label><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Assign Match</button></div></form>`,
    });
  }

  function openMoveMatch(court) {
    state.modalCourtId = court.id;
    const available = state.courts.filter((item) => item.status === "available" && item.id !== court.id);
    host.openDialog({
      title: `Move match from ${court.name}`,
      body: `<form class="court-modal-form" data-court-form="move"><p class="modal-supporting-copy">Select an available destination court. Players and officials will be notified.</p><div class="move-court-list">${available.map((item, index) => `<label><input type="radio" name="destination" value="${escapeMarkup(item.id)}"${index === 0 ? " checked" : ""}><span><strong>${escapeMarkup(item.name)}</strong><small>${escapeMarkup(item.zone)} · ${escapeMarkup(item.surfaceCondition)}</small></span>${courtStatusBadgeText(item.status)}</label>`).join("") || '<div class="court-detail-empty"><strong>No courts available</strong><p>Resolve an active court issue first.</p></div>'}</div><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit"${available.length ? "" : " disabled"}>Move Match</button></div></form>`,
    });
  }

  function openAddCourt() {
    state.modalCourtId = null;
    host.openDialog({
      title: "Add a new court",
      wide: true,
      body: `<form class="court-modal-form" data-court-form="add"><div class="form-grid"><label class="span-2">Court name<input name="name" placeholder="e.g. Court 11" required autofocus></label><label>Zone<select name="zone"><option>Main Courts</option><option>Outdoor Courts</option><option>Academy Courts</option></select></label><label>Surface<select name="surface"><option>Artificial turf</option><option>Panoramic turf</option><option>Textured turf</option></select></label><label>Environment<select name="environment"><option>Indoor</option><option>Outdoor</option></select></label><label>Initial status<select name="status"><option value="available">Available</option><option value="maintenance">Maintenance</option><option value="offline">Offline</option></select></label><label>Scoring device ID<input name="deviceId" placeholder="PAD-SCR-011"></label><label>Display device ID<input name="displayId" placeholder="PAD-DSP-011"></label></div><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Add Court</button></div></form>`,
    });
  }

  function openOfficialRequest(court) {
    state.modalCourtId = court.id;
    host.openDialog({
      title: `Call an official to ${court.name}?`,
      body: `<div class="court-action-dialog"><span class="confirm-icon">!</span><p>The nearest available tournament official will be notified with the court and match details.</p><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="button" data-court-modal-submit="official">Request Official</button></div></div>`,
    });
  }

  function openIssue(court) {
    state.modalCourtId = court.id;
    host.openDialog({
      title: `${court.name} maintenance issue`,
      body: `<div class="maintenance-dialog"><span class="incident-icon">!</span><h3>${escapeMarkup(court.issue?.title || "Maintenance issue")}</h3><div class="incident-grid"><div><span>Reported</span><strong>${escapeMarkup(court.issue?.reportedAt || "—")}</strong></div><div><span>Expected return</span><strong>${escapeMarkup(court.issue?.expectedResolution || "—")}</strong></div></div><p>${escapeMarkup(court.notes)}</p><button class="button primary full" type="button" data-toast="Maintenance workflow opened">Open maintenance workflow</button></div>`,
    });
  }

  function openPause(court) {
    state.modalCourtId = court.id;
    host.openDialog({
      title: `Pause match on ${court.name}?`,
      body: `<div class="court-action-dialog"><span class="confirm-icon">Ⅱ</span><p>The live timer and scoring controls will be paused until an official resumes the match.</p><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="button" data-court-modal-submit="pause">Pause Match</button></div></div>`,
    });
  }

  function handleCourtAction(action, court) {
    state.selectedId = court.id;
    if (action === "select") {
      selectCourt(court.id);
      return;
    }
    if (action === "open-match") {
      host.navigate(`matches/${court.currentMatch?.id || "match-command-centre"}`);
      return;
    }
    if (action === "start-match") openStartMatch(court);
    if (action === "confirm-result") openResultConfirmation(court);
    if (action === "update-delay") openDelayUpdate(court);
    if (action === "assign-match") openAssignMatch(court);
    if (action === "move-match") openMoveMatch(court);
    if (action === "call-official") openOfficialRequest(court);
    if (action === "view-issue") openIssue(court);
    if (action === "pause-match") openPause(court);
    if (action === "edit") host.showToast(`${court.name} editor opened`);
    if (action === "share") host.showToast(`Live link for ${court.name} copied`);
    if (action === "reconnect") reconnectCourt(court);
  }

  function reconnectCourt(court) {
    if (court.reconnecting) return;
    court.reconnecting = true;
    render();
    host.announce(`Reconnecting ${court.name}`);
    window.setTimeout(() => {
      court.reconnecting = false;
      court.status = "available";
      court.deviceStatus = "connected";
      court.displayStatus = "connected";
      court.lastSync = "Just now";
      state.summary.offline = Math.max(0, state.summary.offline - 1);
      state.summary.available += 1;
      render();
      host.showToast(`${court.name} reconnected and is now available`);
      host.announce(`${court.name} reconnected successfully`);
    }, 1050);
  }

  function startMatch(court) {
    court.status = "live";
    court.currentMatch.setLabel = "Set 1";
    court.currentMatch.gameLabel = "Game 1";
    court.currentMatch.durationMinutes = 0;
    court.lastSync = "Just now";
    state.summary.waiting = Math.max(0, state.summary.waiting - 1);
    state.summary.live += 1;
    host.closeDialog();
    render();
    closeCourtSheet();
    host.showToast(`Match started on ${court.name}`);
    host.announce(`${court.name} is now live`);
    window.clearInterval(state.timer);
    state.timer = window.setInterval(() => {
      if (court.status === "live") {
        court.currentMatch.durationMinutes += 1;
        if (state.routeActive) render();
      }
    }, 60000);
  }

  function confirmResult(court) {
    court.status = "available";
    court.currentMatch = null;
    court.lastSync = "Just now";
    state.summary.available += 1;
    host.closeDialog();
    render();
    host.showToast(`Result confirmed and published from ${court.name}`);
    host.announce(`${court.name} result confirmed`);
  }

  function updateDelay(court, form) {
    const data = new FormData(form);
    court.status = "delayed";
    court.delay = {
      reason: data.get("reason"),
      durationMinutes: Number(data.get("duration")),
      estimatedResume: data.get("resume"),
    };
    court.notes = data.get("notes");
    host.closeDialog();
    render();
    host.showToast(`${court.name} delay updated`);
    host.announce(`${court.name} delay information updated`);
  }

  function assignMatch(court, form) {
    const data = new FormData(form);
    const [teamA, teamB, tournament] = String(data.get("match")).split("|");
    court.status = "waiting";
    court.currentMatch = {
      id: `match-${Date.now()}`,
      tournament,
      round: "Upcoming",
      matchNumber: "New assignment",
      teamA,
      teamB,
      scoreA: "0",
      scoreB: "0",
      setLabel: `Starts at ${data.get("time")}`,
      gameLabel: "Check-in pending",
      server: "To be decided",
      durationMinutes: 0,
    };
    state.summary.available = Math.max(0, state.summary.available - 1);
    state.summary.waiting += 1;
    host.closeDialog();
    render();
    host.showToast(`Match assigned to ${court.name}`);
    host.announce(`New match assigned to ${court.name}`);
  }

  function moveMatch(court, form) {
    const destinationId = new FormData(form).get("destination");
    const destination = state.courts.find((item) => item.id === destinationId);
    if (!destination) return;
    destination.currentMatch = court.currentMatch;
    destination.status = court.status === "live" ? "live" : "waiting";
    court.currentMatch = null;
    court.status = "available";
    state.selectedId = destination.id;
    host.closeDialog();
    render();
    host.showToast(`Match moved to ${destination.name}`);
    host.announce(`Match moved from ${court.name} to ${destination.name}`);
  }

  function addCourt(form) {
    const data = new FormData(form);
    const nextNumber = Math.max(...state.courts.map((court) => court.number)) + 1;
    const status = data.get("status");
    const court = {
      id: `court-${nextNumber}`,
      number: nextNumber,
      name: data.get("name"),
      zone: data.get("zone"),
      status,
      surface: data.get("surface"),
      surfaceCondition: "Good",
      lighting: "Good",
      environment: data.get("environment"),
      deviceStatus: status === "offline" ? "offline" : "connected",
      displayStatus: status === "offline" ? "offline" : "connected",
      deviceId: data.get("deviceId") || `PAD-SCR-${String(nextNumber).padStart(3, "0")}`,
      displayId: data.get("displayId") || `PAD-DSP-${String(nextNumber).padStart(3, "0")}`,
      lastSync: "Just now",
      notes: "Newly added court.",
      currentMatch: null,
      nextMatch: null,
    };
    state.courts.push(court);
    state.summary.total += 1;
    if (status in state.summary) state.summary[status] += 1;
    state.selectedId = court.id;
    host.closeDialog();
    render();
    host.showToast(`${court.name} added successfully`);
    host.announce(`${court.name} added to ${court.zone}`);
  }

  function bindEvents() {
    [elements.search, elements.status, elements.zone, elements.sort].forEach((control) => {
      control.addEventListener(control.tagName === "INPUT" ? "input" : "change", render);
    });
    document.querySelector("#courts-page").addEventListener("click", (event) => {
      const view = event.target.closest("[data-court-view]");
      if (view) {
        state.view = view.dataset.courtView;
        render();
        return;
      }
      const clear = event.target.closest("[data-clear-court-filters]");
      if (clear) {
        clearFilters();
        return;
      }
      if (event.target.closest("[data-court-retry]")) {
        showLoading();
        window.setTimeout(render, 320);
        return;
      }
      const more = event.target.closest("[data-court-more]");
      if (more) {
        const menu = document.querySelector(`[data-court-menu="${CSS.escape(more.dataset.courtMore)}"]`);
        const open = menu.hidden;
        document.querySelectorAll("[data-court-menu]").forEach((item) => { item.hidden = true; });
        document.querySelectorAll("[data-court-more]").forEach((item) => item.setAttribute("aria-expanded", "false"));
        menu.hidden = !open;
        more.setAttribute("aria-expanded", String(open));
        return;
      }
      const action = event.target.closest("[data-court-action]");
      if (action) {
        const court = state.courts.find((item) => item.id === action.dataset.court);
        if (court) handleCourtAction(action.dataset.courtAction, court);
        return;
      }
      const selectable = event.target.closest("[data-court-id]");
      if (selectable) selectCourt(selectable.dataset.courtId);
    });
    document.querySelector("#courts-page").addEventListener("keydown", (event) => {
      const selectable = event.target.closest("[data-court-id]");
      if (selectable && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        selectCourt(selectable.dataset.courtId);
      }
    });
    document.querySelector("#add-court-button").addEventListener("click", openAddCourt);
    document.querySelector("#manage-facilities-button").addEventListener("click", () => host.showToast("Facilities management opened"));
    document.querySelector("#clear-court-filters").addEventListener("click", clearFilters);
    elements.sheetScrim.addEventListener("click", closeCourtSheet);
    elements.sheet.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-court-sheet]")) {
        event.stopPropagation();
        closeCourtSheet();
        return;
      }
      const action = event.target.closest("[data-court-action]");
      if (action) {
        event.stopPropagation();
        const court = state.courts.find((item) => item.id === action.dataset.court);
        if (court) handleCourtAction(action.dataset.courtAction, court);
      }
    });
    document.addEventListener("click", (event) => {
      const submit = event.target.closest("[data-court-modal-submit]");
      if (!submit) return;
      const court = currentModalCourt();
      if (submit.dataset.courtModalSubmit === "start") startMatch(court);
      if (submit.dataset.courtModalSubmit === "official") {
        host.closeDialog();
        host.showToast(`Official requested for ${court.name}`);
        host.announce(`Official requested for ${court.name}`);
      }
      if (submit.dataset.courtModalSubmit === "pause") {
        court.status = "delayed";
        court.delay = { reason: "Official pause", durationMinutes: 0, estimatedResume: "TBC" };
        host.closeDialog();
        render();
        host.showToast(`${court.name} match paused`);
      }
    });
    document.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-court-form]");
      if (!form) return;
      event.preventDefault();
      const court = currentModalCourt();
      if (form.dataset.courtForm === "result") confirmResult(court);
      if (form.dataset.courtForm === "delay") updateDelay(court, form);
      if (form.dataset.courtForm === "assign") assignMatch(court, form);
      if (form.dataset.courtForm === "move") moveMatch(court, form);
      if (form.dataset.courtForm === "add") addCourt(form);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.sheet.hidden) {
        event.preventDefault();
        closeCourtSheet();
      }
      if (event.key !== "Tab" || elements.sheet.hidden) return;
      const focusable = [...elements.sheet.querySelectorAll("button, a[href], input, select, textarea")].filter((item) => !item.disabled && !item.hidden);
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

  function activate() {
    state.routeActive = true;
    if (!state.initialized) {
      state.initialized = true;
      showLoading();
      window.setTimeout(render, 280);
    } else render();
  }

  function deactivate() {
    state.routeActive = false;
    closeCourtSheet();
  }

  bindEvents();
  renderSummary();
  renderDetail();
  return { activate, deactivate, render };
}

function courtStatusBadgeText(status) {
  return `<span class="status-badge status-${escapeMarkup(status)}"><span class="status-dot"></span>${escapeMarkup(courtStatusLabels[status] || status)}</span>`;
}
