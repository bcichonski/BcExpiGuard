# Item Mutations Write to the Remote DB Directly and via Replication Plan

**Plan Status**: `FINAL`

**Story Type**: `Internal`

> This plan captures **what** to build and **why** — domain, architecture, decisions, and verified facts.
> It deliberately does **not** contain implementation code, pseudocode, line numbers, mock setups, or test bodies.
> The implementation agent discovers the **how** against live code. See §4 Task Breakdown.

---

## 1. Problem Statement

Issue #24 (labels `bug`, `modernization`) reports this:

*   Mutations in `react-ui/src/persistence/items.js` (`add`, `changeState`, `changeQuantity`, `update`, …) wrote to the local DB, then **also** wrote straight to `dbprovider.remote.items.remote_table`, then called `syncMonkey.reset()`, which replicated local → remote anyway.
*   The direct remote write was redundant, could create revision conflicts (the same change applied on both sides with different `_rev`), and failed or blocked when offline.

The issue asks for local-only writes that rely on replication, and for a check of `itemNames.js`, `categories.js`, `groups.js` and `users.js` for the same pattern. The issue says this is "Part of the modernization plan (Phase 4, task 4.5)".

### 1.1 Technical Summary

*   **Finding:** Phase 4 (#29, PR #52, commit `5808cf6`, merged to `master`) already delivered the fix. Its PR body lists "4.5 #24 double writes to remote — Done", but it only contains `Closes #29`. That is why #24 is still open. The `[29]` entry in `docs/CHANGELOG.md` also records it ("`persistence/items.js`/`itemNames.js` write to the local DB only; the direct remote `upsert`/`putIfNotExists` calls are gone").
*   **Goal of this story:** confirm against current `master` that no persistence module writes to the remote DB and that tests cover it, and record the evidence. The PR from this run (`Closes #24`) closes the issue when merged. No production code changes.
*   **Same situation as #22** (closed through PR #66 with a verification-only plan); this plan follows that precedent.

---

## 2. Architecture & Design

### 2.1 Architecture Overview

Unchanged from Phase 4. Persistence modules write to the local PouchDBs in `DbProvider.local` only. `LiveSync` (`persistence/liveSync.js`) runs one live, retrying `localDb.sync(remote_table, …)` per synced DB (`items`, `item_names`); it is the only path from the client to CouchDB. `syncMonkey` no longer exists.

### 2.2 External Contracts & Evidence

`N/A — Internal story`.

### 2.3 Affected Areas — module-by-module trace (verified on `origin/master` @ `07e4efa`)

| Module | Writes | Remote access | Tests (pointer) |
| :--- | :--- | :--- | :--- |
| `persistence/items.js` (`add`, `changeState`, `changeQuantity`, `update`) | `dbprovider.local.items` (`putIfNotExists` / `upsert`) | none | `tests/persistence/localOnlyWrites.test.js` — local behaviour of each mutation, plus "never touches a remote object, even when one is present" |
| `persistence/itemNames.js` (`add`) | `dbprovider.local.item_names` (`upsert`) | none | same file — local add, revive of a deleted name, and the "never touches a remote" case |
| `persistence/categories.js` | `dbprovider.local.categories` | none (never had one; untouched by `5808cf6`) | — |
| `persistence/groups.js` | `dbprovider.local.groups` | none (never had one) | — |
| `persistence/users.js` | `dbprovider.local.users` | none. `ensureDb(…, 'users', true)` only requires a logged-in provider; it does not write remotely | — |

A grep of `react-ui/src` (non-test code) for `remote_table` hits only `DbProvider.js` (creating and closing the remote PouchDBs) and `liveSync.js` (the sync itself). `syncMonkey` returns nothing.

### 2.4 Key Behaviour

Unchanged. A mutation resolves once the local write commits, online or offline. Replication pushes it later; there is a single writer per change, so the double-`_rev` conflict described in the issue can't arise from the client.

---

## 3. Key Decisions & Assumptions

*   **D1 — No code changes.** Every point of #24 is already on `master` with tests. Adding code or tests here would duplicate Phase 4 work.
*   **D2 — Close #24 through this PR.** The PR body carries `Closes #24`, so the repo owner closes the issue by merging. The run does not close the issue directly.
*   **D3 — `categories`/`groups`/`users` are not replicated (observation, out of scope).** Their local writes never reach CouchDB, because `LiveSync` syncs `items` and `item_names` only. This predates Phase 4 ("Only `items` and `item_names` sync, as before" — PR #52) and is not what #24 asks about. Recorded so the owner can decide whether a follow-up is needed.
*   **D4 — Plan template.** `docs/specs/plans/TEMPLATE.md` is not on `master`; the layout follows the #22 plan.

### 3.1 Decision Lock

| Policy | Value | Why |
| :--- | :--- | :--- |
| Production code changes | none | D1 |
| Issue closure | via `Closes #24` on merge | D2 |

### 3.2 Open Questions

None blocking. D3 is an observation for the owner.

---

## 4. Task Breakdown

No implementation tasks. The work is fully covered by #29 task 4.5, merged in PR #52. The progress sidecar is seeded with no task rows.

---

## 5. Verification

*   Run the full repo verification (install, build incl. typecheck, server `npm test`, react-ui `vitest run`, lint) on this branch. It must pass. This shows the merged fix and its tests are green on current `master`.
*   Manual check (needs the real CouchDB, so it can't run in the sandbox): go offline, change an item, confirm the change is kept locally with no failed remote request; go online and confirm it replicates once with no conflict revision.

---

## 6. Fact-Integrity Checklist

*   [x] Every module named in #24 is traced to its code on `origin/master` (§2.3), read from the source, not from the PR text alone.
*   [x] PR #52 body checked: it lists 4.5 #24 as Done but carries `Closes #29` only, which explains why #24 is open.
*   [x] No Open Question is answerable from the issue text.
*   [x] No implementation code or line numbers in this plan.
