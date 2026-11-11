#!/usr/bin/env bash
# CI for Linux and macOS (also Git Bash on Windows); ci.bat does the same on Windows.
# Any failing step stops the script with a non-zero exit code.
set -euo pipefail
cd "$(dirname "$0")"
step() { printf '\n==== %s ====\n' "$1"; }

step "Environment: $(uname -s) $(uname -m), Node.js $(node --version), npm $(npm --version)"
step "Install dependencies (npm ci)"
npm ci --no-audit --no-fund
step "Build (typecheck + bundle)"
npm run build
step "Unit tests (Vitest)"
npm test
step "Package executable (Node.js SEA)"
npm run package

EXE=build/hello
if [ -f build/hello.exe ]; then EXE=build/hello.exe; fi
step "Smoke test: $EXE"
"./$EXE" | tee build/smoke-output.txt
grep -q "Hello, World!" build/smoke-output.txt
step "CI OK"
