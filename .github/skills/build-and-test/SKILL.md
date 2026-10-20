---
name: build-and-test
description: Налаштовує систему складання (npm scripts, tsc, esbuild, пакування у виконуваний файл hello через Node.js SEA), тестову функцію add і юніт-тест BasicAddition (Vitest), а також скрипти ci.sh і ci.bat. Використовуй для команди create-build.
argument-hint: "PROJECT_NAME=hello-ts"
---

# Skill: build-and-test

Перетворює каркас проєкту на повноцінний збірний проєкт: залежності з фіксованими версіями,
перевірка типів, бандл, юніт-тести з JUnit-звітом і нативний виконуваний файл `hello` для поточної ОС.
Ті самі кроки збирають скрипти `ci.sh` і `ci.bat`, які викликає GitHub Actions.

## Коли застосовувати

- Команда `create-build` (крок 3 оркестратора `init`) після `create-project`.
- Відновлення конфігурації складання чи тестів після випадкового видалення.

Можна виконувати частинами (підкроки нижче), наприклад лише тести: `--only tests/basic.test.ts --only src/math.ts`.

## Вхідні дані

| Параметр | Обов'язковий | За замовчуванням | Обмеження |
|---|---|---|---|
| `PROJECT_NAME` | так | `hello-ts` | має збігатися з назвою з `create-project` |

Передумови: виконано `create-project` (є `src/main.ts`), Node.js ≥ 22.18 і npm, доступ до npm registry.

## Результат

| Підкрок | Файли | Призначення |
|---|---|---|
| 3.1 Система складання | `package.json`, `package-lock.json`, `tsconfig.json`, `sea-config.json`, `scripts/build-sea.mjs` | npm scripts `build`, `test`, `package`, `start`; фіксовані версії TypeScript 7, esbuild, Vitest 5, postject, yaml |
| 3.2 Тестова функція і тест | `src/math.ts`, `tests/basic.test.ts`, `vitest.config.ts` | `add(a, b)`; тести `HelloTest > BasicAddition`, `HelloTest > HelloMessage`; JUnit у `build/test-results/junit.xml` |
| 3.3 Скрипти CI | `ci.sh`, `ci.bat`, `scripts/ci-summary.mjs` | повний цикл: `npm ci` → build → test → package → smoke test → підсумок |
| 3.4 Документація | `README.md` (блок `build-and-test`) | таблиця команд складання |

Згенеровані артефакти (`build/hello.cjs`, `build/hello`, `build/hello.exe`, звіти) з'являються лише в `build/`.

## Порядок дій

1. Попередній перегляд: `node tools/apply-templates.mjs build-and-test --var PROJECT_NAME=<назва> --dry-run`
2. Застосування: та сама команда без `--dry-run`.
3. Встановлення залежностей: `npm ci --no-audit --no-fund` (не `npm install`: lock-файл не змінюється).
4. Складання: `npm run build`.
5. Тести: `npm test`.
6. Пакування: `npm run package`, потім запуск `build/hello` (Windows: `build\hello.exe`).
7. Наведи фактичний вивід кожного кроку; при помилці зупинись.

## Перевірка

| Що перевіряємо | Команда | Очікуваний результат |
|---|---|---|
| Залежності | `npm ci` | код 0, `node_modules/` створено |
| Складання | `npm run build` | код 0, є `build/hello.cjs` |
| Тести | `npm test` | `Tests 2 passed`, у JUnit є `BasicAddition`, `failures="0"` |
| Виконуваний файл | `npm run package` і запуск `build/hello` | файл існує; вивід містить `Hello, World!` |
| Повний цикл | `bash ci.sh` або `.\ci.bat` | останній рядок `==== CI OK ====` |
| Git | `git status --short` | `build/` і `node_modules/` не показуються |

## Обробка помилок

| Симптом | Причина | Дія агента |
|---|---|---|
| `npm ci` → `EUSAGE`/`lockfile ... in sync` | `package.json` і lock-файл розійшлися | не запускати `npm install`; повторно застосувати шаблони, показати `git diff` |
| `npm error code ENOTFOUND` | немає доступу до registry | повідомити про мережу, зупинитись |
| `tsc` → `error TS...` | помилка типів у `src/` чи `tests/` | показати помилку, запропонувати виправлення, не вимикати `strict` |
| `Tests 1 failed` | регресія у `add` або `greet` | показати тест, що впав; заборонено `.skip` чи зміну очікуваного значення без пояснення |
| `[package] build/hello.cjs not found` | `package` запущено до `build` | виконати `npm run build`, повторити |
| `CONFLICT package.json` | файл змінено вручну | не перезаписувати; показати різницю; запитати користувача |
| `npm warn install-scripts ... esbuild@0.28.2 (postinstall)` | npm 11 не виконує install-скрипти без дозволу | очікуване попередження: esbuild працює через optional dependency, дій не потрібно |
| `./ci.sh: Permission denied` (Linux, macOS) | у Git немає біта виконання `ci.sh` | запускати `bash ./ci.sh`; під час коміту на Windows — `git add --chmod=+x ci.sh` |

## Приклад

**Вхід:** `PROJECT_NAME=hello-ts`, після `create-project`.

```text
> node tools/apply-templates.mjs build-and-test --var PROJECT_NAME=hello-ts
  CREATED   package.json
  CREATED   package-lock.json
  ...
  MERGED    README.md
[apply-templates] created 11, merged 1, unchanged 0, conflicts 0
> npm ci && npm run build && npm test
 ✓ tests/basic.test.ts (2 tests)
      Tests  2 passed (2)
> npm run package && build/hello
[package] executable created: build/hello
Hello, World!
Platform: linux/x64, Node.js v24.x
```

**Очікуваний результат:** проєкт збирається, обидва тести зелені, виконуваний файл друкує привітання.

**Перевірки:** `bash ci.sh` (або `.\ci.bat`) завершується рядком `==== CI OK ====` і кодом 0.

**Типовий сценарій помилки:** користувач змінив `add` так, що вона повертає `a - b`. `npm test` показує
`HelloTest > BasicAddition: expected -1 to be 5`, крок завершується з кодом 1, агент зупиняє `init`,
показує тест і рядок у `src/math.ts`, але не послаблює тест.

## Файли шаблонів

- [files.json](./templates/files.json)
- [package.json](./templates/package.json.tpl), [package-lock.json](./templates/package-lock.json.tpl), [tsconfig.json](./templates/tsconfig.json.tpl)
- [vitest.config.ts](./templates/vitest.config.ts.tpl), [sea-config.json](./templates/sea-config.json.tpl)
- [src/math.ts](./templates/src/math.ts.tpl), [tests/basic.test.ts](./templates/tests/basic.test.ts.tpl)
- [scripts/build-sea.mjs](./templates/scripts/build-sea.mjs.tpl), [scripts/ci-summary.mjs](./templates/scripts/ci-summary.mjs.tpl)
- [ci.sh](./templates/ci.sh.tpl), [ci.bat](./templates/ci.bat.tpl), [розділ README](./templates/README.section.md.tpl)
