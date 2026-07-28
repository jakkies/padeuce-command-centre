export type CompetitionStatus =
  | "live"
  | "upcoming"
  | "draft"
  | "scheduled"
  | "completed"
  | "archived";

export type Competition = {
  id: string;
  name: string;
  status: CompetitionStatus;
  format: string;
  rule: string;
  venue: string;
  dateStart: string;
  dateEnd: string;
  teams: number;
  players: number;
  matchesCompleted: number;
  matchesTotal: number;
  courts: number;
  liveMatches: number;
  waitingMatches: number;
  spectators: number;
  progress: number;
  cover: string;
  timing: string;
};

export const competitionsSeed: Competition[] = [
  {
    id: "challenger-2026",
    name: "Challenger 2026",
    status: "live",
    format: "Single Elimination",
    rule: "Best of 3",
    venue: "Hermanus Sports Club",
    dateStart: "2026-07-24",
    dateEnd: "2026-07-31",
    teams: 8,
    players: 14,
    matchesCompleted: 1,
    matchesTotal: 4,
    courts: 8,
    liveMatches: 4,
    waitingMatches: 2,
    spectators: 322,
    progress: 25,
    cover: "A",
    timing: "Live now",
  },
  {
    id: "schools-cup-2026",
    name: "Schools Cup 2026",
    status: "upcoming",
    format: "Group Stage + Knockout",
    rule: "Best of 3",
    venue: "Cape Town Padel Park",
    dateStart: "2026-08-07",
    dateEnd: "2026-08-09",
    teams: 12,
    players: 24,
    matchesCompleted: 0,
    matchesTotal: 24,
    courts: 6,
    liveMatches: 0,
    waitingMatches: 0,
    spectators: 0,
    progress: 8,
    cover: "B",
    timing: "Starts in 10 days",
  },
  {
    id: "club-championships",
    name: "Club Championships",
    status: "draft",
    format: "Double Elimination",
    rule: "Best of 3",
    venue: "Hermanus Sports Club",
    dateStart: "2026-08-21",
    dateEnd: "2026-08-23",
    teams: 16,
    players: 30,
    matchesCompleted: 0,
    matchesTotal: 0,
    courts: 10,
    liveMatches: 0,
    waitingMatches: 0,
    spectators: 0,
    progress: 62,
    cover: "C",
    timing: "Setup 62% complete",
  },
  {
    id: "winter-league",
    name: "Winter League",
    status: "scheduled",
    format: "Round Robin",
    rule: "Best of 3",
    venue: "Overberg Padel Centre",
    dateStart: "2026-09-30",
    dateEnd: "2026-11-14",
    teams: 24,
    players: 48,
    matchesCompleted: 0,
    matchesTotal: 72,
    courts: 12,
    liveMatches: 0,
    waitingMatches: 0,
    spectators: 0,
    progress: 15,
    cover: "D",
    timing: "Starts in 64 days",
  },
  {
    id: "autumn-open",
    name: "Autumn Open",
    status: "completed",
    format: "Single Elimination",
    rule: "Best of 3",
    venue: "Hermanus Sports Club",
    dateStart: "2026-04-12",
    dateEnd: "2026-04-14",
    teams: 16,
    players: 32,
    matchesCompleted: 31,
    matchesTotal: 31,
    courts: 8,
    liveMatches: 0,
    waitingMatches: 0,
    spectators: 864,
    progress: 100,
    cover: "E",
    timing: "Completed 14 April",
  },
  {
    id: "summer-series-2025",
    name: "Summer Series 2025",
    status: "archived",
    format: "Round Robin",
    rule: "Best of 3",
    venue: "Hermanus Sports Club",
    dateStart: "2025-12-02",
    dateEnd: "2025-12-20",
    teams: 20,
    players: 40,
    matchesCompleted: 50,
    matchesTotal: 50,
    courts: 8,
    liveMatches: 0,
    waitingMatches: 0,
    spectators: 1290,
    progress: 100,
    cover: "F",
    timing: "Archived",
  },
];

export const courts = [
  { id: 1, status: "live", teams: "E / L  vs  S / H", score: "30–15", meta: "57 minutes", action: "Open" },
  { id: 2, status: "live", teams: "G / N  vs  S / S", score: "40–30", meta: "63 minutes", action: "Open" },
  { id: 3, status: "waiting", teams: "L / J  vs  C / C", score: "Ready", meta: "Players checked in", action: "Start Match" },
  { id: 4, status: "delayed", teams: "J / L  vs  F / M", score: "Paused", meta: "Rain delay", action: "Update" },
  { id: 5, status: "offline", teams: "Maintenance", score: "—", meta: "Net inspection", action: "Details" },
];

export const activities = [
  { icon: "●", title: "Court 1 · Match 6", detail: "Point scored by E / L", time: "Just now" },
  { icon: "✓", title: "Team G / N checked in", detail: "Quarter Final", time: "2 min" },
  { icon: "■", title: "Match 5 on Court 2 completed", detail: "S / S won 6–4, 6–3", time: "8 min" },
  { icon: "+", title: "Medical timeout · Court 3", detail: "Official notified", time: "14 min" },
  { icon: "↗", title: "New sponsor ad activated", detail: "Cape Coast Motors", time: "22 min" },
];

export const schedule = [
  { time: "09:00", title: "Round 1 started", status: "Complete" },
  { time: "11:30", title: "Quarter Finals", status: "In progress" },
  { time: "15:00", title: "Semi Finals", status: "Upcoming" },
  { time: "18:00", title: "Finals", status: "Upcoming" },
  { time: "20:00", title: "Prize Giving", status: "Upcoming" },
];

export const notifications = [
  { title: "Court 6 needs attention", time: "1 min ago", unread: true },
  { title: "Round 2 draw is ready", time: "8 min ago", unread: true },
  { title: "Sponsor campaign reached 10k views", time: "1 hour ago", unread: false },
];

export const navItems = [
  { route: "today", label: "Today", icon: "⌂" },
  { route: "competitions", label: "Competitions", icon: "◈" },
  { route: "courts", label: "Courts", icon: "▦" },
  { route: "matches", label: "Matches", icon: "◎" },
  { route: "community", label: "Community", icon: "◉" },
  { route: "insights", label: "Insights", icon: "↗" },
  { route: "sponsors", label: "Sponsors", icon: "◇" },
  { route: "assistant", label: "AI Assistant", icon: "✦", badge: "BETA" },
  { route: "administration", label: "Administration", icon: "⚙" },
];
