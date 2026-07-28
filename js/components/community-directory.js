import {
  communityAvatar,
  communityStatusBadge,
  escapeCommunityMarkup,
} from "./community-utils.js";

function actionCell(item, tab) {
  return `
    <div class="community-row-actions">
      <button class="button compact secondary" type="button" data-community-action="select" data-community-id="${escapeCommunityMarkup(item.id)}">View</button>
      <button class="icon-button small" type="button" data-community-more="${escapeCommunityMarkup(item.id)}" aria-label="More options" aria-expanded="false">•••</button>
      <div class="mini-menu community-item-menu" data-community-menu="${escapeCommunityMarkup(item.id)}" hidden>
        <button type="button" data-community-action="message" data-community-id="${escapeCommunityMarkup(item.id)}">Send message</button>
        <button type="button" data-community-action="invite" data-community-id="${escapeCommunityMarkup(item.id)}">Send invitation</button>
        <button type="button" data-community-action="${tab === "teams" ? "disband" : "export-item"}" data-community-id="${escapeCommunityMarkup(item.id)}">${tab === "teams" ? "Disband team" : "Export record"}</button>
      </div>
    </div>
  `;
}

function playerRow(player, selected) {
  return `<tr class="community-directory-row ${selected ? "selected" : ""}" data-community-id="${escapeCommunityMarkup(player.id)}"><td><button class="person-cell" type="button" data-community-action="select" data-community-id="${escapeCommunityMarkup(player.id)}">${communityAvatar(player)}<span><strong>${escapeCommunityMarkup(player.displayName)}</strong><small>${escapeCommunityMarkup(player.email)}</small></span></button></td><td>${escapeCommunityMarkup(player.club)}</td><td><strong class="level-value">${player.level.toFixed(2)}</strong></td><td>${escapeCommunityMarkup(player.preferredSide)}</td><td>${player.matches}</td><td><strong>${player.winRate}%</strong></td><td>${escapeCommunityMarkup(player.currentTeam)}</td><td>${communityStatusBadge(player.status)}</td><td>${actionCell(player, "players")}</td></tr>`;
}

function teamRow(team, selected) {
  return `<tr class="community-directory-row ${selected ? "selected" : ""}" data-community-id="${escapeCommunityMarkup(team.id)}"><td><button class="team-cell" type="button" data-community-action="select" data-community-id="${escapeCommunityMarkup(team.id)}"><span class="team-mark">${escapeCommunityMarkup(team.name)}</span><strong>${escapeCommunityMarkup(team.name)}</strong></button></td><td><strong>${escapeCommunityMarkup(team.playerNames.join(" & "))}</strong></td><td>${escapeCommunityMarkup(team.club)}</td><td>${team.seed}</td><td>${team.matches}</td><td><strong>${team.winRate}%</strong></td><td>${escapeCommunityMarkup(team.competitions.join(", "))}</td><td>${communityStatusBadge(team.status)}</td><td>${actionCell(team, "teams")}</td></tr>`;
}

function coachRow(coach, selected) {
  return `<tr class="community-directory-row ${selected ? "selected" : ""}" data-community-id="${escapeCommunityMarkup(coach.id)}"><td><button class="person-cell" type="button" data-community-action="select" data-community-id="${escapeCommunityMarkup(coach.id)}">${communityAvatar(coach)}<span><strong>${escapeCommunityMarkup(coach.displayName)}</strong><small>${escapeCommunityMarkup(coach.email)}</small></span></button></td><td>${escapeCommunityMarkup(coach.club)}</td><td><strong>${coach.playersAssigned}</strong></td><td>${coach.teamsAssigned}</td><td>${escapeCommunityMarkup(coach.speciality)}</td><td>${communityStatusBadge(coach.status)}</td><td>${escapeCommunityMarkup(coach.contactStatus)}</td><td>${actionCell(coach, "coaches")}</td></tr>`;
}

function officialRow(official, selected) {
  return `<tr class="community-directory-row ${official.conflicts ? "has-conflict" : ""} ${selected ? "selected" : ""}" data-community-id="${escapeCommunityMarkup(official.id)}"><td><button class="person-cell" type="button" data-community-action="select" data-community-id="${escapeCommunityMarkup(official.id)}">${communityAvatar(official)}<span><strong>${escapeCommunityMarkup(official.displayName)}</strong><small>${escapeCommunityMarkup(official.email)}</small></span></button></td><td>${escapeCommunityMarkup(official.role)}</td><td>${escapeCommunityMarkup(official.certification)}</td><td>${escapeCommunityMarkup(official.assignedCourt)}</td><td>${escapeCommunityMarkup(official.assignedMatch)}</td><td>${communityStatusBadge(official.status)}</td><td>${escapeCommunityMarkup(official.contactStatus)}${official.conflicts ? '<small class="conflict-copy">! Schedule conflict</small>' : ""}</td><td>${actionCell(official, "officials")}</td></tr>`;
}

const headings = {
  players: ["Player", "Club", "Level", "Preferred Side", "Matches", "Win Rate", "Current Team", "Status", "Actions"],
  teams: ["Team", "Players", "Club", "Seed", "Matches", "Win Rate", "Current Competitions", "Status", "Actions"],
  coaches: ["Coach", "Club", "Players", "Teams", "Speciality", "Availability", "Contact", "Actions"],
  officials: ["Official", "Role", "Certification", "Court", "Match", "Availability", "Contact", "Actions"],
};

export function renderCommunityTable(tab, items, selectedId) {
  const renderer = { players: playerRow, teams: teamRow, coaches: coachRow, officials: officialRow }[tab];
  return `<div class="community-table-scroll"><table class="community-table community-table-${tab}"><thead><tr>${headings[tab].map((heading) => `<th scope="col">${heading}</th>`).join("")}</tr></thead><tbody>${items.map((item) => renderer(item, item.id === selectedId)).join("")}</tbody></table></div>`;
}

function playerCard(player, selected) {
  return `<article class="community-card player-directory-card ${selected ? "selected" : ""}" data-community-id="${escapeCommunityMarkup(player.id)}"><header>${communityAvatar(player, "large")}<div><h3>${escapeCommunityMarkup(player.displayName)}</h3><p>${escapeCommunityMarkup(player.club)}</p></div>${communityStatusBadge(player.status)}</header><dl><div><dt>Level</dt><dd>${player.level.toFixed(2)}</dd></div><div><dt>Win rate</dt><dd>${player.winRate}%</dd></div><div><dt>Matches</dt><dd>${player.matches}</dd></div><div><dt>Preferred</dt><dd>${escapeCommunityMarkup(player.preferredSide)}</dd></div><div><dt>Team</dt><dd>${escapeCommunityMarkup(player.currentTeam)}</dd></div></dl><footer><button class="button secondary compact" type="button" data-community-action="select" data-community-id="${escapeCommunityMarkup(player.id)}">View Profile</button>${actionCell(player, "players")}</footer></article>`;
}

function teamCard(team, selected) {
  return `<article class="community-card team-directory-card ${selected ? "selected" : ""}" data-community-id="${escapeCommunityMarkup(team.id)}"><header><span class="team-mark large">${escapeCommunityMarkup(team.name)}</span><div><h3>${escapeCommunityMarkup(team.name)}</h3><p>${escapeCommunityMarkup(team.club)}</p></div>${communityStatusBadge(team.status)}</header><div class="card-player-pair"><span>${escapeCommunityMarkup(team.playerNames[0])}</span><i>+</i><span>${escapeCommunityMarkup(team.playerNames[1])}</span></div><dl><div><dt>Seed</dt><dd>${team.seed}</dd></div><div><dt>Matches</dt><dd>${team.matches}</dd></div><div><dt>Win rate</dt><dd>${team.winRate}%</dd></div><div><dt>Ranking</dt><dd>#${team.ranking}</dd></div></dl><footer><button class="button secondary compact" type="button" data-community-action="select" data-community-id="${escapeCommunityMarkup(team.id)}">View Team</button>${actionCell(team, "teams")}</footer></article>`;
}

function roleCard(item, selected, tab) {
  const isCoach = tab === "coaches";
  return `<article class="community-card role-directory-card ${selected ? "selected" : ""}" data-community-id="${escapeCommunityMarkup(item.id)}"><header>${communityAvatar(item, "large")}<div><h3>${escapeCommunityMarkup(item.displayName)}</h3><p>${escapeCommunityMarkup(item.club)}</p></div>${communityStatusBadge(item.status)}</header><div class="role-speciality"><span>${isCoach ? "Speciality" : "Role"}</span><strong>${escapeCommunityMarkup(isCoach ? item.speciality : item.role)}</strong></div><dl>${isCoach ? `<div><dt>Players</dt><dd>${item.playersAssigned}</dd></div><div><dt>Teams</dt><dd>${item.teamsAssigned}</dd></div>` : `<div><dt>Court</dt><dd>${escapeCommunityMarkup(item.assignedCourt)}</dd></div><div><dt>Conflicts</dt><dd>${item.conflicts}</dd></div>`}<div><dt>Contact</dt><dd>${escapeCommunityMarkup(item.contactStatus)}</dd></div></dl><footer><button class="button secondary compact" type="button" data-community-action="select" data-community-id="${escapeCommunityMarkup(item.id)}">View ${isCoach ? "Coach" : "Official"}</button>${actionCell(item, tab)}</footer></article>`;
}

export function renderCommunityCards(tab, items, selectedId) {
  return `<div class="community-card-grid">${items.map((item) => {
    if (tab === "players") return playerCard(item, item.id === selectedId);
    if (tab === "teams") return teamCard(item, item.id === selectedId);
    return roleCard(item, item.id === selectedId, tab);
  }).join("")}</div>`;
}

export function renderCommunitySkeletons() {
  return `<div class="community-card-grid">${Array.from({ length: 6 }, () => '<article class="community-skeleton"><span></span><i></i><i></i><b></b></article>').join("")}</div>`;
}
