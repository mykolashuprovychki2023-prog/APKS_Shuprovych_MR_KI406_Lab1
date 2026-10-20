#!/usr/bin/env bash
# CI script for Linux and macOS (also works in Git Bash on Windows).
# Same steps locally and in GitHub Actions:
#   environment -> npm ci -> build -> unit tests -> native executable -> smoke test.
# Any failing step stops the script with a non-zero exit code.
set -euo pipefail
cd "$(dirname "$0")"

step() { printf '\n==== %s ====\n' "$1"; }

step "Environment"
echo "OS:   $(uname -s) $(uname -m)"
echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

step "Install dependencies (npm ci)"
npm ci --no-audit --no-fund

step "Build (typecheck + bundle)"
npm run build

step "Unit tests (Vitest)"
npm test

step "Package native executable (Node.js SEA)"
npm run package

EXE="build/hello"
if [ -f "build/hello.exe" ]; then EXE="build/hello.exe"; fi

step "Smoke test: $EXE"
OUTPUT="$("./$EXE")"
echo "$OUTPUT"
if ! grep -q "Hello, World!" <<<"$OUTPUT"; then
  echo "ERROR: unexpected output of $EXE" >&2
  exit 1
fi

step "Summary"
node scripts/ci-summary.mjs

step "CI OK"
