# Auth0 Access Token Never Refreshed — Sync Silently Stops after Expiry Plan

**Plan Status**: `FINAL`

**Story Type**: `Internal`

> This plan captures **what** to build and **why** — domain, architecture, decisions, and verified facts.
> It deliberately does **not** contain implementation code, pseudocode, line numbers, mock setups, or test bodies.
> The implementation agent discovers the **how** against live code. See §4 Task Breakdown.

---

## 1. Problem Statement

Issue #22 (labels `bug`, `modernization`) reports this:

*   `DbProvider.useUserAsync()` got **one** access token at login and stored it as a fixed `Authorization` header. The remote PouchDB instances were created with that header. `!this.logged` meant the header was never refreshed.
*   After the token expired, replication to CouchDB failed. `syncMonkey` only backed off (up to 5 min), so sync stopped **silently** until the page was reloaded. Long-lived PWA sessions were hit hardest.

The issue asks for three fixes:

1.  Get a fresh token per request via `getAccessTokenSilently()`, using PouchDB's `fetch` option, instead of fixed headers.
2.  On a 401/`denied`, refresh the token and retry instead of only backing off.
3.  Ideally, show the sync failure in `SyncState`.

The issue says this is "Part of the modernization plan (Phase 4, task 4.3)".

### 1.1 Technical Summary

*   **Finding:** Phase 4 (#29, PR #52, merged to `master`) already delivered all three fixes. Its PR body lists "4.3 #22 token never refreshed — Done", but it only contains `Closes #29`. That is why #22 is still open.
*   **Goal of this story:** confirm against current `master` that every point of #22 is fixed and covered by tests, and record the evidence. The PR from this run (`Closes #22`) closes the issue when merged. No production code changes.
*   **Out of scope:** changing the Auth0 SDK token strategy (see D3).

---

## 2. Architecture & Design

### 2.1 Architecture Overview

Unchanged from Phase 4. `App` passes `getAccessTokenSilently` into `DbProvider.UseUser`. `DbProvider.Login` creates a session and builds a fetch wrapper with `createAuthFetch(session)`. Each remote PouchDB gets that wrapper as its `fetch` option, so every request carries a fresh `Bearer` token. `LiveSync` maps replication `paused(err)` / `denied` / `error` to the global sync state `error`. The NavBar's `SyncState` icon shows that state.

### 2.2 External Contracts & Evidence

`N/A — Internal story`.

### 2.3 Affected Areas — fix-to-evidence trace (verified on `origin/master` @ `fe853b0`)

| #22 point | Status | Code (pointer) | Tests (pointer) |
| :--- | :--- | :--- | :--- |
| 1. Fresh token per request through PouchDB `fetch` | Fixed | `react-ui/src/persistence/authFetch.js` (`createAuthFetch`); `react-ui/src/persistence/DbProvider.js` (remotes are created with `{ fetch: this.remoteFetch }`, no fixed header); `react-ui/src/App.jsx` (passes `getAccessTokenSilently`) | `tests/persistence/authFetch.test.js` ("attaches a token per request and picks up a changed token…", "routes remote requests through the wrapper with a bearer token" on a real PouchDB 9); `tests/persistence/DbProvider.test.js` (remote options are exactly `{ fetch }`) |
| 2. On 401, refresh and retry instead of only backing off | Fixed | `authFetch.js`: on a 401 it gets one forced token (`cacheMode: 'off'`) and retries once; no loop; nothing is sent after logout | `authFetch.test.js` (refresh + retry, double 401, refresh failure, after logout, logout mid-request) |
| 3. Show the sync failure in `SyncState` | Fixed | `react-ui/src/persistence/liveSync.js` (`paused` with an error, `denied`, `error` → `error`; it restarts on `online` / tab visible); `react-ui/src/components/SyncState.jsx` (`error` → `SyncProblemIcon`) | `tests/persistence/liveSync.test.js` (a 401 `error`, a 403 `denied` and `paused(err)` all give state `error`) |

`syncMonkey` and the fixed-header code path no longer exist on `master`.

### 2.4 Key Behaviour

Unchanged. A second 401 after the forced refresh, or a failed token call (for example `login_required`), is passed back to PouchDB. The sync state becomes `error`, which is visible and not silent. The next `online` or tab-visible event restarts the sync.

---

## 3. Key Decisions & Assumptions

*   **D1 — No code changes.** Every point of #22 is already on `master` with tests. Adding code or tests here would duplicate Phase 4 work.
*   **D2 — Close #22 through this PR.** The PR body carries `Closes #22`, so the repo owner closes the issue by merging (or closes it by hand and drops the PR). The run does not close the issue directly.
*   **D3 — Residual risk recorded, not fixed (Assumption).** Phase 4 kept the Auth0 SDK defaults: memory cache, no refresh tokens, silent auth through an iframe (#29 plan, Assumption A2; `Auth0ProviderWithNavigate.jsx` sets no `useRefreshTokens` / `cacheLocation`). In browsers that block third-party cookies (Safari ITP, Brave, some PWA shells), silent renewal can fail once the access token expires. Sync then goes to `error` (visible, so the "silent" part of #22 is fixed) until the user logs in again. Switching to refresh-token rotation requires Auth0 tenant settings and a decision on where tokens are stored, which is a security call for the owner. A follow-up issue is suggested, and nothing is changed here.
*   **D4 — Plan template.** `docs/specs/plans/TEMPLATE.md` is not on `master`. The changelog commit `7d60d76` removed the earlier plans. This plan follows the section layout of the #29 plan.

### 3.1 Decision Lock

| Policy | Value | Why |
| :--- | :--- | :--- |
| Production code changes | none | D1 |
| Issue closure | via `Closes #22` on merge | D2 |

### 3.2 Open Questions

None blocking. D3 is a suggested follow-up for the owner.

---

## 4. Task Breakdown

No implementation tasks. The work is fully covered by #29 T4 (per-request token + 401 retry) and T5 (live sync state wired to the NavBar), both merged in PR #52. The progress sidecar is seeded with no task rows.

---

## 5. Verification

*   Run the full repo verification (`verify.sh`: install, build incl. typecheck, `vitest run`, lint) on this branch. It must pass. This shows the merged fix and its tests are green on current `master`.
*   Manual check (needs the real Auth0 tenant and CouchDB, so it can't run in the sandbox). It is still open from PR #52: keep a tab open past the access-token lifetime, or use a short token lifetime on a test tenant, and confirm sync continues and the icon stays `ok`.

---

## 6. Fact-Integrity Checklist

*   [x] Every #22 point is traced to code and tests on `origin/master` (§2.3), read from the source, not from the PR text alone.
*   [x] PR #52 body checked: it carries `Closes #29` only, which explains why #22 is open.
*   [x] No Open Question is answerable from the issue text.
*   [x] No implementation code or line numbers in this plan.
