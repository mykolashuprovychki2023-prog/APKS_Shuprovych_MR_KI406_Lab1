---
name: github-actions
description: Створює .github/workflows/ci.yml — одна job з matrix ubuntu-latest, windows-latest, macos-latest, яка лише викликає ci.sh або ci.bat і зберігає виконуваний файл та звіт тестів як artifacts. Використовуй для команди create-actions.
---

# Skill: github-actions

## Коли застосовувати

Команда `create-actions` після `create-build`.

## Вхідні дані

Файли `ci.sh` і `ci.bat` від `create-build`. Параметрів немає.

## Результат

Файл створюється за правилом `CREATED` / `UNCHANGED` / `CONFLICT` з маніфесту. Тригери — `push` і `pull_request`
до `develop` та `master`; одна job з matrix трьох ОС; кроки — checkout, Node.js 24.20.0, виклик `ci.sh` або `ci.bat`,
artifacts (виконуваний файл і JUnit-звіт). Логіки складання і секретів у workflow немає.

### `.github/workflows/ci.yml`

```yaml
# CI: one job with a matrix of three OSes; all build logic is in ci.sh / ci.bat.
name: CI

on:
  push:
    branches: [develop, master]
  pull_request:
    branches: [develop, master]

permissions:
  contents: read

jobs:
  build-and-test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24.20.0
      - name: Build and test (ci.sh)
        if: runner.os != 'Windows'
        run: bash ./ci.sh
      - name: Build and test (ci.bat)
        if: runner.os == 'Windows'
        shell: cmd
        run: .\ci.bat
      - name: Upload executable and test report
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: hello-${{ runner.os }}
          path: |
            build/hello
            build/hello.exe
            build/test-results/junit.xml
```

## Перевірка

| Що | Команда | Очікування |
|---|---|---|
| YAML, тригери, matrix, кроки, artifacts | `node tools/check.mjs --only workflow` | W1–W5 `[ OK ]` |
| запуск у GitHub (після push користувача) | вкладка Actions або `gh run list --workflow ci.yml` | три job `success` |

## Обробка помилок

| Симптом | Причина | Дія |
|---|---|---|
| `[FAIL] W1` | синтаксична помилка YAML (відступи, табуляції) | показати рядок помилки, відновити файл за skill |
| `[FAIL] W4 ... npm test (if: -)` | у workflow додано команду складання | перенести її в `ci.sh` / `ci.bat` |
| job `windows-latest` падає на `ci.bat` | файл має LF замість CRLF | перевірити `.gitattributes` (`*.bat text eol=crlf`) |
| push відхилено: `refusing to allow an OAuth App to create or update workflow` | токен без scope `workflow` | користувач виконує `gh auth refresh -s workflow` |

## Приклад

- **Вхід:** є `ci.sh` і `ci.bat`.
- **Очікуваний результат:** `CREATED .github/workflows/ci.yml`; `check --only workflow` → W1–W5 OK; після push —
  три job `build-and-test (...)` зі статусом `success`.
- **Типовий сценарій помилки:** у workflow вручну додали крок `run: npm test`. W4 падає (`npm test (if: -)`),
  `check` повертає код 1, агент пропонує перенести команду в `ci.sh` / `ci.bat`.
