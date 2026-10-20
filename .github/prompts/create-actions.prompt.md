---
name: be-create-actions
description: "create-actions: викликає skill github-actions і створює CI workflow для Windows, Linux і macOS"
agent: build-engineer
---

# Команда create-actions

Створює `.github/workflows/ci.yml` за skill [github-actions](../skills/github-actions/SKILL.md).

## Передумови

- Виконано `create-build`: існують `ci.sh`, `ci.bat`, `package.json`, встановлено `node_modules/`
  (потрібен пакет `yaml` для перевірки workflow).

## Дії

1. Прочитай [SKILL.md](../skills/github-actions/SKILL.md).
2. Визнач `REPO_SLUG`: `git remote get-url origin` → `owner/repo`; якщо remote немає — значення за замовчуванням зі skill.
3. Попередній перегляд: `node tools/apply-templates.mjs github-actions --var REPO_SLUG=<owner/repo> --dry-run`,
   потім та сама команда без `--dry-run`. Якщо є `CONFLICT` — зупинись.
4. Перевір workflow: `node tools/check.mjs --only workflow`.
5. Нагадай користувачу: workflow запуститься після його push у `develop`/`master` або pull request до них
   (push лише у `feature/...` workflow не запускає).

## Очікувані файли

- `.github/workflows/ci.yml`
- `README.md` з блоком `<!-- github-actions:begin -->` (бейдж CI)

## Перевірка

| Перевірка | Команда | Очікування |
|---|---|---|
| Workflow | `node tools/check.mjs --only workflow` | W1–W5 `[ OK ]`, код 0 |
| Запуск у GitHub (поза `init`, після push або PR користувача) | `gh run list --workflow ci.yml --limit 3` | job для трьох ОС, `success` |

Агент не виконує `git push` (заборона маніфесту), тому в межах `init` рядок «Запуск у GitHub» позначається
як «очікує push користувача», а не як помилка.

## Повідомлення про помилку

- `create-actions: FAILED — workflow не пройшов перевірку <W…>: <деталі>. Дія: виправте шаблон skill github-actions.`
- `create-actions: FAILED — немає ci.sh/ci.bat. Дія: спочатку виконайте /be-create-build.`
- `create-actions: FAILED — CONFLICT .github/workflows/ci.yml. Дія: перегляньте різницю з шаблоном.`

## Повторний запуск

Безпечний: наявний ідентичний workflow отримує статус `UNCHANGED`, дублікати не створюються.
