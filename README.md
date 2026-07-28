# Padeuce Command Centre

A framework-free static HTML prototype for clubs, tournament organisers, coaches and officials. It extends the Padeuce scoring experience into a responsive operational command centre for live matches, courts and competitions.

## Run locally

The site is a static bundle that can be hosted by any basic file server. For local development and production optimisation, install dependencies and run:

```bash
npm run dev
```

Open the local URL shown in the terminal. The optimised production build is created with:

```bash
npm run build
```

## Deploy to Cloudflare

The checked-in `wrangler.jsonc` is the source of truth for both Vite and
Wrangler. The install lifecycle creates the production bundle before
Cloudflare reaches its deploy stage, so the repository works with the default
Workers Builds settings:

```bash
npx wrangler deploy
```

For the existing Cloudflare Git integration, use:

- Build command: leave blank
- Deploy command: `npx wrangler deploy`

The `postinstall` script deliberately supplies the build step because
Cloudflare Workers Builds does not honor Wrangler custom-build settings. If
the dashboard is later configured with `npm run build` as a separate build
command, the install hook may be removed to avoid building twice.

To verify the complete build and upload bundle locally without publishing:

```bash
npm run deploy:dry-run
```

## Routes

The prototype uses a lightweight hash router:

- `#/login`
- `#/today`
- `#/competitions`
- `#/courts`
- `#/matches`
- `#/community`
- `#/insights`
- `#/sponsors`
- `#/assistant`
- `#/administration`

Unauthenticated routes redirect to the login screen. Any valid email and a password of six or more characters will enter the prototype. Session state is stored in `sessionStorage`; remembered email is stored locally.

## Prototype interactions

- Login validation, loading state, password visibility and logout
- Club, profile and notification menus
- Responsive sidebar, mobile drawer and bottom navigation
- Dashboard action confirmations, live court actions and toast feedback
- Deterministic Padeuce Assistant responses and dismissible suggestions
- Competition tabs, search, format/status/venue filters and selected-tournament details
- Mobile tournament bottom sheet
- Court operations grid, list and CSS map views with persistent display mode
- Court status and zone filters, live search, sorting and selected-court details
- Start, confirm, delay, assign, reconnect, move, official-request and add-court workflows
- Responsive court detail drawer with keyboard focus trapping
- Match table, chronological timeline and draggable Kanban views with session-persisted display mode
- Tournament, round, court, status, player, date, format, official and free-text match filtering
- Selected-match scoring, teams, history, notes and operational detail panel or mobile drawer
- Launch scoring, pause, resume, move, confirm, cancel, share, import, export and new-match workflows
- Community Players, Teams, Coaches and Officials directories with per-tab filters and persistent active tab
- Semantic list tables, responsive profile cards, selected-profile details and keyboard-operable directory tabs
- Add Person and Add Team flows, invitations, assignments, editable notes, attention filters and CSV export
- Five-step tournament creation flow that adds a session-local draft
- Five-step match creation flow that adds a session-local scheduled match
- Tournament import, more menus, help, request-access and password-reset dialogs

## Design system

Design tokens live in `css/styles.css`. The core palette uses deep navy surfaces, restrained cool-grey borders and selective electric chartreuse emphasis. Headings use a Montserrat-style system stack; body copy uses an Inter-style system stack.

## Accessibility

The prototype uses semantic controls, labels, visible focus treatment, 44px mobile targets, keyboard-operable menus, modal focus trapping, Escape-to-close behaviour, ARIA state attributes and reduced-motion support. Statuses always combine colour with text and symbols.

## Project structure

- `index.html` - semantic markup for login, command centre, competitions, courts, matches, placeholders, dialogs and mobile navigation
- `js/app.js` - shared hash routing, shell state and cross-screen interactions
- `js/data.js` - local courts, matches, competitions, activity, schedule and navigation data
- `js/pages/courts.js` - court operations state, filters, view rendering and workflows
- `js/pages/matches.js` - match operations state, filters, three views and workflows
- `js/pages/community.js` - community tabs, filtering, session-local records, assignments and export flows
- `js/components/` - reusable court and match cards, detail panels, status utilities and view controls
- `css/styles.css` - reset, tokens, components, pages and responsive behaviour
- `css/pages/courts.css` - Courts-specific grid, list, map, detail and responsive styles
- `css/pages/matches.css` - Matches-specific table, timeline, Kanban, detail and responsive styles
- `css/pages/community.css` - Community directory, profile, modal and responsive styles
- `assets/` - local imagery and brand assets
- `manifest.webmanifest` - installable-site metadata
- `wrangler.jsonc` - Cloudflare Worker, static assets and deployment build configuration

The browser application has no framework, no inline styles, no inline scripts and no runtime dependency.

## Add another screen

Add a route entry to `navItems` in `js/data.js`, add the semantic page section to `index.html`, and update `syncRoute()` in `js/app.js`. Shared shell, modal, toast, heading, button and status styles can be reused.

## Replace mock data with an API

Keep the competition, court and match object shapes in `js/data.js` as view models. Replace the seed arrays and other static exports with asynchronous fetch functions, then load them into the existing screen state. The filtering, selection and rendering functions can remain unchanged.
