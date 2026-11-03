---
name: project-scaffold
description: Створює мінімальний Hello World на TypeScript — src/main.ts, src/greeting.ts, розділ README з командою запуску, .gitignore і .gitattributes. Використовуй для команд git-init і create-project.
---

# Skill: project-scaffold

## Коли застосовувати

- Команда `create-project` — каркас застосунку `hello`.
- Команда `git-init` — лише `.gitignore` і `.gitattributes`.

## Вхідні дані

| Параметр | За замовчуванням | Обмеження |
|---|---|---|
| `LANGUAGE` | `TypeScript` | лише `TypeScript` (варіант 6) |
| `PROJECT_NAME` | `hello-ts` | малі латинські літери, цифри, `-` |

## Результат

Файли створюються за правилом `CREATED` / `UNCHANGED` / `CONFLICT` з маніфесту.

### `src/main.ts`

```ts
import { greet } from './greeting.ts';

/** Entry point of the cross-platform hello executable. */
function main(): void {
  console.log(greet());
  console.log(`Platform: ${process.platform}/${process.arch}, Node.js ${process.version}`);
}

main();
```

### `src/greeting.ts`

```ts
/** Builds the greeting line printed by the hello executable. */
export function greet(name = 'World'): string {
  return `Hello, ${name}!`;
}
```

### `.gitignore` і `.gitattributes`

Мають містити рядки нижче: відсутні рядки дописати в кінець файлу, наявні не дублювати.

```gitignore
node_modules/
build/
*.log
.env
.env.*
*.pem
*.key
```

```gitattributes
* text=auto eol=lf
*.bat text eol=crlf
```

### Розділ `README.md`

Якщо в `README.md` ще немає розділу `## Проєкт`, дописати в кінець (замість `hello-ts` — `PROJECT_NAME`):

````markdown
## Проєкт `hello-ts`

Мінімальний кросплатформний Hello World на TypeScript. Запуск без складання
(Node.js ≥ 22.18 виконує TypeScript напряму):

```bash
node src/main.ts
```
````

## Перевірка

| Що | Команда | Очікування |
|---|---|---|
| вихідний файл є | `node -e "require('fs').accessSync('src/main.ts')"` | код 0 |
| команда запуску працює | `node src/main.ts` | перший рядок `Hello, World!` |
| README містить команду запуску | пошук `node src/main.ts` у `README.md` | рядок знайдено |
| повторний запуск | виконати skill ще раз | усі файли `UNCHANGED` |

## Обробка помилок

| Симптом | Причина | Дія |
|---|---|---|
| `LANGUAGE=Rust` | агент підтримує лише варіант 6 | зупинитися, нічого не створювати |
| файл уже є, але відрізняється | змінено вручну | `CONFLICT`: не перезаписувати, показати різницю, запитати користувача |
| `node src/main.ts` → `ERR_UNKNOWN_FILE_EXTENSION` | Node.js старіший за 22.18 | попросити оновити Node.js |

## Приклад

- **Вхід:** `LANGUAGE=TypeScript`, `PROJECT_NAME=hello-ts`, репозиторій лише з агентом.
- **Очікуваний результат:** `CREATED src/main.ts`, `CREATED src/greeting.ts`, розділ README дописано,
  `.gitignore` і `.gitattributes` — `UNCHANGED`; `node src/main.ts` друкує `Hello, World!`.
- **Типовий сценарій помилки:** передано `LANGUAGE=Rust`. Агент нічого не створює, а `init` зупиняється на кроці 2:
  `create-project: FAILED — мова Rust не підтримується. Дія: використайте TypeScript (варіант 6).`
