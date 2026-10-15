# Progress — 26 Modernization Phase 1: Replace Create React App with Vite

| Task | Title | Depends on | Complexity | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Vite build replaces react-scripts | — | High | Done | opus; verifier FAIL(build): clean npm ci → MISSING_EXPORT from material-table nested @material-ui/pickers 3.2.2; retry 1 (opus, already top tier); retry Done (resolve.dedupe pickers); verifier PASS (build) |
| T2 | Configuration from VITE_* env vars | T1 | Low | Done | haiku Done; review: normalize strips only one trailing slash, stale REMOTE_API_ADDRESS left in constants.js; escalated to sonnet; sonnet retry Done; verifier PASS (build + values in bundle); config unit test deferred to T4 |
| T3 | PWA via vite-plugin-pwa (Workbox 7) | T2 | High | Done | opus; Playwright: SW controls, offline OK, CRA upgrade takes over on 2nd load; @types/react override ^17 added; verifier PASS (build) |
| T4 | Jest → Vitest + jsdom | T3 | Medium | Done | sonnet; 9 files / 127 tests (incl. T2 config test); verifier PASS (build + tests) |
| T5 | ESLint flat config | T4 | Medium | Done | sonnet; eslint 0 errors / 30 warnings; verifier PASS (lint + tests + build) |
| T6 | Root build script, CI workflow and README | T5 | Low | Done | haiku; final verifier PASS (root NODE_ENV=production build, 9/127 tests, lint 0 errors, server check, CI YAML) |
