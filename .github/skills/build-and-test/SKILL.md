---
name: build-and-test
description: Налаштовує складання (npm scripts, tsc, esbuild, виконуваний файл hello через Node.js SEA), тестову функцію add і юніт-тест BasicAddition (Vitest), скрипти ci.sh і ci.bat. Використовуй для команди create-build.
---

# Skill: build-and-test

## Коли застосовувати

Команда `create-build` після `create-project` (є `src/main.ts`).

## Вхідні дані

| Параметр | За замовчуванням | Обмеження |
|---|---|---|
| `PROJECT_NAME` | `hello-ts` | та сама назва, що в `create-project` |

Потрібні Node.js ≥ 22.18, npm і доступ до npm registry.

## Результат

Файли створюються за правилом `CREATED` / `UNCHANGED` / `CONFLICT` з маніфесту. Система складання — npm scripts:
`build` (перевірка типів `tsc` і бандл `build/hello.cjs` через esbuild), `test` (Vitest, JUnit-звіт у `build/`),
`package` (виконуваний файл `build/hello`, на Windows — `build/hello.exe`). `package-lock.json` створює
`npm install`, лише якщо файлу ще немає (`CREATED`); наявний не змінюється (`UNCHANGED`). Пакет `yaml` потрібен
команді `check`: нею вона читає `ci.yml`.

### `package.json`

Замість `hello-ts` — `PROJECT_NAME`.

```json
{
  "name": "hello-ts",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.18"
  },
  "scripts": {
    "build": "tsc --noEmit && esbuild src/main.ts --bundle --platform=node --format=cjs --target=node22 --outfile=build/hello.cjs --log-level=warning",
    "test": "vitest run",
    "package": "node scripts/build-sea.mjs"
  },
  "devDependencies": {
    "@types/node": "24.19.2",
    "esbuild": "0.28.2",
    "postject": "1.0.0-alpha.6",
    "typescript": "7.0.2",
    "vitest": "5.0.5",
    "yaml": "2.9.1"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

// Unit tests live in tests/; a JUnit report is written to build/ for CI.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    reporters: ['default', 'junit'],
    outputFile: { junit: 'build/test-results/junit.xml' },
  },
});
```

### `sea-config.json`

```json
{
  "main": "build/hello.cjs",
  "output": "build/sea-prep.blob",
  "disableExperimentalSEAWarning": true
}
```

### `src/math.ts`

```ts
/**
 * Adds two numbers.
 * This is the function covered by the BasicAddition unit test.
 */
export function add(a: number, b: number): number {
  return a + b;
}
```

### `tests/basic.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { greet } from '../src/greeting.ts';
import { add } from '../src/math.ts';

describe('HelloTest', () => {
  it('BasicAddition', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('HelloMessage', () => {
    expect(greet()).toBe('Hello, World!');
  });
});
```

### `scripts/build-sea.mjs`

```js
// Packs build/hello.cjs into a single executable (Node.js SEA):
// build/hello.exe on Windows, build/hello on Linux and macOS.
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import postject from 'postject';

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const exe = isWindows ? 'build/hello.exe' : 'build/hello';
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

if (!existsSync('build/hello.cjs')) {
  console.error('[package] build/hello.cjs not found - run "npm run build" first.');
  process.exit(1);
}

// 1. SEA blob from sea-config.json. 2. Copy of the Node.js binary. 3. Blob injected into the copy.
run(process.execPath, ['--experimental-sea-config', 'sea-config.json']);
rmSync(exe, { force: true });
copyFileSync(process.execPath, exe);
if (!isWindows) chmodSync(exe, 0o755);
if (isMac) run('codesign', ['--remove-signature', exe]);
await postject.inject(exe, 'NODE_SEA_BLOB', readFileSync('build/sea-prep.blob'), {
  sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  machoSegmentName: isMac ? 'NODE_SEA' : undefined,
});
if (isMac) run('codesign', ['--sign', '-', exe]); // macOS runs only signed binaries

console.log(`[package] executable created: ${exe}`);
```

### `ci.sh`

```bash
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
```

### `ci.bat`

```bat
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
```

## Порядок дій

1. Створи файли з розділу «Результат».
2. Якщо немає `package-lock.json` — `npm install --no-audit --no-fund`.
3. Повний цикл: `.\ci.bat` (Windows) або `bash ci.sh` (Linux, macOS).

## Перевірка

| Що | Команда | Очікування |
|---|---|---|
| повний цикл | `.\ci.bat` або `bash ci.sh` | останній рядок `==== CI OK ====`, код 0 |
| тести | вивід `npm test`, `build/test-results/junit.xml` | `Tests  2 passed (2)`; у JUnit-звіті `HelloTest > BasicAddition` без `failure` і `skipped` |
| виконуваний файл | `build\hello.exe` або `build/hello` | `Hello, World!` |
| Git | `git status --short` | немає `build/` і `node_modules/` |

## Обробка помилок

| Симптом | Причина | Дія |
|---|---|---|
| `npm error code ENOTFOUND` | немає доступу до npm registry | повідомити про мережу, зупинитися |
| `error TS...` | помилка типів | показати помилку; не вимикати `strict` |
| `Tests 1 failed` | регресія в `add` чи `greet` | показати тест; заборонено `.skip` чи зміна очікуваного значення |
| `npm ci` → `package.json and package-lock.json ... in sync` | файли розійшлися | не запускати `npm install` поверх; показати різницю, запитати користувача |
| `warning: The signature seems corrupted!` (Windows) | копія `node.exe` втрачає підпис після вбудовування | очікуване попередження: файл працює |
| `npm warn install-scripts ... esbuild` | npm не запускає install-скрипти пакетів | очікуване попередження: esbuild працює |
| файл уже є, але відрізняється | змінено вручну | `CONFLICT`: не перезаписувати, показати різницю |

## Приклад

- **Вхід:** `PROJECT_NAME=hello-ts`, після `create-project`.
- **Очікуваний результат:** 9 файлів `CREATED`, `package-lock.json` від `npm install`; `.\ci.bat` → `Tests  2 passed (2)`,
  `build\hello.exe` → `Hello, World!`, `==== CI OK ====`.
- **Типовий сценарій помилки:** `add` повертає `a - b`. `npm test` показує
  `HelloTest > BasicAddition: expected -1 to be 5`, `ci.bat` завершується з кодом 1, агент зупиняє `init`
  і показує тест та рядок у `src/math.ts`, але не послаблює тест.
