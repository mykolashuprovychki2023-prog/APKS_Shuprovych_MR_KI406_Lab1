---
name: be-create-build
description: "create-build: викликає skill build-and-test — система складання, тест BasicAddition, виконуваний файл hello, ci.sh і ci.bat"
agent: build-engineer
argument-hint: "projectName=hello-ts"
---

# Команда create-build

Налаштовує складання і тести за skill [build-and-test](../skills/build-and-test/SKILL.md).

## Вхідні дані

- Назва проєкту: `${input:projectName:hello-ts}` — та сама, що в `create-project`.

## Передумови

- Виконано `create-project`: є `src/main.ts`.
- Node.js ≥ 22.18 і npm, доступ до npm registry.

## Дії

1. Створи файли зі skill.
2. Якщо немає `package-lock.json` — `npm install --no-audit --no-fund`.
3. Запусти повний цикл: `.\ci.bat` (Windows) або `bash ci.sh` (Linux, macOS).

## Очікувані файли

`package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `sea-config.json`, `src/math.ts`,
`tests/basic.test.ts`, `scripts/build-sea.mjs`, `ci.sh`, `ci.bat`. Артефакти — лише в `build/`.

## Перевірка

| Що | Команда | Очікування |
|---|---|---|
| повний цикл | `.\ci.bat` або `bash ci.sh` | останній рядок `==== CI OK ====` |
| тести | вивід `npm test`, `build/test-results/junit.xml` | `Tests  2 passed (2)`; у JUnit-звіті `HelloTest > BasicAddition` без `failure` і `skipped` |
| виконуваний файл | `build\hello.exe` або `build/hello` | `Hello, World!` |
| Git | `git status --short` | немає `build/` і `node_modules/` |

## Повідомлення про помилку

- `create-build: FAILED — тест BasicAddition не пройшов. Дія: перевірте add() у src/math.ts.`
- `create-build: FAILED — npm ENOTFOUND. Дія: перевірте доступ до інтернету і повторіть команду.`
- `create-build: CONFLICT — package.json змінено вручну. Дія: перегляньте різницю і вирішіть, який варіант залишити.`
