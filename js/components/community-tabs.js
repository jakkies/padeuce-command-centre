const tabs = ["players", "teams", "coaches", "officials"];

export function initialCommunityTab() {
  const stored = sessionStorage.getItem("padeuce-community-tab");
  return tabs.includes(stored) ? stored : "players";
}

export function updateCommunityTabs(activeTab) {
  sessionStorage.setItem("padeuce-community-tab", activeTab);
  document.querySelectorAll("[data-community-tab]").forEach((button) => {
    const active = button.dataset.communityTab === activeTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

export function adjacentCommunityTab(currentTab, direction) {
  const index = tabs.indexOf(currentTab);
  return tabs[(index + direction + tabs.length) % tabs.length];
}
