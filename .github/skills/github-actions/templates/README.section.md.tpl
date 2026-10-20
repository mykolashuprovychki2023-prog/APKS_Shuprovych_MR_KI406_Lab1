## Неперервна інтеграція

[![CI](https://github.com/{{REPO_SLUG}}/actions/workflows/ci.yml/badge.svg)](https://github.com/{{REPO_SLUG}}/actions/workflows/ci.yml)

Workflow `.github/workflows/ci.yml` запускається на `push` і `pull_request` до `develop` та `master`
(а також вручну) і в одній job з matrix виконує `ci.sh` (Ubuntu, macOS) або `ci.bat` (Windows).
Виконуваний файл `hello` для кожної ОС і JUnit-звіт зберігаються як artifacts запуску.
