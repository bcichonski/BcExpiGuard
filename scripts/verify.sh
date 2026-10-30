#!/usr/bin/env bash
# scripts/verify.sh — repo override for the /grind verify.sh (same arguments and verdict line).
#
# The generic script only looks at the root package.json, so it ran the server tests and skipped the
# react-ui build, tests and lint. This one runs the same steps as .github/workflows/ci.yml:
#   root:     npm ci, npm test (server)
#   react-ui: npm ci, npm run build (typecheck + vite), npm test (vitest), npm run lint
# It ends with exactly one line:
#
#   VERDICT: PASS|FAIL(build)|FAIL(tests)|FAIL(lint)|FAIL(grep)|ENV(<reason>)|UNSUPPORTED — <details> — log: <path>
#
# Exit codes: 0 PASS, 1 FAIL(*), 2 ENV(*), 3 UNSUPPORTED / usage error.
#
# Usage: scripts/verify.sh --repo <dir> [--scope full|<path> ...] [--grep-file <file>] [--log <file>]
#                          [--step-timeout <minutes>] [--no-kill]
#   --repo    defaults to the parent of scripts/.
#   --scope   "full" (default) or test paths relative to the repo root. Paths under server/ go to
#             `node --test`, everything else to vitest (a leading react-ui/ is stripped). Only the
#             suites with scoped paths run.

set -u

REPO=""
SCOPE=()
GREP_FILE=""
LOG=""
STEP_TIMEOUT=25
KILL=1

while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --scope) SCOPE+=("$2"); shift 2 ;;
    --grep-file) GREP_FILE="$2"; shift 2 ;;
    --log) LOG="$2"; shift 2 ;;
    --step-timeout) STEP_TIMEOUT="$2"; shift 2 ;;
    --no-kill) KILL=0; shift ;;
    *) echo "VERDICT: UNSUPPORTED — unknown argument: $1 — log: none"; exit 3 ;;
  esac
done

# Default to this script's repo, so it also works when called with no --repo.
[ -n "$REPO" ] || REPO="$(cd "$(dirname "$0")/.." && pwd)"
if [ ! -d "$REPO" ]; then
  echo "VERDICT: UNSUPPORTED — --repo <dir> is required and must exist — log: none"
  exit 3
fi
REPO="$(cd "$REPO" && pwd)"
UI="$REPO/react-ui"

TMP_BASE="${TMPDIR:-${TEMP:-/tmp}}"
[ -n "$LOG" ] || LOG="$TMP_BASE/grind-verify-$(date +%Y%m%d-%H%M%S).log"
: > "$LOG"
[ ${#SCOPE[@]} -gt 0 ] || SCOPE=(full)

verdict() {
  # verdict <code> <exit> <details>
  echo "VERDICT: $1 — $3 — log: $LOG"
  exit "$2"
}

# run <label> <dir> <cmd...>: runs a step in <dir> with a timeout, appends to the log, returns its status.
run() {
  local label="$1" dir="$2"; shift 2
  echo "== $label: $*" | tee -a "$LOG"
  local start=$(date +%s) rc
  if command -v timeout >/dev/null 2>&1; then
    (cd "$dir" && timeout "$((STEP_TIMEOUT * 60))" "$@") >>"$LOG" 2>&1; rc=$?
  else
    (cd "$dir" && "$@") >>"$LOG" 2>&1; rc=$?
  fi
  echo "== $label: exit $rc after $(( $(date +%s) - start ))s" | tee -a "$LOG"
  [ $rc -eq 124 ] && echo "== $label: TIMED OUT after ${STEP_TIMEOUT}m" | tee -a "$LOG"
  return $rc
}

excerpt() {
  tail -n +"$1" "$LOG" | grep -iE "error|fail|✗|×|FAIL|assert|expected|exception" \
    | grep -viE "^npm (warn|notice)" | head -n 40
}

log_lines() { wc -l < "$LOG"; }

env_reason() {
  local t; t="$(tail -n 200 "$LOG")"
  case "$t" in
    *ENOTEMPTY*) echo "ENOTEMPTY" ;;
    *EBUSY*) echo "EBUSY" ;;
    *ENOSPC*) echo "ENOSPC (disk full)" ;;
    *EACCES*|*EPERM*) echo "permission denied" ;;
    *EAI_AGAIN*|*ENOTFOUND*|*ETIMEDOUT*|*ECONNRESET*|*ECONNREFUSED*) echo "network" ;;
    *"TIMED OUT"*) echo "step timeout" ;;
    *) ;;
  esac
}

kill_leftovers() {
  # Kill node/vite/vitest/browser processes whose working directory is inside the repo (Linux /proc
  # only). Never ourselves or an ancestor.
  [ $KILL -eq 1 ] && [ -d /proc/self/cwd ] || return 0
  local keep=" $$ " p=$$ pid cwd name killed=""
  while [ -n "$p" ] && [ "$p" != "0" ] && [ "$p" != "1" ]; do
    p="$(awk '/^PPid:/{print $2}' "/proc/$p/status" 2>/dev/null)"; keep="$keep$p "
  done
  for d in /proc/[0-9]*; do
    pid="${d#/proc/}"
    case "$keep" in *" $pid "*) continue ;; esac
    cwd="$(readlink "$d/cwd" 2>/dev/null)" || continue
    case "$cwd" in "$REPO"|"$REPO"/*) ;; *) continue ;; esac
    name="$(cat "$d/comm" 2>/dev/null)"
    case "$name" in node|npm|npx|vite|vitest|esbuild|sleep|chrome*|chromium*)
      kill "$pid" 2>/dev/null && killed="$killed $name($pid)" ;;
    esac
  done
  [ -n "$killed" ] && echo "== killed leftover processes:$killed" | tee -a "$LOG"
  return 0
}

check_patterns() {
  [ -n "$GREP_FILE" ] || return 0
  [ -f "$GREP_FILE" ] || { echo "== grep file not found: $GREP_FILE" | tee -a "$LOG"; return 1; }
  local bad=0 line pat
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    case "$line" in ''|'#'*) continue ;; esac
    if [ "${line#+}" != "$line" ]; then
      pat="${line#+}"
      if ! git -C "$REPO" grep -qE -- "$pat" -- . ':!*.lock' ':!**/package-lock.json' ':!docs/specs/**' 2>/dev/null; then
        echo "required pattern missing: $pat" | tee -a "$LOG"; bad=1
      fi
    else
      if git -C "$REPO" grep -nE -- "$line" -- . ':!*.lock' ':!**/package-lock.json' ':!docs/specs/**' >>"$LOG" 2>&1; then
        echo "forbidden pattern found: $line" | tee -a "$LOG"; bad=1
      fi
    fi
  done < "$GREP_FILE"
  return $bad
}

test_counts() {
  local s
  s="$(grep -E "Tests +[0-9]+ (passed|failed)|^ℹ (pass|fail) [0-9]+" "$LOG" | tr -s ' ' | paste -sd ';' -)"
  echo "${s:-counts not detected}"
}

# install <label> <dir>: npm ci, moving node_modules aside and retrying once on ENOTEMPTY/EBUSY (virtiofs).
install() {
  local label="$1" dir="$2" mark r
  mark=$(log_lines)
  run "$label" "$dir" npm ci --no-audit --no-fund && return 0
  r="$(env_reason)"
  if [ "$r" = "ENOTEMPTY" ] || [ "$r" = "EBUSY" ]; then
    local aside="$TMP_BASE/node_modules.aside.$(date +%s)"
    echo "== moving $dir/node_modules to $aside and retrying once" | tee -a "$LOG"
    mv "$dir/node_modules" "$aside" 2>>"$LOG" || rm -rf "$dir/node_modules"
    run "$label-retry" "$dir" npm ci --no-audit --no-fund && return 0
    r="$(env_reason)"; verdict "ENV(${r:-install})" 2 "$label: npm ci failed twice"
  fi
  [ -n "$r" ] && verdict "ENV($r)" 2 "$label: npm ci failed"
  excerpt "$mark"; verdict "FAIL(build)" 1 "$label: npm ci failed (lockfile/package.json mismatch?)"
}

# Split --scope into server (node --test) and react-ui (vitest) paths.
RUN_SERVER=1 RUN_UI=1
SERVER_PATHS=() UI_PATHS=()
if [ "${SCOPE[0]}" != "full" ]; then
  RUN_SERVER=0 RUN_UI=0
  for p in "${SCOPE[@]}"; do
    case "$p" in
      server/*) SERVER_PATHS+=("$p"); RUN_SERVER=1 ;;
      react-ui/*) UI_PATHS+=("${p#react-ui/}"); RUN_UI=1 ;;
      *) UI_PATHS+=("$p"); RUN_UI=1 ;;
    esac
  done
fi

[ -f "$REPO/package.json" ] && [ -f "$UI/package.json" ] \
  || verdict "UNSUPPORTED" 3 "expected package.json at the repo root and in react-ui/"

kill_leftovers

install "install (root)" "$REPO"
install "install (react-ui)" "$UI"

# The UI is always built: its typecheck covers every source file, whatever the scope.
mark=$(log_lines)
run "build (react-ui)" "$UI" npm run build || {
  r="$(env_reason)"; [ "$r" = "step timeout" ] && verdict "ENV($r)" 2 "build"
  excerpt "$mark"; verdict "FAIL(build)" 1 "react-ui: npm run build failed"; }

mark=$(log_lines)
failed=""
if [ $RUN_SERVER -eq 1 ]; then
  if [ ${#SERVER_PATHS[@]} -gt 0 ]; then
    run "tests (server)" "$REPO" node --test "${SERVER_PATHS[@]}" || failed="$failed server"
  else
    CI=true run "tests (server)" "$REPO" npm test || failed="$failed server"
  fi
fi
if [ $RUN_UI -eq 1 ]; then
  CI=true run "tests (react-ui)" "$UI" npx vitest run "${UI_PATHS[@]}" || failed="$failed react-ui"
fi
if [ -n "$failed" ]; then
  r="$(env_reason)"; [ "$r" = "step timeout" ] && verdict "ENV($r)" 2 "tests"
  excerpt "$mark"; verdict "FAIL(tests)" 1 "failed:$failed; $(test_counts)"
fi

mark=$(log_lines)
run "lint (react-ui)" "$UI" npm run lint || { excerpt "$mark"; verdict "FAIL(lint)" 1 "react-ui: npm run lint failed"; }

mark=$(log_lines)
check_patterns || { excerpt "$mark"; verdict "FAIL(grep)" 1 "pattern check failed"; }

kill_leftovers
verdict "PASS" 0 "$(test_counts)"
