# Журнал взаємодії з AI

| | |
|---|---|
| AI-інструмент | Claude Code (модель Claude Opus 5.5), розширення для VS Code |
| Формат агента | GitHub Copilot (`.github/agents`, `.github/prompts`, `.github/skills`) + адаптери Claude Code |
| Оператор | Шупрович Микола Русланович, КІ-406 |
| Дата | 20.10.2026 |

> Методичка вимагає використовувати AI-інструмент, визначений викладачем. Агентські файли, код,
> конфігурації й тести цього репозиторію створено за допомогою Claude Code. Формат агента сумісний
> з GitHub Copilot, тож сценарій `/be-init` можна повторити в Copilot.

## Журнал запитів

| № | Запит користувача / завдання | Важлива відповідь або дія AI | Результат |
|---|---|---|---|
| 1 | «Ознайомся з вмістом папки АПКС на робочому столі» | Прочитав 4 методички і 6 лекційних модулів (`pdftotext -enc UTF-8`), підсумував вимоги ЛР1–ЛР4 | Огляд курсу і вимог ЛР1 |
| 2 | «Повністю зроби лабораторну роботу 1 разом зі звітом у форматі Word за стилями кафедри ЕОМ… Перед початком уточни деталі» | Перевірив середовище (Git 2.52, Visual Studio 2026, Python 3.14, Rust, Java 17; немає Node.js і GitHub CLI) і поставив уточнювальні запитання: варіант, дані для титулки, GitHub-акаунт, формат агента, шаблон звіту | Перелік питань |
| 3 | Відповіді: варіант 6; Шупрович Микола Русланович, КІ-406; акаунт `mykolashuprovychki2023-prog`; згода на пропозиції; шаблон `звіт_практика.docx` | Встановив через winget GitHub CLI 2.102.0 і Node.js 24.20.0 LTS, запустив `gh auth login --web` | Інструменти встановлено |
| 4 | «Давай увійду в github» | Перезапустив вхід через device flow і передав новий одноразовий код | `Logged in as mykolashuprovychki2023-prog`, scopes `repo`, `workflow` |
| 5 | Завдання AI: звірити формат агента з документацією VS Code | З'ясував: custom agents — `.github/agents/*.agent.md`, prompt files — `.github/prompts/*.prompt.md` (`name`, `agent`, `${input:...}`), Agent Skills — `.github/skills/<name>/SKILL.md`; набори інструментів `read`, `search`, `edit`, `execute`, `todos`; `/init` — вбудована команда | Формат файлів і префікс `be-` |
| 6 | Завдання AI: еталонний проєкт TypeScript | Створив і перевірив локально: TypeScript 7.0.2, esbuild 0.28.2, Vitest 5.0.5, Node.js SEA, `ci.sh`, `ci.bat` | Складання, 2 тести, `hello.exe` — успішно |
| 7 | Завдання AI: агент на гілці `develop` | Створив manifest, 3 skills із шаблонами, 6 commands, `tools/apply-templates.mjs`, `tools/check.mjs`, адаптери Claude Code, документацію | `node tools/check.mjs --agent-only` → 17/17 |
| 8 | Запит до окремого екземпляра AI-агента (без контексту розробки): «Виконай `/be-init` строго за `.github/agents/build-engineer.agent.md` і `.github/prompts/init.prompt.md`; не комітити, не пушити, не змінювати агентські файли» | Виконав 5 кроків (усі `OK`), `check` → 30/30; повторив `init`: усі шаблони `UNCHANGED`, SHA-256 17 файлів збігаються; надав 9 зауважень до інструкцій | Проєкт у гілці `feature/lab1-hello-ts` |
| 9 | Завдання AI: виправити інструкції за зауваженнями агента (етап 4.3 методички — через AI, а не ручною зміною результату) | Коміт `797eb35` у `develop`: G4 перевіряє нові файли, `--dry-run` у командах, повний цикл у перевірках `create-build`, «очікує push» для CI, уточнення `check` і `init` | Повторне застосування шаблонів виправленою версією: 21/21 `UNCHANGED`, `check` 30/30 |
| 10 | Завдання AI: зафіксувати результат і відкрити PR | Три коміти за етапами (create-project, create-build, create-actions), push, pull request #1 `lab1/finish` у `develop` | PR запустив CI |
| 11 | Завдання AI: перевірити CI | Запуск 39481423856 (`pull_request`): `ubuntu-latest` 15 с, `windows-latest` 38 с, `macos-latest` 40 с — усі `success`; artifacts `hello-Linux`, `hello-Windows`, `hello-macOS` | CI зелений на трьох ОС |
| 12 | Завдання AI: продемонструвати реакцію на зламану перевірку | `toBe(5)` → `toBe(6)`: `[FAIL] B2`, код 1; без `macos-latest` у matrix: `[FAIL] W3`, код 1; після `git restore` — 30/30 | Демонстрація для звіту і відео |

## Помилки та виправлення

| № | Помилка (фактичний вивід) | Причина | Виправлення |
|---|---|---|---|
| 1 | `failed to authenticate via web browser: context deadline exceeded` під час `gh auth login` | одноразовий код (діє 15 хв) не підтвердили вчасно | вхід перезапущено з новим кодом, користувач підтвердив його в браузері |
| 2 | `npm warn install-scripts ... esbuild@0.28.2 (postinstall: node install.js)` | npm 11 за замовчуванням не виконує install-скрипти пакетів | перевірено, що esbuild працює без postinstall (бінарник з optional dependency); попередження описано в skill build-and-test |
| 3 | `warning: The signature seems corrupted!` від postject під час `npm run package` на Windows | копія `node.exe` має Authenticode-підпис, який стає недійсним після вбудовування | у `scripts/build-sea.mjs` додано зняття підпису з PE-заголовка перед вбудовуванням (аналог `signtool remove /s`); попередження зникло, `Get-AuthenticodeSignature` → `NotSigned`, файл працює |
| 4 | `'ci.bat' is not recognized as an internal or external command` | у середовищі ввімкнено `NoDefaultCurrentDirectoryInExePath`: cmd не шукає програми в поточному каталозі | у workflow і документації скрипт викликається з явним шляхом `.\ci.bat` |
| 5 | в адаптерах `.claude/commands/be-*.md` замість закривного апострофа після `.github/prompts/` стояла лапка | помилка екранування в shell-скрипті, яким AI генерував файли | виправлено `sed`, перевірено `grep` |
| 6 | зауваження агента: перевірка секретів G4 не бачить нових файлів, бо читає лише `git ls-files` | на першому `init` увесь проєкт — ще не відстежувані файли | `git ls-files --cached --others --exclude-standard`; негативний тест із фальшивим токеном у новому файлі → `[FAIL] G4` |
| 7 | зауваження агента: команди `create-build` і `create-actions` не мали `--dry-run`, перевірки команд і skills відрізнялися | неузгодженість інструкцій | кроки й перевірки вирівняно (коміт `797eb35`) |
| 8 | зауваження агента: `ci.sh` потрапить у Git без біта виконання | Windows, `core.filemode=false` | `git add --chmod=+x ci.sh` (режим `100755`), крок додано в наступні кроки `init` і в skill |
| 9 | помилка AI під час комітування: у двох комітах кожен рядок README виглядав зміненим | проміжні версії README записано через текстовий stdout Python на Windows, який замінив `\n` на `\r\n` | ще не опубліковані коміти перероблено (`git reset --mixed`, запис байтів із LF); у комітах README лише додавання: +17, +19, +10 рядків |
| 10 | у демонстрації `[FAIL] B2` показував лише хвіст виводу Vitest без рядка `AssertionError` | `check.mjs` брав останні 12 рядків виводу | фільтр рядків `FAIL`/`AssertionError` (коміт `1fa0bc4`): `AssertionError: expected 5 to be 6 // Object.is equality` |

Інформаційні повідомлення CI (не помилки): анотації GitHub про перехід мітки `ubuntu-latest` на Ubuntu 26 і черги
на macOS arm64; `setup-node` встановив різні патчі Node.js 24 (24.22.0 на Linux, 24.21.0 на Windows і macOS) —
на результат не впливає, бо версії залежностей зафіксовано `package-lock.json`.

## Прийняті рішення

| № | Рішення | Обґрунтування |
|---|---|---|
| 1 | Формат агента — GitHub Copilot + адаптери Claude Code | рекомендована структура методички; запуск в обох середовищах без дублювання інструкцій |
| 2 | Префікс команд `be-` (`/be-init`, `/be-check`, …) | `/init` уже зайнята вбудованою командою Copilot і Claude Code |
| 3 | Skills містять перевірені шаблони, `tools/apply-templates.mjs` застосовує їх ідемпотентно | відтворюваність develop → feature; повторний запуск не руйнує і не дублює файли |
| 4 | `tools/check.mjs` — детермінована перевірка з кодом виходу | однаковий результат для людини, агента і демонстрації зламаної перевірки |
| 5 | Виконуваний файл `hello` будується через Node.js SEA | нативний файл для кожної ОС, запускається без встановленого Node.js |
| 6 | `ci.yml` лише робить checkout, встановлює Node.js 24 і викликає `ci.sh`/`ci.bat` | вимога методички; ті самі скрипти працюють локально |
| 7 | Точні версії залежностей і `package-lock.json` у шаблоні | `npm ci` дає однаковий результат на всіх ОС |
| 8 | `.gitattributes`: LF усюди, CRLF для `*.bat` | cmd некоректно обробляє мітки й `goto` у batch-файлах з LF |
| 9 | Імпорти з розширенням `.ts` і `allowImportingTsExtensions` | каркас запускається відразу (`node src/main.ts`), тож крок `create-project` перевіряється окремо від складання |
| 10 | Агента запущено окремим екземпляром AI без контексту розробки | доказ, що інструкцій у репозиторії достатньо для відтворення результату |
| 11 | Виправлення вносяться в інструкції агента в `develop`, а `feature` отримує їх через merge | вимога етапу 4.3: виправляти агента, а не підправляти результат вручну |
| 12 | Pull request без автоматичного призначення рецензента | методичка ЛР1 цього не вимагає; рецензента студент додає сам за потреби |

## Докази перевірки

Підсумковий звіт оркестратора `init` (запуск окремим екземпляром агента):

| № | Команда | Статус | Створено / змінено | Перевірка |
|---|---|---|---|---|
| 1 | git-init | OK | `.gitignore`, `.gitattributes` (UNCHANGED) | `build/`, `node_modules/` ігноруються |
| 2 | create-project | OK | `src/main.ts`, `src/greeting.ts` (CREATED), README (MERGED) | `node src/main.ts` → `Hello, World!` |
| 3 | create-build | OK | 11 файлів (CREATED), README (MERGED) | `npm ci`, build, `Tests 2 passed`, `build\hello.exe` → `Hello, World!`, `.\ci.bat` → `CI OK` |
| 4 | create-actions | OK | `.github/workflows/ci.yml` (CREATED), README (MERGED) | `check --only workflow` → W1–W5 OK |
| 5 | check | OK | лише `build/` | `node tools/check.mjs` → 30/30, код 0 |

- Повторний `init`: усі шаблони `UNCHANGED` (2 + 5 + 12 + 2), `git status --short` і SHA-256 17 файлів без змін.
- Pull request: <https://github.com/mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1/pull/1>
- GitHub Actions: <https://github.com/mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1/actions/runs/39481423856>
  — `build-and-test (ubuntu-latest)` ✓, `(windows-latest)` ✓, `(macos-latest)` ✓.
