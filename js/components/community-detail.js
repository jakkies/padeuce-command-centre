import {
  communityAvatar,
  communityStatusBadge,
  escapeCommunityMarkup,
  resultChips,
} from "./community-utils.js";

function fact(label, value) {
  return `<div><span>${escapeCommunityMarkup(label)}</span><strong>${escapeCommunityMarkup(value)}</strong></div>`;
}

function detailHeader(item, eyebrow, mobile) {
  return `<header class="community-detail-header"><div class="profile-heading">${communityAvatar(item, "profile")}<div><span class="eyebrow">${escapeCommunityMarkup(eyebrow)}</span><h2>${escapeCommunityMarkup(item.displayName || item.name)}</h2><p>${escapeCommunityMarkup(item.club)}</p>${communityStatusBadge(item.status)}</div></div><div class="detail-header-actions"><button class="text-button" type="button" data-community-action="edit" data-community-id="${escapeCommunityMarkup(item.id)}">Edit</button>${mobile ? '<button class="icon-button" type="button" data-close-community-sheet aria-label="Close profile details">×</button>' : ""}</div></header>`;
}

function actions(item, definitions) {
  return `<div class="community-quick-actions">${definitions.map(([key, label, icon, danger]) => `<button class="${danger ? "danger-action" : key === "profile" ? "primary-action" : ""}" type="button" data-community-action="${key}" data-community-id="${escapeCommunityMarkup(item.id)}"><span>${icon}</span>${label}</button>`).join("")}</div>`;
}

function noteEditor(item) {
  return `<form class="community-note-form" data-community-note="${escapeCommunityMarkup(item.id)}"><label>Admin note<textarea name="note" rows="3">${escapeCommunityMarkup(item.notes)}</textarea></label><button class="button secondary compact" type="submit">Save Note</button></form>`;
}

function playerDetail(player, mobile) {
  const recentMatches = [
    ["W", "6–4, 3–6, 6–4", "Leo / David"],
    ["W", "6–2, 6–3", "Sara / Julia"],
    ["L", "4–6, 6–3, 8–10", "G / N"],
  ];
  return `${detailHeader(player, `${player.level.toFixed(2)} level · ${player.preferredSide} side`, mobile)}
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Performance</span><h3>Key statistics</h3></div><div class="profile-stat-grid">${fact("Matches", player.matches)}${fact("Wins", player.wins)}${fact("Losses", player.losses)}${fact("Win rate", `${player.winRate}%`)}${fact("Current streak", `${player.currentStreak} wins`)}${fact("Ranking", `#${player.ranking}`)}${fact("Avg. duration", `${player.averageDuration} min`)}</div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Relationships</span><h3>Current connections</h3></div><div class="connection-list">${fact("Current team", player.currentTeam)}${fact("Regular partner", player.regularPartner)}${fact("Coach", player.coach)}${fact("Club", player.club)}</div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Last five</span><h3>Recent form</h3></div>${resultChips(player.recentForm)}<div class="recent-community-matches">${recentMatches.map(([result, score, opponent]) => `<div><span class="${result === "W" ? "win" : "loss"}">${result}</span><strong>${score}</strong><small>vs ${opponent}</small></div>`).join("")}</div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Controls</span><h3>Quick actions</h3></div>${actions(player, [["profile", "View Full Profile", "↗"], ["invite", "Invite to Tournament", "✉"], ["add-team", "Add to Team", "＋"], ["assign-coach", "Assign Coach", "◎"], ["message", "Send Message", "→"], ["export-item", "Export Player Report", "↓"]])}</section>
    <section class="community-detail-section">${noteEditor(player)}</section>`;
}

function teamDetail(team, mobile) {
  const shellItem = { ...team, displayName: team.name, initials: team.name.replaceAll(" ", "").replace("/", "") };
  return `${detailHeader(shellItem, `Seed ${team.seed} · Rank #${team.ranking}`, mobile)}
    <section class="community-detail-section"><div class="team-partners"><div>${communityAvatar({ initials: team.playerNames[0].split(" ").map((part) => part[0]).join("") })}<strong>${escapeCommunityMarkup(team.playerNames[0])}</strong></div><span>+</span><div>${communityAvatar({ initials: team.playerNames[1].split(" ").map((part) => part[0]).join("") })}<strong>${escapeCommunityMarkup(team.playerNames[1])}</strong></div></div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Partnership</span><h3>Team performance</h3></div><div class="profile-stat-grid">${fact("Matches", team.matches)}${fact("Wins", team.wins)}${fact("Losses", team.losses)}${fact("Win rate", `${team.winRate}%`)}${fact("Duration", team.duration)}${fact("Formation", team.formation)}</div><div class="connection-list">${fact("Competitions", team.competitions.join(", "))}${fact("Group", team.group)}</div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Last three</span><h3>Recent results</h3></div><div class="team-results">${team.recentResults.map((result) => `<span class="${result.startsWith("W") ? "win" : "loss"}">${escapeCommunityMarkup(result)}</span>`).join("")}</div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Controls</span><h3>Quick actions</h3></div>${actions(team, [["profile", "View Team Profile", "↗"], ["enter-tournament", "Enter Tournament", "◈"], ["replace-player", "Replace Player", "⇄"], ["change-seed", "Change Seed", "#"], ["message", "Send Message", "→"], ["disband", "Disband Team", "×", true]])}</section>
    <section class="community-detail-section">${noteEditor(team)}</section>`;
}

function coachDetail(coach, mobile) {
  return `${detailHeader(coach, coach.speciality, mobile)}
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Overview</span><h3>Coaching profile</h3></div><div class="profile-stat-grid">${fact("Players assigned", coach.playersAssigned)}${fact("Teams assigned", coach.teamsAssigned)}${fact("Certification", coach.certification)}${fact("Availability", coach.status)}${fact("Contact", coach.contactStatus)}</div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Schedule</span><h3>Upcoming sessions</h3></div><div class="upcoming-community-list">${coach.upcoming.map((item) => `<div><span>◇</span><strong>${escapeCommunityMarkup(item)}</strong></div>`).join("") || "<p>No sessions scheduled.</p>"}</div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Controls</span><h3>Quick actions</h3></div>${actions(coach, [["assign-player", "Assign Player", "＋"], ["assign-team", "Assign Team", "◎"], ["availability", "Update Availability", "◷"], ["add-note", "Add Note", "◇"], ["message", "Send Message", "→"], ["edit", "Edit Profile", "⚙"]])}</section>
    <section class="community-detail-section">${noteEditor(coach)}</section>`;
}

function officialDetail(official, mobile) {
  return `${detailHeader(official, `${official.role} · ${official.certification}`, mobile)}
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Operations</span><h3>Current assignment</h3></div><div class="connection-list">${fact("Assigned court", official.assignedCourt)}${fact("Assigned match", official.assignedMatch)}${fact("Next assignment", official.nextAssignment)}${fact("Availability", official.availability)}${fact("Contact", official.contactStatus)}</div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Audit trail</span><h3>Incident history</h3></div><div class="upcoming-community-list">${official.incidents.map((item) => `<div><span>!</span><strong>${escapeCommunityMarkup(item)}</strong></div>`).join("") || "<p>No incidents recorded.</p>"}</div></section>
    <section class="community-detail-section"><div class="detail-section-title"><span class="eyebrow">Controls</span><h3>Quick actions</h3></div>${actions(official, [["assign-match", "Assign Match", "◎"], ["assign-court", "Assign Court", "▦"], ["availability", "Update Availability", "◷"], ["message", "Send Message", "→"], ["schedule", "View Full Schedule", "⌁"]])}</section>
    <section class="community-detail-section">${noteEditor(official)}</section>`;
}

export function renderCommunityDetail(tab, item, mobile = false) {
  const handle = { players: playerDetail, teams: teamDetail, coaches: coachDetail, officials: officialDetail }[tab];
  return `${mobile ? '<div class="sheet-handle"></div>' : ""}${handle(item, mobile)}`;
}
