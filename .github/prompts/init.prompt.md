---
name: be-init
description: "init: оркестратор — послідовно виконує git-init, create-project, create-build, create-actions і check; зупиняється на першій помилці"
agent: build-engineer
argument-hint: "projectName=hello-ts"
---

# Оркестратор init

Повний сценарій: від порожнього репозиторію до перевіреного проєкту з CI.

## Вхідні дані

- Назва проєкту: `${input:projectName:hello-ts}`. Якщо значення не передано — `hello-ts`.
- Мова: `TypeScript` (варіант 6).

## Передумови

Перевір і наведи версії перед стартом:

- Git: `git --version`;
- Node.js ≥ 22.18 і npm: `node --version`, `npm --version`;
- поточний каталог — корінь репозиторію з `.github/skills` і `tools/`.

Якщо хоча б одна передумова не виконана — не починай сценарій і поясни, що встановити.

## Дії

Виконуй кроки строго по черзі. Для кожного кроку прочитай файл команди, виконай її розділ «Дії»,
потім «Перевірка», і лише після успіху переходь далі.

1. [git-init.prompt.md](./git-init.prompt.md) — репозиторій, `.gitignore`, `.gitattributes`.
2. [create-project.prompt.md](./create-project.prompt.md) — каркас (`LANGUAGE=TypeScript`, `PROJECT_NAME=<назва>`).
3. [create-build.prompt.md](./create-build.prompt.md) — складання, тести, виконуваний файл `hello`.
4. [create-actions.prompt.md](./create-actions.prompt.md) — workflow GitHub Actions.
5. [check.prompt.md](./check.prompt.md) — підсумкова перевірка `node tools/check.mjs`.

Передача даних між кроками: назва проєкту (кроки 2–3), статуси файлів від `apply-templates`,
коди виходу і шляхи артефактів (`build/hello`, `build/test-results/junit.xml`) — у підсумковий звіт.

## Обробка помилок

- Помилка на кроці N — **не виконуй** кроки N+1…5. Виведи
  `init: FAILED на кроці N (<команда>) — <причина>. Дія: <що зробити>` і останні рядки виводу.
- `CONFLICT` від `apply-templates` — теж помилка: змінений вручну файл не перезаписується.
- Роботу не можна вважати успішною, якщо `check` має хоча б один `[FAIL]`.

## Очікувані файли

Після успішного `init`: `.gitignore`, `.gitattributes`, `src/main.ts`, `src/greeting.ts`, `src/math.ts`,
`tests/basic.test.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`,
`sea-config.json`, `scripts/build-sea.mjs`, `scripts/ci-summary.mjs`, `ci.sh`, `ci.bat`,
`.github/workflows/ci.yml`, `README.md` (три блоки). Артефакти — лише в `build/`.

## Перевірка

| Перевірка | Як | Очікування |
|---|---|---|
| Підсумкова | `node tools/check.mjs` | код 0, усі `[ OK ]` |
| Повторний запуск | запустити `init` ще раз | усі шаблони `UNCHANGED`, `git status --short` без нових змін |

## Повідомлення про помилку

- `init: FAILED на кроці 1 (git-init) — Git не знайдено. Дія: встановіть Git.`
- `init: FAILED на кроці 3 (create-build) — тест BasicAddition не пройшов. Дія: виправте add() у src/math.ts.`
- `init: FAILED на кроці 5 (check) — W3: у matrix немає macos-latest. Дія: відновіть workflow через /be-create-actions.`

## Підсумковий звіт

| № | Команда | Статус | Створено / змінено | Перевірка |
|---|---|---|---|---|
| 1 | git-init | … | … | … |
| 2 | create-project | … | … | … |
| 3 | create-build | … | … | … |
| 4 | create-actions | … | … | … |
| 5 | check | … | … | … |

Після таблиці: вивід `git status --short` і наступні кроки для користувача
(перегляд змін → коміти → push → pull request).
