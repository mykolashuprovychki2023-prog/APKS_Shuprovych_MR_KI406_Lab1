---
name: be-init
description: "init: оркестратор — послідовно виконує git-init, create-project, create-build, create-actions і check; зупиняється на першій помилці"
agent: build-engineer
argument-hint: "projectName=hello-ts"
---

# Оркестратор init

Повний сценарій: від репозиторію з агентом до перевіреного проєкту з CI.

## Вхідні дані

- Назва проєкту: `${input:projectName:hello-ts}`; мова — `TypeScript`.

## Передумови

`git --version`, `node --version` (≥ 22.18), `npm --version`; поточний каталог — корінь репозиторію з `.github/skills`
і `tools/`. Якщо щось не виконано — не починай і поясни, що встановити.

## Дії

Виконуй кроки по черзі: для кожного прочитай файл команди, виконай її «Дії» і «Перевірку»; лише після успіху переходь далі.

1. [git-init.prompt.md](./git-init.prompt.md)
2. [create-project.prompt.md](./create-project.prompt.md) — `LANGUAGE=TypeScript`, `PROJECT_NAME=<назва>`
3. [create-build.prompt.md](./create-build.prompt.md) — `PROJECT_NAME=<назва>`
4. [create-actions.prompt.md](./create-actions.prompt.md)
5. [check.prompt.md](./check.prompt.md)

Між кроками передаються назва проєкту (кроки 2–3), статуси файлів, коди виходу і шляхи артефактів
(`build/hello(.exe)`, `build/test-results/junit.xml`) — до підсумкового звіту.

## Очікувані файли

`.gitignore`, `.gitattributes`, `src/main.ts`, `src/greeting.ts`, `src/math.ts`, `tests/basic.test.ts`, `package.json`,
`package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `sea-config.json`, `scripts/build-sea.mjs`, `ci.sh`, `ci.bat`,
`.github/workflows/ci.yml`, `README.md` з розділом «Проєкт». Артефакти — лише в `build/`.

## Перевірка

| Що | Як | Очікування |
|---|---|---|
| підсумкова | `node tools/check.mjs` | код 0, усі `[ OK ]` |
| повторний запуск | користувач окремо запускає `init` ще раз | усі файли `UNCHANGED` (вміст збігається зі skills), `git status --short` без нових змін |

## Повідомлення про помилку

Помилка на кроці N — кроки N+1…5 не виконуються:
`init: FAILED на кроці N (<команда>) — <причина>. Дія: <що зробити>` і останні рядки виводу.
Приклад: `init: FAILED на кроці 3 (create-build) — тест BasicAddition не пройшов. Дія: виправте add() у src/math.ts.`

## Підсумковий звіт

| № | Команда | Статус | Файли | Перевірка |
|---|---|---|---|---|
| 1 | git-init | … | … | … |
| … | … | … | … | … |
| 5 | check | … | … | … |

Після таблиці — вивід `git status --short`. Якщо є нові файли, наступні кроки для користувача: створити гілку
(`git switch -c feature/lab1-hello-ts`, якщо її ще немає), переглянути зміни, закомітити (`ci.sh` — з
`git add --chmod=+x ci.sh`), зробити push і pull request до `develop`.
