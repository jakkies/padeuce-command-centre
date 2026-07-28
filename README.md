# Padeuce Command Centre

A polished front-end prototype for clubs, tournament organisers, coaches and officials. It extends the Padeuce scoring experience into a responsive operational command centre for live matches, courts and competitions.

## Run locally

Install dependencies, then run:

```bash
npm run dev
```

Open the local URL shown in the terminal. The production build is created with:

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

- `app/page.tsx` - interactive screens, shared shell and reusable prototype components
- `app/data.ts` - local courts, competitions, activity, schedule and navigation data
- `app/globals.css` - reset, tokens, components, pages and responsive behaviour
- `public/` - local imagery, manifest and favicon

## Add another screen

Add a route entry to `navItems` in `app/data.ts`, create a page component in `app/page.tsx`, and route to it in the authenticated content switch. Shared shell, modal, toast, heading, button and status styles can be reused.

## Replace mock data with an API

Keep the `Competition` shape in `app/data.ts` as the view model. Replace the seed array and other static exports with asynchronous fetch functions, then load them into the existing top-level state. The filtering, selection and rendering components can remain unchanged.
