# Журнал взаємодії з AI

| | |
|---|---|
| AI-інструмент | Claude Code (модель Claude Opus 5.5), розширення для VS Code |
| Формат агента | GitHub Copilot (`.github/agents`, `.github/prompts`, `.github/skills`) + адаптери Claude Code |
| Оператор | Шупрович Микола Русланович, КІ-406 |
| Дата | 20.10.2026 |

> Методичка вимагає використовувати AI-інструмент, визначений викладачем. Агентські файли, код,
> конфігурації й тести цього репозиторію створено за допомогою Claude Code. Формат агента сумісний
> з GitHub Copilot, тож сценарій `/be-init` можна повторити в Copilot.

## Журнал запитів

| № | Запит користувача / завдання | Важлива відповідь або дія AI | Результат |
|---|---|---|---|
| 1 | «Ознайомся з вмістом папки АПКС на робочому столі» | Прочитав 4 методички і 6 лекційних модулів (`pdftotext -enc UTF-8`), підсумував вимоги ЛР1–ЛР4 | Огляд курсу і вимог ЛР1 |
| 2 | «Повністю зроби лабораторну роботу 1 разом зі звітом у форматі Word за стилями кафедри ЕОМ… Перед початком уточни деталі» | Перевірив середовище (Git 2.52, Visual Studio 2026, Python 3.14, Rust, Java 17; немає Node.js і GitHub CLI) і поставив уточнювальні запитання: варіант, дані для титулки, GitHub-акаунт, формат агента, шаблон звіту | Перелік питань |
| 3 | Відповіді: варіант 6; Шупрович Микола Русланович, КІ-406; акаунт `mykolashuprovychki2023-prog`; згода на пропозиції; шаблон `звіт_практика.docx` | Встановив через winget GitHub CLI 2.102.0 і Node.js 24.20.0 LTS, запустив `gh auth login --web` | Інструменти встановлено |
| 4 | «Давай увійду в github» | Перезапустив вхід через device flow і передав новий одноразовий код | `Logged in as mykolashuprovychki2023-prog`, scopes `repo`, `workflow` |
| 5 | Завдання AI: звірити формат агента з документацією VS Code | З'ясував: custom agents — `.github/agents/*.agent.md`, prompt files — `.github/prompts/*.prompt.md` (`name`, `agent`, `${input:...}`), Agent Skills — `.github/skills/<name>/SKILL.md`; набори інструментів `read`, `search`, `edit`, `execute`, `todos`; `/init` — вбудована команда | Формат файлів і префікс `be-` |
| 6 | Завдання AI: еталонний проєкт TypeScript | Створив і перевірив локально: TypeScript 7.0.2, esbuild 0.28.2, Vitest 5.0.5, Node.js SEA, `ci.sh`, `ci.bat` | Складання, 2 тести, `hello.exe` — успішно |
| 7 | Завдання AI: агент на гілці `develop` | Створив manifest, 3 skills із шаблонами, 6 commands, `tools/apply-templates.mjs`, `tools/check.mjs`, адаптери Claude Code, документацію | `node tools/check.mjs --agent-only` |

## Помилки та виправлення

| № | Помилка (фактичний вивід) | Причина | Виправлення |
|---|---|---|---|
| 1 | `failed to authenticate via web browser: context deadline exceeded` під час `gh auth login` | одноразовий код (діє 15 хв) не підтвердили вчасно | вхід перезапущено з новим кодом, користувач підтвердив його в браузері |
| 2 | `npm warn install-scripts ... esbuild@0.28.2 (postinstall: node install.js)` | npm 11 за замовчуванням не виконує install-скрипти пакетів | перевірено, що esbuild працює без postinstall (бінарник з optional dependency); додаткових дозволів не надавали |
| 3 | `warning: The signature seems corrupted!` від postject під час `npm run package` на Windows | копія `node.exe` має Authenticode-підпис, який стає недійсним після вбудовування | у `scripts/build-sea.mjs` додано зняття підпису з PE-заголовка перед вбудовуванням (аналог `signtool remove /s`); попередження зникло, `Get-AuthenticodeSignature` → `NotSigned`, файл працює |
| 4 | `'ci.bat' is not recognized as an internal or external command` | у середовищі ввімкнено `NoDefaultCurrentDirectoryInExePath`: cmd не шукає програми в поточному каталозі | у workflow і документації скрипт викликається з явним шляхом `.\ci.bat` |
| 5 | в адаптерах `.claude/commands/be-*.md` замість закривного апострофа після `.github/prompts/` стояла лапка | помилка екранування в shell-скрипті, яким AI генерував файли | виправлено `sed`, перевірено `grep` |

## Прийняті рішення

| № | Рішення | Обґрунтування |
|---|---|---|
| 1 | Формат агента — GitHub Copilot + адаптери Claude Code | рекомендована структура методички; запуск в обох середовищах без дублювання інструкцій |
| 2 | Префікс команд `be-` (`/be-init`, `/be-check`, …) | `/init` уже зайнята вбудованою командою Copilot і Claude Code |
| 3 | Skills містять перевірені шаблони, `tools/apply-templates.mjs` застосовує їх ідемпотентно | відтворюваність develop → feature; повторний запуск не руйнує і не дублює файли |
| 4 | `tools/check.mjs` — детермінована перевірка з кодом виходу | однаковий результат для людини, агента і демонстрації зламаної перевірки |
| 5 | Виконуваний файл `hello` будується через Node.js SEA | нативний файл для кожної ОС, запускається без встановленого Node.js |
| 6 | `ci.yml` лише робить checkout, встановлює Node.js 24 і викликає `ci.sh`/`ci.bat` | вимога методички; ті самі скрипти працюють локально |
| 7 | Точні версії залежностей і `package-lock.json` у шаблоні | `npm ci` дає однаковий результат на всіх ОС |
| 8 | `.gitattributes`: LF усюди, CRLF для `*.bat` | cmd некоректно обробляє мітки й `goto` у batch-файлах з LF |
| 9 | Імпорти з розширенням `.ts` і `allowImportingTsExtensions` | каркас запускається відразу (`node src/main.ts`), тож крок `create-project` перевіряється окремо від складання |

## Докази перевірки

Результати перевірок додаються після запуску агента (гілка `feature/lab1-hello-ts`).
