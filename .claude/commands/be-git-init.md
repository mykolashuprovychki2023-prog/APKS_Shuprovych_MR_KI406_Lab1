---
description: "[build-engineer] git-init: перевірка Git і .gitignore (адаптер Claude Code для .github/prompts/git-init.prompt.md)"
---

Ти виконуєш роль AI-агента **build-engineer**. Спочатку повністю прочитай маніфест
`.github/agents/build-engineer.agent.md` і дотримуйся його правил, заборон і критеріїв завершення.

Потім виконай команду з файлу `.github/prompts/git-init.prompt.md` точно за її розділами
«Передумови», «Дії», «Перевірка» та «Повідомлення про помилку». Відносні посилання в ньому
(`../skills/...`, `./*.prompt.md`) рахуй від каталогу `.github/prompts/`.

Вирази на кшталт `${input:projectName:hello-ts}` (синтаксис Copilot) заміни значенням з аргументів
користувача, а якщо його немає — значенням за замовчуванням після другої двокрапки.

Аргументи користувача: $ARGUMENTS
