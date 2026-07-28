import {
  communityCoachesSeed,
  communityInvitationsSeed,
  communityOfficialsSeed,
  communityPlayersSeed,
  communityTeamsSeed,
} from "../data.js";
import { renderCommunityDetail } from "../components/community-detail.js";
import {
  renderCommunityCards,
  renderCommunitySkeletons,
  renderCommunityTable,
} from "../components/community-directory.js";
import {
  addPersonWizardTemplate,
  addTeamTemplate,
  communityExportTemplate,
  communityImportTemplate,
  invitationTemplate,
} from "../components/community-modals.js";
import {
  adjacentCommunityTab,
  initialCommunityTab,
  updateCommunityTabs,
} from "../components/community-tabs.js";
import {
  communityItemName,
  communityTabLabels,
  escapeCommunityMarkup,
} from "../components/community-utils.js";

const defaultFilters = () => ({ search: "", club: "all", status: "all", level: "all", participation: "all", sort: "name", attention: "" });

function initialView() {
  const stored = sessionStorage.getItem("padeuce-community-view");
  return ["list", "card"].includes(stored) ? stored : "list";
}

function newPersonDraft() {
  return {
    role: "Player",
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    mobile: "",
    club: "Hermanus Sports Club",
    level: "3.50",
    preferredSide: "Left",
    dominantHand: "Right",
    speciality: "Tactical",
    certification: "",
    availability: "Available",
    officialRole: "Referee",
  };
}

export function initCommunityScreen(host) {
  const persisted = sessionStorage.getItem("padeuce-community-data");
  const storedData = persisted ? JSON.parse(persisted) : null;
  const state = {
    data: storedData || {
      players: structuredClone(communityPlayersSeed),
      teams: structuredClone(communityTeamsSeed),
      coaches: structuredClone(communityCoachesSeed),
      officials: structuredClone(communityOfficialsSeed),
    },
    invitations: structuredClone(communityInvitationsSeed),
    activity: [],
    tab: initialCommunityTab(),
    view: initialView(),
    selected: {
      players: "player-jakkie-swart",
      teams: "team-j-l",
      coaches: "coach-mia-daniels",
      officials: "official-sarah-miller",
    },
    filters: {
      players: defaultFilters(),
      teams: defaultFilters(),
      coaches: defaultFilters(),
      officials: defaultFilters(),
    },
    personStep: 0,
    personDraft: newPersonDraft(),
    modalItemId: null,
    initialized: false,
    routeActive: false,
  };

  const elements = {
    page: document.querySelector("#community-page"),
    summary: document.querySelector("#community-summary"),
    tabs: document.querySelector("#community-tabs"),
    toolbar: document.querySelector("#community-toolbar"),
    collection: document.querySelector("#community-collection"),
    detail: document.querySelector("#community-detail-panel"),
    sheet: document.querySelector("#community-detail-sheet"),
    sheetScrim: document.querySelector("#community-sheet-scrim"),
    count: document.querySelector("#community-results-count"),
    search: document.querySelector("#community-search"),
    club: document.querySelector("#community-club-filter"),
    status: document.querySelector("#community-status-filter"),
    level: document.querySelector("#community-level-filter"),
    participation: document.querySelector("#community-participation-filter"),
    sort: document.querySelector("#community-sort"),
    primary: document.querySelector("#community-primary-action"),
  };

  function items() {
    return state.data[state.tab];
  }

  function selectedItem() {
    return items().find((item) => item.id === state.selected[state.tab]) || items()[0];
  }

  function findItem(id) {
    return Object.values(state.data).flat().find((item) => item.id === id);
  }

  function findItemTab(id) {
    return Object.keys(state.data).find((tab) => state.data[tab].some((item) => item.id === id)) || state.tab;
  }

  function persistData() {
    sessionStorage.setItem("padeuce-community-data", JSON.stringify(state.data));
  }

  function renderSummary() {
    const metrics = [
      ["players", "◉", 284, "Players", "+18 this month"],
      ["teams", "◎", 62, "Teams", "48 active"],
      ["coaches", "◇", 18, "Coaches", "14 assigned"],
      ["officials", "✓", 24, "Officials", "Across 4 competitions"],
      ["today", "●", 74, "Active Today", "Players and officials"],
      ["attention", "!", 12, "Incomplete Profiles", "Needs attention"],
    ];
    elements.summary.innerHTML = metrics.map(([key, icon, value, label, copy]) => `<div class="community-summary-metric summary-${key}"><span aria-hidden="true">${icon}</span><div><strong>${value}</strong><b>${label}</b><small>${copy}</small></div></div>`).join("");
  }

  function searchHaystack(item) {
    return [
      item.firstName,
      item.lastName,
      item.displayName,
      item.name,
      item.email,
      item.club,
      item.role,
      item.speciality,
      ...(item.playerNames || []),
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function levelMatches(item, level) {
    if (level === "all") return true;
    if (state.tab === "players") {
      if (level === "elite") return item.level >= 4.5;
      if (level === "advanced") return item.level >= 4 && item.level < 4.5;
      if (level === "development") return item.level < 4;
    }
    if (state.tab === "teams") return level === "seeded" ? item.seed <= 8 : item.seed > 8;
    if (state.tab === "coaches") return level === "assigned" ? item.playersAssigned + item.teamsAssigned > 0 : item.playersAssigned + item.teamsAssigned === 0;
    if (state.tab === "officials") return level === "conflict" ? item.conflicts > 0 : item.conflicts === 0;
    return true;
  }

  function participationMatches(item, value) {
    if (value === "all") return true;
    if (state.tab === "players") return value === "connected" ? item.currentTeam !== "Unassigned" : item.currentTeam === "Unassigned";
    if (state.tab === "teams") return value === "entered" ? item.competitions.length > 0 : item.competitions.length === 0;
    if (state.tab === "coaches") return value === "assigned" ? item.playersAssigned + item.teamsAssigned > 0 : item.playersAssigned + item.teamsAssigned === 0;
    return value === "assigned" ? item.assignedMatch !== "Unassigned" : item.assignedMatch === "Unassigned";
  }

  function filteredItems() {
    const filter = state.filters[state.tab];
    const result = items().filter((item) => {
      const attentionMatch = !filter.attention
        || (filter.attention === "incomplete" && item.status === "incomplete")
        || (filter.attention === "invited" && ["invited", "pending invitation", "pending approval"].includes(item.status))
        || (filter.attention === "conflict" && item.conflicts > 0);
      return (!filter.search || searchHaystack(item).includes(filter.search.toLowerCase()))
        && (filter.club === "all" || item.club === filter.club)
        && (filter.status === "all" || item.status === filter.status)
        && levelMatches(item, filter.level)
        && participationMatches(item, filter.participation)
        && attentionMatch;
    });
    return result.sort((a, b) => {
      if (filter.sort === "ranking") return (a.ranking || 999) - (b.ranking || 999);
      if (filter.sort === "win-rate") return (b.winRate || 0) - (a.winRate || 0);
      if (filter.sort === "activity") return (b.matches || b.playersAssigned || 0) - (a.matches || a.playersAssigned || 0);
      return communityItemName(a).localeCompare(communityItemName(b));
    });
  }

  function updateToolbarLabels() {
    const configs = {
      players: {
        status: [["all", "All statuses"], ["active", "Active"], ["inactive", "Inactive"], ["invited", "Invited"], ["incomplete", "Incomplete"], ["suspended", "Suspended"]],
        level: [["all", "All levels"], ["elite", "Elite · 4.50+"], ["advanced", "Advanced · 4.00+"], ["development", "Development"]],
        participation: [["all", "All participation"], ["connected", "Has team"], ["unassigned", "Without team"]],
      },
      teams: {
        status: [["all", "All statuses"], ["active", "Active"], ["draft", "Draft"], ["disbanded", "Disbanded"], ["pending invitation", "Pending invitation"]],
        level: [["all", "All seeds"], ["seeded", "Seeded 1–8"], ["development", "Seed 9+"]],
        participation: [["all", "All participation"], ["entered", "In competition"], ["unassigned", "Not entered"]],
      },
      coaches: {
        status: [["all", "All availability"], ["available", "Available"], ["assigned", "Assigned"], ["unavailable", "Unavailable"], ["pending approval", "Pending approval"]],
        level: [["all", "All assignments"], ["assigned", "Has assignments"], ["development", "No assignments"]],
        participation: [["all", "All participation"], ["assigned", "Assigned"], ["unassigned", "Unassigned"]],
      },
      officials: {
        status: [["all", "All availability"], ["available", "Available"], ["assigned", "Assigned"], ["unavailable", "Unavailable"], ["pending approval", "Pending approval"]],
        level: [["all", "All schedules"], ["conflict", "Has conflict"], ["development", "Conflict free"]],
        participation: [["all", "All assignments"], ["assigned", "Assigned"], ["unassigned", "Unassigned"]],
      },
    }[state.tab];
    const fill = (control, options) => {
      const current = state.filters[state.tab][control.id.replace("community-", "").replace("-filter", "")] || "all";
      control.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
      control.value = [...control.options].some((option) => option.value === current) ? current : "all";
    };
    fill(elements.status, configs.status);
    fill(elements.level, configs.level);
    fill(elements.participation, configs.participation);
  }

  function populateClubs() {
    const current = state.filters[state.tab].club;
    const clubs = [...new Set(items().map((item) => item.club))].sort();
    elements.club.innerHTML = '<option value="all">All clubs</option>' + clubs.map((club) => `<option>${escapeCommunityMarkup(club)}</option>`).join("");
    elements.club.value = clubs.includes(current) ? current : "all";
  }

  function loadFilterControls() {
    const filter = state.filters[state.tab];
    elements.search.value = filter.search;
    elements.sort.value = filter.sort;
    updateToolbarLabels();
    populateClubs();
  }

  function saveFilterControls() {
    const filter = state.filters[state.tab];
    filter.search = elements.search.value;
    filter.club = elements.club.value;
    filter.status = elements.status.value;
    filter.level = elements.level.value;
    filter.participation = elements.participation.value;
    filter.sort = elements.sort.value;
    filter.attention = "";
  }

  function renderDetail() {
    const item = selectedItem();
    elements.detail.innerHTML = renderCommunityDetail(state.tab, item);
    elements.sheet.innerHTML = renderCommunityDetail(state.tab, item, true);
  }

  function renderAttention() {
    document.querySelector("#community-attention").innerHTML = `<header><span>!</span><div><span class="eyebrow">Operational hygiene</span><h3>Needs Attention</h3></div></header><button type="button" data-attention="incomplete"><strong>12</strong><span>Incomplete profiles</span><i>→</i></button><button type="button" data-attention="invited"><strong>${state.invitations.filter((item) => item.status === "pending").length}</strong><span>Pending invitations</span><i>→</i></button><button type="button" data-attention="conflict"><strong>3</strong><span>Officials with conflicts</span><i>→</i></button>`;
  }

  function render() {
    const result = filteredItems();
    updateCommunityTabs(state.tab);
    sessionStorage.setItem("padeuce-community-view", state.view);
    document.querySelectorAll("[data-community-view]").forEach((button) => {
      const active = button.dataset.communityView === state.view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.primary.innerHTML = state.tab === "teams" ? "＋ Add Team" : "＋ Add Person";
    document.querySelector("#community-directory-title").textContent = communityTabLabels[state.tab];
    elements.count.textContent = `${result.length} ${communityTabLabels[state.tab].toLowerCase()}`;
    renderDetail();
    renderAttention();
    if (!result.length) {
      elements.collection.className = "community-collection";
      elements.collection.innerHTML = `<div class="empty-state community-empty-state"><span>◉</span><h3>No ${communityTabLabels[state.tab].toLowerCase()} found.</h3><p>Clear filters to return to the full community directory.</p><button class="button secondary" type="button" data-clear-community-filters>Clear filters</button></div>`;
      return;
    }
    elements.collection.className = `community-collection community-${state.view}-view`;
    if (state.view === "card") elements.collection.innerHTML = renderCommunityCards(state.tab, result, state.selected[state.tab]);
    else elements.collection.innerHTML = `${renderCommunityTable(state.tab, result, state.selected[state.tab])}<div class="mobile-community-cards">${renderCommunityCards(state.tab, result, state.selected[state.tab])}</div>`;
  }

  function showLoading() {
    elements.collection.className = "community-collection community-loading";
    elements.collection.innerHTML = renderCommunitySkeletons();
  }

  function switchTab(tab, focus = false) {
    if (!state.data[tab]) return;
    state.tab = tab;
    loadFilterControls();
    render();
    if (focus) document.querySelector(`[data-community-tab="${tab}"]`)?.focus();
  }

  function clearFilters() {
    state.filters[state.tab] = defaultFilters();
    loadFilterControls();
    render();
  }

  function selectItem(id, shouldOpenSheet = true) {
    const tab = findItemTab(id);
    if (tab !== state.tab) state.tab = tab;
    state.selected[state.tab] = id;
    render();
    if (shouldOpenSheet && window.innerWidth < 1200) openSheet();
  }

  function openSheet() {
    elements.sheet.hidden = false;
    elements.sheetScrim.hidden = false;
    document.body.classList.add("community-sheet-open");
    elements.sheet.querySelector("[data-close-community-sheet]")?.focus();
  }

  function closeSheet() {
    if (elements.sheet.hidden) return;
    elements.sheet.hidden = true;
    elements.sheetScrim.hidden = true;
    document.body.classList.remove("community-sheet-open");
    document.querySelector(`[data-community-id="${CSS.escape(state.selected[state.tab])}"] button`)?.focus();
  }

  function allRecipients() {
    return Object.values(state.data).flat();
  }

  function openPersonWizard() {
    state.personStep = 0;
    state.personDraft = newPersonDraft();
    host.openDialog({ title: "Add a person", body: addPersonWizardTemplate(state.personStep, state.personDraft), wide: true });
  }

  function updatePersonWizard() {
    document.querySelector("#modal-body").innerHTML = addPersonWizardTemplate(state.personStep, state.personDraft);
  }

  function addPerson(sendInvite = false, draft = false) {
    const data = state.personDraft;
    const displayName = data.displayName || `${data.firstName} ${data.lastName}`.trim() || "New Community Member";
    const id = `${data.role.toLowerCase()}-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    if (data.role === "Player") {
      state.data.players.unshift({ id, firstName: data.firstName, lastName: data.lastName, displayName, initials: `${data.firstName[0] || "N"}${data.lastName[0] || "P"}`, email: data.email, mobile: data.mobile, club: data.club, level: Number(data.level), preferredSide: data.preferredSide, dominantHand: data.dominantHand, status: draft ? "incomplete" : sendInvite ? "invited" : "active", matches: 0, wins: 0, losses: 0, winRate: 0, currentStreak: 0, ranking: 0, currentTeam: "Unassigned", regularPartner: "Unassigned", coach: "Unassigned", averageDuration: 0, recentForm: [], notes: "New community profile.", participation: "0 competitions" });
      state.selected.players = id;
      state.tab = "players";
    } else if (data.role === "Coach") {
      state.data.coaches.unshift({ id, displayName, initials: `${data.firstName[0] || "N"}${data.lastName[0] || "C"}`, email: data.email, mobile: data.mobile, club: data.club, speciality: data.speciality, status: draft ? "pending approval" : data.availability.toLowerCase(), playersAssigned: 0, teamsAssigned: 0, certification: data.certification || "Pending", contactStatus: sendInvite ? "Invited" : "Verified", upcoming: [], notes: "New coaching profile." });
      state.selected.coaches = id;
      state.tab = "coaches";
    } else {
      state.data.officials.unshift({ id, displayName, initials: `${data.firstName[0] || "N"}${data.lastName[0] || "O"}`, email: data.email, mobile: data.mobile, club: data.club, role: data.officialRole, certification: data.certification || "Pending", status: draft ? "pending approval" : data.availability.toLowerCase(), assignedCourt: "Unassigned", assignedMatch: "Unassigned", nextAssignment: "None", availability: data.availability, contactStatus: sendInvite ? "Invited" : "Verified", conflicts: 0, incidents: [], notes: "New official profile." });
      state.selected.officials = id;
      state.tab = "officials";
    }
    if (sendInvite) state.invitations.unshift({ id: `invite-${Date.now()}`, recipient: displayName, type: "Join Padeuce", status: "pending", sentAt: "Just now" });
    persistData();
    host.closeDialog();
    loadFilterControls();
    render();
    host.showToast(`${displayName} ${draft ? "saved as draft" : "added to Community"}`);
    host.announce(`${displayName} added successfully`);
  }

  function openAddTeam() {
    host.openDialog({ title: "Add a new team", body: addTeamTemplate(state.data.players), wide: true });
  }

  function addTeam(form) {
    const formData = new FormData(form);
    if (formData.get("player1") === formData.get("player2")) {
      form.querySelector("[data-team-error]").hidden = false;
      return;
    }
    const player1 = state.data.players.find((player) => player.id === formData.get("player1"));
    const player2 = state.data.players.find((player) => player.id === formData.get("player2"));
    const name = formData.get("name") || `${player1.firstName[0]} / ${player2.firstName[0]}`;
    const id = `team-${Date.now()}`;
    state.data.teams.unshift({ id, name, playerNames: [player1.displayName, player2.displayName], club: formData.get("club"), seed: Number(formData.get("seed")), group: formData.get("group"), status: formData.get("status"), matches: 0, wins: 0, losses: 0, winRate: 0, competitions: [], ranking: 0, duration: "New partnership", formation: `${player1.preferredSide} / ${player2.preferredSide}`, notes: formData.get("notes") || "New team.", recentResults: [] });
    player1.currentTeam = name;
    player1.regularPartner = player2.displayName;
    player2.currentTeam = name;
    player2.regularPartner = player1.displayName;
    state.selected.teams = id;
    persistData();
    host.closeDialog();
    loadFilterControls();
    render();
    host.showToast(`${name} added successfully`);
    host.announce(`Team ${name} created`);
  }

  function openInvitation(id = "") {
    host.openDialog({ title: "Send an invitation", body: invitationTemplate(allRecipients(), id), wide: true });
  }

  function sendInvitation(form) {
    const data = new FormData(form);
    const item = findItem(data.get("recipient"));
    if (!item) return;
    if ("status" in item) item.status = findItemTab(item.id) === "teams" ? "pending invitation" : item.status === "active" ? "invited" : item.status;
    state.invitations.unshift({ id: `invite-${Date.now()}`, recipient: communityItemName(item), type: data.get("type"), status: "pending", sentAt: "Just now" });
    state.activity.unshift({ title: `${data.get("type")} invitation sent`, person: communityItemName(item), time: "Just now" });
    persistData();
    host.closeDialog();
    render();
    host.showToast(`Invitation sent to ${communityItemName(item)}`);
    host.announce(`Invitation sent to ${communityItemName(item)}`);
  }

  function csvRows(scope) {
    if (scope === "view") {
      return [["Type", "Name", "Club", "Status", "Email"], ...filteredItems().map((item) => [communityTabLabels[state.tab].slice(0, -1), communityItemName(item), item.club, item.status, item.email || ""])];
    }
    const tabs = scope === "all" ? ["players", "teams", "coaches", "officials"] : [scope];
    return [["Type", "Name", "Club", "Status", "Email"], ...tabs.flatMap((tab) => state.data[tab].map((item) => [communityTabLabels[tab].slice(0, -1), communityItemName(item), item.club, item.status, item.email || ""]))];
  }

  function downloadCsv(scope) {
    const csv = csvRows(scope).map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `padeuce-community-${scope}.csv`;
    link.click();
  }

  function openSimpleAssignment(item, action) {
    state.modalItemId = item.id;
    const label = action.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    const choices = {
      "assign-coach": state.data.coaches.map((coach) => coach.displayName),
      "add-team": state.data.teams.filter((team) => team.status === "active").map((team) => team.name),
      "assign-player": state.data.players.map((player) => player.displayName),
      "assign-team": state.data.teams.map((team) => team.name),
      "assign-match": ["Match 4 · Quarter Final", "Match 8 · Group A", "Match 13 · Semi Final"],
      "assign-court": ["Court 1", "Court 3", "Court 5", "Court 7"],
      "enter-tournament": ["Challenger 2026", "Schools Cup 2026", "Winter League"],
      "replace-player": state.data.players.map((player) => player.displayName),
      "change-seed": Array.from({ length: 16 }, (_, index) => String(index + 1)),
      availability: ["Available", "Assigned", "Unavailable"],
    }[action] || ["Challenger 2026"];
    host.openDialog({ title: `${label} · ${communityItemName(item)}`, body: `<form class="community-modal-form" data-community-form="assignment"><input type="hidden" name="action" value="${escapeCommunityMarkup(action)}"><label>${label}<select name="assignment">${choices.map((choice) => `<option>${escapeCommunityMarkup(choice)}</option>`).join("")}</select></label><label>Operational note<textarea name="note" rows="3"></textarea></label><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Confirm Assignment</button></div></form>` });
  }

  function handleAction(action, id) {
    const item = findItem(id);
    if (!item) return;
    state.modalItemId = id;
    if (action === "select") selectItem(id);
    if (action === "invite") openInvitation(id);
    if (["assign-coach", "add-team", "assign-player", "assign-team", "assign-match", "assign-court", "enter-tournament", "replace-player", "change-seed", "availability"].includes(action)) openSimpleAssignment(item, action);
    if (action === "message") host.openDialog({ title: `Message ${communityItemName(item)}`, body: `<form class="community-modal-form" data-community-form="message"><label>Message<textarea name="message" rows="5" required autofocus></textarea></label><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Send Message</button></div></form>` });
    if (action === "disband") host.openDialog({ title: `Disband ${communityItemName(item)}?`, body: `<form class="community-modal-form" data-community-form="disband"><div class="community-danger-panel"><span>!</span><p>The partnership will be marked as disbanded. Player profiles and historical results remain available.</p></div><label>Reason<textarea name="reason" rows="3" required></textarea></label><div class="dialog-actions"><button class="button secondary" type="button" data-close-modal>Keep Team</button><button class="button danger-button" type="submit">Disband Team</button></div></form>` });
    if (action === "export-item") {
      downloadCsv(findItemTab(id));
      host.showToast(`${communityItemName(item)} report exported`);
    }
    if (["profile", "edit", "schedule", "add-note"].includes(action)) host.showToast(`${communityItemName(item)} ${action === "profile" ? "profile" : action} opened`);
  }

  function handleForm(form) {
    const type = form.dataset.communityForm;
    if (type === "add-team") return addTeam(form);
    if (type === "invitation") return sendInvitation(form);
    if (type === "import") {
      host.closeDialog();
      host.showToast("Community records validated and imported");
      host.announce("Community import completed");
      return;
    }
    if (type === "export") {
      downloadCsv(new FormData(form).get("scope"));
      host.closeDialog();
      host.showToast("Community CSV downloaded");
      return;
    }
    const item = findItem(state.modalItemId);
    if (!item) return;
    if (type === "assignment") {
      const data = new FormData(form);
      const action = data.get("action");
      if (action === "assign-coach" && "coach" in item) item.coach = data.get("assignment");
      if (action === "add-team" && "currentTeam" in item) item.currentTeam = data.get("assignment");
      if (action === "availability") item.status = String(data.get("assignment")).toLowerCase();
      if (action === "change-seed" && "seed" in item) item.seed = Number(data.get("assignment"));
      if (action === "enter-tournament" && "competitions" in item && !item.competitions.includes(data.get("assignment"))) item.competitions.push(data.get("assignment"));
      if (action === "assign-match" && "assignedMatch" in item) item.assignedMatch = data.get("assignment");
      if (action === "assign-court" && "assignedCourt" in item) item.assignedCourt = data.get("assignment");
      if (action === "assign-player" && "playersAssigned" in item) item.playersAssigned += 1;
      if (action === "assign-team" && "teamsAssigned" in item) item.teamsAssigned += 1;
      if (action === "replace-player" && "playerNames" in item) item.playerNames[1] = data.get("assignment");
      host.showToast(`${communityItemName(item)} assignment updated`);
    }
    if (type === "message") host.showToast(`Message sent to ${communityItemName(item)}`);
    if (type === "disband") {
      item.status = "disbanded";
      host.showToast(`${communityItemName(item)} disbanded`);
    }
    persistData();
    host.closeDialog();
    render();
    host.announce(`${communityItemName(item)} updated`);
  }

  function bindEvents() {
    elements.tabs.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-community-tab]");
      if (tab) switchTab(tab.dataset.communityTab);
    });
    elements.tabs.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      switchTab(adjacentCommunityTab(state.tab, event.key === "ArrowRight" ? 1 : -1), true);
    });
    [elements.club, elements.status, elements.level, elements.participation, elements.sort].forEach((control) => control.addEventListener("change", () => {
      saveFilterControls();
      render();
    }));
    elements.search.addEventListener("input", () => {
      saveFilterControls();
      render();
    });
    elements.page.addEventListener("click", (event) => {
      const view = event.target.closest("[data-community-view]");
      if (view) {
        state.view = view.dataset.communityView;
        render();
        return;
      }
      if (event.target.closest("[data-clear-community-filters]")) {
        clearFilters();
        return;
      }
      const attention = event.target.closest("[data-attention]");
      if (attention) {
        const key = attention.dataset.attention;
        if (key === "conflict") switchTab("officials");
        else switchTab("players");
        state.filters[state.tab].attention = key;
        render();
        return;
      }
      const more = event.target.closest("[data-community-more]");
      if (more) {
        const menu = document.querySelector(`[data-community-menu="${CSS.escape(more.dataset.communityMore)}"]`);
        const open = menu.hidden;
        document.querySelectorAll("[data-community-menu]").forEach((item) => { item.hidden = true; });
        menu.hidden = !open;
        more.setAttribute("aria-expanded", String(open));
        return;
      }
      const action = event.target.closest("[data-community-action]");
      if (action) {
        handleAction(action.dataset.communityAction, action.dataset.communityId);
        return;
      }
      const selectable = event.target.closest("[data-community-id]");
      if (selectable) selectItem(selectable.dataset.communityId);
    });
    elements.primary.addEventListener("click", () => state.tab === "teams" ? openAddTeam() : openPersonWizard());
    document.querySelector("#community-invite-button").addEventListener("click", () => openInvitation());
    document.querySelector("#community-import-button").addEventListener("click", () => host.openDialog({ title: "Import community data", body: communityImportTemplate(), wide: true }));
    document.querySelector("#community-export-button").addEventListener("click", () => host.openDialog({ title: "Export community data", body: communityExportTemplate(state.tab), wide: true }));
    document.querySelector("#community-filter-toggle").addEventListener("click", () => {
      const filters = document.querySelector("#community-filter-grid");
      const expanded = !filters.classList.contains("expanded");
      filters.classList.toggle("expanded", expanded);
      document.querySelector("#community-filter-toggle").setAttribute("aria-expanded", String(expanded));
    });
    elements.sheetScrim.addEventListener("click", closeSheet);
    elements.sheet.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-community-sheet]")) {
        event.stopPropagation();
        closeSheet();
        return;
      }
      const action = event.target.closest("[data-community-action]");
      if (action) {
        event.stopPropagation();
        handleAction(action.dataset.communityAction, action.dataset.communityId);
      }
    });
    document.addEventListener("click", (event) => {
      const role = event.target.closest("[data-person-role]");
      if (role) {
        state.personDraft.role = role.dataset.personRole;
        updatePersonWizard();
      }
      if (event.target.closest("[data-person-back]")) {
        if (!state.personStep) host.closeDialog();
        else {
          state.personStep -= 1;
          updatePersonWizard();
        }
      }
      if (event.target.closest("[data-person-next]")) {
        if (state.personStep < 4) {
          state.personStep += 1;
          updatePersonWizard();
        } else addPerson();
      }
      const save = event.target.closest("[data-person-save]");
      if (save) addPerson(save.dataset.personSave === "invite", save.dataset.personSave === "draft");
    });
    document.addEventListener("input", (event) => {
      const field = event.target.closest("[data-person-draft]");
      if (!field) return;
      state.personDraft[field.dataset.personDraft] = field.value;
      if (field.dataset.personDraft === "firstName" || field.dataset.personDraft === "lastName") {
        state.personDraft.displayName = `${state.personDraft.firstName} ${state.personDraft.lastName}`.trim();
      }
    });
    document.addEventListener("change", (event) => {
      const field = event.target.closest("[data-person-draft]");
      if (field) state.personDraft[field.dataset.personDraft] = field.value;
    });
    document.addEventListener("submit", (event) => {
      const note = event.target.closest("[data-community-note]");
      if (note) {
        event.preventDefault();
        const item = findItem(note.dataset.communityNote);
        item.notes = new FormData(note).get("note");
        persistData();
        host.showToast("Admin note saved");
        host.announce("Admin note saved");
        return;
      }
      const form = event.target.closest("[data-community-form]");
      if (!form) return;
      event.preventDefault();
      handleForm(form);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.sheet.hidden) {
        event.preventDefault();
        closeSheet();
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

  function activate() {
    state.routeActive = true;
    if (!state.initialized) {
      state.initialized = true;
      showLoading();
      window.setTimeout(render, 260);
    } else render();
  }

  function deactivate() {
    state.routeActive = false;
    closeSheet();
  }

  loadFilterControls();
  bindEvents();
  renderSummary();
  renderAttention();
  renderDetail();
  return { activate, deactivate, render };
}
