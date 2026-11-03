---
name: be-check
description: "check: перевіряє агента, структуру проєкту, конфігурацію, складання, тести і YAML workflow, нічого не змінюючи"
agent: build-engineer
---

# Команда check

Підтверджує, що результат відповідає вимогам. Файлів проєкту не змінює: пише лише в ігноровані `build/`
і `node_modules/` (`npm ci`, якщо залежностей ще немає).

## Передумови

- Node.js ≥ 22.18 і npm.
- Для повної перевірки виконано `create-build` і `create-actions`; до цього (гілка `develop`) — режим `--agent-only`.

## Дії

1. Запусти `node tools/check.mjs` (до `init` — `node tools/check.mjs --agent-only`; одна група —
   `--only agent|project|git|build|workflow`).
2. Ручна перевірка: manifest і skills не суперечать одне одному; `docs/ai-log.md` містить запити, помилки й рішення.
3. Звіт: таблиця перевірок, для кожного `FAIL` — причина і дія.

| Група | Що перевіряється |
|---|---|
| agent (A1–A5) | manifest; 3 skills; 6 commands; порядок `init`; документація |
| project (P1–P4) | файли проєкту; npm scripts; тест `BasicAddition` не вимкнений; `ci.sh`/`ci.bat` не приховують помилок |
| git (G1–G3) | репозиторій; `build/` і `node_modules/` ігноруються й не відстежуються; секретів немає |
| build (B1–B4) | складання; тести (`BasicAddition` виконано); виконуваний файл; його запуск |
| workflow (W1–W5) | YAML; тригери; matrix трьох ОС; лише `ci.sh`/`ci.bat`; artifacts без секретів |

## Очікувані файли

Нових файлів у проєкті немає: `git status --short` до і після `check` однаковий.

## Перевірка

Код виходу `0`, останній рядок `check: OK - N/N перевірок пройдено`.

## Повідомлення про помилку

`check: FAILED - k/N перевірок пройдено, помилок: m (<ID>)`, для кожної помилки — деталі. Приклад:
`[FAIL] B2 ... AssertionError: expected 5 to be 6` → «Тест BasicAddition не пройшов: перевірте тест і add() у src/math.ts».
