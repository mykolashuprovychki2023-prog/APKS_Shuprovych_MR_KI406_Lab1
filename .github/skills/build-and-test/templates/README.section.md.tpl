## Складання і тестування

| Команда | Що робить |
|---|---|
| `npm ci` | встановлює залежності строго за `package-lock.json` |
| `npm run build` | перевірка типів (`tsc --noEmit`) і бандл `build/hello.cjs` (esbuild) |
| `npm test` | юніт-тести Vitest (`HelloTest > BasicAddition`), JUnit-звіт у `build/test-results/` |
| `npm run package` | виконуваний файл `build/hello` або `build/hello.exe` (Node.js SEA) |
| `npm start` | запуск зібраного `build/hello.cjs` |

Повний цикл однією командою, так само як у CI:

```bash
bash ci.sh     # Linux, macOS, Git Bash
.\ci.bat       # Windows (cmd, PowerShell)
```
