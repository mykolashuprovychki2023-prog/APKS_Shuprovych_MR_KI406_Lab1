---
name: be-create-build
description: "create-build: викликає skill build-and-test — система складання, тест BasicAddition, виконуваний файл hello, ci.sh/ci.bat"
agent: build-engineer
argument-hint: "projectName=hello-ts"
---

# Команда create-build

Налаштовує складання, тести і пакування за skill [build-and-test](../skills/build-and-test/SKILL.md).

## Вхідні дані

- Назва проєкту: `${input:projectName:hello-ts}` — та сама, що в `create-project`.

## Передумови

- Виконано `create-project`: існує `src/main.ts`.
- Node.js ≥ 22.18 і npm: `node --version`, `npm --version`.
- Доступ до npm registry (для `npm ci`).

## Дії

1. Прочитай [SKILL.md](../skills/build-and-test/SKILL.md).
2. Застосуй шаблони: `node tools/apply-templates.mjs build-and-test --var PROJECT_NAME=<назва>`.
3. Встанови залежності: `npm ci --no-audit --no-fund`.
4. Склади проєкт: `npm run build`.
5. Запусти тести: `npm test`.
6. Створи виконуваний файл: `npm run package`, потім запусти `build/hello` (Windows: `build\hello.exe`).
7. Після кожного кроку наведи фактичний вивід; на першій помилці зупинись.

## Очікувані файли

- `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `sea-config.json`
- `src/math.ts`, `tests/basic.test.ts`
- `scripts/build-sea.mjs`, `scripts/ci-summary.mjs`, `ci.sh`, `ci.bat`
- `README.md` з блоком `<!-- build-and-test:begin -->`
- Артефакти лише в `build/`: `hello.cjs`, `hello` / `hello.exe`, `test-results/junit.xml`

## Перевірка

| Перевірка | Команда | Очікування |
|---|---|---|
| Складання | `npm run build` | код 0, є `build/hello.cjs` |
| Тести | `npm test` | `Tests 2 passed`, `BasicAddition` у JUnit |
| Виконуваний файл | `build/hello` | вивід містить `Hello, World!` |
| Git | `git status --short` | немає `build/` і `node_modules/` |

## Повідомлення про помилку

- `create-build: FAILED на кроці npm ci — <причина>. Дія: перевірте мережу / узгодженість package-lock.json.`
- `create-build: FAILED на кроці build — <помилка tsc>. Дія: виправте тип у <файл:рядок>.`
- `create-build: FAILED на кроці test — BasicAddition: <очікування>. Дія: виправте add(), тест не вимикати.`
- `create-build: FAILED на кроці package — <причина>. Дія: спочатку npm run build.`

## Повторний запуск

Безпечний: шаблони дають `UNCHANGED`, `npm ci` перевстановлює `node_modules/`, складання перезаписує лише `build/`.
