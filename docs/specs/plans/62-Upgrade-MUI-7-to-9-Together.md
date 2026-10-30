# Upgrade MUI 7 → 9 (material, icons, x-data-grid, x-date-pickers together) Plan

**Plan Status**: `FINAL`

**Story Type**: `Internal`

**Issue**: [bcichonski/BcExpiGuard#62](https://github.com/bcichonski/BcExpiGuard/issues/62) · replaces Dependabot PR #56 · points: 5

**Builds on**: [27] Modernization Phase 2 (Material-UI v4 → MUI v7, `docs/CHANGELOG.md`). That phase introduced `react-ui/src/theme.js` ("puts the v4 look back so the upgrade is visually neutral") and the `DatePicker` on `@mui/x-date-pickers` 8. This story keeps that goal: the upgrade must be visually and behaviourally neutral.

---

## 1. Problem Statement

Dependabot PR #56 bumps only `@mui/material` to 9.5.0, so `npm ci` fails with ERESOLVE: `@mui/icons-material@7.3.11` peers on `@mui/material@^7.3.11`. The four MUI packages in `react-ui/package.json` have to move together in one change:

| Package | Current | Target |
|---|---|---|
| `@mui/material` | ^7.3.11 | ^9.5.0 |
| `@mui/icons-material` | ^7.3.11 | ^9.5.0 |
| `@mui/x-data-grid` | ^8.29.3 | ^9.16.0 |
| `@mui/x-date-pickers` | ^8.29.4 | ^9.16.0 |

**Goal:** the React UI builds, lints and passes its tests on MUI 9 / MUI X 9. The lockfile is regenerated without `--legacy-peer-deps` or `--force`. Screens look and behave as before.

### 1.1 Technical Summary

- Material UI has **no v8 release**. The npm `versions` list for `@mui/material` goes from 7.3.x straight to 9.0.0 (verified 2026-10-30). The issue's "7→8→9" guide reading collapses to the single official guide, *Upgrade to v9* (from v7).
- MUI X goes v8 → v9 (guides: *Migration from v8 to v9* for the data grid and for the pickers).
- Verified peer ranges (npm registry, 2026-10-30):
  - `@mui/icons-material@9.5.0` peers on `@mui/material@^9.5.0`.
  - `@mui/x-data-grid@9.16.0` and `@mui/x-date-pickers@9.16.0` both peer on `@mui/material` and `@mui/system` `^7.3.0 || ^9.0.0`, React `^17 || ^18 || ^19`, and date-fns `^2.25 || ^3.2 || ^4` (pickers).
  - `@mui/material@9.5.0` peers on React `^17 || ^18 || ^19`.
  - So React 19.3 and date-fns 4.4 work. Emotion 11 meets the `@emotion/*` peers.
- Codemods exist for both: `@mui/codemod@9.5.0` and `@mui/x-codemod@9.16.0`.

## 2. Architecture & Design

### 2.1 Architecture Overview

This is a dependency upgrade confined to `react-ui/`. No data, store, server or sync code changes. `@mui/material` is imported by 25 files under `react-ui/src` (19 sources and 6 tests). `@mui/x-data-grid` is used only in `pages/BrowseItems.jsx`. `@mui/x-date-pickers` is used in `components/DatePicker.jsx`, the `LocalizationProvider` in `App.jsx`, and `tests/DatePicker.test.jsx`.

### 2.2 External Contracts & Evidence

N/A — Internal story. The upstream migration guides are references, not contracts. They were downloaded from `raw.githubusercontent.com` (the `mui/material-ui` and `mui/mui-x` `master` docs) because `mui.com` returns 403 from the sandbox.

### 2.3 Affected Areas — breaking-change to code trace (verified on `origin/master` @ `6cb54d8`)

Every breaking change in the three guides was checked against the code. Only these items hit:

| # | Breaking change (guide) | Where it hits | Handling |
|---|---|---|---|
| A1 | **Pickers v9:** `enableAccessibleFieldDOMStructure` removed; the accessible, section-based `PickersTextField` is now the only field DOM, and the legacy plain `<input>` mode is gone | `components/DatePicker.jsx` sets `enableAccessibleFieldDOMStructure={false}` on purpose ("plain `<input>` inside the regular TextField, like the v4 keyboard picker"). `tests/DatePicker.test.jsx` reads `.value` of the labelled input and types with `fireEvent.change` | Remove the prop. Rewrite the DatePicker tests against the section-based field (T2) |
| A2 | **Pickers v9:** the `textField` slot accepts `PickersTextFieldProps` only | `DatePicker.jsx` passes `slotProps.textField = { error, helperText }` | Both props exist on `PickersTextField`. Keep them and confirm the typecheck passes |
| A3 | Theme default `MuiTextField.defaultProps.variant = 'standard'` (in `theme.js`) no longer reaches the date field, because `PickersTextField` is not `TextField` | The date field would switch to the outlined look | Add a `MuiPickersTextField` default of `variant: 'standard'` in `theme.js`. The `MuiPickersTextField` theme key exists in the v9 `themeAugmentation` (verified in the 9.16.0 tarball) |
| A4 | **Material v9:** 23 `*Outline` icon exports removed (exact duplicates of `*Outlined`) | `pages/BrowseItems.jsx` imports `@mui/icons-material/DeleteOutline` | Import `DeleteOutlined` instead (same SVG) |
| A5 | **Material v9:** system props removed from `Box`, `Typography`, `Grid`, `Link`, `Stack`, `DialogContentText` | e.g. `containers/Layout.jsx` `<Box pt={4}>`, `pages/AddItem.jsx` `<Grid container justifyContent=…>`. Real component props (`color`, `align`, `noWrap`, `gutterBottom`, `variant`) are not system props | Run `npx @mui/codemod@9.5.0 v9.0.0/system-props react-ui/src`, then review the diff |
| A6 | **Material v9:** `ListItemIcon` default `min-width` is now 36px (was 56px) | The NavBar drawer list (`components/NavBar.jsx`, `constants/appBarItems.jsx`). `theme.js` already pins 56px inside `MuiMenuItem` only | Add a `MuiListItemIcon` root `minWidth: 56` override to `theme.js` to keep the drawer layout. The `MuiMenuItem` rule can then go or stay (implementer's call, as long as the result is unchanged) |
| A7 | **Material v9:** `Grid` no longer accepts `direction="column"` / `column-reverse` | No usage. Only `direction='row'` appears | None. Keep it as a grep check |
| A8 | **Material v9:** deprecated props removed (`TextField` `InputProps`/`inputProps`/…, `Tooltip` `TransitionComponent`/`componentsProps`, Dialog/Menu/Snackbar `PaperProps`/`TransitionComponent`/`MenuListProps`, `Typography paragraph`, `ListItemText primaryTypographyProps`, …) | No usage found. `BrowseItems.jsx` already uses `slotProps.htmlInput`/`input`. The `inputProps` in `AddItem.jsx` is on `Select`, whose `inputProps` is not removed | Codemods still run as a safety net. Typecheck and lint confirm |
| A9 | **Data grid v9:** pagination numbers formatted by default; actions cell loses `menu`/`menuitem` roles; `filterPanelColumns` locale key renamed; DOM node moves inside the virtual scroller | `BrowseItems.jsx` uses `QuickFilter*`, a custom toolbar slot, `autoHeight`, `getRowHeight`, and `sx` on `.MuiDataGrid-cell`/`-columnHeader`/`-columnSeparator`. None of those are affected. The actions column is a custom `renderCell`, not `GridActionsCellItem` | Run `npx @mui/x-codemod@9.16.0 v9.0.0/preset-safe react-ui/src`. Confirm `tests/BrowseItems.test.jsx` still passes. Page counts under 1000 make number formatting invisible |
| A10 | **Material v9:** `MenuItem` throws outside `Menu`/`MenuList`; `Tab` outside `Tabs` throws | `MenuItem` is used only inside `Menu` / `Select` | None. Any violation shows up in tests |
| A11 | **Material v9:** jsdom feature detection replaces `NODE_ENV === 'test'` | Vitest/jsdom suites | Covered by running the full suite |
| A12 | **Material v9:** default browserslist bumped (Chrome 117, Safari 17, …) | Vite build targets | Accept. This is a PWA for current browsers |

Not affected: `LocalizationProvider` + `AdapterDateFns` import paths. `@mui/x-date-pickers/AdapterDateFns` still exists in 9.16.0 and serves date-fns v3/v4. `AdapterDateFnsV2` is the date-fns v2 one. `Chart.jsx` uses recharts, not MUI X Charts.

### 2.4 Key Behaviour (must stay the same)

- **Date picker:** the store keeps a `yyyy-MM-dd` string (`DATE_FORMAT`). The field shows it in that format. Typing a full date emits a `Date` that formats back to the same string, and an empty value shows an empty field. Past days are disabled (`minDate = today`). The mobile variant hides the toolbar and shows Cancel/OK, and picking a day closes it (`closeOnSelect`). `error` and `helperText` show, with `aria-invalid` on the field.
- **Browse grid:** the state filter select, the whole-text case-insensitive quick filter, page size 100 with options 25/50/100, auto row height, and the per-row actions menu.
- Visual: the v4-like theme (standard inputs, palette, 56px list icons, IconButton padding).

## 3. Key Decisions & Assumptions

1. **Guide set.** Material UI v9 has no v8. The single *Upgrade to v9* (from v7) guide is the Material reference. *(Verified from the npm versions list; this closes the issue's "7→8→9" wording.)*
2. **Accessible field DOM accepted.** The legacy `<input>` date field cannot be kept in v9. The section-based field replaces it. Typing still works (sections take keyboard input), so the "keyboard picker" intent is kept. Tests are adapted to the new DOM. Their asserted behaviours (§2.4) are not weakened.
3. **No Playwright e2e suite exists.** `@playwright/test` is a devDependency, but the repo tracks no Playwright config or spec files (verified with `git ls-files`), and CI (`.github/workflows/ci.yml`) runs only build, vitest and lint. **Assumption:** the AC item "Playwright e2e tests pass" is satisfied vacuously. Writing an e2e suite is out of scope.
4. **No dark theme exists.** `theme.js` defines only a light palette, and no `palette.mode` / colour-scheme switch is present (verified by grep). **Assumption:** the AC's "light and dark themes" hand check reduces to the light theme.
5. **Manual screen check is left to the human reviewer.** This is an unattended run. The by-hand check of list, add/edit item, date picking and charts is listed in the PR body as a reviewer step. Automated coverage is the vitest suites plus build, typecheck and lint.
6. **Lockfile.** Regenerate `react-ui/package-lock.json` with a normal `npm install` of the four packages, without `--legacy-peer-deps`/`--force`. `npm ci` must then succeed on a clean `node_modules`.
7. **Closing #56.** The PR body says it supersedes #56. Closing #56 is left to the human or Dependabot: this run does not close another PR.
8. **Codemods** are pinned to the target versions (`@mui/codemod@9.5.0`, `@mui/x-codemod@9.16.0`). Their output is reviewed rather than trusted blindly. Do not reformat unrelated code.

### 3.1 Decision Lock

Bump all four together. Remove `enableAccessibleFieldDOMStructure`. Restore standard-variant date field and 56px list icons via `theme.js`. Rename the icon to `DeleteOutlined`. Migrate system props via the codemod. No other behaviour changes.

### 3.2 Open Questions

None.

## 4. Task Breakdown

| Task | Title | Depends on | Complexity |
| :--- | :--- | :--- | :--- |
| T1 | Bump MUI packages, migrate Material UI + data grid code | — | Medium |
| T2 | Migrate DatePicker to the v9 accessible field and rewrite its tests | T1 | Medium |

The tasks are sequential on purpose. Both touch `react-ui/node_modules` and the lockfile, and concurrent npm runs corrupt them on this mount.

### T1 — Bump MUI packages, migrate Material UI + data grid code

- **Goal:** move all four packages to their targets and leave every non-picker area compiling and green on v9.
- **File pointers:** `react-ui/package.json`, `react-ui/package-lock.json`, `react-ui/src/theme.js`, `react-ui/src/pages/BrowseItems.jsx`, `react-ui/src/containers/Layout.jsx`, `react-ui/src/pages/AddItem.jsx`, plus any file the codemods change under `react-ui/src`.
- **Scope:** §2.3 items A4–A12. Run both codemods (`@mui/codemod@9.5.0 v9.0.0/system-props`, plus the deprecations codemods if they change anything; `@mui/x-codemod@9.16.0 v9.0.0/preset-safe`) over `react-ui/src`. Add the `MuiListItemIcon` 56px override (A6).
  - If the x-codemod also touches the picker (removing `enableAccessibleFieldDOMStructure`), that is fine, but the DatePicker behaviour work belongs to T2.
- **Definition of Done:**
  - `package.json` carries `^9.5.0` / `^9.5.0` / `^9.16.0` / `^9.16.0`, and the lockfile is regenerated without force flags.
  - `npm ci` succeeds in `react-ui/`.
  - `npm run build` (typecheck + vite) passes, and `npm run lint` is clean.
  - `npx vitest run` passes for every suite except `src/tests/DatePicker.test.jsx`, whose failures are expected and are T2's job.
  - No `@mui/icons-material/*Outline'` imports remain. No system props remain on the listed components. No `direction="column"` remains on `Grid`.
- **Tests:** existing component suites (BrowseItems, Layout, ExpireSoonList, Autocomplete, Chart, …) stay green unmodified. Changing a test is allowed only for a documented v9 DOM/role change (§2.3 A9), and each such change must be explained in the task notes.

### T2 — Migrate DatePicker to the v9 accessible field and rewrite its tests

- **Goal:** `DatePicker` works on the v9 section-based field with the §2.4 behaviours unchanged, and its tests prove it.
- **File pointers:** `react-ui/src/components/DatePicker.jsx`, `react-ui/src/theme.js` (A3), `react-ui/src/tests/DatePicker.test.jsx`. Consumer: `react-ui/src/pages/AddItem.jsx` (read only, to confirm the props contract).
- **Scope:** §2.3 A1–A3. Remove `enableAccessibleFieldDOMStructure` and its outdated comment. Keep `error` / `helperText` on `slotProps.textField`. Add the `MuiPickersTextField` standard-variant default.
- **Definition of Done:**
  - Full `npm run build`, `npm run lint` and `npx vitest run` (all suites) pass.
  - The DatePicker suite covers, against the new DOM, every behaviour it covered before:
    - value renders in `yyyy-MM-dd`, desktop and mobile
    - empty value renders empty
    - typing a full date emits a matching `Date`
    - picking a day in the mobile dialog emits a `Date` and closes the dialog
    - past days are disabled
    - error and helper text show, and the field is marked invalid
    - desktop vs mobile action bar
  - Tests must not depend on today's date beyond what the current suite already handles. Keep the "last day of month" guard.
- **Tests:** component tests (vitest + Testing Library, jsdom). Query the field the way MUI documents for the accessible DOM (for example the labelled group/sections, or the hidden input carrying the value). Pick what is robust. Do not reach into private class names when a role or label works.

## 5. Verification

Run from `react-ui/` unless noted:

1. `npm ci`. It must succeed without `--legacy-peer-deps`/`--force`.
2. `npm run build`: typecheck and vite build.
3. `npx vitest run`: all suites.
4. `npx eslint .` (or `npm run lint`).
5. Repo-level: `scripts/verify.sh --repo <repo root>` runs the same steps as CI (root server tests + react-ui build, test and lint) and must end with `VERDICT: PASS`.
6. Reviewer (human, not automated in this run): check the list, add/edit item, date picking (desktop and mobile widths) and charts screens by hand.

## 6. Fact-Integrity Checklist

| Check | Result |
|---|---|
| Every AC item mapped to a task, verification step or recorded assumption | Yes. Guides → §2.3. Bump/lockfile → T1. Codemods → T1/T2. Grid → T1 (A9). Pickers adapter/`LocalizationProvider` → §2.3 "Not affected" + T2. Build/lint/test → §5. e2e → Assumption 3. Hand check → Assumption 4–5. #56 → Assumption 7 |
| Package versions and peer ranges verified, not assumed | Yes (npm registry, 2026-10-30) |
| Each breaking change traced to concrete code or ruled out | Yes (§2.3, grep over `react-ui/src` on `6cb54d8`) |
| No implementation code / line numbers in tasks | Yes |
| Every task has a Definition of Done and test expectations | Yes |
| Open Questions empty | Yes |

**Self-review note:** checked §2.3 against §3.1 and the tasks: A1–A3 are in T2 and A4–A12 in T1. T1's DoD explicitly allows only the DatePicker suite to be red, and T2's DoD requires the whole suite green. No contradictions remain.
