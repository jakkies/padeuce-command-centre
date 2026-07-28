const allowedViews = ["grid", "list", "map"];

export function initialCourtView() {
  const stored = sessionStorage.getItem("padeuce-court-view");
  return allowedViews.includes(stored) ? stored : "grid";
}

export function updateViewToggle(view) {
  document.querySelectorAll("[data-court-view]").forEach((button) => {
    const active = button.dataset.courtView === view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  sessionStorage.setItem("padeuce-court-view", view);
}
