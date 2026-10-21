# Changelog

All notable changes to this project will be documented in this file.
Each entry corresponds to a completed story and is generated from the actual PR diff after
implementation — not from the spec plan.
Entries are ordered by merge date (newest first).

To add entries, run the `generate-changelog-entry` skill (or the `changelog-generator` agent).
It scans `docs/specs/plans/` for `FINAL` plans with no entry here yet, finds each one's merged
PR on GitHub, and drafts from the diff. The format for an entry is in
`docs/changelog-entry-template.md`.

---

## [30] Modernization Phase 5: Server and hosting (leave Heroku) — 2026-10-20

Tags: `server` `infrastructure` `ci` `testing`
PR: [#53](https://github.com/bcichonski/BcExpiGuard/pull/53)
Builds on: #26

### What was built
- `server/app.js`: `createApp` factory on Express 5 with `/healthz`, optional HTTPS redirect (308) + HSTS, helmet with an explicit CSP (`connect-src`/`frame-src` derived from the Auth0 and CouchDB origins), compression, static serving and an SPA fallback middleware
- Cache policy: `assets/**` served `immutable` for a year; `index.html` and everything else `no-cache`
- `server/config.js`: `loadConfig` reads `PORT`, `FORCE_HTTPS` and `VITE_AUTH0_DOMAIN`/`VITE_COUCH_URL`, falling back to `react-ui/.env.production`; HTTPS is on by default when `NODE_ENV=production`
- `server/index.js` reduced to bootstrap + graceful SIGTERM/SIGINT shutdown (5 s forced-exit timeout)
- `server/app.test.js` (node:test + supertest) and root `npm test`, run as a new step in CI's `server` job
- Multi-stage `Dockerfile` (node:24-alpine build → runtime with prod deps only, `USER node`, port 5000, `HEALTHCHECK` on `/healthz`), `.dockerignore`, and `docker-compose.yml` for local runs with `FORCE_HTTPS=false`
- `.github/workflows/docker.yml`: builds the image on every PR and pushes to `ghcr.io/bcichonski/bcexpiguard` (`latest` + `sha-<short>`) on master, with GHA layer cache
- Heroku removed: `app.json`, `cacheDirectories` and the `heroku` keyword deleted; `doc/deployment.md` added
- Dependencies: `express` 4 → 5, new `helmet`, `compression`, `supertest` (dev)

### Key decisions reflected in the diff
- The server builds the CSP from the same `VITE_*` values the client is built with, so there is one source of truth for the allowed origins.
- HTTPS enforcement is opt-out (`FORCE_HTTPS=false`), not opt-in, and `/healthz` is registered before the redirect so plain-HTTP health probes keep working.

## [29] Modernization Phase 4: Data layer (PouchDB 9 + sync fixes) — 2026-10-20

Tags: `persistence` `sync` `auth` `testing`
PR: [#52](https://github.com/bcichonski/BcExpiGuard/pull/52)
Builds on: #28

### What was built
- PouchDB 7 → 9 (`pouchdb-debug` dropped, `pouchdb-adapter-memory` added for tests)
- `persistence/liveSync.js`: one live, retrying `localDb.sync` per synced DB (`item_names`, `items`), with the remote filter applied to pull only, an exponential back-off (1 s → 5 min, with jitter) and aggregated per-DB sync state reported through the existing sync hooks
- `persistence/authFetch.js`: `createAuthFetch` gives remote PouchDBs a `fetch` that asks Auth0 for a token on every request, retries once with `cacheMode: 'off'` after a 401, and fails fast once the session has ended
- `DbProvider` reworked: `Login` takes the token getter instead of a fixed token, `startSync()` (idempotent) replaces the hand-rolled two-step replicate, and logout runs an ordered, failure-tolerant teardown (stop sync → close remotes → close locals) that a concurrent login waits for
- `common/syncMonkey.js` (polling + mousemove/touchmove wake-up hooks) removed; `appstate.initialize` now starts live sync
- `persistence/items.js`/`itemNames.js` write to the local DB only; the direct remote `upsert`/`putIfNotExists` calls are gone
- `common/logger.js`: debug/info only in Vite DEV or when `localStorage['expiguard:debug'] === '1'`
- Tests: `liveSync`, `liveSyncTwoDevices`, `authFetch`, `localOnlyWrites`, `pouchdb9`, `logger`, extended `DbProvider` tests

### Key decisions reflected in the diff
- Local data is kept on logout on purpose, so offline edits that haven't been pushed yet survive.
- Writes go local-first and replication is the only path to the server, which removes the earlier double-write to remote.

## [28] Modernization Phase 3: React 19, React Router 7, Auth0 React SDK v2, Redux Toolkit 2 — 2026-10-17

Tags: `ui` `auth` `routing` `state` `testing`
PR: [#51](https://github.com/bcichonski/BcExpiGuard/pull/51)
Builds on: #27

### What was built
- React 17 → 19.2 with `createRoot` and `<StrictMode>` enabled; react-redux 9, Redux Toolkit 2, date-fns 4, uuid 14, Testing Library 16
- `@reach/router` + `history` → React Router 7: `RouterSwitch` uses `<Routes>/<Route element>`, `Restricted` redirects with `<Navigate replace>`
- Custom `common/auth0.jsx` wrapper over `auth0-spa-js` replaced by `@auth0/auth0-react` v2; `Auth0ProviderWithNavigate` handles the redirect callback with `navigate(..., { replace: true })`
- `common/navigation.js` + `NavigationBridge` let non-component code (reducers/thunks) navigate through the router
- `App` moved from `connect` to hooks; login wiring and loading timers moved into `useEffect` with cleanup
- `DbProvider` login made idempotent and cancellable (shared in-flight login, generation counter) so StrictMode's double effects log in once
- `redux`, `redux-thunk`, `redux-devtools-extension` removed (covered by RTK 2)
- Tests: `AllRoutesSmoke`, `AppStrictMode`, `Auth0ProviderWithNavigate`, `NavigationBridge`, `RouterSwitch`, `Profile`, `navigation`, `store`, `DbProvider` and more

### Key decisions reflected in the diff
- StrictMode was enabled instead of left commented out, and the login path was made idempotent to cope with it.

## [27] Modernization Phase 2: Upgrade UI libraries (Material-UI v4 → MUI v7) — 2026-10-16

Tags: `ui` `testing`
PR: [#43](https://github.com/bcichonski/BcExpiGuard/pull/43)
Builds on: #26

### What was built
- `@material-ui/*` v4 (core, icons, lab, pickers, styles) replaced by `@mui/material`/`@mui/icons-material` 7 with Emotion; `material-table` and `react-responsive` removed
- `BrowseItems` rebuilt on MUI components instead of `material-table`; `makeStyles` replaced by `styled` across `Layout`, `NavBar`, `ExpireSoonList` and others
- `DatePicker` moved to `@mui/x-date-pickers` 8 (`DesktopDatePicker`/`MobileDatePicker`), with the store's string date converted to a `Date` for the picker
- `App` wraps the UI in `ThemeProvider` + `CssBaseline` + `LocalizationProvider` (date-fns adapter); media query via MUI `useMediaQuery`
- `src/theme.js` restores the v4 look: v4 breakpoints, palette, body2 body text, standard input variant, hover-only link underline, menu item/icon button spacing
- Roboto via `@fontsource/roboto` instead of `typeface-roboto`; recharts 1 → 3; React 16 → 17 as an intermediate step
- Component tests added: `Autocomplete`, `BrowseItems`, `Chart`, `DatePicker`, `ExpireSoonList`, `Layout`

### Key decisions reflected in the diff
- The upgrade aims to look the same as before: `theme.js` exists only to cancel out default changes from v5 onward.

## [26] Modernization Phase 1: Replace Create React App with Vite — 2026-10-16

Tags: `build` `ci` `testing`
PR: [#41](https://github.com/bcichonski/BcExpiGuard/pull/41)
Builds on: #25

### What was built
- `react-scripts` 3 replaced by Vite (`vite.config.mjs`, root `index.html`, `.js` → `.jsx` renames); scripts `dev`/`build`/`preview`/`test` (Vitest)/`lint`
- Jest replaced by Vitest (jsdom, globals, fixed test `VITE_*` values so tests never read `.env` files)
- ESLint 9 flat config (`eslint.config.mjs`) with react + react-hooks; CI runs `npm run lint` and no longer needs `--openssl-legacy-provider`
- CRA `serviceWorker.js` replaced by `vite-plugin-pwa` (`generateSW`, auto-update, `service-worker.js` filename and `/` scope kept)
- `constants/config.js` reads `VITE_COUCH_URL` and the Auth0 settings from `import.meta.env` (logs missing ones, normalises the trailing slash); `auth_config.json` and the hard-coded CouchDB URL removed; `.env.example` and `.env.production` added
- `manifest.json` `Scope` → `scope` fix; `config.test.js` added and existing tests ported to Vitest

### Key decisions reflected in the diff
- The PWA worker keeps CRA's file name and scope so browsers treat it as an update of the existing registration, not a second worker.
- Configuration moved from source constants to build-time env vars.

## [25] Modernization Phase 0: Baseline and safety net (CI + tests) — 2026-10-15

Tags: `ci` `testing`
PR: [#33](https://github.com/bcichonski/BcExpiGuard/pull/33)

### What was built
- `.github/workflows/ci.yml`: `react-ui` job (build + tests) and `server` job (syntax check), on PRs and pushes to master
- `.github/dependabot.yml`: weekly updates for root npm, `react-ui` npm and GitHub Actions, with minor/patch grouped
- Node pinned to 24 (`.nvmrc`, `engines` in both `package.json` files)
- Baseline unit tests: `syncMonkey`, `appstate`, `categories`, `item-edit-add`, `item-list`, `item-names`, `persistence/validate`; `App.test.js` expanded
- `doc/couchdb/`: README and a reconstructed (explicitly unverified) reference copy of the `_design/restrict` filter
