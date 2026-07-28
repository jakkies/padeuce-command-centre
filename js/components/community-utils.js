export const communityTabLabels = {
  players: "Players",
  teams: "Teams",
  coaches: "Coaches",
  officials: "Officials",
};

export function escapeCommunityMarkup(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function communityStatusBadge(status) {
  const label = String(status || "active").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const icon = {
    active: "●",
    available: "✓",
    assigned: "◎",
    incomplete: "!",
    invited: "↗",
    inactive: "○",
    suspended: "×",
    draft: "◇",
    disbanded: "×",
    "pending invitation": "↗",
    unavailable: "–",
    "pending approval": "◷",
  }[status] || "•";
  return `<span class="community-status status-${escapeCommunityMarkup(status).replaceAll(" ", "-")}"><span aria-hidden="true">${icon}</span>${escapeCommunityMarkup(label)}</span>`;
}

export function communityAvatar(item, size = "") {
  return `<span class="community-avatar ${size}" aria-hidden="true">${escapeCommunityMarkup(item.initials || item.name?.replaceAll(" ", "").slice(0, 2) || "PD")}</span>`;
}

export function resultChips(results) {
  return `<div class="result-chips" aria-label="Recent form: ${escapeCommunityMarkup(results.join(", "))}">${results.map((result) => `<span class="${result === "W" ? "win" : "loss"}" aria-label="${result === "W" ? "Win" : "Loss"}">${result}</span>`).join("")}</div>`;
}

export function communityItemName(item) {
  return item.displayName || item.name;
}

export function communityItemClub(item) {
  return item.club || "Independent";
}
