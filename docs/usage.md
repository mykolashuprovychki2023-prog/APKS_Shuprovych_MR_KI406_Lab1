# Інструкція: запуск агента і перевірка результату

## 1. Вимоги

| Інструмент | Версія | Перевірка |
|---|---|---|
| Git | ≥ 2.40 | `git --version` |
| Node.js | ≥ 22.18 (рекомендовано 24 LTS) | `node --version` |
| npm | постачається з Node.js | `npm --version` |
| AI-клієнт | VS Code + GitHub Copilot або Claude Code | — |
| GitHub CLI (необов'язково) | ≥ 2.40 | `gh --version` |

## 2. Запуск агента

### 2.1. GitHub Copilot у VS Code

1. Клонувати репозиторій і перейти на гілку з агентом:
   ```bash
   git clone https://github.com/mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1.git
   cd APKS_Shuprovych_MR_KI406_Lab1
   git switch develop
   git switch -c feature/my-run
   ```
2. Відкрити каталог у VS Code (`code .`) і відкрити Chat (Ctrl+Alt+I).
3. У списку агентів вибрати **build-engineer** (сесія Local).
4. Ввести `/be-init` і за потреби підтвердити запуск терміналу. Агент виконає п'ять кроків і виведе
   підсумкову таблицю.

### 2.2. Claude Code

```text
/be-init
```

Окремі команди: `/be-git-init`, `/be-create-project`, `/be-create-build`, `/be-create-actions`, `/be-check`.

### 2.3. Що відбувається під капотом

Агент викликає ті самі детерміновані інструменти, тож кожен крок можна повторити вручну:

```bash
node tools/apply-templates.mjs project-scaffold --only .gitignore --only .gitattributes   # git-init
node tools/apply-templates.mjs project-scaffold --var LANGUAGE=TypeScript --var PROJECT_NAME=hello-ts
node tools/apply-templates.mjs build-and-test --var PROJECT_NAME=hello-ts
npm ci --no-audit --no-fund && npm run build && npm test && npm run package
node tools/apply-templates.mjs github-actions --var REPO_SLUG=mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1
node tools/check.mjs
```

## 3. Локальна перевірка

| Що | Команда (Linux, macOS, Git Bash) | Команда (Windows cmd / PowerShell) |
|---|---|---|
| Повна перевірка агента і проєкту | `node tools/check.mjs` | `node tools\check.mjs` |
| Лише агент (гілка `develop`) | `node tools/check.mjs --agent-only` | `node tools\check.mjs --agent-only` |
| Повний цикл CI | `bash ci.sh` | `.\ci.bat` |
| Складання | `npm run build` | `npm run build` |
| Тести | `npm test` | `npm test` |
| Виконуваний файл | `npm run package && ./build/hello` | `npm run package`, потім `build\hello.exe` (у Windows PowerShell 5.1 оператора `&&` немає) |
| Git не бачить build/ | `git status --short` | `git status --short` |

Очікуваний вивід застосунку:

```text
Hello, World!
Platform: <os>/<arch>, Node.js v24.x.x
```

## 4. Демонстрація реакції на навмисно зламану перевірку

Демонстрацію виконують на гілці `feature/lab1-hello-ts`, де файли вже закомічені (на незакоміченому запуску
`git restore` їх не знає — тоді поверніть зміну вручну або повторіть відповідну команду агента).

1. Зламати тест: у `tests/basic.test.ts` замінити `toBe(5)` на `toBe(6)`.
2. Запустити `node tools/check.mjs`. Очікування: `[FAIL] B2 Тести ...` з текстом
   `expected 5 to be 6`, рядок `check: FAILED ...`, код виходу 1.
3. Зламати workflow: у `.github/workflows/ci.yml` прибрати `macos-latest` з matrix.
   Очікування: `[FAIL] W3 ...`, `matrix.os: [ubuntu-latest,windows-latest]`.
4. Повернути файли: `git restore tests/basic.test.ts .github/workflows/ci.yml`, повторити `check` → код 0.

## 5. Відтворюваність і повторний запуск

- Повторний `/be-init` у вже створеному проєкті дає лише статуси `UNCHANGED`, а `git status --short`
  не показує нових змін.
- Порівняти свій запуск з еталонною гілкою. Після `/be-init` згенеровані файли ще не відстежуються Git, тому
  спочатку додайте їх в індекс, інакше `git diff` покаже їх як «видалені»:
  ```bash
  git add -A
  git diff --cached feature/lab1-hello-ts --stat -- . ":(exclude)docs"
  ```
  Очікування: порожній вивід. На Windows може з'явитися лише `ci.sh | 0` (режим 100644 замість 100755) —
  його усуває `git add --chmod=+x ci.sh`.

## 6. CI у GitHub

```bash
gh run list --workflow ci.yml --limit 5      # останні запуски
gh run view <run-id>                         # job для ubuntu, windows, macos
gh run download <run-id>                     # artifacts hello-Linux / hello-Windows / hello-macOS
```
