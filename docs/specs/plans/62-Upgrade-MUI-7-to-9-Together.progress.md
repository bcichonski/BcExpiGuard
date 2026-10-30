# Progress — 62 Upgrade MUI 7 → 9 Together

| Task | Title | Depends on | Complexity | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Bump MUI packages, migrate Material UI + data grid code | — | Medium | Done | model: sonnet; started 2026-10-30 12:04 UTC; finished 12:13 UTC. Agent ran npm ci/build/vitest/lint: build+lint OK (0 errors), vitest 258/263 with 5 expected DatePicker failures (T2). @mui/codemod CLI crashes (yargs); system-props transform run via jscodeshift; x-codemod preset-safe no content change. Orchestrator reverted codemod EOL churn on 27 untouched files. Wave verify deferred to after T2 (T1 DoD permits red DatePicker suite). |
| T2 | Migrate DatePicker to the v9 accessible field and rewrite its tests | T1 | Medium | Done | model: sonnet; started 12:13 UTC; finished 12:15 UTC. Wave verify: shared verify.sh PASS (root only) + repo scripts/verify.sh PASS — server 13/13, react-ui vitest 263/263, build + lint OK after clean npm ci. |
