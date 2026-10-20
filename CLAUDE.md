# Інструкції для Claude Code

У цьому репозиторії є AI-агент **build-engineer** у форматі GitHub Copilot:

- маніфест: `.github/agents/build-engineer.agent.md`;
- skills: `.github/skills/*/SKILL.md` (з шаблонами в `templates/`);
- команди: `.github/prompts/*.prompt.md`; у Claude Code вони доступні як `/be-*` (адаптери в `.claude/commands/`).

Виконуючи будь-яку команду `/be-*`, дотримуйся правил, заборон і критеріїв завершення з маніфесту агента.
Перевірка без змін у проєкті: `node tools/check.mjs` (до запуску `init` — `node tools/check.mjs --agent-only`).
