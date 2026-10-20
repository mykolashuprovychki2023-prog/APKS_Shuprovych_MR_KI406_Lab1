# Архітектура AI-агента build-engineer

## 1. Яку проблему вирішує агент

Створення навіть мінімального кросплатформного проєкту вимагає низки повторюваних дій: структура
каталогів, `.gitignore`, система складання, тести, пакування у виконуваний файл, CI для трьох ОС,
документація. Виконані вручну чи одноразовим запитом до AI, ці дії дають невідтворюваний результат.

Агент `build-engineer` перетворює їх на **узгоджений, повторюваний процес**: кожна операція — окрема
команда з передумовами й перевірками, кожен клас задач — skill з еталонними шаблонами, а оркестратор
`init` запускає все в правильному порядку і зупиняється на першій помилці. Запуск агента на гілці
`develop` відтворює гілку `feature/lab1-hello-ts`.

## 2. Компоненти

```mermaid
flowchart TB
    U([Користувач]) -->|/be-init| I[init.prompt.md<br/>оркестратор]
    M[[build-engineer.agent.md<br/>manifest: роль, правила, заборони,<br/>критерії завершення]] -. керує .-> I
    I --> C1[git-init] --> C2[create-project] --> C3[create-build] --> C4[create-actions] --> C5[check]
    C1 -. only .gitignore .-> S1
    C2 --> S1[skill project-scaffold]
    C3 --> S2[skill build-and-test]
    C4 --> S3[skill github-actions]
    S1 & S2 & S3 --> T[(templates/*.tpl<br/>files.json)]
    T --> A[tools/apply-templates.mjs<br/>CREATED / MERGED / UNCHANGED / CONFLICT]
    A --> P[Файли проєкту:<br/>src, tests, package.json,<br/>ci.sh, ci.bat, ci.yml]
    C5 --> K[tools/check.mjs<br/>A, P, G, B, W]
    K --> R[[Звіт OK / FAIL<br/>build/check-report.md]]
```

| Компонент | Файл(и) | Роль |
|---|---|---|
| Agent manifest | `.github/agents/build-engineer.agent.md` | роль, область відповідальності, параметри проєкту, правила роботи з файлами, заборонені дії, критерії завершення, формат звіту |
| Skills | `.github/skills/<name>/SKILL.md` + `templates/` | повторно використовувані інструкції: коли застосовувати, входи, виходи, перевірки, помилки, приклад |
| Commands | `.github/prompts/*.prompt.md` | іменовані операції, які користувач запускає явно (`/be-...`) |
| Orchestrator | `.github/prompts/init.prompt.md` | викликає команди в порядку git-init → create-project → create-build → create-actions → check |
| Інструменти | `tools/apply-templates.mjs`, `tools/check.mjs` | детерміновані дії, які агент викликає замість «ручного» редагування |
| Адаптери | `.claude/commands/be-*.md`, `CLAUDE.md` | ті самі команди в Claude Code без дублювання інструкцій |

## 3. Skills

| Skill | Входи | Виходи | Перевірка |
|---|---|---|---|
| `project-scaffold` | `LANGUAGE` (лише TypeScript), `PROJECT_NAME` | `src/main.ts`, `src/greeting.ts`, `.gitignore`, `.gitattributes`, блок README | `node src/main.ts` → `Hello, World!` |
| `build-and-test` | `PROJECT_NAME` | `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `sea-config.json`, `src/math.ts`, `tests/basic.test.ts`, `scripts/*`, `ci.sh`, `ci.bat`, блок README | `npm ci`, `npm run build`, `npm test` (`BasicAddition`), `npm run package`, запуск `build/hello` |
| `github-actions` | `REPO_SLUG` | `.github/workflows/ci.yml`, блок README з бейджем | `node tools/check.mjs --only workflow` (W1–W5), `gh run list` |

## 4. Commands для користувача

| Command | Виклик | Змінює файли | Призначення |
|---|---|---|---|
| `git-init` | `/be-git-init` | `.gitignore`, `.gitattributes` | перевірка репозиторію, ігнорування `build/`, `node_modules/`, секретів |
| `create-project` | `/be-create-project` | `src/`, README | каркас застосунку |
| `create-build` | `/be-create-build` | конфігурації, `tests/`, `scripts/`, `ci.*` | складання, тести, виконуваний файл |
| `create-actions` | `/be-create-actions` | `.github/workflows/ci.yml`, README | CI |
| `check` | `/be-check` | ні (лише `build/`) | перевірка структури, конфігурації, складання, тестів, YAML |
| `init` | `/be-init` | усе вищезазначене | повний сценарій |

Префікс `be-` додано тому, що `/init` уже зайнята вбудованою командою VS Code Copilot і Claude Code.

## 5. Дані між етапами

| Звідки → куди | Дані |
|---|---|
| користувач → `init` | `projectName` (за замовчуванням `hello-ts`) |
| `init` → `create-project`, `create-build` | `PROJECT_NAME`, `LANGUAGE=TypeScript` |
| `git remote` → `create-actions` | `REPO_SLUG` (`owner/repo`) для бейджа CI |
| `apply-templates` → агент | статус кожного файла: `CREATED`, `MERGED`, `UNCHANGED`, `CONFLICT` |
| `create-build` → `check`, CI | `build/hello.cjs`, `build/hello(.exe)`, `build/test-results/junit.xml` |
| `check` → користувач | таблиця `[ OK ]`/`[FAIL]`, `build/check-report.md`, код виходу |

## 6. Обробка помилок оркестратором

1. Перед стартом `init` перевіряє передумови (Git, Node.js ≥ 22.18, npm, корінь репозиторію).
2. Кожен крок має розділ «Перевірка». Ненульовий код виходу або `CONFLICT` зупиняє сценарій: наступні
   кроки не виконуються, а агент виводить `init: FAILED на кроці N (<команда>) — <причина>. Дія: ...`.
3. `apply-templates` ніколи не перезаписує змінені вручну файли, тож повторний запуск безпечний.
4. Роботу не можна вважати успішною без `check` з кодом 0. Маніфест забороняє «озеленення»: вимкнення
   тестів, `|| true`, `continue-on-error`, логіку складання в YAML. `check` ловить це автоматично: P3 і B2 —
   вимкнені чи пропущені тести, W4 — `continue-on-error` і змінені умови `if`, P5 — будь-які ручні зміни
   згенерованих файлів (зокрема `ci.sh`, `ci.bat`, `ci.yml`) відносно шаблонів skills.

## 7. Відповідність рекомендованій структурі

| Рекомендований файл (методичка) | У цьому репозиторії | Пояснення |
|---|---|---|
| `.github/agents/build-engineer.agent.md` | той самий | формат custom agent VS Code Copilot |
| `.github/prompts/*.prompt.md` (6 файлів) | ті самі, `name: be-*` | у чаті викликаються як `/be-*` |
| `.github/skills/*/SKILL.md` | ті самі + `templates/` | формат Agent Skills; шаблони мають суфікс `.tpl` |
| `.github/workflows/ci.yml` | той самий | створюється командою `create-actions` |
| `CMakeLists.txt` | `package.json` + `tsconfig.json` + `sea-config.json` + `scripts/build-sea.mjs` | варіант 6 використовує npm scripts замість CMake |
| GoogleTest/CTest | Vitest (`tests/basic.test.ts`, `vitest.config.ts`) | варіант 6 |
| `src/`, `tests/`, `docs/`, `README.md`, `.gitignore` | ті самі | — |
| — | `tools/`, `.claude/commands/`, `CLAUDE.md`, `.gitattributes`, `ci.sh`, `ci.bat` | інструменти агента, адаптери Claude Code, кінці рядків, скрипти CI |

## 8. Ключові рішення

- **Шаблони в skills + ідемпотентний застосувальник.** Результат не залежить від «настрою» моделі:
  агент застосовує перевірені файли, а повторний запуск дає `UNCHANGED`. Тому запуск агента на `develop`
  точно відтворює `feature/lab1-hello-ts`.
- **Нативний виконуваний файл `hello`.** Node.js SEA вбудовує бандл у копію Node.js: `hello.exe` на
  Windows, `hello` на Linux і macOS запускаються без встановленого Node.js. На Windows старий
  Authenticode-підпис знімається перед вбудовуванням, на macOS файл підписується ad-hoc.
- **Логіка CI лише у скриптах.** `ci.yml` виконує checkout, встановлює точну версію Node.js 24.20.0 і викликає `ci.sh`/`ci.bat`;
  ті самі скрипти запускаються локально.
- **Фіксовані версії.** TypeScript 7.0.2, esbuild 0.28.2, Vitest 5.0.5, postject 1.0.0-alpha.6, yaml 2.9.1
  та `package-lock.json` гарантують однакові залежності на всіх ОС (`npm ci`), а точна версія Node.js 24.20.0
  у CI — однаковий runtime, який SEA вбудовує у виконуваний файл.
- **Кінці рядків.** `.gitattributes` задає LF усюди та CRLF для `*.bat`: cmd некоректно обробляє мітки
  в batch-файлах з LF.

## 9. Обмеження агента

- Підтримує лише варіант 6 (TypeScript). Інша мова потребує нових шаблонів у skills.
- Не виконує `git push`, не створює й не зливає pull request: це робить користувач після перегляду.
- Потребує мережі для `npm ci` і для запуску CI в GitHub.
- Розмір виконуваного файлу (≈ 90 МіБ на Windows, 115–121 МіБ на macOS і Linux) визначається розміром Node.js, бо SEA вбудовує весь runtime.
