---
name: be-git-init
description: "git-init: перевіряє Git-репозиторій, створює або доповнює .gitignore і .gitattributes, показує стан Git"
agent: build-engineer
---

# Команда git-init

Готує репозиторій до роботи агента: Git ініціалізовано, тимчасові каталоги та секрети ігноруються.
Використовує частину skill [project-scaffold](../skills/project-scaffold/SKILL.md) (лише `.gitignore` і `.gitattributes`).

## Передумови

- Git встановлено: `git --version`.
- Node.js ≥ 22.18: `node --version`.
- Поточний каталог — корінь репозиторію (є `.github/skills`).

## Дії

1. Перевір, чи це Git-репозиторій: `git rev-parse --is-inside-work-tree`.
   Якщо ні — `git init -b develop` (команда нічого не видаляє).
2. Створи або доповни `.gitignore` і `.gitattributes`:
   `node tools/apply-templates.mjs project-scaffold --only .gitignore --only .gitattributes`
3. Переконайся, що службові каталоги ігноруються: `git check-ignore -v build/probe node_modules/probe`.
4. Покажи стан: `git status --short --branch` і `git log --oneline -5` (якщо коміти вже є).

## Очікувані файли

- `.gitignore` — містить `node_modules/`, `build/`, `.env`, `*.pem`, `*.key`.
- `.gitattributes` — `* text=auto eol=lf`, `*.bat text eol=crlf`.

## Перевірка

| Перевірка | Команда | Очікування |
|---|---|---|
| Репозиторій існує | `git rev-parse --is-inside-work-tree` | `true` |
| Каталоги ігноруються | `git check-ignore build/probe node_modules/probe` | обидва шляхи надруковано |
| Ідемпотентність | повторити крок 2 | `UNCHANGED .gitignore`, `UNCHANGED .gitattributes` |

## Повідомлення про помилку

- `git-init: FAILED — Git не знайдено. Дія: встановіть Git і повторіть /be-git-init.`
- `git-init: FAILED — .gitignore не ігнорує build/ (CONFLICT або ручні зміни). Дія: перегляньте .gitignore.`
- `git-init: FAILED — команду запущено не з кореня репозиторію. Дія: відкрийте корінь і повторіть.`

## Повторний запуск

Безпечний: команда лише дописує відсутні рядки й нічого не видаляє.
