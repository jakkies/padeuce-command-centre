import {
  escapeMatchMarkup,
  matchPrimaryAction,
  matchPrimaryActionKey,
  matchScoreText,
  matchStatusBadge,
} from "./match-utils.js";

function teamMarkup(team, alignment = "") {
  return `<div class="match-team ${alignment}"><strong>${escapeMatchMarkup(team.short)}</strong><small>${escapeMatchMarkup(team.players.join(" · "))}</small></div>`;
}

export function renderMatchRow(match, selected) {
  return `
    <article class="match-table-row ${selected ? "selected" : ""}" data-match-id="${escapeMatchMarkup(match.id)}" tabindex="0" role="button" aria-label="Select ${escapeMatchMarkup(match.teamA.short)} versus ${escapeMatchMarkup(match.teamB.short)}">
      <div>${matchStatusBadge(match.status)}</div>
      <time datetime="${escapeMatchMarkup(`${match.date}T${match.start}`)}"><strong>${escapeMatchMarkup(match.start)}</strong><small>${match.date === "2026-07-28" ? "Today" : "Tomorrow"}</small></time>
      <div class="row-court"><strong>${escapeMatchMarkup(match.court)}</strong><small>${escapeMatchMarkup(match.official)}</small></div>
      <div class="row-tournament"><strong>${escapeMatchMarkup(match.tournament)}</strong><small>${escapeMatchMarkup(match.format)}</small></div>
      <span class="row-round">${escapeMatchMarkup(match.round)}</span>
      ${teamMarkup(match.teamA, "team-a")}
      <strong class="row-score">${escapeMatchMarkup(matchScoreText(match))}</strong>
      ${teamMarkup(match.teamB, "team-b")}
      <span class="row-duration">${match.duration ? `${match.duration} min` : "—"}</span>
      <div class="row-actions">
        <button class="button compact ${match.status === "live" || match.status === "waiting" || match.status === "review" ? "primary" : "secondary"}" type="button" data-match-action="${matchPrimaryActionKey(match)}" data-match="${escapeMatchMarkup(match.id)}">${escapeMatchMarkup(matchPrimaryAction(match))}</button>
        <button class="icon-button small" type="button" data-match-more="${escapeMatchMarkup(match.id)}" aria-label="More actions" aria-expanded="false">•••</button>
        <div class="mini-menu match-row-menu" data-match-menu="${escapeMatchMarkup(match.id)}" hidden>
          <button type="button" data-match-action="reschedule" data-match="${escapeMatchMarkup(match.id)}">Edit schedule</button>
          <button type="button" data-match-action="move" data-match="${escapeMatchMarkup(match.id)}">Move court</button>
          <button type="button" data-match-action="share" data-match="${escapeMatchMarkup(match.id)}">Share live link</button>
          <button type="button" data-match-action="cancel" data-match="${escapeMatchMarkup(match.id)}">Cancel match</button>
        </div>
      </div>
    </article>
  `;
}

export function renderMatchMobileCard(match, selected) {
  return `
    <article class="match-mobile-card ${selected ? "selected" : ""}" data-match-id="${escapeMatchMarkup(match.id)}" tabindex="0" role="button" aria-label="Select match at ${escapeMatchMarkup(match.start)}">
      <header><div>${matchStatusBadge(match.status)}<time>${escapeMatchMarkup(match.start)}</time></div><strong>${escapeMatchMarkup(match.court)}</strong></header>
      <p>${escapeMatchMarkup(match.tournament)} · ${escapeMatchMarkup(match.round)}</p>
      <div class="mobile-matchup">${teamMarkup(match.teamA)}<strong>${escapeMatchMarkup(matchScoreText(match))}</strong>${teamMarkup(match.teamB, "team-b")}</div>
      <footer><span>${match.duration ? `${match.duration} min` : escapeMatchMarkup(match.format)}</span><button class="button compact secondary" type="button" data-match-action="${matchPrimaryActionKey(match)}" data-match="${escapeMatchMarkup(match.id)}">${escapeMatchMarkup(matchPrimaryAction(match))}</button></footer>
    </article>
  `;
}

export function renderTimelineGroup(time, matches, selectedId) {
  return `
    <section class="match-time-group">
      <header><time>${escapeMatchMarkup(time)}</time><span>${matches.length} match${matches.length === 1 ? "" : "es"}</span></header>
      <div class="time-group-track">
        ${matches.map((match) => `
          <article class="timeline-match-card ${match.id === selectedId ? "selected" : ""}" data-match-id="${escapeMatchMarkup(match.id)}" tabindex="0" role="button">
            <div class="timeline-status">${matchStatusBadge(match.status)}<strong>${escapeMatchMarkup(match.court)}</strong></div>
            <p>${escapeMatchMarkup(match.tournament)} · ${escapeMatchMarkup(match.round)}</p>
            <div><strong>${escapeMatchMarkup(match.teamA.short)}</strong><span>${escapeMatchMarkup(matchScoreText(match))}</span><strong>${escapeMatchMarkup(match.teamB.short)}</strong></div>
            <button class="text-button" type="button" data-match-action="${matchPrimaryActionKey(match)}" data-match="${escapeMatchMarkup(match.id)}">${escapeMatchMarkup(matchPrimaryAction(match))} →</button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

export function renderKanbanCard(match, selected) {
  return `
    <article class="match-kanban-card ${selected ? "selected" : ""}" draggable="true" data-match-id="${escapeMatchMarkup(match.id)}" tabindex="0" role="button">
      <header>${matchStatusBadge(match.status)}<strong>${escapeMatchMarkup(match.court)}</strong></header>
      <p>${escapeMatchMarkup(match.tournament)} · ${escapeMatchMarkup(match.round)}</p>
      <div class="kanban-matchup"><strong>${escapeMatchMarkup(match.teamA.short)}</strong><span>${escapeMatchMarkup(matchScoreText(match))}</span><strong>${escapeMatchMarkup(match.teamB.short)}</strong></div>
      <footer><span>${match.duration ? `${match.duration} min` : escapeMatchMarkup(match.start)}</span><button class="text-button" type="button" data-match-action="${matchPrimaryActionKey(match)}" data-match="${escapeMatchMarkup(match.id)}">${escapeMatchMarkup(matchPrimaryAction(match))}</button></footer>
    </article>
  `;
}
