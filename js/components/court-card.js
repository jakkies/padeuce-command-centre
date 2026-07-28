import {
  courtActionKey,
  courtPrimaryAction,
  courtScore,
  courtStateCopy,
  courtStatusBadge,
  escapeMarkup,
} from "./court-utils.js";

function connectionLabel(court) {
  if (court.deviceStatus === "connected") return '<span class="connection connected"><i></i>Device connected</span>';
  return '<span class="connection disconnected"><i></i>Device offline</span>';
}

export function renderCourtCard(court, selected) {
  const match = court.currentMatch;
  const actionLabel = court.reconnecting ? "Reconnecting…" : courtPrimaryAction(court);
  return `
    <article class="ops-court-card court-status-${escapeMarkup(court.status)} ${selected ? "selected" : ""}"
      data-court-id="${escapeMarkup(court.id)}" tabindex="0" role="button"
      aria-label="Select ${escapeMarkup(court.name)}, ${escapeMarkup(court.status)}">
      <div class="ops-court-accent" aria-hidden="true"></div>
      <div class="ops-court-heading">
        <div><span class="court-number">${escapeMarkup(court.name)}</span><small>${escapeMarkup(court.zone)}</small></div>
        ${courtStatusBadge(court.status)}
      </div>
      <div class="court-connection">${connectionLabel(court)}</div>
      <div class="court-match">
        ${match ? `<div class="court-team"><strong>${escapeMarkup(match.teamA)}</strong><span>vs</span><strong>${escapeMarkup(match.teamB)}</strong></div>` : '<div class="no-match-compact"><strong>No match assigned</strong><span>Ready for an upcoming match.</span></div>'}
        <strong class="ops-court-score">${escapeMarkup(courtScore(court))}</strong>
        <p>${escapeMarkup(courtStateCopy(court))}</p>
      </div>
      <div class="ops-court-footer">
        <button class="button compact ${court.status === "waiting" || court.status === "available" ? "primary" : "secondary"}"
          type="button" data-court-action="${courtActionKey(court)}" data-court="${escapeMarkup(court.id)}"${court.reconnecting ? " disabled" : ""}>${escapeMarkup(actionLabel)}</button>
        <div class="more-anchor">
          <button class="icon-button small" type="button" data-court-more="${escapeMarkup(court.id)}"
            aria-label="More options for ${escapeMarkup(court.name)}" aria-expanded="false">•••</button>
          <div class="mini-menu court-card-menu" data-court-menu="${escapeMarkup(court.id)}" hidden>
            <button type="button" data-court-action="select" data-court="${escapeMarkup(court.id)}">View details</button>
            <button type="button" data-court-action="move-match" data-court="${escapeMarkup(court.id)}">Move match</button>
            <button type="button" data-court-action="share" data-court="${escapeMarkup(court.id)}">Copy live link</button>
          </div>
        </div>
      </div>
      ${selected ? '<span class="selected-court-label"><span>✓</span> Selected</span>' : ""}
    </article>
  `;
}

export function renderCourtListRow(court, selected) {
  const match = court.currentMatch;
  const actionLabel = court.reconnecting ? "Reconnecting…" : courtPrimaryAction(court);
  return `
    <article class="court-list-row ${selected ? "selected" : ""}" data-court-id="${escapeMarkup(court.id)}" tabindex="0" role="button" aria-label="Select ${escapeMarkup(court.name)}">
      <div class="list-court"><strong>${escapeMarkup(court.name)}</strong><small>${escapeMarkup(court.zone)}</small></div>
      <div>${courtStatusBadge(court.status)}</div>
      <div class="list-match"><strong>${match ? `${escapeMarkup(match.teamA)} vs ${escapeMarkup(match.teamB)}` : "No match assigned"}</strong><small>${escapeMarkup(courtStateCopy(court))}</small></div>
      <strong class="list-score">${escapeMarkup(courtScore(court))}</strong>
      <span>${match?.durationMinutes ? `${match.durationMinutes} min` : "—"}</span>
      <span>${escapeMarkup(court.nextMatch?.time || "—")}</span>
      <span>${connectionLabel(court)}</span>
      <button class="button compact secondary" type="button" data-court-action="${courtActionKey(court)}" data-court="${escapeMarkup(court.id)}"${court.reconnecting ? " disabled" : ""}>${escapeMarkup(actionLabel)}</button>
    </article>
  `;
}

export function renderCourtMapBlock(court, selected) {
  return `
    <button class="court-map-block court-status-${escapeMarkup(court.status)} ${selected ? "selected" : ""}"
      type="button" data-court-id="${escapeMarkup(court.id)}" aria-label="Select ${escapeMarkup(court.name)}, ${escapeMarkup(court.status)}">
      <span class="map-court-number">${court.number}</span>
      <span>${escapeMarkup(courtStatusBadgeText(court.status))}</span>
      <strong>${escapeMarkup(courtScore(court))}</strong>
    </button>
  `;
}

function courtStatusBadgeText(status) {
  return {
    live: "LIVE",
    waiting: "WAIT",
    delayed: "DELAY",
    completed: "DONE",
    maintenance: "MAINT",
    available: "FREE",
    "warm-up": "WARM",
    offline: "OFF",
  }[status] || status;
}

export function renderCourtSkeletons(count = 6) {
  return Array.from({ length: count }, () => `
    <article class="ops-court-card court-skeleton" aria-hidden="true">
      <div class="skeleton-line skeleton-short"></div><div class="skeleton-line"></div>
      <div class="skeleton-score"></div><div class="skeleton-line"></div>
      <div class="skeleton-button"></div>
    </article>
  `).join("");
}
