# Progress — 25 Modernization Phase 0: Baseline and Safety Net

| Task | Title | Depends on | Complexity | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Pin Node version and document the build workaround | — | Low | Done | haiku; wave 1 verified PASS (8 suites, 118 tests, build ok) |
| T2 | Replace placeholder test with an App smoke test | — | Medium | Done | sonnet; wave 1 verified PASS (8 suites, 118 tests, build ok) |
| T3 | Unit tests for persistence validation helpers | — | Low | Done | haiku; wave 1 verified PASS (8 suites, 118 tests, build ok) |
| T4 | Unit tests for the `logic/*` reducers | — | Medium | Done | sonnet; wave 1 verified PASS (8 suites, 118 tests, build ok) |
| T5 | Unit tests for the syncMonkey backoff | — | Medium | Done | sonnet; wave 1 verified PASS (8 suites, 118 tests, build ok) |
| T6 | GitHub Actions CI workflow | T1 | Low | Done | haiku; clean npm ci of both lockfiles ok; wave 2 verified PASS (clean-install build + 8 suites, 118 tests, server syntax check) |
| T7 | Dependabot grouped-updates config | — | Low | Done | haiku returned Done but orchestrator review found invalid Dependabot schema value (groups.dependency-type "direct"); escalated to sonnet; retry Done; wave 1 verified PASS |
| T8 | Capture the CouchDB setup in `doc/couchdb/` | — | Medium | Done | sonnet; wave 1 verified PASS (8 suites, 118 tests, build ok) |
