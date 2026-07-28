import {
  escapeMatchMarkup,
  matchSetsMarkup,
  matchStatusBadge,
} from "./match-utils.js";

function overviewRow(label, value) {
  return `<div><span>${escapeMatchMarkup(label)}</span><strong>${escapeMatchMarkup(value)}</strong></div>`;
}

function teamDetail(team, label) {
  return `
    <article class="detail-team">
      <header><span>${label}</span>${team.server ? '<b><i></i>Serving</b>' : ""}</header>
      <strong>${escapeMatchMarkup(team.short)}</strong>
      <p>${escapeMatchMarkup(team.players.join(" & "))}</p>
      <footer><span>Seed ${team.seed || "—"}</span><span>${escapeMatchMarkup(team.club)}</span></footer>
    </article>
  `;
}

export function renderMatchDetail(match, mobile = false) {
  const isActive = ["live", "paused", "delayed"].includes(match.status);
  const isFinished = ["completed", "review", "walkover", "retired"].includes(match.status);
  return `
    ${mobile ? '<div class="sheet-handle"></div>' : ""}
    <header class="match-detail-header">
      <div><span class="eyebrow">${escapeMatchMarkup(match.tournament)}</span><div><h2>${escapeMatchMarkup(match.round)}</h2>${matchStatusBadge(match.status)}</div></div>
      <div class="detail-header-actions">
        <button class="icon-button small" type="button" data-match-action="share" data-match="${escapeMatchMarkup(match.id)}" aria-label="Share match">↗</button>
        ${mobile ? '<button class="icon-button" type="button" data-close-match-sheet aria-label="Close match details">×</button>' : ""}
      </div>
    </header>

    <section class="match-detail-section match-score-hero">
      <div class="match-score-teams">
        <div><span>Team A</span><strong>${escapeMatchMarkup(match.teamA.short)}</strong><small>${escapeMatchMarkup(match.teamA.players.join(" · "))}</small></div>
        <i>vs</i>
        <div><span>Team B</span><strong>${escapeMatchMarkup(match.teamB.short)}</strong><small>${escapeMatchMarkup(match.teamB.players.join(" · "))}</small></div>
      </div>
      <div class="detail-point-score"><strong>${escapeMatchMarkup(match.score.pointsA)}</strong><span>POINTS</span><strong>${escapeMatchMarkup(match.score.pointsB)}</strong></div>
      <div class="set-score-strip">${matchSetsMarkup(match)}</div>
    </section>

    <section class="match-detail-section">
      <div class="match-detail-section-heading"><span class="eyebrow">Match overview</span><h3>Operations</h3></div>
      <div class="match-overview-grid">
        ${overviewRow("Court", match.court)}
        ${overviewRow("Scheduled", `${match.start} · ${match.date === "2026-07-28" ? "Today" : match.date}`)}
        ${overviewRow("Duration", match.duration ? `${match.duration} minutes` : "Not started")}
        ${overviewRow("Official", match.official)}
        ${overviewRow("Format", match.format)}
        ${overviewRow("Match ID", match.id.toUpperCase())}
      </div>
    </section>

    <section class="match-detail-section">
      <div class="match-detail-section-heading"><span class="eyebrow">Players</span><h3>Teams</h3></div>
      <div class="detail-team-grid">${teamDetail(match.teamA, "Team A")}${teamDetail(match.teamB, "Team B")}</div>
    </section>

    <section class="match-detail-section">
      <div class="match-detail-section-heading"><span class="eyebrow">Controls</span><h3>Match actions</h3></div>
      <div class="match-detail-actions">
        <button class="primary-action" type="button" data-match-action="open" data-match="${escapeMatchMarkup(match.id)}"><span>↗</span>Open Match Command Centre</button>
        <button type="button" data-match-action="mobile" data-match="${escapeMatchMarkup(match.id)}"><span>▦</span>Launch Mobile Scoring</button>
        ${match.status === "live" ? `<button type="button" data-match-action="pause" data-match="${escapeMatchMarkup(match.id)}"><span>Ⅱ</span>Pause Match</button>` : ""}
        ${match.status === "paused" ? `<button type="button" data-match-action="resume" data-match="${escapeMatchMarkup(match.id)}"><span>▶</span>Resume Match</button>` : ""}
        <button type="button" data-match-action="reschedule" data-match="${escapeMatchMarkup(match.id)}"><span>◇</span>Edit Schedule</button>
        <button type="button" data-match-action="move" data-match="${escapeMatchMarkup(match.id)}"><span>⇄</span>Move Court</button>
        ${isFinished || match.status === "review" ? `<button type="button" data-match-action="confirm" data-match="${escapeMatchMarkup(match.id)}"><span>✓</span>Confirm Result</button>` : ""}
        <button type="button" data-match-action="share" data-match="${escapeMatchMarkup(match.id)}"><span>↗</span>Share Live Link</button>
        ${!isFinished ? `<button class="danger-action" type="button" data-match-action="cancel" data-match="${escapeMatchMarkup(match.id)}"><span>×</span>Cancel Match</button>` : ""}
      </div>
    </section>

    <section class="match-detail-section">
      <div class="match-detail-section-heading"><span class="eyebrow">Audit trail</span><h3>Match history</h3></div>
      <ol class="match-history">
        ${match.history.map(([time, event]) => `<li><time>${escapeMatchMarkup(time)}</time><span></span><p>${escapeMatchMarkup(event)}</p></li>`).join("")}
        ${isActive ? `<li><time>Now</time><span></span><p>Current duration · ${match.duration} minutes</p></li>` : ""}
      </ol>
    </section>

    <section class="match-detail-section">
      <div class="match-detail-section-heading"><span class="eyebrow">Context</span><h3>Notes & incidents</h3></div>
      <div class="match-note-list">
        ${overviewRow("Tournament notes", match.notes.tournament)}
        ${overviewRow("Official notes", match.notes.official)}
        ${overviewRow("Incident log", match.notes.incident)}
      </div>
    </section>
  `;
}
