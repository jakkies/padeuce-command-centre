import {
  courtActionKey,
  courtPrimaryAction,
  courtStatusBadge,
  escapeMarkup,
} from "./court-utils.js";

function detailRow(label, value, tone = "") {
  return `<div class="court-detail-row"><span>${escapeMarkup(label)}</span><strong class="${tone}">${escapeMarkup(value)}</strong></div>`;
}

export function renderCourtDetail(court, mobile = false) {
  const match = court.currentMatch;
  const next = court.nextMatch;
  const primaryAction = courtActionKey(court);
  const primaryLabel = courtPrimaryAction(court);

  return `
    ${mobile ? '<div class="sheet-handle"></div>' : ""}
    <header class="court-detail-header">
      <div><span class="eyebrow">${escapeMarkup(court.zone)}</span><div class="detail-title-row"><h2>${escapeMarkup(court.name)}</h2>${courtStatusBadge(court.status)}</div></div>
      <div class="detail-header-actions">
        <button class="text-button" type="button" data-court-action="edit" data-court="${escapeMarkup(court.id)}">Edit Court</button>
        <button class="icon-button small" type="button" data-court-more-detail="${escapeMarkup(court.id)}" aria-label="More court options">•••</button>
        ${mobile ? '<button class="icon-button" type="button" data-close-court-sheet aria-label="Close court details">×</button>' : ""}
      </div>
    </header>

    <section class="detail-section current-match-detail">
      <div class="detail-section-heading"><div><span class="eyebrow">Current state</span><h3>${match ? "Current Match" : "Court Available"}</h3></div>${match ? `<span>${escapeMarkup(match.matchNumber)}</span>` : ""}</div>
      ${match ? `
        <div class="detail-scoreboard">
          <div><span>Team A</span><strong>${escapeMarkup(match.teamA)}</strong><b>${escapeMarkup(match.scoreA)}</b></div>
          <i>vs</i>
          <div><span>Team B</span><strong>${escapeMarkup(match.teamB)}</strong><b>${escapeMarkup(match.scoreB)}</b></div>
        </div>
        <div class="detail-facts">
          ${detailRow("Set & game", `${match.setLabel} · ${match.gameLabel}`)}
          ${detailRow("Duration", match.durationMinutes ? `${match.durationMinutes} minutes` : "Not started")}
          ${detailRow("Server", match.server)}
          ${detailRow("Tournament", match.tournament)}
          ${detailRow("Round", match.round)}
        </div>
      ` : `
        <div class="court-detail-empty"><span>＋</span><strong>No match assigned to this court.</strong><p>Assign an upcoming match when ready.</p></div>
      `}
    </section>

    <section class="detail-section quick-actions-section">
      <div class="detail-section-heading"><h3>Quick actions</h3></div>
      <div class="court-quick-actions">
        ${match ? `<button type="button" data-court-action="open-match" data-court="${escapeMarkup(court.id)}"><span>↗</span>Open Match Command Centre</button>` : ""}
        ${match && court.status === "live" ? `<button type="button" data-court-action="pause-match" data-court="${escapeMarkup(court.id)}"><span>Ⅱ</span>Pause Match</button>` : ""}
        <button type="button" data-court-action="move-match" data-court="${escapeMarkup(court.id)}"><span>⇄</span>Move Match</button>
        <button type="button" data-court-action="call-official" data-court="${escapeMarkup(court.id)}"><span>!</span>Call Official</button>
        <button type="button" data-court-action="share" data-court="${escapeMarkup(court.id)}"><span>↗</span>Share Live Link</button>
      </div>
    </section>

    <section class="detail-section">
      <div class="detail-section-heading"><div><span class="eyebrow">Next on court</span><h3>Upcoming Match</h3></div><span>${escapeMarkup(next?.time || "Unscheduled")}</span></div>
      ${next ? `<div class="upcoming-court-match"><strong>${escapeMarkup(next.teamA)} <span>vs</span> ${escapeMarkup(next.teamB)}</strong><p>${escapeMarkup(next.tournament)}</p><span class="${next.checkedIn ? "checked-in" : "not-checked-in"}">${next.checkedIn ? "✓ Players checked in" : "○ Check-in pending"}</span></div>` : '<p class="muted-copy">No upcoming match scheduled.</p>'}
    </section>

    <section class="detail-section">
      <div class="detail-section-heading"><h3>Court status</h3></div>
      <div class="detail-facts">
        ${detailRow("Surface", `${court.surface} · ${court.surfaceCondition}`)}
        ${detailRow("Lighting", court.lighting, court.lighting.includes("Fault") ? "danger-value" : "success-value")}
        ${detailRow("Scoring device", court.deviceStatus === "connected" ? "Connected" : "Offline", court.deviceStatus === "connected" ? "success-value" : "danger-value")}
        ${detailRow("Score display", court.displayStatus === "connected" ? "Connected" : "Offline", court.displayStatus === "connected" ? "success-value" : "danger-value")}
        ${detailRow("Last sync", court.lastSync)}
      </div>
      <div class="court-notes"><span>Notes</span><p>${escapeMarkup(court.notes)}</p></div>
    </section>

    ${court.issue ? `
      <section class="detail-section incident-section">
        <div class="detail-section-heading"><div><span class="eyebrow">Incident</span><h3>${escapeMarkup(court.issue.title)}</h3></div><span class="incident-icon">!</span></div>
        <div class="incident-grid"><div><span>Reported</span><strong>${escapeMarkup(court.issue.reportedAt)}</strong></div><div><span>Expected resolution</span><strong>${escapeMarkup(court.issue.expectedResolution)}</strong></div></div>
      </section>
    ` : ""}

    ${court.delay ? `
      <section class="detail-section incident-section delay-incident">
        <div class="detail-section-heading"><div><span class="eyebrow">Active delay</span><h3>${escapeMarkup(court.delay.reason)}</h3></div><span class="incident-icon">◷</span></div>
        <div class="incident-grid"><div><span>Duration</span><strong>${court.delay.durationMinutes} min</strong></div><div><span>Estimated resume</span><strong>${escapeMarkup(court.delay.estimatedResume)}</strong></div></div>
      </section>
    ` : ""}

    ${mobile ? `<div class="mobile-detail-action"><button class="button primary full" type="button" data-court-action="${primaryAction}" data-court="${escapeMarkup(court.id)}">${escapeMarkup(primaryLabel)}</button></div>` : ""}
  `;
}
