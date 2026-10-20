#!/usr/bin/env node
// check.mjs - verification used by the `check` command of the build-engineer agent.
//
// Usage (from the repository root):
//   node tools/check.mjs [--agent-only] [--skip-build] [--only <group>]...
//   groups: agent, project, git, build, workflow
//
// The check does not modify project files. It writes only into build/ (check-report.md
// and the build artifacts of B1-B3) and runs `npm ci` into node_modules/ when the
// dependencies are missing; both directories are ignored by Git.
// Exit code: 0 - all checks passed, 1 - a check failed.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const ROOT = process.cwd();
const GROUPS = ['agent', 'project', 'git', 'build', 'workflow'];

// ---- command line -----------------------------------------------------------
const argv = process.argv.slice(2);
let agentOnly = false;
let skipBuild = false;
const only = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--agent-only') agentOnly = true;
  else if (argv[i] === '--skip-build') skipBuild = true;
  else if (argv[i] === '--only' && GROUPS.includes(argv[i + 1])) only.push(argv[++i]);
  else {
    console.error(`check: unknown argument "${argv[i]}". Groups: ${GROUPS.join(', ')}`);
    process.exit(2);
  }
}
const enabled = (group) => {
  if (only.length > 0) return only.includes(group);
  if (agentOnly) return group === 'agent' || group === 'git';
  return !(skipBuild && group === 'build');
};

// ---- helpers ----------------------------------------------------------------
const results = [];
const record = (id, title, ok, details = '') =>
  results.push({ id, title, status: ok ? 'OK' : 'FAIL', details });
const exists = (p) => existsSync(join(ROOT, p));
const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const tail = (text, n = 12) => text.trim().split('\n').slice(-n).join('\n');

function sh(command) {
  const r = spawnSync(command, { cwd: ROOT, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return fm;
}

function missingHeadings(text, required) {
  const headings = [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1].trim().toLowerCase());
  return required.filter((r) => !headings.some((h) => h.startsWith(r.toLowerCase())));
}

function section(text, heading) {
  const start = text.search(new RegExp(`^##\\s+${heading}`, 'm'));
  if (start < 0) return '';
  const rest = text.slice(start + 3);
  const next = rest.search(/^##\s+/m);
  return next < 0 ? rest : rest.slice(0, next);
}

// ---- A. agent ---------------------------------------------------------------
const MANIFEST = '.github/agents/build-engineer.agent.md';
const SKILLS = ['project-scaffold', 'build-and-test', 'github-actions'];
const COMMANDS = ['git-init', 'create-project', 'create-build', 'create-actions', 'check', 'init'];
const INIT_ORDER = ['git-init', 'create-project', 'create-build', 'create-actions', 'check'];

function checkAgent() {
  if (!exists(MANIFEST)) {
    record('A1', 'Manifest агента', false, `немає ${MANIFEST}`);
  } else {
    const text = read(MANIFEST);
    const fm = frontmatter(text);
    const problems = [];
    if (!fm) problems.push('немає YAML frontmatter');
    else {
      if (fm.name !== 'build-engineer') problems.push('name не дорівнює build-engineer');
      if (!fm.description) problems.push('немає description');
      if (!fm.tools) problems.push('немає tools');
    }
    const miss = missingHeadings(text, [
      'Роль',
      'Область відповідальності',
      'Правила роботи з файлами',
      'Заборонені дії',
      'Критерії успішного завершення',
    ]);
    if (miss.length) problems.push(`немає розділів: ${miss.join(', ')}`);
    record('A1', 'Manifest: роль, відповідальність, правила, заборони, критерії', !problems.length, problems.join('; '));
  }

  for (const [i, name] of SKILLS.entries()) {
    const file = `.github/skills/${name}/SKILL.md`;
    const id = `A2.${i + 1}`;
    if (!exists(file)) {
      record(id, `Skill ${name}`, false, `немає ${file}`);
      continue;
    }
    const text = read(file);
    const fm = frontmatter(text);
    const problems = [];
    if (!fm || fm.name !== name) problems.push('name у frontmatter не збігається з назвою каталогу');
    if (!fm || !fm.description || fm.description.length < 20) problems.push('немає змістовного description');
    const miss = missingHeadings(text, ['Коли застосовувати', 'Вхідні дані', 'Результат', 'Перевірка', 'Обробка помилок', 'Приклад']);
    if (miss.length) problems.push(`немає розділів: ${miss.join(', ')}`);
    const map = `.github/skills/${name}/templates/files.json`;
    if (!exists(map)) problems.push('немає templates/files.json');
    else {
      const lost = JSON.parse(read(map)).files.filter((f) => !exists(`.github/skills/${name}/templates/${f.from}`));
      if (lost.length) problems.push(`немає шаблонів: ${lost.map((f) => f.from).join(', ')}`);
    }
    record(id, `Skill ${name}: призначення, входи, виходи, перевірки, помилки, приклад`, !problems.length, problems.join('; '));
  }

  for (const [i, name] of COMMANDS.entries()) {
    const file = `.github/prompts/${name}.prompt.md`;
    const id = `A3.${i + 1}`;
    if (!exists(file)) {
      record(id, `Command ${name}`, false, `немає ${file}`);
      continue;
    }
    const text = read(file);
    const fm = frontmatter(text);
    const problems = [];
    if (!fm || fm.name !== `be-${name}`) problems.push(`name має бути be-${name}`);
    if (!fm || fm.agent !== 'build-engineer') problems.push('agent має бути build-engineer');
    if (!fm || !fm.description) problems.push('немає description');
    const miss = missingHeadings(text, ['Передумови', 'Дії', 'Очікувані файли', 'Перевірка', 'Повідомлення про помилку']);
    if (miss.length) problems.push(`немає розділів: ${miss.join(', ')}`);
    record(id, `Command ${name} (/be-${name}): передумови, дії, файли, перевірка, помилки`, !problems.length, problems.join('; '));
  }

  if (exists('.github/prompts/init.prompt.md')) {
    const actions = section(read('.github/prompts/init.prompt.md'), 'Дії');
    const positions = INIT_ORDER.map((c) => actions.indexOf(`${c}.prompt.md`));
    const ordered = positions.every((p, i) => p >= 0 && (i === 0 || p > positions[i - 1]));
    record('A4', `init викликає команди в порядку ${INIT_ORDER.join(' → ')}`, ordered,
      ordered ? '' : `позиції у розділі «Дії»: ${positions.join(', ')}`);
  } else {
    record('A4', 'init викликає команди в правильному порядку', false, 'немає init.prompt.md');
  }

  const docs = ['README.md', 'docs/architecture.md', 'docs/usage.md', 'docs/ai-log.md'].filter((p) => !exists(p));
  const problems = docs.length ? [`немає: ${docs.join(', ')}`] : [];
  if (exists('README.md')) {
    const readme = read('README.md');
    for (const word of ['Варіант', 'Груп', 'Студент']) if (!readme.includes(word)) problems.push(`README без «${word}»`);
  }
  if (exists('docs/ai-log.md')) {
    const miss = missingHeadings(read('docs/ai-log.md'), ['Журнал запитів', 'Помилки та виправлення', 'Прийняті рішення']);
    if (miss.length) problems.push(`журнал AI без розділів: ${miss.join(', ')}`);
  }
  record('A5', 'Документація: README, архітектура, інструкція, журнал AI', !problems.length, problems.join('; '));

  const tools = ['tools/apply-templates.mjs', 'tools/check.mjs'].filter((p) => !exists(p));
  record('A6', 'Інструменти агента (apply-templates, check)', !tools.length, tools.length ? `немає: ${tools.join(', ')}` : '');
}

// ---- P. project files -----------------------------------------------------------
const PROJECT_FILES = [
  'package.json', 'package-lock.json', 'tsconfig.json', 'vitest.config.ts', 'sea-config.json',
  'src/main.ts', 'src/greeting.ts', 'src/math.ts', 'tests/basic.test.ts',
  'scripts/build-sea.mjs', 'scripts/ci-summary.mjs', 'ci.sh', 'ci.bat', '.gitignore', '.gitattributes',
];

function checkProject() {
  const missing = PROJECT_FILES.filter((p) => !exists(p));
  record('P1', 'Структура проєкту (src, tests, конфігурації, ci.sh, ci.bat)', !missing.length,
    missing.length ? `немає: ${missing.join(', ')}` : '');

  if (exists('package.json')) {
    const pkg = JSON.parse(read('package.json'));
    const scripts = ['build', 'test', 'package', 'start'].filter((s) => !pkg.scripts?.[s]);
    const deps = ['typescript', 'vitest', 'esbuild', 'postject', 'yaml'].filter((d) => !pkg.devDependencies?.[d]);
    const problems = [];
    if (scripts.length) problems.push(`немає npm scripts: ${scripts.join(', ')}`);
    if (deps.length) problems.push(`немає devDependencies: ${deps.join(', ')}`);
    record('P2', 'npm scripts (build, test, package, start) і devDependencies', !problems.length, problems.join('; '));
  } else {
    record('P2', 'npm scripts і devDependencies', false, 'немає package.json');
  }

  const test = exists('tests/basic.test.ts') ? read('tests/basic.test.ts') : '';
  record('P3', 'Юніт-тест BasicAddition існує', /BasicAddition/.test(test) && !/\.(skip|todo)\(/.test(test),
    test ? 'тест відсутній або вимкнений (.skip/.todo)' : 'немає tests/basic.test.ts');

  const readme = exists('README.md') ? read('README.md') : '';
  const blocks = ['project-scaffold', 'build-and-test', 'github-actions'].filter((b) => !readme.includes(`<!-- ${b}:begin -->`));
  record('P4', 'README містить розділи запуску проєкту, складання і CI', !blocks.length,
    blocks.length ? `немає блоків: ${blocks.join(', ')}` : '');
}

// ---- G. git hygiene -------------------------------------------------------------
const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9]{30,}/, /gho_[A-Za-z0-9]{30,}/, /github_pat_[A-Za-z0-9_]{40,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /AKIA[0-9A-Z]{16}/, /xox[baprs]-[A-Za-z0-9-]{10,}/,
];

function checkGit() {
  const inside = sh('git rev-parse --is-inside-work-tree');
  record('G1', 'Каталог є Git-репозиторієм', inside.code === 0 && inside.out.trim() === 'true', tail(inside.out, 2));
  if (inside.code !== 0) return;

  const ignored = sh('git check-ignore build/probe node_modules/probe');
  record('G2', 'build/ і node_modules/ ігноруються Git', ignored.code === 0 && ignored.out.trim().split('\n').length === 2,
    ignored.code === 0 ? '' : 'додайте build/ і node_modules/ у .gitignore (команда git-init)');

  const tracked = sh('git ls-files build node_modules');
  record('G3', 'У Git немає build-каталогів і залежностей', tracked.code === 0 && tracked.out.trim() === '',
    tracked.out.trim() ? `відстежуються: ${tail(tracked.out, 5)}` : '');

  // tracked files plus new (untracked, not ignored) files: a first `init` creates
  // the whole project as untracked files, and they must be scanned before the commit
  const files = sh('git ls-files --cached --others --exclude-standard').out
    .split('\n').map((s) => s.trim()).filter(Boolean);
  const leaks = [];
  for (const file of files) {
    if (/(^|\/)\.env(\.|$)/.test(file)) leaks.push(`${file} (.env)`);
    const path = join(ROOT, file);
    if (!existsSync(path) || statSync(path).size > 2 * 1024 * 1024) continue;
    const text = readFileSync(path, 'utf8');
    if (SECRET_PATTERNS.some((re) => re.test(text))) leaks.push(file);
  }
  record('G4', 'Секретів (токени, ключі, .env) у файлах репозиторію немає', !leaks.length, leaks.join(', '));
}

// ---- B. build and tests -----------------------------------------------------------
function checkBuild() {
  if (!exists('package.json')) {
    record('B0', 'Складання і тести', false, 'немає package.json - спочатку create-build');
    return;
  }
  if (!exists('node_modules')) {
    const ci = sh('npm ci --no-audit --no-fund');
    record('B0', 'Встановлення залежностей (npm ci)', ci.code === 0, ci.code === 0 ? '' : tail(ci.out));
    if (ci.code !== 0) return;
  }
  const build = sh('npm run build');
  record('B1', 'Складання: npm run build (tsc + esbuild)', build.code === 0 && exists('build/hello.cjs'),
    build.code === 0 ? '' : tail(build.out));

  const test = sh('npm test');
  const junit = exists('build/test-results/junit.xml') ? read('build/test-results/junit.xml') : '';
  const basic = /<testcase[^>]*name="[^"]*BasicAddition"/.test(junit);
  const failures = junit.match(/<testsuites[^>]*failures="(\d+)"/);
  const okTests = test.code === 0 && basic && failures && failures[1] === '0';
  record('B2', 'Тести: npm test (Vitest), BasicAddition пройдено', okTests,
    okTests ? '' : tail(test.out) || 'JUnit-звіт без BasicAddition');

  const pack = sh('npm run package');
  const exe = process.platform === 'win32' ? 'build/hello.exe' : 'build/hello';
  record('B3', `Виконуваний файл ${exe} створено`, pack.code === 0 && exists(exe), pack.code === 0 ? '' : tail(pack.out));

  if (exists(exe)) {
    const run = spawnSync(join(ROOT, exe), { encoding: 'utf8' });
    const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
    record('B4', `Запуск ${exe} друкує "Hello, World!"`, run.status === 0 && out.includes('Hello, World!'), tail(out, 3));
  }
}

// ---- W. workflow ------------------------------------------------------------------
const OSES = ['ubuntu-latest', 'windows-latest', 'macos-latest'];

function checkWorkflow() {
  const file = '.github/workflows/ci.yml';
  if (!exists(file)) {
    record('W1', 'Workflow .github/workflows/ci.yml', false, 'файл відсутній - виконайте create-actions');
    return;
  }
  let YAML;
  try {
    YAML = createRequire(join(ROOT, 'package.json'))('yaml');
  } catch {
    record('W1', 'YAML workflow коректний', false, 'немає пакета yaml - виконайте npm ci');
    return;
  }
  let wf;
  try {
    wf = YAML.parse(read(file));
    record('W1', 'YAML workflow синтаксично коректний', true);
  } catch (error) {
    record('W1', 'YAML workflow синтаксично коректний', false, String(error.message).split('\n')[0]);
    return;
  }

  const on = wf?.on ?? {};
  const branches = (event) => (Array.isArray(on?.[event]?.branches) ? on[event].branches : []);
  const triggersOk = ['push', 'pull_request'].every((e) => ['develop', 'master'].every((b) => branches(e).includes(b)));
  record('W2', 'Тригери: push і pull_request до develop та master', triggersOk,
    triggersOk ? '' : `push: [${branches('push')}], pull_request: [${branches('pull_request')}]`);

  const jobs = Object.values(wf?.jobs ?? {});
  const job = jobs[0] ?? {};
  const os = job?.strategy?.matrix?.os ?? [];
  const osOk = jobs.length === 1 && OSES.every((o) => os.includes(o)) && os.length === OSES.length
    && String(job['runs-on']).includes('matrix.os');
  record('W3', 'Одна job з matrix: ubuntu-latest, windows-latest, macos-latest', osOk,
    osOk ? '' : `jobs: ${jobs.length}, matrix.os: [${os}]`);

  const steps = job?.steps ?? [];
  const runs = steps.filter((s) => s.run).map((s) => String(s.run).trim());
  const allowed = /^(bash \.\/ci\.sh|\.\/ci\.sh|\.\\ci\.bat|ci\.bat)$/;
  const extra = runs.filter((r) => !allowed.test(r));
  const usesCheckout = steps.some((s) => String(s.uses ?? '').startsWith('actions/checkout@'));
  const scriptsOk = usesCheckout && !extra.length && runs.some((r) => r.includes('ci.sh')) && runs.some((r) => r.includes('ci.bat'));
  record('W4', 'Кроки: checkout і лише виклики ci.sh / ci.bat', scriptsOk,
    scriptsOk ? '' : `checkout: ${usesCheckout}; зайві run: ${extra.join(' | ') || '-'}`);

  const text = read(file);
  const artifacts = steps.some((s) => String(s.uses ?? '').startsWith('actions/upload-artifact@'));
  const noSecrets = !/\$\{\{\s*secrets\./.test(text);
  record('W5', 'Результат job зберігається (artifact), секретів у workflow немає', artifacts && noSecrets,
    `artifact: ${artifacts}; secrets: ${!noSecrets}`);
}

// ---- run ----------------------------------------------------------------------
const plan = [
  ['agent', 'Агент (manifest, skills, commands)', checkAgent],
  ['project', 'Файли проєкту', checkProject],
  ['git', 'Git', checkGit],
  ['build', 'Складання і тести', checkBuild],
  ['workflow', 'GitHub Actions workflow', checkWorkflow],
];
console.log(`check: ${ROOT}`);
for (const [group, title, fn] of plan) {
  if (!enabled(group)) continue;
  console.log(`\n== ${title}`);
  const before = results.length;
  fn();
  for (const r of results.slice(before)) {
    const mark = r.status === 'OK' ? '[ OK ]' : '[FAIL]';
    console.log(`${mark} ${r.id.padEnd(5)} ${r.title}`);
    if (r.status !== 'OK' && r.details) console.log(r.details.replace(/^/gm, '         '));
  }
}

const failed = results.filter((r) => r.status === 'FAIL');
const summary = `${results.length - failed.length}/${results.length} перевірок пройдено` +
  (failed.length ? `, помилок: ${failed.length} (${failed.map((r) => r.id).join(', ')})` : '');
console.log(`\ncheck: ${failed.length ? 'FAILED' : 'OK'} - ${summary}`);

try {
  mkdirSync(join(ROOT, 'build'), { recursive: true });
  const rows = results.map((r) => `| ${r.id} | ${r.status} | ${r.title} | ${r.details.replace(/\n/g, ' ').replace(/\|/g, '/')} |`);
  writeFileSync(join(ROOT, 'build', 'check-report.md'),
    `# Звіт команди check\n\n| ID | Статус | Перевірка | Деталі |\n|---|---|---|---|\n${rows.join('\n')}\n\n**${summary}**\n`);
} catch {
  // The report file is optional; console output is the primary result.
}
process.exit(failed.length ? 1 : 0);
