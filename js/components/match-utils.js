export const matchStatusLabels = {
  live: "Live",
  waiting: "Waiting",
  "warm-up": "Warm-up",
  scheduled: "Scheduled",
  completed: "Completed",
  review: "Needs Review",
  delayed: "Delayed",
  paused: "Paused",
  cancelled: "Cancelled",
  walkover: "Walkover",
  retired: "Retired",
};

export const matchStatusIcons = {
  live: "●",
  waiting: "◷",
  "warm-up": "↻",
  scheduled: "◇",
  completed: "✓",
  review: "!",
  delayed: "⌛",
  paused: "Ⅱ",
  cancelled: "×",
  walkover: "↗",
  retired: "–",
};

export function escapeMatchMarkup(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function matchStatusBadge(status) {
  return `<span class="match-status status-${escapeMatchMarkup(status)}"><span aria-hidden="true">${matchStatusIcons[status] || "•"}</span>${escapeMatchMarkup(matchStatusLabels[status] || status)}</span>`;
}

export function matchScoreText(match) {
  if (match.status === "scheduled" || match.status === "waiting" || match.status === "warm-up") return "0–0";
  if (match.status === "cancelled") return "—";
  if (["completed", "review", "walkover", "retired"].includes(match.status)) {
    return match.score.setsA.map((value, index) => `${value}–${match.score.setsB[index] ?? 0}`).join("  ");
  }
  return `${match.score.pointsA}–${match.score.pointsB}`;
}

export function matchPrimaryAction(match) {
  if (match.status === "live") return "Open";
  if (match.status === "paused") return "Resume";
  if (match.status === "review") return "Review";
  if (match.status === "waiting" || match.status === "warm-up") return "Start";
  if (match.status === "completed") return "View";
  return "Manage";
}

export function matchPrimaryActionKey(match) {
  if (match.status === "live") return "open";
  if (match.status === "paused") return "resume";
  if (match.status === "review") return "confirm";
  if (match.status === "waiting" || match.status === "warm-up") return "start";
  return "select";
}

export function matchSetsMarkup(match) {
  if (!match.score.setsA.length) return '<span class="set-empty">No sets played</span>';
  return match.score.setsA.map((setA, index) => {
    const setB = match.score.setsB[index] ?? 0;
    return `<span class="${setA > setB ? "won" : ""}"><small>Set ${index + 1}</small><strong>${setA}</strong><i>–</i><strong>${setB}</strong></span>`;
  }).join("");
}
