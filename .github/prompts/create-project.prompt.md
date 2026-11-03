---
name: be-create-project
description: "create-project: викликає skill project-scaffold і створює початковий Hello World-проєкт на TypeScript"
agent: build-engineer
argument-hint: "projectName=hello-ts"
---

# Команда create-project

Створює каркас застосунку `hello` за skill [project-scaffold](../skills/project-scaffold/SKILL.md).

## Вхідні дані

- Мова: `TypeScript` (варіант 6).
- Назва проєкту: `${input:projectName:hello-ts}`.

## Передумови

- Виконано `git-init`.
- Node.js ≥ 22.18: `node --version`.

## Дії

1. Перевір вхідні дані за skill.
2. Створи `src/main.ts`, `src/greeting.ts` і розділ README.
3. Виконай перевірки skill.

## Очікувані файли

`src/main.ts`, `src/greeting.ts`, `README.md` з розділом «Проєкт».

## Перевірка

| Що | Команда | Очікування |
|---|---|---|
| запуск | `node src/main.ts` | перший рядок `Hello, World!` |
| README | пошук `node src/main.ts` у `README.md` | знайдено |

## Повідомлення про помилку

- `create-project: FAILED — мова <LANGUAGE> не підтримується. Дія: використайте TypeScript (варіант 6).`
- `create-project: CONFLICT — src/main.ts змінено вручну. Дія: перегляньте різницю і вирішіть, який варіант залишити.`
