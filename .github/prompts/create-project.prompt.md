---
name: be-create-project
description: "create-project: викликає skill project-scaffold і створює початковий Hello World-проєкт на TypeScript"
agent: build-engineer
argument-hint: "projectName=hello-ts"
---

# Команда create-project

Створює каркас застосунку `hello` за skill [project-scaffold](../skills/project-scaffold/SKILL.md).

## Вхідні дані

- Мова: `TypeScript` (варіант 6; інші мови агент не підтримує).
- Назва проєкту: `${input:projectName:hello-ts}`. Якщо значення не передано — `hello-ts`.

## Передумови

- Виконано `git-init` (є `.gitignore` з `build/` і `node_modules/`).
- Node.js ≥ 22.18: `node --version`.

## Дії

1. Прочитай [SKILL.md](../skills/project-scaffold/SKILL.md) і перевір вхідні дані за його розділом «Вхідні дані».
2. Попередній перегляд:
   `node tools/apply-templates.mjs project-scaffold --var LANGUAGE=TypeScript --var PROJECT_NAME=<назва> --dry-run`
3. Застосування: та сама команда без `--dry-run`. Якщо є `CONFLICT` — зупинись (див. «Повідомлення про помилку»).
4. Виконай перевірки skill: `node src/main.ts` і пошук `node src/main.ts` у `README.md`.

## Очікувані файли

- `src/main.ts`, `src/greeting.ts`
- `README.md` з блоком `<!-- project-scaffold:begin -->`
- `.gitignore`, `.gitattributes` (без змін, якщо `git-init` уже виконано)

## Перевірка

| Перевірка | Команда | Очікування |
|---|---|---|
| Вихідний файл | `node -e "require('fs').accessSync('src/main.ts')"` | код 0 |
| Команда запуску | `node src/main.ts` | `Hello, World!` у першому рядку |
| Ідемпотентність | повторити крок 3 | `created 0, merged 0, conflicts 0` |

## Повідомлення про помилку

- `create-project: FAILED — мова <X> не підтримується (лише TypeScript). Дія: запустіть з LANGUAGE=TypeScript.`
- `create-project: FAILED — CONFLICT <файл>: файл змінено вручну. Дія: перегляньте різницю й вирішіть, який варіант залишити.`
- `create-project: FAILED — node src/main.ts завершився з кодом <N>. Дія: оновіть Node.js до 24 LTS.`

## Повторний запуск

Безпечний: існуючі ідентичні файли отримують статус `UNCHANGED`, змінені — `CONFLICT` без перезапису.
