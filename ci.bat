@echo off
rem CI for Windows (cmd); ci.sh does the same on Linux and macOS.
rem Any failing step stops the script with exit code 1.
setlocal
cd /d "%~dp0"

echo ==== Environment ====
call node --version || goto :fail
call npm --version || goto :fail
echo ==== Install dependencies (npm ci) ====
call npm ci --no-audit --no-fund || goto :fail
echo ==== Build (typecheck + bundle) ====
call npm run build || goto :fail
echo ==== Unit tests (Vitest) ====
call npm test || goto :fail
echo ==== Package executable (Node.js SEA) ====
call npm run package || goto :fail
echo ==== Smoke test: build\hello.exe ====
build\hello.exe > build\smoke-output.txt || goto :fail
type build\smoke-output.txt
findstr /C:"Hello, World!" build\smoke-output.txt >nul || goto :fail
echo ==== CI OK ====
exit /b 0

:fail
echo ==== CI FAILED ====
exit /b 1
