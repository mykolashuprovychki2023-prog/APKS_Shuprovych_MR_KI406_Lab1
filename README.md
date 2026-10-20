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
