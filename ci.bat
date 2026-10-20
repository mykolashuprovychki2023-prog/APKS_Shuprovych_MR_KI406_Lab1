@echo off
rem CI script for Windows (cmd). Same steps as ci.sh:
rem   environment -> npm ci -> build -> unit tests -> native executable -> smoke test.
rem Any failing step stops the script with exit code 1.
setlocal
cd /d "%~dp0"

echo.
echo ==== Environment ====
ver
call node --version || goto :fail
call npm --version || goto :fail

echo.
echo ==== Install dependencies (npm ci) ====
call npm ci --no-audit --no-fund || goto :fail

echo.
echo ==== Build (typecheck + bundle) ====
call npm run build || goto :fail

echo.
echo ==== Unit tests (Vitest) ====
call npm test || goto :fail

echo.
echo ==== Package native executable (Node.js SEA) ====
call npm run package || goto :fail

echo.
echo ==== Smoke test: build\hello.exe ====
build\hello.exe > build\smoke-output.txt || goto :fail
type build\smoke-output.txt
findstr /C:"Hello, World!" build\smoke-output.txt >nul || goto :fail

echo.
echo ==== Summary ====
call node scripts\ci-summary.mjs || goto :fail

echo.
echo ==== CI OK ====
exit /b 0

:fail
echo.
echo ==== CI FAILED ====
exit /b 1
