# APKS_Shuprovych_MR_KI406_Lab1

Лабораторна робота № 1 з дисципліни «Автоматизоване проєктування комп'ютерних систем»:
AI-агент для автоматизації розробки та CI/CD.

| | |
|---|---|
| Студент | Шупрович Микола Русланович |
| Група | КІ-406 |
| Варіант | 6 — TypeScript · npm scripts · Vitest |

## Опис

AI-агент **build-engineer** (формат GitHub Copilot) створює, складає, тестує і перевіряє кросплатформний
Hello World на TypeScript і налаштовує GitHub Actions для Windows, Linux і macOS. Гілка `develop` містить лише
агента; запуск його оркестратора `/be-init` відтворює гілку `feature/lab1-hello-ts`.

## Запуск агента

Потрібні Git і Node.js ≥ 22.18. У VS Code з GitHub Copilot відкрийте репозиторій (гілка `develop`), у Chat виберіть
агента `build-engineer` і введіть `/be-init`. Окремі команди: `/be-git-init`, `/be-create-project`,
`/be-create-build`, `/be-create-actions`, `/be-check`.

Детально — [docs/usage.md](docs/usage.md) (запуск агента, проєкту і перевірки), архітектура —
[docs/architecture.md](docs/architecture.md), журнал роботи з AI — [docs/ai-log.md](docs/ai-log.md).

## Гілки

| Гілка | Вміст |
|---|---|
| `master` | стабільний результат після перевірки викладачем |
| `develop` | AI-агент з інструкціями |
| `feature/lab1-hello-ts` | проєкт, створений агентом, з CI |

Pull request `lab1/finish`: `feature/lab1-hello-ts` → `develop`.

## Проєкт `hello-ts`

Мінімальний кросплатформний Hello World на TypeScript. Запуск без складання
(Node.js ≥ 22.18 виконує TypeScript напряму):

```bash
node src/main.ts
```
