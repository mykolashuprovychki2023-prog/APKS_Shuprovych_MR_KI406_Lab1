# Інструкція: запуск агента, проєкту і перевірки

## 1. Вимоги

Git, Node.js ≥ 22.18 (рекомендовано 24 LTS) з npm, VS Code з GitHub Copilot.

## 2. Запуск агента

```bash
git clone -b develop https://github.com/mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1.git
code APKS_Shuprovych_MR_KI406_Lab1
```

1. Відкрити Chat (Ctrl+Alt+I) і вибрати агента **build-engineer**.
2. Ввести `/be-init` (або `/be-init projectName=hello-ts`) і дозволяти запуск команд у терміналі.
3. Агент виконає п'ять кроків і виведе підсумкову таблицю.

Окремі команди: `/be-git-init`, `/be-create-project`, `/be-create-build`, `/be-create-actions`, `/be-check`.

## 3. Запуск проєкту і локальна перевірка

| Що | Windows (PowerShell, cmd) | Linux, macOS, Git Bash |
|---|---|---|
| повний цикл, як у CI | `.\ci.bat` | `bash ci.sh` |
| перевірка агента і проєкту | `node tools\check.mjs` | `node tools/check.mjs` |
| лише агент (гілка `develop`) | `node tools\check.mjs --agent-only` | `node tools/check.mjs --agent-only` |
| складання, тести, виконуваний файл | `npm run build`, `npm test`, `npm run package` | те саме |
| запуск застосунку | `build\hello.exe` | `./build/hello` |
| Git не бачить `build/` | `git status --short` | `git status --short` |

Залежності встановлює `npm ci` (його запускають `ci.bat` / `ci.sh`). Очікуваний вивід застосунку:
`Hello, World!` і `Platform: <os>/<arch>, Node.js v24.x.x`.

## 4. Демонстрація зламаної перевірки (гілка `feature/lab1-hello-ts`)

1. У `tests/basic.test.ts` замінити `toBe(5)` на `toBe(6)`.
2. `node tools/check.mjs` → `[FAIL] B2 ... AssertionError: expected 5 to be 6`, `check: FAILED`, код виходу 1.
3. Повернути файл: `git restore tests/basic.test.ts`, повторити `check` → код 0.

## 5. Відтворюваність

- Повторний `/be-init` дає лише `UNCHANGED`, `git status --short` без нових змін.
- Порівняння запуску агента з гілкою `feature` (нові файли спершу додаються в індекс):

  ```bash
  git add -A
  git diff --cached origin/feature/lab1-hello-ts --stat -- . ":(exclude)docs" ":(exclude)package-lock.json"
  ```

  Очікування: порожній вивід; на Windows можливе `ci.sh | 0` (лише біт виконання). `package-lock.json` створює
  `npm install`, тому версії вкладених залежностей можуть відрізнятися.
