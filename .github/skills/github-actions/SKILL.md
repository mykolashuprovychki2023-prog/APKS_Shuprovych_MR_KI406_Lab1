---
name: github-actions
description: Створює workflow .github/workflows/ci.yml з однією job і matrix ubuntu-latest, windows-latest, macos-latest, який лише викликає ci.sh або ci.bat і зберігає виконувані файли та JUnit-звіт як artifacts. Використовуй для команди create-actions.
argument-hint: "REPO_SLUG=owner/repo"
---

# Skill: github-actions

Налаштовує неперервну інтеграцію в GitHub Actions. Уся логіка складання лишається у скриптах
`ci.sh`/`ci.bat` (skill `build-and-test`), тож локальний запуск і CI виконують однакові кроки.

## Коли застосовувати

- Команда `create-actions` (крок 4 оркестратора `init`) після `create-build`.
- Відновлення workflow після випадкового видалення чи пошкодження.

## Вхідні дані

| Параметр | Обов'язковий | За замовчуванням | Опис |
|---|---|---|---|
| `REPO_SLUG` | ні | `mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1` | `owner/repo` для бейджа CI у README |

Визнач `REPO_SLUG` з `git remote get-url origin` (частина `owner/repo` без `.git`). Якщо віддаленого
репозиторію ще немає — використай значення за замовчуванням.
Передумови: виконано `create-build` (є `ci.sh`, `ci.bat`, `package.json`).

## Результат

| Файл | Режим | Призначення |
|---|---|---|
| `.github/workflows/ci.yml` | create | workflow `CI` |
| `README.md` | block `github-actions` | бейдж і опис CI |

Властивості workflow:

- тригери: `push` і `pull_request` до `develop` та `master`, а також ручний `workflow_dispatch`;
- одна job `build-and-test` з `strategy.matrix.os: [ubuntu-latest, windows-latest, macos-latest]`, `fail-fast: false`;
- кроки: `actions/checkout@v7` → `actions/setup-node@v7` (Node.js 24) → `bash ./ci.sh` або `.\ci.bat` → `actions/upload-artifact@v7`;
- мінімальні права `permissions: contents: read`, жодних секретів.

## Порядок дій

1. Визнач `REPO_SLUG` (див. «Вхідні дані»).
2. `node tools/apply-templates.mjs github-actions --var REPO_SLUG=<owner/repo> --dry-run`, потім без `--dry-run`.
3. Перевір workflow: `node tools/check.mjs --only workflow`.
4. Якщо віддалений репозиторій і `gh` доступні, після push користувача покажи статус запусків:
   `gh run list --workflow ci.yml --limit 3`. Сам push виконує користувач.

## Перевірка

| Що перевіряємо | Команда | Очікуваний результат |
|---|---|---|
| YAML коректний | `node tools/check.mjs --only workflow` (W1) | `[ OK ] W1` |
| Тригери develop/master | те саме (W2) | `[ OK ] W2` |
| Matrix з трьох ОС, одна job | те саме (W3) | `[ OK ] W3` |
| Лише виклики `ci.sh`/`ci.bat` | те саме (W4) | `[ OK ] W4` |
| Artifacts і відсутність секретів | те саме (W5) | `[ OK ] W5` |
| Запуск у GitHub (після push або PR користувача, поза `init`) | `gh run list --workflow ci.yml` | три job зі статусом `success` |

## Обробка помилок

| Симптом | Причина | Дія агента |
|---|---|---|
| `[FAIL] W1 ... YAML` | синтаксична помилка (відступи, табуляції) | показати рядок помилки; виправити шаблон через skill, а не вручну в результаті |
| `[FAIL] W4 ... зайві run` | у workflow додано команди складання | прибрати їх: логіка складання має бути в `ci.sh`/`ci.bat` |
| job `windows-latest` падає на `ci.bat` | файл має LF замість CRLF | перевірити `.gitattributes` (`*.bat text eol=crlf`) |
| `refusing to allow an OAuth App to create or update workflow` під час push | токен без scope `workflow` | повідомити користувача: `gh auth refresh -s workflow` |
| `CONFLICT .github/workflows/ci.yml` | workflow змінено вручну | не перезаписувати; показати різницю, запитати користувача |

## Приклад

**Вхід:** `REPO_SLUG=mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1`.

```text
> node tools/apply-templates.mjs github-actions --var REPO_SLUG=mykolashuprovychki2023-prog/APKS_Shuprovych_MR_KI406_Lab1
  CREATED   .github/workflows/ci.yml
  MERGED    README.md
> node tools/check.mjs --only workflow
[ OK ] W1    YAML workflow синтаксично коректний
[ OK ] W2    Тригери: push і pull_request до develop та master
[ OK ] W3    Одна job з matrix: ubuntu-latest, windows-latest, macos-latest
[ OK ] W4    Кроки: checkout і лише виклики ci.sh / ci.bat
[ OK ] W5    Результат job зберігається (artifact), секретів у workflow немає
```

**Очікуваний результат:** після push у GitHub Actions з'являються три job `build-and-test (...)`.

**Типовий сценарій помилки:** у workflow вручну додали крок `run: npm test`. Перевірка W4 падає
(`зайві run: npm test`), `check` повертає код 1, агент пропонує перенести команду в `ci.sh`/`ci.bat`.

## Файли шаблонів

- [files.json](./templates/files.json)
- [ci.yml](./templates/ci.yml.tpl)
- [розділ README](./templates/README.section.md.tpl)
