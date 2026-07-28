"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  activities,
  competitionsSeed,
  Competition,
  courts,
  navItems,
  notifications,
  schedule,
} from "./data";

type ModalState =
  | { type: "forgot" }
  | { type: "access" }
  | { type: "confirm"; title: string; body: string; confirm: string; success: string }
  | { type: "import" }
  | { type: "help" }
  | { type: "new" }
  | null;

const statusLabel: Record<string, string> = {
  live: "Live",
  upcoming: "Upcoming",
  draft: "Draft",
  scheduled: "Scheduled",
  completed: "Completed",
  archived: "Archived",
  waiting: "Waiting",
  delayed: "Delayed",
  offline: "Offline",
};

const competitionTabs = [["active", "Active"], ["upcoming", "Upcoming"], ["draft", "Drafts"], ["completed", "Completed"], ["archived", "Archived"]];
const tabStatuses: Record<string, string[]> = {
  active: ["live", "scheduled"],
  upcoming: ["upcoming"],
  draft: ["draft"],
  completed: ["completed"],
  archived: ["archived"],
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-logo" aria-label="Padeuce">
      <span className="brand-mark" aria-hidden="true">P</span>
      {!compact && <span className="brand-word">PADEUCE</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {statusLabel[status] || status}
    </span>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);
  return (
    <div className="toast" role="status">
      <span className="toast-check" aria-hidden="true">✓</span>
      <span>{message}</span>
      <button className="icon-button small" onClick={onClose} aria-label="Dismiss notification">×</button>
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
  wide = false,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const keydown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const dialog = closeRef.current?.closest("[role='dialog']");
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        "button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <div>
            <span className="eyebrow">Padeuce workspace</span>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

function Login({
  onLogin,
  setModal,
}: {
  onLogin: () => void;
  setModal: (modal: ModalState) => void;
}) {
  const [email, setEmail] = useState(() => localStorage.getItem("padeuce-email") || "");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(Boolean(localStorage.getItem("padeuce-email")));
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Use at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    window.setTimeout(() => {
      if (remember) localStorage.setItem("padeuce-email", email);
      else localStorage.removeItem("padeuce-email");
      onLogin();
    }, 850);
  };

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-story">
          <div className="story-overlay" />
          <div className="story-content">
            <Logo />
            <div className="login-copy">
              <span className="eyebrow electric">The scoring platform for padel</span>
              <h1>Because<br /><span>every point</span><br />counts.</h1>
              <p>The complete padel scoring platform for players, clubs, and spectators.</p>
            </div>
            <div className="feature-stack">
              {[
                ["＋", "Score with ease", "Fast, accurate scoring built for the court."],
                ["↗", "Share instantly", "Live results for every player and spectator."],
                ["⌁", "Analyse your game", "Turn every rally into useful performance insight."],
                ["◉", "Grow the game", "Connect clubs, players, sponsors and officials."],
              ].map(([icon, title, detail]) => (
                <div className="feature-row" key={title}>
                  <span className="feature-icon" aria-hidden="true">{icon}</span>
                  <div><strong>{title}</strong><small>{detail}</small></div>
                </div>
              ))}
            </div>
            <div className="app-promo">
              <div className="mini-phone" aria-hidden="true">
                <span>FINAL</span><strong>6 <i>:</i> 4</strong><small>Match saved</small>
              </div>
              <div className="app-promo-copy">
                <span className="eyebrow">Play point-for-point</span>
                <h3>The Padeuce app</h3>
                <p>Score matches, save results and share live play.</p>
                <div className="store-row">
                  <button type="button" className="store-button"> <span>App Store</span></button>
                  <button type="button" className="store-button">▶ <span>Google Play</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="login-form-side">
          <div className="mobile-login-brand">
            <Logo />
            <h1>Every point <span>counts.</span></h1>
          </div>
          <form className="login-card" onSubmit={submit} noValidate>
            <div className="login-heading">
              <span className="eyebrow">Command Centre</span>
              <h2>Welcome back</h2>
              <p>Sign in to your Padeuce account.</p>
            </div>
            <label className="field-label" htmlFor="email">Email address</label>
            <div className={`input-wrap ${errors.email ? "invalid" : ""}`}>
              <span aria-hidden="true">✉</span>
              <input id="email" type="email" autoComplete="email" placeholder="name@club.co.za" value={email} onChange={(event) => setEmail(event.target.value)} aria-describedby={errors.email ? "email-error" : undefined} />
            </div>
            {errors.email && <small id="email-error" className="field-error">{errors.email}</small>}
            <label className="field-label" htmlFor="password">Password</label>
            <div className={`input-wrap ${errors.password ? "invalid" : ""}`}>
              <span aria-hidden="true">⌁</span>
              <input id="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby={errors.password ? "password-error" : undefined} />
              <button type="button" className="input-action" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? "Hide" : "Show"}</button>
            </div>
            {errors.password && <small id="password-error" className="field-error">{errors.password}</small>}
            <div className="form-options">
              <label className="check-row"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember me</label>
              <button type="button" className="text-button" onClick={() => setModal({ type: "forgot" })}>Forgot password?</button>
            </div>
            <button className="button primary full" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : <>Sign in <span>→</span></>}
            </button>
            <div className="divider"><span>or continue with</span></div>
            <div className="social-row">
              <button className="button secondary" type="button" onClick={() => setErrors({})}><b>G</b> Google</button>
              <button className="button secondary" type="button" onClick={() => setErrors({})}><b></b> Apple</button>
            </div>
            <p className="request-copy">New to Padeuce? <button type="button" className="text-button" onClick={() => setModal({ type: "access" })}>Request access</button></p>
          </form>
          <div className="mobile-app-promo">
            <strong>The Padeuce app</strong><span>Score every point from the court.</span>
            <button className="button compact secondary" type="button">Get the app</button>
          </div>
          <footer className="login-footer">
            <span>© 2026 Padeuce</span>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Use</a>
          </footer>
        </div>
      </section>
    </main>
  );
}

function Shell({
  route,
  navigate,
  children,
  onLogout,
  setModal,
  toast,
}: {
  route: string;
  navigate: (route: string) => void;
  children: React.ReactNode;
  onLogout: () => void;
  setModal: (modal: ModalState) => void;
  toast: (message: string) => void;
}) {
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const go = (next: string) => {
    setDrawer(false);
    setMenu(null);
    navigate(next);
  };

  const keyMenu = (event: KeyboardEvent, value: string) => {
    if (event.key === "Escape") setMenu(null);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setMenu(menu === value ? null : value);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <button className="hamburger" onClick={() => setDrawer(true)} aria-label="Open navigation" aria-expanded={drawer}>☰</button>
          <Logo />
        </div>
        <div className="topbar-tools">
          <div className="dropdown-anchor">
            <button className="club-selector" onClick={() => setMenu(menu === "club" ? null : "club")} onKeyDown={(event) => keyMenu(event, "club")} aria-haspopup="menu" aria-expanded={menu === "club"}>
              <span className="club-monogram">H</span>
              <span><small>Current club</small><strong>Hermanus Sports Club</strong></span>
              <i>⌄</i>
            </button>
            {menu === "club" && (
              <div className="dropdown-menu" role="menu">
                <button onClick={() => { toast("Hermanus Sports Club selected"); setMenu(null); }}><span className="menu-check">✓</span> Hermanus Sports Club</button>
                <button onClick={() => { toast("Cape Town Padel Park selected"); setMenu(null); }}><span>○</span> Cape Town Padel Park</button>
                <button onClick={() => { toast("Overberg Padel Centre selected"); setMenu(null); }}><span>○</span> Overberg Padel Centre</button>
              </div>
            )}
          </div>
          <label className="global-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Search players, matches, competitions…" aria-label="Global search" onKeyDown={(event) => event.key === "Enter" && toast(`Searching for “${event.currentTarget.value}”`)} />
            <kbd>⌘ K</kbd>
          </label>
          <div className="dropdown-anchor">
            <button className="icon-button notification-button" onClick={() => setMenu(menu === "notifications" ? null : "notifications")} aria-label="Notifications" aria-expanded={menu === "notifications"}>
              ♢<span className="notification-badge">2</span>
            </button>
            {menu === "notifications" && (
              <div className="dropdown-menu notification-menu" role="menu">
                <div className="menu-title"><strong>Notifications</strong><button onClick={() => toast("All notifications marked as read")}>Mark all read</button></div>
                {notifications.map((item) => (
                  <button key={item.title} onClick={() => setMenu(null)} className={item.unread ? "unread" : ""}>
                    <span className="notice-dot">•</span><span><strong>{item.title}</strong><small>{item.time}</small></span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="dropdown-anchor">
            <button className="profile-button" onClick={() => setMenu(menu === "profile" ? null : "profile")} aria-haspopup="menu" aria-expanded={menu === "profile"}>
              <span className="avatar">JM</span><span className="profile-copy"><strong>James Meyer</strong><small>Competition Admin</small></span><i>⌄</i>
            </button>
            {menu === "profile" && (
              <div className="dropdown-menu profile-menu" role="menu">
                <button onClick={() => { toast("Profile settings opened"); setMenu(null); }}>◉ Profile settings</button>
                <button onClick={() => { toast("Preferences opened"); setMenu(null); }}>⚙ Preferences</button>
                <hr />
                <button className="danger-link" onClick={onLogout}>↪ Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <aside className={`sidebar ${drawer ? "drawer-open" : ""}`} aria-label="Primary navigation">
        <div className="drawer-header"><Logo /><button className="icon-button" onClick={() => setDrawer(false)} aria-label="Close navigation">×</button></div>
        <nav>
          <span className="nav-label">Workspace</span>
          {navItems.slice(0, 7).map((item) => (
            <button key={item.route} className={`nav-item ${route === item.route ? "active" : ""}`} onClick={() => go(item.route)} aria-current={route === item.route ? "page" : undefined}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.badge && <b>{item.badge}</b>}
            </button>
          ))}
          <span className="nav-label nav-label-second">System</span>
          {navItems.slice(7).map((item) => (
            <button key={item.route} className={`nav-item ${route === item.route ? "active" : ""}`} onClick={() => go(item.route)} aria-current={route === item.route ? "page" : undefined}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.badge && <b>{item.badge}</b>}
            </button>
          ))}
        </nav>
        <div className="help-card">
          <span className="help-icon">?</span><strong>Need a hand?</strong>
          <p>Get setup guidance or contact the Padeuce team.</p>
          <button className="button compact secondary" onClick={() => setModal({ type: "help" })}>Help centre</button>
        </div>
      </aside>
      {drawer && <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setDrawer(false)} />}
      <main className="workspace">{children}</main>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 3).map((item) => (
          <button key={item.route} className={route === item.route ? "active" : ""} onClick={() => go(item.route)}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
        <button onClick={() => setDrawer(true)}><span>•••</span>More</button>
      </nav>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{subtitle}</p></div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

function Today({
  setModal,
  toast,
}: {
  setModal: (modal: ModalState) => void;
  toast: (message: string) => void;
}) {
  const [suggestions, setSuggestions] = useState([
    { id: 1, icon: "↘", title: "Court 3 is behind schedule", detail: "Starting now recovers 18 minutes.", action: "Review" },
    { id: 2, icon: "✓", title: "Round 2 can be published", detail: "All quarter-final results are verified.", action: "Publish" },
    { id: 3, icon: "☂", title: "Heavy rain expected at 16:00", detail: "A 22-minute court plan avoids delays.", action: "View Plan" },
  ]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const overview = [
    ["●", "12", "Live Matches", "Across 8 courts"],
    ["◷", "4", "Waiting Matches", "Next 18 minutes"],
    ["▦", "8", "Courts Active", "1 maintenance"],
    ["◉", "74", "Players on Site", "91% checked in"],
    ["◎", "322", "Live Spectators", "+18% today"],
    ["↗", "92%", "Ad Fill Rate", "Above target"],
  ];
  const askAi = () => {
    if (!aiPrompt.trim()) return;
    const response = aiPrompt.toLowerCase().includes("court")
      ? "Court 3 is the best next action. Start the match now, then move the 15:00 semi-final warm-up to Court 5."
      : "Operations look healthy. Resolve Court 6 and publish Round 2 to keep the programme on schedule.";
    setAiResponse(response);
    setAiPrompt("");
  };
  const confirm = (title: string, body: string, confirmText: string, success: string) =>
    setModal({ type: "confirm", title, body, confirm: confirmText, success });

  return (
    <div className="page today-page">
      <PageHeading eyebrow="Live operations" title="Today Dashboard" subtitle="Tuesday, 28 July 2026 · Challenger 2026 Command Centre" actions={<button className="button secondary compact" onClick={() => toast("Live dashboard refreshed")}>↻ Refresh live data</button>} />
      <section className="overview-strip" aria-label="Live overview">
        {overview.map(([icon, value, label, subtext]) => (
          <div className="overview-metric" key={label}>
            <span className="metric-icon">{icon}</span><div><strong>{value}</strong><b>{label}</b><small>{subtext}</small></div>
          </div>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="card health-card">
          <div className="card-header"><div><span className="eyebrow">Operations</span><h2>Tournament Health</h2></div><button className="icon-button small" onClick={() => toast("Health detail opened")}>•••</button></div>
          <div className="health-content">
            <div className="progress-ring ring-94">
              <div><strong>94%</strong><span>Excellent</span></div>
            </div>
            <div className="health-copy"><h3>Everything is on track.</h3><p>Your tournament is running smoothly with no critical blockers.</p>
              <ul>{["No critical issues", "All courts operational", "Round on schedule", "Good player check-in rate"].map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
            </div>
          </div>
        </section>
        <section className="card actions-card">
          <div className="card-header"><div><span className="eyebrow">3 open tasks</span><h2>Action Required</h2></div><span className="count-badge">3</span></div>
          <div className="action-list">
            {[
              ["!", "Court 6 waiting for players", "4 minutes behind schedule", "Resolve", "Resolve Court 6?", "Notify both teams and assign a court marshal.", "Court 6 resolved"],
              ["?", "Confirm Court 4 result", "Score submitted by one team", "Review", "Review Court 4 result?", "Open the submitted score and verify with the official.", "Court 4 result opened"],
              ["✓", "Round 2 ready to publish", "All 8 results verified", "Publish", "Publish Round 2?", "This will notify players and update the public draw.", "Round 2 published"],
            ].map(([icon, title, detail, action, modalTitle, modalBody, success]) => (
              <div className="action-item" key={title}><span className="action-status">{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><button className="button compact secondary" onClick={() => confirm(modalTitle, modalBody, action, success)}>{action}</button></div>
            ))}
          </div>
        </section>
        <section className="card schedule-card">
          <div className="card-header"><div><span className="eyebrow">Programme</span><h2>Today’s Schedule</h2></div><button className="text-button" onClick={() => toast("Full schedule opened")}>View all →</button></div>
          <div className="timeline">
            {schedule.map((item, index) => (
              <div className={`timeline-item ${index < 2 ? "current" : ""}`} key={item.time}><time>{item.time}</time><span className="timeline-node" /><div><strong>{item.title}</strong><small>{item.status}</small></div></div>
            ))}
          </div>
        </section>
        <section className="live-courts">
          <div className="section-heading"><div><span className="eyebrow">Court operations</span><h2>Live Courts</h2></div><button className="text-button" onClick={() => toast("All courts opened")}>View court map →</button></div>
          <div className="court-grid">
            {courts.map((court) => (
              <article className={`court-card court-${court.status}`} key={court.id}>
                <div className="court-top"><span>Court {court.id}</span><StatusBadge status={court.status} /></div>
                <strong className="court-teams">{court.teams}</strong>
                <div className="court-score"><b>{court.score}</b><small>{court.meta}</small></div>
                <button className={`button compact ${court.status === "live" ? "secondary" : court.status === "waiting" ? "primary" : "ghost"}`} onClick={() => court.action === "Start Match" ? confirm("Start match on Court 3?", "Both teams are checked in. The match timer will start immediately.", "Start Match", "Court 3 match started") : toast(`Court ${court.id}: ${court.action}`)}>{court.action}</button>
              </article>
            ))}
          </div>
        </section>
        <section className="card activity-card">
          <div className="card-header"><div><span className="eyebrow">Live feed</span><h2>Recent Activity</h2></div><span className="live-label"><i /> Live</span></div>
          <div className="activity-list">
            {activities.map((item) => (
              <div className="activity-item" key={item.title}><span className="activity-icon">{item.icon}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><time>{item.time}</time></div>
            ))}
          </div>
        </section>
        <section className="ai-panel">
          <div className="ai-header"><div className="ai-orb">✦</div><div><div className="title-with-badge"><h2>Padeuce Assistant</h2><span>BETA</span></div><p>Operational insights for the next best action.</p></div></div>
          <div className="suggestion-grid">
            {suggestions.map((suggestion) => (
              <article className="suggestion-card" key={suggestion.id}><span className="suggestion-icon">{suggestion.icon}</span><div><strong>{suggestion.title}</strong><p>{suggestion.detail}</p><div><button className="text-button" onClick={() => suggestion.action === "Publish" ? confirm("Publish Round 2?", "Players will receive their next match assignment.", "Publish", "Round 2 published") : toast(`${suggestion.action}: ${suggestion.title}`)}>{suggestion.action} →</button><button className="dismiss-button" onClick={() => setSuggestions((items) => items.filter((item) => item.id !== suggestion.id))}>Dismiss</button></div></div></article>
            ))}
          </div>
          {aiResponse && <div className="ai-response"><span>✦</span><p>{aiResponse}</p><button className="icon-button small" onClick={() => setAiResponse("")}>×</button></div>}
          <div className="ai-input"><span>✦</span><input value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} onKeyDown={(event) => event.key === "Enter" && askAi()} placeholder="Ask Padeuce about courts, schedules or players…" aria-label="Ask Padeuce" /><button onClick={askAi} aria-label="Send question">↑</button></div>
        </section>
      </div>
    </div>
  );
}

function CompetitionCard({
  item,
  selected,
  onSelect,
  onAction,
}: {
  item: Competition;
  selected: boolean;
  onSelect: () => void;
  onAction: (message: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const range = `${new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(new Date(item.dateStart))}–${new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.dateEnd))}`;
  return (
    <article className={`competition-card ${selected ? "selected" : ""}`} onClick={onSelect}>
      <div className={`competition-artwork artwork-${item.cover}`}><span>{item.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><small>PADEUCE · 2026</small></div>
      <div className="competition-body">
        <div className="competition-heading"><div><StatusBadge status={item.status} /><h3>{item.name}</h3></div><div className="more-anchor"><button className="icon-button small" onClick={(event) => { event.stopPropagation(); setMenu((value) => !value); }} aria-label={`More options for ${item.name}`} aria-expanded={menu}>•••</button>{menu && <div className="mini-menu"><button onClick={() => onAction("Tournament duplicated")}>Duplicate</button><button onClick={() => onAction("Tournament link copied")}>Copy link</button><button onClick={() => onAction("Tournament archived")}>Archive</button></div>}</div></div>
        <div className="competition-meta"><span>◈ {item.format}</span><span>◎ {item.rule}</span><span>⌖ {item.venue}</span><span>□ {range}</span></div>
        <div className="competition-stats"><div><strong>{item.teams}</strong><span>Teams</span></div><div><strong>{item.matchesCompleted}/{item.matchesTotal}</strong><span>Matches</span></div><div><strong>{item.courts}</strong><span>Courts</span></div></div>
        <div className="progress-row"><div className="progress-track"><span className={`progress-${item.progress}`} /></div><span>{item.progress}%</span></div>
        <div className="competition-footer"><small>{item.timing}</small><button className={`button compact ${item.status === "live" ? "primary" : "secondary"}`} onClick={(event) => { event.stopPropagation(); onAction(item.status === "draft" ? "Tournament setup opened" : `${item.name} dashboard opened`); }}>{item.status === "draft" ? "Continue Setup" : item.status === "live" ? "Open Dashboard" : "View Tournament"} <span>→</span></button></div>
      </div>
    </article>
  );
}

function TournamentAside({
  item,
  toast,
  mobile,
  onClose,
}: {
  item: Competition;
  toast: (message: string) => void;
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside className={`tournament-aside ${mobile ? "mobile-sheet" : ""}`} aria-label="Tournament at a glance">
      {mobile && <div className="sheet-handle" />}
      <div className="aside-heading"><div><span className="eyebrow">Selected competition</span><h2>Tournament at a glance</h2></div>{mobile && <button className="icon-button" onClick={onClose} aria-label="Close tournament details">×</button>}</div>
      <div className={`aside-artwork artwork-${item.cover}`}><span>{item.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><StatusBadge status={item.status} /></div>
      <h3>{item.name}</h3>
      <div className="aside-meta"><span>◈ {item.format}</span><span>⌖ {item.venue}</span><span>□ 24–31 July 2026</span></div>
      <button className="button secondary full" onClick={() => toast("Public tournament page opened")}>View public page ↗</button>
      <div className="aside-stats">{[["Teams", item.teams], ["Players", item.players], ["Courts", item.courts], ["Live", item.liveMatches], ["Waiting", item.waitingMatches], ["Spectators", item.spectators]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="aside-progress"><div><strong>Tournament progress</strong><span>{item.progress}%</span></div><div className="progress-track"><span className={`progress-${item.progress}`} /></div></div>
      <div className="aside-section"><div className="section-heading small"><h4>Recent activity</h4><button className="text-button">View all</button></div><div className="mini-activity"><span>✓</span><div><strong>Quarter Final 1 verified</strong><small>3 minutes ago</small></div></div><div className="mini-activity"><span>●</span><div><strong>Court 2 match started</strong><small>12 minutes ago</small></div></div></div>
      <div className="aside-section"><h4>Quick actions</h4><div className="quick-grid">{["Generate round", "Send message", "Export data", "Tournament settings"].map((action, index) => <button key={action} onClick={() => toast(`${action} opened`)}><span>{["＋", "✉", "↓", "⚙"][index]}</span>{action}</button>)}</div></div>
    </aside>
  );
}

function CompetitionsPage({
  competitions,
  setModal,
  toast,
}: {
  competitions: Competition[];
  setModal: (modal: ModalState) => void;
  toast: (message: string) => void;
}) {
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState("all");
  const [venue, setVenue] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState("challenger-2026");
  const [mobileDetail, setMobileDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filtered = useMemo(() => competitions.filter((item) =>
    tabStatuses[tab].includes(item.status) &&
    (status === "all" || item.status === status) &&
    (format === "all" || item.format === format) &&
    (venue === "all" || item.venue === venue) &&
    `${item.name} ${item.venue}`.toLowerCase().includes(search.toLowerCase())
  ), [competitions, format, search, status, tab, venue]);
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0] || competitions[0];

  return (
    <div className="page competitions-page">
      <PageHeading eyebrow="Tournament operations" title="Competitions" subtitle="Manage all tournaments and competitions." actions={<><button className="button secondary" onClick={() => setModal({ type: "import" })}>↓ Import</button><button className="button primary sticky-mobile-cta" onClick={() => setModal({ type: "new" })}>＋ New Tournament</button></>} />
      <div className="competition-layout">
        <div className="competition-main">
          <div className="tabs" role="tablist" aria-label="Competition status">
            {competitionTabs.map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}<span>{competitions.filter((item) => tabStatuses[value].includes(item.status)).length}</span></button>)}
          </div>
          <div className={`filters ${showFilters ? "expanded" : ""}`}>
            <label className="filter-search"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search competitions…" aria-label="Search competitions" /></label>
            <label><span>Date</span><select aria-label="Filter by date"><option>Any date</option><option>Next 30 days</option><option>This season</option></select></label>
            <label><span>Format</span><select value={format} onChange={(event) => setFormat(event.target.value)}><option value="all">All formats</option>{Array.from(new Set(competitions.map((item) => item.format))).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{["live", "upcoming", "draft", "scheduled", "completed", "archived"].map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}</select></label>
            <label><span>Venue</span><select value={venue} onChange={(event) => setVenue(event.target.value)}><option value="all">All venues</option>{Array.from(new Set(competitions.map((item) => item.venue))).map((item) => <option key={item}>{item}</option>)}</select></label>
            <button className="button secondary filter-toggle" onClick={() => setShowFilters((value) => !value)}>⌁ Filters</button>
          </div>
          <div className="result-summary"><span><strong>{filtered.length}</strong> competitions</span>{(search || format !== "all" || venue !== "all" || status !== "all") && <button className="text-button" onClick={() => { setSearch(""); setFormat("all"); setVenue("all"); setStatus("all"); }}>Clear filters</button>}</div>
          <div className="competition-list">
            {filtered.map((item) => <CompetitionCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => { setSelectedId(item.id); if (window.innerWidth < 1200) setMobileDetail(true); }} onAction={toast} />)}
            {!filtered.length && <div className="empty-state"><span>◇</span><h3>No competitions found</h3><p>Try a different tab or clear the active filters.</p><button className="button secondary" onClick={() => { setSearch(""); setFormat("all"); setVenue("all"); setStatus("all"); }}>Clear filters</button></div>}
          </div>
        </div>
        {selected && <TournamentAside item={selected} toast={toast} />}
      </div>
      {mobileDetail && selected && <><button className="sheet-scrim" aria-label="Close tournament details" onClick={() => setMobileDetail(false)} /><TournamentAside item={selected} toast={toast} mobile onClose={() => setMobileDetail(false)} /></>}
    </div>
  );
}

function ComingSoon({ route, toast }: { route: string; toast: (message: string) => void }) {
  const item = navItems.find((entry) => entry.route === route);
  return (
    <div className="page coming-page">
      <PageHeading eyebrow="Padeuce workspace" title={item?.label || "Workspace"} subtitle="This command-centre module is being prepared for the next release." />
      <section className="coming-card">
        <div className="coming-visual"><span>{item?.icon}</span><i /><i /><i /></div>
        <span className="eyebrow electric">Coming soon</span>
        <h2>{item?.label} is taking shape.</h2>
        <p>One connected place to manage every part of competition day, built around Padeuce live scoring.</p>
        <div className="coming-features"><span>✓ Live operational data</span><span>✓ Club-ready controls</span><span>✓ Public result integration</span></div>
        <button className="button primary" onClick={() => toast(`You’ll be notified when ${item?.label} is ready`)}>Notify me</button>
      </section>
    </div>
  );
}

function NewTournamentFlow({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (competition: Competition) => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", date: "2026-09-12", venue: "Hermanus Sports Club", courts: "8", format: "Single Elimination", rule: "Best of 3", deuce: "Golden point", registration: "Invite only" });
  const steps = ["Details", "Format", "Rules", "Registration", "Review"];
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const create = (draft = false) => {
    const name = form.name.trim() || "Untitled Tournament";
    onCreate({
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name,
      status: "draft",
      format: form.format,
      rule: form.rule,
      venue: form.venue,
      dateStart: form.date,
      dateEnd: form.date,
      teams: 0,
      players: 0,
      matchesCompleted: 0,
      matchesTotal: 0,
      courts: Number(form.courts),
      liveMatches: 0,
      waitingMatches: 0,
      spectators: 0,
      progress: draft ? 20 : 45,
      cover: "N",
      timing: draft ? "Draft saved just now" : "Setup created just now",
    });
  };
  return (
    <div className="stepper">
      <ol>{steps.map((label, index) => <li key={label} className={index === step ? "active" : index < step ? "complete" : ""}><span>{index < step ? "✓" : index + 1}</span><b>{label}</b></li>)}</ol>
      <div className="step-content">
        {step === 0 && <div className="form-grid"><label className="span-2">Tournament name<input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Spring Challenger 2026" autoFocus /></label><label>Date<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label><label>Number of courts<input type="number" min="1" max="32" value={form.courts} onChange={(event) => update("courts", event.target.value)} /></label><label className="span-2">Venue<select value={form.venue} onChange={(event) => update("venue", event.target.value)}><option>Hermanus Sports Club</option><option>Cape Town Padel Park</option><option>Overberg Padel Centre</option></select></label></div>}
        {step === 1 && <ChoiceGrid values={["Single Elimination", "Round Robin", "Group Stage + Knockout", "Double Elimination", "Americano", "Mexicano"]} selected={form.format} onSelect={(value) => update("format", value)} />}
        {step === 2 && <div className="form-grid"><label className="span-2">Match format<select value={form.rule} onChange={(event) => update("rule", event.target.value)}><option>Best of 3</option><option>Best of 5</option><option>Single set</option></select></label><label className="span-2">Deuce rule<select value={form.deuce} onChange={(event) => update("deuce", event.target.value)}><option>Golden point</option><option>Normal deuce</option></select></label><label className="check-panel span-2"><input type="checkbox" defaultChecked /> Final-set match tiebreak to 10 points</label></div>}
        {step === 3 && <ChoiceGrid values={["Manual teams", "Invite only", "Open registration"]} selected={form.registration} onSelect={(value) => update("registration", value)} />}
        {step === 4 && <div className="review-panel"><div><span>Name</span><strong>{form.name || "Untitled Tournament"}</strong></div><div><span>Date</span><strong>{form.date}</strong></div><div><span>Venue</span><strong>{form.venue}</strong></div><div><span>Courts</span><strong>{form.courts}</strong></div><div><span>Format</span><strong>{form.format}</strong></div><div><span>Rules</span><strong>{form.rule} · {form.deuce}</strong></div><div><span>Registration</span><strong>{form.registration}</strong></div></div>}
      </div>
      <div className="step-actions">
        <button className="button secondary" onClick={() => step ? setStep(step - 1) : onClose()}>{step ? "Back" : "Cancel"}</button>
        <div>{step === 4 && <button className="button ghost" onClick={() => create(true)}>Save Draft</button>}<button className="button primary" onClick={() => step < 4 ? setStep(step + 1) : create(false)}>{step < 4 ? "Continue" : "Create Tournament"} <span>→</span></button></div>
      </div>
    </div>
  );
}

function ChoiceGrid({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) {
  return <div className="choice-grid">{values.map((value, index) => <button key={value} className={selected === value ? "selected" : ""} onClick={() => onSelect(value)}><span>{["◈", "◎", "▦", "◇", "A", "M"][index]}</span><strong>{value}</strong><small>{selected === value ? "Selected" : "Choose format"}</small></button>)}</div>;
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState("login");
  const [modal, setModal] = useState<ModalState>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [competitions, setCompetitions] = useState<Competition[]>(competitionsSeed);

  const navigate = (next: string) => {
    window.location.hash = `#/${next}`;
    setRoute(next);
  };

  useEffect(() => {
    const sync = () => {
      const loggedIn = sessionStorage.getItem("padeuce-auth") === "true";
      const hash = window.location.hash.replace(/^#\//, "") || (loggedIn ? "today" : "login");
      setAuthenticated(loggedIn);
      if (!loggedIn && hash !== "login") {
        window.location.hash = "#/login";
        setRoute("login");
      } else if (loggedIn && hash === "login") {
        window.location.hash = "#/today";
        setRoute("today");
      } else setRoute(hash);
      setReady(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const login = () => {
    sessionStorage.setItem("padeuce-auth", "true");
    setAuthenticated(true);
    navigate("today");
  };
  const logout = () => {
    sessionStorage.removeItem("padeuce-auth");
    setAuthenticated(false);
    navigate("login");
  };
  const showToast = (message: string) => setToastMessage(message);

  if (!ready) return <div className="app-loader"><Logo /><span className="spinner" /></div>;

  const modalTitle = modal?.type === "forgot" ? "Reset your password" : modal?.type === "access" ? "Request access" : modal?.type === "import" ? "Import Tournament" : modal?.type === "help" ? "How can we help?" : modal?.type === "new" ? "Create a new tournament" : modal?.type === "confirm" ? modal.title : "";

  return (
    <>
      {!authenticated || route === "login" ? <Login onLogin={login} setModal={setModal} /> : (
        <Shell route={route} navigate={navigate} onLogout={logout} setModal={setModal} toast={showToast}>
          {route === "today" ? <Today setModal={setModal} toast={showToast} /> : route === "competitions" ? <CompetitionsPage competitions={competitions} setModal={setModal} toast={showToast} /> : <ComingSoon route={route} toast={showToast} />}
        </Shell>
      )}
      <Modal open={Boolean(modal)} title={modalTitle} onClose={() => setModal(null)} wide={modal?.type === "new"}>
        {modal?.type === "forgot" && <form className="simple-form" onSubmit={(event) => { event.preventDefault(); setModal(null); showToast("Password reset instructions sent"); }}><p>Enter the email linked to your Padeuce account and we’ll send a secure reset link.</p><label>Email address<input type="email" required placeholder="name@club.co.za" autoFocus /></label><button className="button primary full">Send reset link</button></form>}
        {modal?.type === "access" && <form className="simple-form" onSubmit={(event) => { event.preventDefault(); setModal(null); showToast("Access request submitted"); }}><p>Tell us about your club and we’ll arrange a guided Command Centre setup.</p><label>Your name<input required placeholder="Full name" autoFocus /></label><label>Club or organisation<input required placeholder="Club name" /></label><label>Work email<input type="email" required placeholder="name@club.co.za" /></label><button className="button primary full">Request access</button></form>}
        {modal?.type === "confirm" && <div className="confirm-content"><span className="confirm-icon">✓</span><p>{modal.body}</p><div><button className="button secondary" onClick={() => setModal(null)}>Cancel</button><button className="button primary" onClick={() => { const success = modal.success; setModal(null); showToast(success); }}>{modal.confirm}</button></div></div>}
        {modal?.type === "import" && <div className="import-panel"><div className="drop-zone"><span>↓</span><h3>Drop tournament file here</h3><p>CSV or XLSX up to 10MB</p><label className="button secondary">Choose file<input type="file" accept=".csv,.xlsx" onChange={() => { setModal(null); showToast("Tournament file imported"); }} /></label></div><div className="import-note"><strong>Need the template?</strong><button className="text-button" onClick={() => showToast("Import template downloaded")}>Download CSV template →</button></div></div>}
        {modal?.type === "help" && <div className="help-options">{["Get started with Command Centre", "Run a competition", "Connect live scoring", "Contact Padeuce support"].map((item, index) => <button key={item} onClick={() => { setModal(null); showToast(`${item} opened`); }}><span>{["↗", "◈", "●", "✉"][index]}</span><div><strong>{item}</strong><small>Step-by-step guidance</small></div><i>→</i></button>)}</div>}
        {modal?.type === "new" && <NewTournamentFlow onClose={() => setModal(null)} onCreate={(competition) => { setCompetitions((items) => [competition, ...items]); setModal(null); showToast(`${competition.name} created`); }} />}
      </Modal>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </>
  );
}
