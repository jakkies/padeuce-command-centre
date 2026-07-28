import {
  activities,
  competitionsSeed,
  courts,
  navItems,
} from "./data.js";
import { initCourtsScreen } from "./pages/courts.js";
import { initMatchesScreen } from "./pages/matches.js";
import { initCommunityScreen } from "./pages/community.js";

const statusLabels = {
  live: "Live",
  upcoming: "Upcoming",
  draft: "Draft",
  scheduled: "Scheduled",
  completed: "Completed",
  archived: "Archived",
  waiting: "Waiting",
  delayed: "Delayed",
  offline: "Offline",
};

const tabStatuses = {
  active: ["live", "scheduled"],
  upcoming: ["upcoming"],
  draft: ["draft"],
  completed: ["completed"],
  archived: ["archived"],
};

const confirmActions = {
  "court-6": {
    title: "Resolve Court 6?",
    body: "Notify both teams and assign a court marshal.",
    action: "Resolve",
    success: "Court 6 resolved",
  },
  "court-4": {
    title: "Review Court 4 result?",
    body: "Open the submitted score and verify it with the official.",
    action: "Review",
    success: "Court 4 result opened",
  },
  "round-2": {
    title: "Publish Round 2?",
    body: "This will notify players and update the public draw.",
    action: "Publish",
    success: "Round 2 published",
  },
  "start-court-3": {
    title: "Start match on Court 3?",
    body: "Both teams are checked in. The match timer will start immediately.",
    action: "Start Match",
    success: "Court 3 match started",
  },
};

const state = {
  route: "login",
  competitions: structuredClone(competitionsSeed),
  selectedCompetition: "challenger-2026",
  competitionTab: "active",
  tournamentStep: 0,
  tournamentDraft: {
    name: "",
    date: "2026-09-12",
    venue: "Hermanus Sports Club",
    courts: "8",
    format: "Single Elimination",
    rule: "Best of 3",
    deuce: "Golden point",
    registration: "Invite only",
  },
};

const elements = {
  login: document.querySelector("#login-screen"),
  app: document.querySelector("#application"),
  loginForm: document.querySelector("#login-form"),
  email: document.querySelector("#login-email"),
  password: document.querySelector("#login-password"),
  remember: document.querySelector("#remember-email"),
  loginSubmit: document.querySelector("#login-submit"),
  sidebar: document.querySelector("#sidebar"),
  drawerScrim: document.querySelector("#drawer-scrim"),
  modalBackdrop: document.querySelector("#modal-backdrop"),
  modal: document.querySelector("#modal"),
  modalTitle: document.querySelector("#modal-title"),
  modalBody: document.querySelector("#modal-body"),
  toast: document.querySelector("#toast"),
  toastCopy: document.querySelector("#toast-copy"),
  competitionList: document.querySelector("#competition-list"),
  tournamentAside: document.querySelector("#tournament-aside"),
  mobileSheet: document.querySelector("#mobile-tournament-sheet"),
  sheetScrim: document.querySelector("#sheet-scrim"),
};

let toastTimer;
let modalReturnFocus;
let courtController;
let matchController;
let communityController;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusBadge(status) {
  return `<span class="status-badge status-${status}"><span class="status-dot" aria-hidden="true"></span>${statusLabels[status] || status}</span>`;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toastCopy.textContent = message;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(hideToast, 3200);
}

function hideToast() {
  elements.toast.hidden = true;
}

function setDropdown(name) {
  const names = ["club", "notification", "profile"];
  names.forEach((item) => {
    const menu = document.querySelector(`#${item}-menu`);
    const toggle = document.querySelector(`#${item}-toggle`);
    const shouldOpen = item === name && menu.hidden;
    menu.hidden = !shouldOpen;
    toggle.setAttribute("aria-expanded", String(shouldOpen));
  });
}

function closeDropdowns() {
  ["club", "notification", "profile"].forEach((name) => {
    document.querySelector(`#${name}-menu`).hidden = true;
    document.querySelector(`#${name}-toggle`).setAttribute("aria-expanded", "false");
  });
}

function openDrawer() {
  elements.sidebar.classList.add("drawer-open");
  elements.drawerScrim.hidden = false;
  document.querySelector("#drawer-open").setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  elements.sidebar.classList.remove("drawer-open");
  elements.drawerScrim.hidden = true;
  document.querySelector("#drawer-open").setAttribute("aria-expanded", "false");
}

function isAuthenticated() {
  return sessionStorage.getItem("padeuce-auth") === "true";
}

function navigate(route) {
  window.location.hash = `#/${route}`;
}

function syncRoute() {
  const authenticated = isAuthenticated();
  const requested = window.location.hash.replace(/^#\//, "") || (authenticated ? "today" : "login");

  if (!authenticated && requested !== "login") {
    navigate("login");
    return;
  }
  if (authenticated && requested === "login") {
    navigate("today");
    return;
  }

  state.route = requested;
  elements.login.hidden = authenticated;
  elements.app.hidden = !authenticated;
  closeDrawer();
  closeDropdowns();

  if (!authenticated) return;

  const routeRoot = requested.split("/")[0];
  const pageRoute = ["today", "competitions", "courts", "matches", "community"].includes(routeRoot) ? routeRoot : "coming";
  document.querySelectorAll("[data-page]").forEach((page) => {
    page.hidden = page.dataset.page !== pageRoute;
  });

  document.querySelectorAll("[data-route]").forEach((button) => {
    const active = button.dataset.route === routeRoot;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  if (pageRoute === "coming") {
    const item = navItems.find((entry) => entry.route === routeRoot) || navItems[0];
    document.querySelector("#coming-title").textContent = item.label;
    document.querySelector("#coming-name").textContent = item.label;
    document.querySelector("#coming-icon").textContent = item.icon;
  }

  if (requested === "courts") courtController?.activate();
  else courtController?.deactivate();
  if (routeRoot === "matches") matchController?.activate(requested.split("/")[1] || "");
  else matchController?.deactivate();
  if (requested === "community") communityController?.activate();
  else communityController?.deactivate();
  if (requested === "competitions") renderCompetitions();
}

function validateLogin() {
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elements.email.value);
  const passwordValid = elements.password.value.length >= 6;

  document.querySelector("#email-error").hidden = emailValid;
  document.querySelector("#password-error").hidden = passwordValid;
  document.querySelector("#email-wrap").classList.toggle("invalid", !emailValid);
  document.querySelector("#password-wrap").classList.toggle("invalid", !passwordValid);
  return emailValid && passwordValid;
}

function handleLogin(event) {
  event.preventDefault();
  if (!validateLogin()) return;
  if (elements.remember.checked) localStorage.setItem("padeuce-email", elements.email.value);
  else localStorage.removeItem("padeuce-email");

  elements.loginSubmit.disabled = true;
  elements.loginSubmit.innerHTML = '<span class="spinner"></span> Signing in…';
  window.setTimeout(() => {
    sessionStorage.setItem("padeuce-auth", "true");
    elements.loginSubmit.disabled = false;
    elements.loginSubmit.innerHTML = "Sign in <span>→</span>";
    navigate("today");
  }, 850);
}

function renderCourts() {
  document.querySelector("#court-grid").innerHTML = courts.map((court) => `
    <article class="court-card court-${court.status}">
      <div class="court-top"><span>Court ${court.id}</span>${statusBadge(court.status)}</div>
      <strong class="court-teams">${escapeHtml(court.teams)}</strong>
      <div class="court-score"><b>${escapeHtml(court.score)}</b><small>${escapeHtml(court.meta)}</small></div>
      <button class="button compact ${court.status === "live" ? "secondary" : court.status === "waiting" ? "primary" : "ghost"}" type="button"
        ${court.action === "Start Match" ? 'data-confirm="start-court-3"' : `data-toast="Court ${court.id}: ${escapeHtml(court.action)}"`}>${escapeHtml(court.action)}</button>
    </article>
  `).join("");
}

function renderActivity() {
  document.querySelector("#activity-list").innerHTML = activities.map((item) => `
    <div class="activity-item">
      <span class="activity-icon">${escapeHtml(item.icon)}</span>
      <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></div>
      <time>${escapeHtml(item.time)}</time>
    </div>
  `).join("");
}

function competitionDate(item) {
  const format = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" });
  const endFormat = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  return `${format.format(new Date(item.dateStart))}–${endFormat.format(new Date(item.dateEnd))}`;
}

function currentCompetitionFilters() {
  return {
    search: document.querySelector("#competition-search").value.toLowerCase(),
    format: document.querySelector("#format-filter").value,
    status: document.querySelector("#status-filter").value,
    venue: document.querySelector("#venue-filter").value,
  };
}

function filteredCompetitions() {
  const filters = currentCompetitionFilters();
  return state.competitions.filter((item) =>
    tabStatuses[state.competitionTab].includes(item.status)
    && (filters.format === "all" || item.format === filters.format)
    && (filters.status === "all" || item.status === filters.status)
    && (filters.venue === "all" || item.venue === filters.venue)
    && `${item.name} ${item.venue}`.toLowerCase().includes(filters.search)
  );
}

function competitionCard(item, selected) {
  const initials = item.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  const primaryLabel = item.status === "draft" ? "Continue Setup" : item.status === "live" ? "Open Dashboard" : "View Tournament";
  return `
    <article class="competition-card ${selected ? "selected" : ""}" data-competition="${escapeHtml(item.id)}">
      <div class="competition-artwork artwork-${escapeHtml(item.cover)}"><span>${escapeHtml(initials)}</span><small>PADEUCE · 2026</small></div>
      <div class="competition-body">
        <div class="competition-heading">
          <div>${statusBadge(item.status)}<h3>${escapeHtml(item.name)}</h3></div>
          <div class="more-anchor">
            <button class="icon-button small" type="button" data-more="${escapeHtml(item.id)}" aria-label="More options for ${escapeHtml(item.name)}" aria-expanded="false">•••</button>
            <div class="mini-menu" data-more-menu="${escapeHtml(item.id)}" hidden>
              <button type="button" data-toast="Tournament duplicated">Duplicate</button>
              <button type="button" data-toast="Tournament link copied">Copy link</button>
              <button type="button" data-toast="Tournament archived">Archive</button>
            </div>
          </div>
        </div>
        <div class="competition-meta"><span>◈ ${escapeHtml(item.format)}</span><span>◎ ${escapeHtml(item.rule)}</span><span>⌖ ${escapeHtml(item.venue)}</span><span>□ ${competitionDate(item)}</span></div>
        <div class="competition-stats"><div><strong>${item.teams}</strong><span>Teams</span></div><div><strong>${item.matchesCompleted}/${item.matchesTotal}</strong><span>Matches</span></div><div><strong>${item.courts}</strong><span>Courts</span></div></div>
        <div class="progress-row"><div class="progress-track"><span class="progress-${item.progress}"></span></div><span>${item.progress}%</span></div>
        <div class="competition-footer"><small>${escapeHtml(item.timing)}</small><button class="button compact ${item.status === "live" ? "primary" : "secondary"}" type="button" data-tournament-action="${escapeHtml(item.id)}">${primaryLabel} <span>→</span></button></div>
      </div>
    </article>
  `;
}

function tournamentAside(item, mobile = false) {
  const initials = item.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  return `
    ${mobile ? '<div class="sheet-handle"></div>' : ""}
    <div class="aside-heading">
      <div><span class="eyebrow">Selected competition</span><h2>Tournament at a glance</h2></div>
      ${mobile ? '<button class="icon-button" id="sheet-close" type="button" aria-label="Close tournament details">×</button>' : ""}
    </div>
    <div class="aside-artwork artwork-${escapeHtml(item.cover)}"><span>${escapeHtml(initials)}</span>${statusBadge(item.status)}</div>
    <h3>${escapeHtml(item.name)}</h3>
    <div class="aside-meta"><span>◈ ${escapeHtml(item.format)}</span><span>⌖ ${escapeHtml(item.venue)}</span><span>□ ${competitionDate(item)}</span></div>
    <button class="button secondary full" type="button" data-toast="Public tournament page opened">View public page ↗</button>
    <div class="aside-stats">
      <div><span>Teams</span><strong>${item.teams}</strong></div><div><span>Players</span><strong>${item.players}</strong></div><div><span>Courts</span><strong>${item.courts}</strong></div>
      <div><span>Live</span><strong>${item.liveMatches}</strong></div><div><span>Waiting</span><strong>${item.waitingMatches}</strong></div><div><span>Spectators</span><strong>${item.spectators}</strong></div>
    </div>
    <div class="aside-progress"><div><strong>Tournament progress</strong><span>${item.progress}%</span></div><div class="progress-track"><span class="progress-${item.progress}"></span></div></div>
    <div class="aside-section"><div class="section-heading small"><h4>Recent activity</h4><button class="text-button" type="button" data-toast="All tournament activity opened">View all</button></div><div class="mini-activity"><span>✓</span><div><strong>Quarter Final 1 verified</strong><small>3 minutes ago</small></div></div><div class="mini-activity"><span>●</span><div><strong>Court 2 match started</strong><small>12 minutes ago</small></div></div></div>
    <div class="aside-section"><h4>Quick actions</h4><div class="quick-grid"><button type="button" data-toast="Generate round opened"><span>＋</span>Generate round</button><button type="button" data-toast="Send message opened"><span>✉</span>Send message</button><button type="button" data-toast="Export data opened"><span>↓</span>Export data</button><button type="button" data-toast="Tournament settings opened"><span>⚙</span>Tournament settings</button></div></div>
  `;
}

function renderCompetitions() {
  const items = filteredCompetitions();
  const filters = currentCompetitionFilters();
  if (items.length && !items.some((item) => item.id === state.selectedCompetition)) {
    state.selectedCompetition = items[0].id;
  }
  const selected = state.competitions.find((item) => item.id === state.selectedCompetition) || state.competitions[0];

  document.querySelector("#competition-count").textContent = String(items.length);
  document.querySelector("#clear-filters").hidden = !(
    filters.search || filters.format !== "all" || filters.status !== "all" || filters.venue !== "all"
  );

  elements.competitionList.innerHTML = items.length
    ? items.map((item) => competitionCard(item, item.id === selected.id)).join("")
    : '<div class="empty-state"><span>◇</span><h3>No competitions found</h3><p>Try a different tab or clear the active filters.</p><button class="button secondary" type="button" id="empty-clear">Clear filters</button></div>';

  elements.tournamentAside.innerHTML = tournamentAside(selected);
  elements.mobileSheet.innerHTML = tournamentAside(selected, true);
}

function populateCompetitionFilters() {
  const formats = [...new Set(state.competitions.map((item) => item.format))];
  const venues = [...new Set(state.competitions.map((item) => item.venue))];
  document.querySelector("#format-filter").insertAdjacentHTML("beforeend", formats.map((item) => `<option>${escapeHtml(item)}</option>`).join(""));
  document.querySelector("#venue-filter").insertAdjacentHTML("beforeend", venues.map((item) => `<option>${escapeHtml(item)}</option>`).join(""));
}

function clearFilters() {
  document.querySelector("#competition-search").value = "";
  document.querySelector("#format-filter").value = "all";
  document.querySelector("#status-filter").value = "all";
  document.querySelector("#venue-filter").value = "all";
  renderCompetitions();
}

function openMobileSheet() {
  if (window.innerWidth >= 1200) return;
  elements.mobileSheet.hidden = false;
  elements.sheetScrim.hidden = false;
  document.body.classList.add("sheet-open");
  document.querySelector("#sheet-close")?.focus();
}

function closeMobileSheet() {
  elements.mobileSheet.hidden = true;
  elements.sheetScrim.hidden = true;
  document.body.classList.remove("sheet-open");
}

function modalTemplate(type, payload = {}) {
  if (type === "custom") {
    return {
      title: payload.title || "Court action",
      body: payload.body || "",
    };
  }
  if (type === "forgot") {
    return {
      title: "Reset your password",
      body: `<form class="simple-form" id="forgot-form"><p>Enter the email linked to your Padeuce account and we’ll send a secure reset link.</p><label>Email address<input type="email" name="email" required placeholder="name@club.co.za" autofocus></label><button class="button primary full" type="submit">Send reset link</button></form>`,
    };
  }
  if (type === "access") {
    return {
      title: "Request access",
      body: `<form class="simple-form" id="access-form"><p>Tell us about your club and we’ll arrange a guided Command Centre setup.</p><label>Your name<input name="name" required placeholder="Full name" autofocus></label><label>Club or organisation<input name="club" required placeholder="Club name"></label><label>Work email<input name="email" type="email" required placeholder="name@club.co.za"></label><button class="button primary full" type="submit">Request access</button></form>`,
    };
  }
  if (type === "import") {
    return {
      title: "Import Tournament",
      body: `<div class="import-panel"><div class="drop-zone"><span>↓</span><h3>Drop tournament file here</h3><p>CSV or XLSX up to 10MB</p><label class="button secondary">Choose file<input id="import-file" type="file" accept=".csv,.xlsx"></label></div><div class="import-note"><strong>Need the template?</strong><button class="text-button" type="button" data-toast="Import template downloaded">Download CSV template →</button></div></div>`,
    };
  }
  if (type === "help") {
    const options = [
      ["↗", "Get started with Command Centre"],
      ["◈", "Run a competition"],
      ["●", "Connect live scoring"],
      ["✉", "Contact Padeuce support"],
    ];
    return {
      title: "How can we help?",
      body: `<div class="help-options">${options.map(([icon, label]) => `<button type="button" data-toast="${label} opened"><span>${icon}</span><div><strong>${label}</strong><small>Step-by-step guidance</small></div><i>→</i></button>`).join("")}</div>`,
    };
  }
  if (type === "confirm") {
    const config = confirmActions[payload.key];
    return {
      title: config.title,
      body: `<div class="confirm-content"><span class="confirm-icon">✓</span><p>${escapeHtml(config.body)}</p><div><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="button" data-confirm-submit="${escapeHtml(payload.key)}">${escapeHtml(config.action)}</button></div></div>`,
    };
  }
  if (type === "new") {
    return { title: "Create a new tournament", body: tournamentFlowTemplate() };
  }
  return { title: "Padeuce", body: "" };
}

function openModal(type, payload = {}) {
  modalReturnFocus = document.activeElement;
  const template = modalTemplate(type, payload);
  elements.modalTitle.textContent = template.title;
  elements.modalBody.innerHTML = template.body;
  elements.modal.classList.toggle("modal-wide", type === "new" || Boolean(payload.wide));
  elements.modalBackdrop.hidden = false;
  elements.modal.dataset.type = type;
  document.querySelector("#modal-close").focus();
}

function closeModal() {
  elements.modalBackdrop.hidden = true;
  elements.modal.dataset.type = "";
  modalReturnFocus?.focus();
}

function tournamentFlowTemplate() {
  const steps = ["Details", "Format", "Rules", "Registration", "Review"];
  return `
    <div class="stepper">
      <ol>${steps.map((label, index) => `<li class="${index === state.tournamentStep ? "active" : index < state.tournamentStep ? "complete" : ""}"><span>${index < state.tournamentStep ? "✓" : index + 1}</span><b>${label}</b></li>`).join("")}</ol>
      <p class="modal-step-title">Step ${state.tournamentStep + 1} of 5 · ${steps[state.tournamentStep]}</p>
      <div class="step-content">${tournamentStepContent()}</div>
      <div class="step-actions"><button class="button secondary" type="button" data-tournament-back>${state.tournamentStep ? "Back" : "Cancel"}</button><div>${state.tournamentStep === 4 ? '<button class="button ghost" type="button" data-save-tournament="draft">Save Draft</button>' : ""}<button class="button primary" type="button" data-tournament-next>${state.tournamentStep < 4 ? "Continue" : "Create Tournament"} <span>→</span></button></div></div>
    </div>
  `;
}

function tournamentStepContent() {
  const form = state.tournamentDraft;
  if (state.tournamentStep === 0) {
    return `<div class="form-grid"><label class="span-2">Tournament name<input data-draft-field="name" value="${escapeHtml(form.name)}" placeholder="e.g. Spring Challenger 2026" autofocus></label><label>Date<input data-draft-field="date" type="date" value="${escapeHtml(form.date)}"></label><label>Number of courts<input data-draft-field="courts" type="number" min="1" max="32" value="${escapeHtml(form.courts)}"></label><label class="span-2">Venue<select data-draft-field="venue"><option${form.venue === "Hermanus Sports Club" ? " selected" : ""}>Hermanus Sports Club</option><option${form.venue === "Cape Town Padel Park" ? " selected" : ""}>Cape Town Padel Park</option><option${form.venue === "Overberg Padel Centre" ? " selected" : ""}>Overberg Padel Centre</option></select></label></div>`;
  }
  if (state.tournamentStep === 1) {
    return choiceGrid(["Single Elimination", "Round Robin", "Group Stage + Knockout", "Double Elimination", "Americano", "Mexicano"], "format");
  }
  if (state.tournamentStep === 2) {
    return `<div class="form-grid"><label class="span-2">Match format<select data-draft-field="rule"><option>Best of 3</option><option>Best of 5</option><option>Single set</option></select></label><label class="span-2">Deuce rule<select data-draft-field="deuce"><option>Golden point</option><option>Normal deuce</option></select></label><label class="check-panel span-2"><input type="checkbox" checked> Final-set match tiebreak to 10 points</label></div>`;
  }
  if (state.tournamentStep === 3) {
    return choiceGrid(["Manual teams", "Invite only", "Open registration"], "registration");
  }
  return `<div class="review-panel"><div><span>Name</span><strong>${escapeHtml(form.name || "Untitled Tournament")}</strong></div><div><span>Date</span><strong>${escapeHtml(form.date)}</strong></div><div><span>Venue</span><strong>${escapeHtml(form.venue)}</strong></div><div><span>Courts</span><strong>${escapeHtml(form.courts)}</strong></div><div><span>Format</span><strong>${escapeHtml(form.format)}</strong></div><div><span>Rules</span><strong>${escapeHtml(form.rule)} · ${escapeHtml(form.deuce)}</strong></div><div><span>Registration</span><strong>${escapeHtml(form.registration)}</strong></div></div>`;
}

function choiceGrid(values, field) {
  return `<div class="choice-grid">${values.map((value, index) => `<button class="${state.tournamentDraft[field] === value ? "selected" : ""}" type="button" data-choice-field="${field}" data-choice-value="${escapeHtml(value)}"><span>${["◈", "◎", "▦", "◇", "A", "M"][index]}</span><strong>${escapeHtml(value)}</strong><small>${state.tournamentDraft[field] === value ? "Selected" : "Choose option"}</small></button>`).join("")}</div>`;
}

function updateTournamentModal() {
  elements.modalBody.innerHTML = tournamentFlowTemplate();
}

function createTournament(draftOnly) {
  const form = state.tournamentDraft;
  const name = form.name.trim() || "Untitled Tournament";
  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  state.competitions.unshift({
    id,
    name,
    status: "draft",
    format: form.format,
    rule: form.rule,
    venue: form.venue,
    dateStart: form.date,
    dateEnd: form.date,
    teams: 0,
    players: 0,
    matchesCompleted: 0,
    matchesTotal: 0,
    courts: Number(form.courts),
    liveMatches: 0,
    waitingMatches: 0,
    spectators: 0,
    progress: draftOnly ? 20 : 45,
    cover: "N",
    timing: draftOnly ? "Draft saved just now" : "Setup created just now",
  });
  state.competitionTab = "draft";
  state.selectedCompetition = id;
  document.querySelectorAll("#competition-tabs button").forEach((button) => {
    const active = button.dataset.tab === "draft";
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    if (active) {
      const count = button.querySelector("span");
      count.textContent = String(state.competitions.filter((item) => item.status === "draft").length);
    }
  });
  closeModal();
  renderCompetitions();
  showToast(`${name} created`);
}

function trapModalFocus(event) {
  if (elements.modalBackdrop.hidden || event.key !== "Tab") return;
  const focusable = [...elements.modal.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])")]
    .filter((item) => !item.disabled && !item.hidden);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function submitAi() {
  const input = document.querySelector("#ai-prompt");
  const prompt = input.value.trim();
  if (!prompt) return;
  const response = prompt.toLowerCase().includes("court")
    ? "Court 3 is the best next action. Start the match now, then move the 15:00 semi-final warm-up to Court 5."
    : "Operations look healthy. Resolve Court 6 and publish Round 2 to keep the programme on schedule.";
  document.querySelector("#ai-response-copy").textContent = response;
  document.querySelector("#ai-response").hidden = false;
  input.value = "";
}

function handleDelegatedClick(event) {
  const route = event.target.closest("[data-route]");
  if (route) {
    navigate(route.dataset.route);
    return;
  }

  const toast = event.target.closest("[data-toast]");
  if (toast) {
    showToast(toast.dataset.toast);
    if (toast.closest(".dropdown-menu")) closeDropdowns();
    return;
  }

  const modal = event.target.closest("[data-modal]");
  if (modal) {
    if (modal.dataset.modal === "new") {
      state.tournamentStep = 0;
      state.tournamentDraft.name = "";
    }
    openModal(modal.dataset.modal);
    return;
  }

  const confirm = event.target.closest("[data-confirm]");
  if (confirm) {
    openModal("confirm", { key: confirm.dataset.confirm });
    return;
  }

  const confirmSubmit = event.target.closest("[data-confirm-submit]");
  if (confirmSubmit) {
    const config = confirmActions[confirmSubmit.dataset.confirmSubmit];
    closeModal();
    showToast(config.success);
    return;
  }

  if (event.target.closest("[data-close-modal]")) {
    closeModal();
    return;
  }

  const dismiss = event.target.closest("[data-dismiss-suggestion]");
  if (dismiss) {
    dismiss.closest(".suggestion-card").remove();
    return;
  }

  const card = event.target.closest("[data-competition]");
  if (card && !event.target.closest("button")) {
    state.selectedCompetition = card.dataset.competition;
    renderCompetitions();
    openMobileSheet();
    return;
  }

  const tournamentAction = event.target.closest("[data-tournament-action]");
  if (tournamentAction) {
    const item = state.competitions.find((entry) => entry.id === tournamentAction.dataset.tournamentAction);
    showToast(item.status === "draft" ? "Tournament setup opened" : `${item.name} dashboard opened`);
    return;
  }

  const more = event.target.closest("[data-more]");
  if (more) {
    const menu = document.querySelector(`[data-more-menu="${CSS.escape(more.dataset.more)}"]`);
    const open = menu.hidden;
    document.querySelectorAll("[data-more-menu]").forEach((item) => { item.hidden = true; });
    document.querySelectorAll("[data-more]").forEach((item) => item.setAttribute("aria-expanded", "false"));
    menu.hidden = !open;
    more.setAttribute("aria-expanded", String(open));
    return;
  }

  if (event.target.closest("#empty-clear")) {
    clearFilters();
    return;
  }

  const choice = event.target.closest("[data-choice-field]");
  if (choice) {
    state.tournamentDraft[choice.dataset.choiceField] = choice.dataset.choiceValue;
    updateTournamentModal();
    return;
  }

  if (event.target.closest("[data-tournament-back]")) {
    if (!state.tournamentStep) closeModal();
    else {
      state.tournamentStep -= 1;
      updateTournamentModal();
    }
    return;
  }

  if (event.target.closest("[data-tournament-next]")) {
    if (state.tournamentStep < 4) {
      state.tournamentStep += 1;
      updateTournamentModal();
    } else createTournament(false);
    return;
  }

  if (event.target.closest('[data-save-tournament="draft"]')) {
    createTournament(true);
  }
}

function handleModalInput(event) {
  const field = event.target.closest("[data-draft-field]");
  if (field) state.tournamentDraft[field.dataset.draftField] = field.value;
}

function wireEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  document.querySelector("#password-toggle").addEventListener("click", () => {
    const visible = elements.password.type === "text";
    elements.password.type = visible ? "password" : "text";
    document.querySelector("#password-toggle").textContent = visible ? "Show" : "Hide";
    document.querySelector("#password-toggle").setAttribute("aria-label", visible ? "Show password" : "Hide password");
  });
  document.querySelector("#logout-button").addEventListener("click", () => {
    sessionStorage.removeItem("padeuce-auth");
    navigate("login");
  });
  document.querySelector("#club-toggle").addEventListener("click", () => setDropdown("club"));
  document.querySelector("#notification-toggle").addEventListener("click", () => setDropdown("notification"));
  document.querySelector("#profile-toggle").addEventListener("click", () => setDropdown("profile"));
  document.querySelectorAll("[data-club]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#current-club").textContent = button.dataset.club;
    closeDropdowns();
    showToast(`${button.dataset.club} selected`);
  }));
  document.querySelector("#drawer-open").addEventListener("click", openDrawer);
  document.querySelector("#more-navigation").addEventListener("click", openDrawer);
  document.querySelector("#drawer-close").addEventListener("click", closeDrawer);
  elements.drawerScrim.addEventListener("click", closeDrawer);
  document.querySelector("#global-search").addEventListener("keydown", (event) => {
    if (event.key === "Enter") showToast(`Searching for “${event.currentTarget.value}”`);
  });
  document.querySelector("#competition-tabs").addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (!tab) return;
    state.competitionTab = tab.dataset.tab;
    document.querySelectorAll("#competition-tabs button").forEach((button) => {
      const active = button === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    renderCompetitions();
  });
  ["competition-search", "format-filter", "status-filter", "venue-filter"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener(id === "competition-search" ? "input" : "change", renderCompetitions);
  });
  document.querySelector("#filter-toggle").addEventListener("click", () => document.querySelector("#competition-filters").classList.toggle("expanded"));
  document.querySelector("#clear-filters").addEventListener("click", clearFilters);
  elements.sheetScrim.addEventListener("click", closeMobileSheet);
  elements.mobileSheet.addEventListener("click", (event) => {
    if (event.target.closest("#sheet-close")) closeMobileSheet();
  });
  document.querySelector("#ai-submit").addEventListener("click", submitAi);
  document.querySelector("#ai-prompt").addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitAi();
  });
  document.querySelector("#ai-response-close").addEventListener("click", () => {
    document.querySelector("#ai-response").hidden = true;
  });
  document.querySelector("#notify-coming").addEventListener("click", () => showToast(`You’ll be notified when ${document.querySelector("#coming-name").textContent} is ready`));
  document.querySelector("#modal-close").addEventListener("click", closeModal);
  elements.modalBackdrop.addEventListener("mousedown", (event) => {
    if (event.target === elements.modalBackdrop) closeModal();
  });
  elements.modalBody.addEventListener("input", handleModalInput);
  elements.modalBody.addEventListener("change", (event) => {
    handleModalInput(event);
    if (event.target.id === "import-file" && event.target.files.length) {
      closeModal();
      showToast("Tournament file imported");
    }
  });
  elements.modalBody.addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.target.id === "forgot-form") {
      closeModal();
      showToast("Password reset instructions sent");
    }
    if (event.target.id === "access-form") {
      closeModal();
      showToast("Access request submitted");
    }
  });
  document.querySelector("#toast-close").addEventListener("click", hideToast);
  document.addEventListener("click", handleDelegatedClick);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!elements.modalBackdrop.hidden) closeModal();
      else if (!elements.mobileSheet.hidden) closeMobileSheet();
      else {
        closeDropdowns();
        closeDrawer();
      }
    }
    trapModalFocus(event);
  });
  window.addEventListener("hashchange", syncRoute);
}

function initialize() {
  const savedEmail = localStorage.getItem("padeuce-email");
  if (savedEmail) {
    elements.email.value = savedEmail;
    elements.remember.checked = true;
  }
  renderCourts();
  renderActivity();
  populateCompetitionFilters();
  renderCompetitions();
  courtController = initCourtsScreen({
    showToast,
    navigate,
    openDialog: ({ title, body, wide = false }) => openModal("custom", { title, body, wide }),
    closeDialog: closeModal,
    announce: (message) => {
      const liveRegion = document.querySelector("#court-live-region");
      liveRegion.textContent = "";
      window.setTimeout(() => { liveRegion.textContent = message; }, 20);
    },
  });
  matchController = initMatchesScreen({
    showToast,
    navigate,
    openDialog: ({ title, body, wide = false }) => openModal("custom", { title, body, wide }),
    closeDialog: closeModal,
    announce: (message) => {
      const liveRegion = document.querySelector("#match-live-region");
      liveRegion.textContent = "";
      window.setTimeout(() => { liveRegion.textContent = message; }, 20);
    },
  });
  communityController = initCommunityScreen({
    showToast,
    openDialog: ({ title, body, wide = false }) => openModal("custom", { title, body, wide }),
    closeDialog: closeModal,
    announce: (message) => {
      const liveRegion = document.querySelector("#community-live-region");
      liveRegion.textContent = "";
      window.setTimeout(() => { liveRegion.textContent = message; }, 20);
    },
  });
  wireEvents();
  syncRoute();
}

initialize();
