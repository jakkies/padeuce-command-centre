export const courtStatusLabels = {
  live: "Live",
  waiting: "Waiting",
  delayed: "Delayed",
  completed: "Completed",
  maintenance: "Maintenance",
  available: "Available",
  "warm-up": "Warm-up",
  offline: "Offline",
};

export function escapeMarkup(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function courtStatusBadge(status) {
  const label = courtStatusLabels[status] || status;
  return `<span class="status-badge status-${escapeMarkup(status)}"><span class="status-dot" aria-hidden="true"></span>${escapeMarkup(label)}</span>`;
}

export function courtPrimaryAction(court) {
  return {
    live: "Open Match",
    waiting: "Start Match",
    delayed: "Update",
    completed: "Confirm Result",
    maintenance: "View Issue",
    available: "Assign Match",
    "warm-up": "Open",
    offline: "Reconnect",
  }[court.status] || "Open";
}

export function courtActionKey(court) {
  return {
    live: "open-match",
    waiting: "start-match",
    delayed: "update-delay",
    completed: "confirm-result",
    maintenance: "view-issue",
    available: "assign-match",
    "warm-up": "open-match",
    offline: "reconnect",
  }[court.status] || "select";
}

export function courtScore(court) {
  if (!court.currentMatch) return "Available";
  if (court.status === "completed") return court.currentMatch.scoreA;
  if (court.status === "waiting") return "Ready";
  if (court.status === "warm-up") return "4 min";
  return `${court.currentMatch.scoreA}–${court.currentMatch.scoreB}`;
}

export function courtStateCopy(court) {
  if (court.status === "maintenance") return court.issue?.title || "Unavailable";
  if (court.status === "offline") return "Device disconnected";
  if (court.status === "available") return "No assigned match";
  if (court.status === "delayed") return `${court.delay?.reason || "Delay"} · ${court.delay?.durationMinutes || 0} min`;
  if (court.status === "completed") return "Awaiting confirmation";
  if (court.status === "waiting") return "All players checked in";
  if (court.status === "warm-up") return "Warm-up in progress";
  return `${court.currentMatch?.durationMinutes || 0} min · ${court.currentMatch?.setLabel || ""} · ${court.currentMatch?.gameLabel || ""}`;
}
