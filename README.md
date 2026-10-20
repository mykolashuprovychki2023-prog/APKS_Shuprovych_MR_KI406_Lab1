# APKS_Shuprovych_MR_KI406_Lab1

Лабораторна робота № 1 з дисципліни «Автоматизоване проєктування комп'ютерних систем».

**Тема:** проєктування AI-агента для автоматизації розробки та CI/CD.

| | |
|---|---|
| Студент | Шупрович Микола Русланович |
| Група | КІ-406 |
| Варіант | 6 — TypeScript · npm scripts · Vitest |
| AI-агент | `build-engineer` (формат GitHub Copilot + адаптери Claude Code) |

## Опис

AI-агент **build-engineer** за власними інструкціями (manifest, skills, commands) створює, складає,
тестує і перевіряє кросплатформний застосунок Hello World на TypeScript та налаштовує для нього
GitHub Actions на Windows, Linux і macOS. Гілка `develop` містить лише агента з інструкціями;
запуск його оркестратора `/be-init` відтворює проєкт, що зберігається в гілці `feature/lab1-hello-ts`.

## Структура репозиторію

```text
.
├── .github/
│   ├── agents/build-engineer.agent.md     # manifest агента
│   ├── prompts/*.prompt.md                # commands: git-init, create-project, create-build,
│   │                                      #           create-actions, check, init (оркестратор)
│   ├── skills/                            # skills з шаблонами (templates/)
│   │   ├── project-scaffold/SKILL.md
│   │   ├── build-and-test/SKILL.md
│   │   └── github-actions/SKILL.md
│   └── workflows/ci.yml                   # створюється командою create-actions
├── .claude/commands/be-*.md               # адаптери команд для Claude Code
├── tools/
│   ├── apply-templates.mjs                # ідемпотентне застосування шаблонів skills
│   └── check.mjs                          # перевірка для команди check
├── docs/
│   ├── architecture.md                    # архітектура агента
│   ├── usage.md                           # точні команди запуску й перевірки
│   └── ai-log.md                          # журнал взаємодії з AI
├── src/, tests/, scripts/, package.json   # створюються агентом (гілка feature)
└── README.md
```

## Запуск агента

Потрібні Git і Node.js ≥ 22.18 (рекомендовано 24 LTS).

**GitHub Copilot (VS Code):** відкрийте репозиторій, у Chat виберіть агента `build-engineer`
і введіть `/be-init` (або `/be-init projectName=hello-ts`). Окремі команди: `/be-git-init`,
`/be-create-project`, `/be-create-build`, `/be-create-actions`, `/be-check`.

**Claude Code:** ті самі команди `/be-init`, `/be-check` тощо.

**Перевірка без AI:** `node tools/check.mjs` (на `develop` до запуску агента — `node tools/check.mjs --agent-only`).

Детально: [docs/usage.md](docs/usage.md), архітектура: [docs/architecture.md](docs/architecture.md),
журнал AI: [docs/ai-log.md](docs/ai-log.md).

## Гілки

| Гілка | Вміст |
|---|---|
| `master` | стабільний результат після перевірки викладачем |
| `develop` | AI-агент з інструкціями |
| `feature/lab1-hello-ts` | повний проєкт, створений агентом, з CI |

Pull request `lab1/finish`: `feature/lab1-hello-ts` → `develop`.

<!-- project-scaffold:begin -->
## Проєкт `hello-ts`

Мінімальний кросплатформний застосунок Hello World на TypeScript (варіант 6: TypeScript · npm scripts · Vitest).

| Файл | Призначення |
|---|---|
| `src/main.ts` | точка входу застосунку `hello` |
| `src/greeting.ts` | функція `greet()`, що формує привітання |

Швидкий запуск без складання (Node.js ≥ 22.18 виконує TypeScript напряму):

```bash
node src/main.ts
```
<!-- project-scaffold:end -->

<!-- build-and-test:begin -->
## Складання і тестування

| Команда | Що робить |
|---|---|
| `npm ci` | встановлює залежності строго за `package-lock.json` |
| `npm run build` | перевірка типів (`tsc --noEmit`) і бандл `build/hello.cjs` (esbuild) |
| `npm test` | юніт-тести Vitest (`HelloTest > BasicAddition`), JUnit-звіт у `build/test-results/` |
| `npm run package` | виконуваний файл `build/hello` або `build/hello.exe` (Node.js SEA) |
| `npm start` | запуск зібраного `build/hello.cjs` |

Повний цикл однією командою, так само як у CI:

```bash
bash ci.sh     # Linux, macOS, Git Bash
.\ci.bat       # Windows (cmd, PowerShell)
```
<!-- build-and-test:end -->

<!-- github-actions:begin -->
## Неперервна інтеграція

[![CI](https://github.com/mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1/actions/workflows/ci.yml/badge.svg)](https://github.com/mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1/actions/workflows/ci.yml)

Workflow `.github/workflows/ci.yml` запускається на `push` і `pull_request` до `develop` та `master`
(а також вручну) і в одній job з matrix виконує `ci.sh` (Ubuntu, macOS) або `ci.bat` (Windows).
Виконуваний файл `hello` для кожної ОС і JUnit-звіт зберігаються як artifacts запуску.
<!-- github-actions:end -->
