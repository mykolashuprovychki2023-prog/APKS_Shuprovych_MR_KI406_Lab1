---
name: project-scaffold
description: Створює мінімальний кросплатформний Hello World-проєкт на TypeScript (src/main.ts, src/greeting.ts, розділ README, .gitignore, .gitattributes) з перевірених шаблонів. Використовуй для команд create-project і git-init або щоб відновити каркас проєкту.
argument-hint: "LANGUAGE=TypeScript PROJECT_NAME=hello-ts"
---

# Skill: project-scaffold

Створює каркас застосунку `hello`: вихідні файли, структуру каталогів, розділ README з командою запуску,
початкові `.gitignore` і `.gitattributes`. Усі файли беруться з шаблонів у [templates/](./templates/files.json)
і застосовуються ідемпотентним інструментом `tools/apply-templates.mjs`.

## Коли застосовувати

- Команда `create-project` (крок 2 оркестратора `init`) у новому або частково створеному репозиторії.
- Команда `git-init` — лише для `.gitignore` і `.gitattributes` (параметр `--only`).
- Відновлення випадково видалених файлів каркаса: повторний запуск безпечний.

Не застосовуй для зміни логіки застосунку: це звичайна розробка, а не створення каркаса.

## Вхідні дані

| Параметр | Обов'язковий | За замовчуванням | Обмеження |
|---|---|---|---|
| `LANGUAGE` | так | `TypeScript` | лише `TypeScript` (варіант 6) |
| `PROJECT_NAME` | так | `hello-ts` | правила npm: `^[a-z0-9][a-z0-9._-]{0,213}$` |

Передумови: поточний каталог — корінь репозиторію (є `.github/skills`), Node.js ≥ 22.18 (`node --version`).

## Результат

| Файл | Режим | Призначення |
|---|---|---|
| `src/main.ts` | create | точка входу: друкує `Hello, World!` і платформу |
| `src/greeting.ts` | create | функція `greet()` |
| `.gitignore` | merge-lines | ігнорування `node_modules/`, `build/`, логів і секретів |
| `.gitattributes` | merge-lines | LF для всіх файлів, CRLF для `*.bat` |
| `README.md` | block `project-scaffold` | опис проєкту і команда запуску `node src/main.ts` |

Режими: `create` — створити, якщо файла немає; `merge-lines` — дописати відсутні рядки;
`block` — вставити розділ між маркерами `<!-- project-scaffold:begin/end -->`. Змінений вручну файл
ніколи не перезаписується (статус `CONFLICT`).

## Порядок дій

1. Перевір вхідні дані. Якщо `LANGUAGE` не `TypeScript`, зупинись (див. «Обробка помилок»).
2. Попередній перегляд без запису:
   `node tools/apply-templates.mjs project-scaffold --var LANGUAGE=TypeScript --var PROJECT_NAME=<назва> --dry-run`
3. Застосування: та сама команда без `--dry-run`.
4. Виконай усі перевірки з таблиці нижче і наведи їхній фактичний вивід.

## Перевірка

| Що перевіряємо | Команда | Очікуваний результат |
|---|---|---|
| Вихідний файл існує | `node -e "require('fs').accessSync('src/main.ts')"` | код виходу 0 |
| Команда запуску працює | `node src/main.ts` | перший рядок `Hello, World!`, код 0 |
| README містить команду запуску | пошук `node src/main.ts` у `README.md` | рядок знайдено |
| Ідемпотентність | повторити крок 3 | усі файли `UNCHANGED`, `conflicts 0` |

## Обробка помилок

| Симптом | Причина | Дія агента |
|---|---|---|
| `LANGUAGE=Rust is not supported by skill "project-scaffold"` | варіант не TypeScript | зупинитись; повідомити, що агент підтримує лише TypeScript (варіант 6) |
| `CONFLICT src/main.ts` | файл змінено вручну | не перезаписувати; показати `git diff --no-index .github/skills/project-scaffold/templates/src/main.ts.tpl src/main.ts`; запитати користувача |
| `node src/main.ts` → `ERR_UNKNOWN_FILE_EXTENSION` | Node.js старіший за 22.18 | зупинитись; попросити оновити Node.js до 24 LTS |
| `run this script from the repository root` | неправильний робочий каталог | перейти в корінь репозиторію й повторити |

## Приклад

**Вхід:** `LANGUAGE=TypeScript`, `PROJECT_NAME=hello-ts`, порожній репозиторій.

```text
> node tools/apply-templates.mjs project-scaffold --var LANGUAGE=TypeScript --var PROJECT_NAME=hello-ts
[apply-templates] skill: project-scaffold (LANGUAGE=TypeScript, PROJECT_NAME=hello-ts)
  CREATED   src/main.ts
  CREATED   src/greeting.ts
  UNCHANGED .gitignore
  UNCHANGED .gitattributes
  MERGED    README.md
[apply-templates] created 2, merged 1, unchanged 2, conflicts 0
```

**Очікуваний результат:** з'явилися `src/main.ts`, `src/greeting.ts`, у README — розділ «Проєкт `hello-ts`».

**Перевірки:** `node src/main.ts` друкує `Hello, World!` і `Platform: ...`; повторний запуск дає `created 0, merged 0`.

**Типовий сценарій помилки:** користувач запускає `/be-create-project` з `LANGUAGE=Rust`. Інструмент
завершується з кодом 1 і повідомленням `LANGUAGE=Rust is not supported ... (allowed: TypeScript)`. Агент
не створює жодного файла, зупиняє `init` на кроці 2 і пояснює, що цей агент налаштований на варіант 6.

## Файли шаблонів

- [files.json](./templates/files.json) — карта шаблонів і змінних
- [src/main.ts](./templates/src/main.ts.tpl), [src/greeting.ts](./templates/src/greeting.ts.tpl)
- [.gitignore](./templates/gitignore.tpl), [.gitattributes](./templates/gitattributes.tpl)
- [розділ README](./templates/README.section.md.tpl)
