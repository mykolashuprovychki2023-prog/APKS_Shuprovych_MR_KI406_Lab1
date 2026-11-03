---
name: be-git-init
description: "git-init: перевіряє Git-репозиторій, створює або доповнює .gitignore і .gitattributes, показує стан Git"
agent: build-engineer
---

# Команда git-init

Готує репозиторій: Git ініціалізовано, `build/`, `node_modules/` і секрети ігноруються.
Використовує розділ про `.gitignore` і `.gitattributes` зі skill [project-scaffold](../skills/project-scaffold/SKILL.md).

## Передумови

- Git: `git --version`.
- Поточний каталог — корінь репозиторію з `.github/skills`.

## Дії

1. `git rev-parse --is-inside-work-tree`; якщо це не репозиторій — `git init -b develop`.
2. Допиши в `.gitignore` і `.gitattributes` відсутні рядки зі skill (наявні не дублюй).
3. Перевір ігнорування: `git check-ignore build/probe node_modules/probe`.
4. Покажи стан: `git status --short --branch`.

## Очікувані файли

`.gitignore`, `.gitattributes`.

## Перевірка

| Що | Команда | Очікування |
|---|---|---|
| репозиторій | `git rev-parse --is-inside-work-tree` | `true` |
| ігнорування | `git check-ignore build/probe node_modules/probe` | надруковано обидва шляхи |
| повторний запуск | користувач окремо запускає команду ще раз | `.gitignore` і `.gitattributes` — `UNCHANGED` |

## Повідомлення про помилку

- `git-init: FAILED — Git не знайдено. Дія: встановіть Git і повторіть /be-git-init.`
- `git-init: FAILED — .gitignore не ігнорує build/ або node_modules/. Дія: приберіть правило-виняток і повторіть.`
