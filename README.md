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
- Five-step tournament creation flow that adds a session-local draft
- Tournament import, more menus, help, request-access and password-reset dialogs

## Design system

Design tokens live in `app/globals.css`. The core palette uses deep navy surfaces, restrained cool-grey borders and selective electric chartreuse emphasis. Headings use a Montserrat-style system stack; body copy uses an Inter-style system stack.

## Accessibility

The prototype uses semantic controls, labels, visible focus treatment, 44px mobile targets, keyboard-operable menus, modal focus trapping, Escape-to-close behaviour, ARIA state attributes and reduced-motion support. Statuses always combine colour with text and symbols.

## Project structure

- `index.html` - semantic markup for login, command centre, competitions, placeholders, dialogs and mobile navigation
- `js/app.js` - hash routing, component rendering, state and all prototype interactions
- `js/data.js` - local courts, competitions, activity, schedule and navigation data
- `css/styles.css` - reset, tokens, components, pages and responsive behaviour
- `assets/` - local imagery and brand assets
- `manifest.webmanifest` - installable-site metadata

The browser application has no framework, no inline styles, no inline scripts and no runtime dependency.

## Add another screen

Add a route entry to `navItems` in `js/data.js`, add the semantic page section to `index.html`, and update `syncRoute()` in `js/app.js`. Shared shell, modal, toast, heading, button and status styles can be reused.

## Replace mock data with an API

Keep the competition object shape in `js/data.js` as the view model. Replace the seed array and other static exports with asynchronous fetch functions, then load them into the existing top-level state. The filtering, selection and rendering functions can remain unchanged.
