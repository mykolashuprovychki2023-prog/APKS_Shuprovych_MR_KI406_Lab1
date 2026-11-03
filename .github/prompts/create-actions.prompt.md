---
name: be-create-actions
description: "create-actions: викликає skill github-actions і створює CI workflow для Windows, Linux і macOS"
agent: build-engineer
---

# Команда create-actions

Створює `.github/workflows/ci.yml` за skill [github-actions](../skills/github-actions/SKILL.md).

## Передумови

- Виконано `create-build`: є `ci.sh`, `ci.bat` і `node_modules/` (пакет `yaml` потрібен для перевірки).

## Дії

1. Створи `.github/workflows/ci.yml` зі skill.
2. Перевір workflow: `node tools/check.mjs --only workflow`.
3. Нагадай: workflow запуститься після push користувача в `develop` / `master` або pull request до них.

## Очікувані файли

`.github/workflows/ci.yml`.

## Перевірка

| Що | Команда | Очікування |
|---|---|---|
| workflow | `node tools/check.mjs --only workflow` | W1–W5 `[ OK ]`, код 0 |

## Повідомлення про помилку

- `create-actions: FAILED — W3: у matrix немає macos-latest. Дія: відновіть файл за skill github-actions.`
- `create-actions: FAILED — немає пакета yaml. Дія: спочатку виконайте /be-create-build.`
