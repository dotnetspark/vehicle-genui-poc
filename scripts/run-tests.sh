#!/usr/bin/env bash
# run-tests.sh — CI-friendly test runner for Demo A and Demo B.
#
# Usage:
#   bash scripts/run-tests.sh
#
# Exit codes:
#   0 — all suites passed
#   1 — one or more suites failed

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0

run_suite() {
  local name="$1"
  local dir="$2"
  shift 2
  echo ""
  echo "──────────────────────────────────────────────"
  echo "  Suite: ${name}"
  echo "  Dir  : ${dir}"
  echo "──────────────────────────────────────────────"
  pushd "${dir}" > /dev/null
  if "$@"; then
    echo "  ✓ PASSED: ${name}"
    PASS=$(( PASS + 1 ))
  else
    echo "  ✗ FAILED: ${name}"
    FAIL=$(( FAIL + 1 ))
  fi
  popd > /dev/null
}

# ── Demo A — Node built-in test runner ────────────────────────────────────────
run_suite \
  "Demo A — query-cache (LRU + normalisation)" \
  "${REPO_ROOT}/src/demo-a-mcp-apps" \
  node --import tsx/esm --test query-cache.test.ts

run_suite \
  "Demo A — resource-uri (content-hash URI resolution)" \
  "${REPO_ROOT}/src/demo-a-mcp-apps" \
  node --import tsx/esm --test resource-uri.test.ts

# ── Demo B — Vitest ───────────────────────────────────────────────────────────
run_suite \
  "Demo B frontend — components + state + schemas (Vitest)" \
  "${REPO_ROOT}/src/demo-b-copilotkit/frontend" \
  pnpm test

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo "  Results: ${PASS} passed, ${FAIL} failed"
echo "══════════════════════════════════════════════"
echo ""

if [ "${FAIL}" -gt 0 ]; then
  exit 1
fi
