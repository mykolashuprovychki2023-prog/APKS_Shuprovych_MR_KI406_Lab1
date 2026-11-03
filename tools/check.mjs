#!/usr/bin/env node
// check.mjs - verification for the `check` command of the build-engineer agent.
// Usage (from the repository root): node tools/check.mjs [--agent-only] [--only <group>]...
// Groups: agent, project, git, build, workflow. Project files are not modified: only the
// ignored build/ and node_modules/ are written. Exit code: 0 - all checks passed, 1 - a check failed.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const ROOT = process.cwd();
const GROUPS = ['agent', 'project', 'git', 'build', 'workflow'];
const args = process.argv.slice(2);
const only = args.filter((a, i) => args[i - 1] === '--only');
const unknown = args.filter((a, i) => !['--agent-only', '--only'].includes(a) && args[i - 1] !== '--only');
if (unknown.length || only.some((g) => !GROUPS.includes(g))) {
  console.error(`Usage: node tools/check.mjs [--agent-only] [--only ${GROUPS.join('|')}]`);
  process.exit(2);
}
const enabled = (group) =>
  only.length ? only.includes(group) : !args.includes('--agent-only') || ['agent', 'git'].includes(group);

const results = [];
const check = (id, title, ok, details = '') => results.push({ id, title, ok: Boolean(ok), details });
const exists = (p) => existsSync(join(ROOT, p));
const read = (p) => (exists(p) ? readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n') : '');
const tail = (text, n = 8) => String(text).trim().split('\n').slice(-n).join('\n');
const sh = (cmd) => {
  const r = spawnSync(cmd, { cwd: ROOT, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};
// required Markdown headings that are missing in a file
const missing = (file, headings) => {
  if (!exists(file)) return ['файл відсутній'];
  const found = [...read(file).matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1].toLowerCase());
  return headings.filter((h) => !found.some((f) => f.startsWith(h.toLowerCase())));
};

// ---- agent: manifest, skills, commands, init order, documentation ----------------
const SKILLS = ['project-scaffold', 'build-and-test', 'github-actions'];
const COMMANDS = ['git-init', 'create-project', 'create-build', 'create-actions', 'check', 'init'];

function agent() {
  const manifest = missing('.github/agents/build-engineer.agent.md',
    ['Роль', 'Область відповідальності', 'Правила роботи з файлами', 'Заборонені дії', 'Критерії успішного завершення']);
  check('A1', 'Manifest: роль, відповідальність, правила, заборони, критерії', !manifest.length, manifest.join(', '));

  const skills = SKILLS.map((s) => [s, missing(`.github/skills/${s}/SKILL.md`,
    ['Коли застосовувати', 'Вхідні дані', 'Результат', 'Перевірка', 'Обробка помилок', 'Приклад'])])
    .filter(([, m]) => m.length);
  check('A2', '3 skills: призначення, входи, результат, перевірка, помилки, приклад', !skills.length,
    skills.map(([s, m]) => `${s}: ${m.join(', ')}`).join('\n'));

  const commands = COMMANDS.map((c) => [c, missing(`.github/prompts/${c}.prompt.md`,
    ['Передумови', 'Дії', 'Очікувані файли', 'Перевірка', 'Повідомлення про помилку'])])
    .filter(([, m]) => m.length);
  check('A3', '6 commands: передумови, дії, очікувані файли, перевірка, повідомлення про помилку', !commands.length,
    commands.map(([c, m]) => `${c}: ${m.join(', ')}`).join('\n'));

  const actions = read('.github/prompts/init.prompt.md').split(/^## /m).find((s) => s.startsWith('Дії')) ?? '';
  const order = COMMANDS.slice(0, 5).map((c) => actions.indexOf(`${c}.prompt.md`));
  check('A4', 'init: git-init → create-project → create-build → create-actions → check',
    order.every((p, i) => p >= 0 && (i === 0 || p > order[i - 1])), `позиції в розділі «Дії»: ${order}`);

  const readme = read('README.md');
  const docs = ['Студент', 'Група', 'Варіант', '/be-init'].filter((w) => !readme.includes(w)).map((w) => `README без «${w}»`);
  for (const f of ['docs/architecture.md', 'docs/usage.md']) if (!exists(f)) docs.push(`немає ${f}`);
  const log = missing('docs/ai-log.md', ['Журнал запитів', 'Помилки та виправлення', 'Прийняті рішення']);
  if (log.length) docs.push(`docs/ai-log.md: ${log.join(', ')}`);
  check('A5', 'Документація: README, architecture.md, usage.md, журнал AI', !docs.length, docs.join('\n'));
}

// ---- project: files, npm scripts, test, CI scripts ---------------------------------
const FILES = ['src/main.ts', 'src/greeting.ts', 'src/math.ts', 'tests/basic.test.ts', 'package.json', 'package-lock.json',
  'tsconfig.json', 'vitest.config.ts', 'sea-config.json', 'scripts/build-sea.mjs', 'ci.sh', 'ci.bat', '.github/workflows/ci.yml'];

function project() {
  const absent = FILES.filter((f) => !exists(f));
  check('P1', 'Файли проєкту: src, tests, конфігурації, ci.sh, ci.bat, ci.yml', !absent.length, `немає: ${absent.join(', ')}`);

  let pkg = {};
  try { pkg = JSON.parse(read('package.json')); } catch { /* reported below */ }
  const scripts = ['build', 'test', 'package'].filter((s) => !pkg.scripts?.[s]);
  const deps = ['typescript', 'esbuild', 'vitest', 'postject', 'yaml'].filter((d) => !pkg.devDependencies?.[d]);
  check('P2', 'npm scripts build, test, package і devDependencies', !scripts.length && !deps.length,
    `немає scripts: ${scripts.join(', ') || '-'}; devDependencies: ${deps.join(', ') || '-'}`);

  // any way to disable or narrow the tests: .skip/.skipIf/.runIf/.todo/.fails/.only, xit/xdescribe
  const test = read('tests/basic.test.ts');
  const off = test.match(/\b(?:it|test|describe)\s*\.\s*(?:skip|skipIf|runIf|todo|fails|only)\b|\bx(?:it|describe)\s*\(/);
  check('P3', 'Тест BasicAddition є і не вимкнений', /BasicAddition/.test(test) && !off, off ? off[0] : 'тесту BasicAddition немає');

  const scriptsText = { 'ci.sh': read('ci.sh'), 'ci.bat': read('ci.bat') };
  const problems = Object.entries(scriptsText).flatMap(([file, text]) => [
    ...['npm ci', 'npm run build', 'npm test', 'npm run package'].filter((s) => !text.includes(s)).map((s) => `${file}: немає ${s}`),
    ...(/\|\|\s*(?:true|exit\s+(?:\/b\s+)?0)\b|set \+e/.test(text) ? [`${file}: помилку приховано`] : []),
  ]);
  check('P4', 'ci.sh і ci.bat: npm ci, build, test, package без приховування помилок', !problems.length, problems.join('\n'));
}

// ---- git: repository, ignored build output, no secrets -----------------------------
const SECRETS = /gh[pousr]_[A-Za-z0-9]{30,}|github_pat_\w{40,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}/;

function git() {
  const inside = sh('git rev-parse --is-inside-work-tree').out.trim();
  check('G1', 'Каталог є Git-репозиторієм', inside === 'true', inside);
  if (inside !== 'true') return;

  const ignored = sh('git check-ignore build/probe node_modules/probe').out.trim().split('\n').filter(Boolean);
  const tracked = sh('git ls-files build node_modules').out.trim();
  check('G2', 'build/ і node_modules/ ігноруються й не відстежуються Git', ignored.length === 2 && !tracked,
    tracked ? `відстежуються: ${tail(tracked, 3)}` : 'додайте build/ і node_modules/ у .gitignore (git-init)');

  // tracked and new files: the first init creates the whole project as untracked files
  const leaks = sh('git ls-files --cached --others --exclude-standard').out.split('\n').map((f) => f.trim())
    .filter((f) => f && (/(^|\/)\.env(\.|$)|\.(pem|key)$/.test(f)
      || (exists(f) && statSync(join(ROOT, f)).size < 2 ** 21 && SECRETS.test(read(f)))));
  check('G3', 'Секретів (токени, ключі, .env) у репозиторії немає', !leaks.length, leaks.join(', '));
}

// ---- build: build, tests, executable ------------------------------------------------
function build() {
  if (!exists('package.json')) return check('B1', 'Складання', false, 'немає package.json - виконайте create-build');
  if (!exists('node_modules')) {
    const ci = sh('npm ci --no-audit --no-fund');
    check('B0', 'Залежності: npm ci', ci.code === 0, tail(ci.out));
    if (ci.code !== 0) return;
  }
  const b = sh('npm run build');
  check('B1', 'Складання: npm run build (tsc + esbuild)', b.code === 0 && exists('build/hello.cjs'), tail(b.out));

  // BasicAddition must really run and pass; a skipped test would also give exit code 0
  const t = sh('npm test');
  const junit = read('build/test-results/junit.xml');
  const basic = junit.match(/<testcase[^>]*name="[^"]*BasicAddition"[^>]*?(?:\/>|>([\s\S]*?)<\/testcase>)/);
  const passed = t.code === 0 && basic && !/<(skipped|failure|error)\b/.test(basic[1] ?? '') && !/<skipped\b/.test(junit);
  const reason = t.out.split('\n').map((l) => l.trim()).filter((l) => /^(FAIL\s|AssertionError|Error:)/.test(l));
  check('B2', 'Тести: npm test, BasicAddition виконано і пройдено', passed, reason.slice(0, 3).join('\n') || tail(t.out));

  const exe = process.platform === 'win32' ? 'build/hello.exe' : 'build/hello';
  const p = sh('npm run package');
  check('B3', `Виконуваний файл ${exe}`, p.code === 0 && exists(exe), tail(p.out));
  const run = spawnSync(join(ROOT, exe), { encoding: 'utf8' });
  check('B4', `${exe} друкує "Hello, World!"`, run.status === 0 && String(run.stdout).includes('Hello, World!'),
    `${run.stdout ?? ''}${run.stderr ?? ''}${run.error ?? ''}`);
}

// ---- workflow: YAML, triggers, matrix, steps, artifacts ------------------------------
function workflow() {
  const file = '.github/workflows/ci.yml';
  if (!exists(file)) return check('W1', 'Workflow .github/workflows/ci.yml', false, 'файлу немає - виконайте create-actions');
  let wf;
  try {
    wf = createRequire(join(ROOT, 'package.json'))('yaml').parse(read(file));
  } catch (error) {
    return check('W1', 'YAML workflow коректний', false, String(error.message).split('\n')[0]);
  }
  check('W1', 'YAML workflow коректний', true);

  const branches = (event) => wf?.on?.[event]?.branches ?? [];
  check('W2', 'Тригери: push і pull_request до develop і master',
    ['push', 'pull_request'].every((e) => ['develop', 'master'].every((b) => branches(e).includes(b))),
    `push: [${branches('push')}], pull_request: [${branches('pull_request')}]`);

  const jobs = Object.values(wf?.jobs ?? {});
  const job = jobs[0] ?? {};
  const os = job.strategy?.matrix?.os ?? [];
  check('W3', 'Одна job з matrix: ubuntu-latest, windows-latest, macos-latest',
    jobs.length === 1 && os.length === 3 && ['ubuntu-latest', 'windows-latest', 'macos-latest'].every((o) => os.includes(o))
      && String(job['runs-on']).includes('matrix.os'), `jobs: ${jobs.length}, matrix.os: [${os}]`);

  // only the two CI scripts, each with its fixed `if`; nothing may hide a failure
  const steps = job.steps ?? [];
  const fixedIf = { 'bash ./ci.sh': "runner.os != 'Windows'", '.\\ci.bat': "runner.os == 'Windows'" };
  const runs = steps.filter((s) => s.run).map((s) => [String(s.run).trim(), String(s.if ?? '').trim()]);
  const wrong = runs.filter(([run, cond]) => fixedIf[run] !== cond).map(([run, cond]) => `${run} (if: ${cond || '-'})`);
  const checkout = steps.some((s) => String(s.uses ?? '').startsWith('actions/checkout@'));
  const soft = /continue-on-error/.test(read(file)) || job.if !== undefined;
  check('W4', 'Кроки: checkout і лише ci.sh / ci.bat без обходу помилок', checkout && runs.length === 2 && !wrong.length && !soft,
    [`checkout: ${checkout}`, ...wrong, soft ? 'continue-on-error або if на рівні job' : ''].filter(Boolean).join('; '));

  const artifact = steps.some((s) => String(s.uses ?? '').startsWith('actions/upload-artifact@'));
  const secrets = /\$\{\{\s*secrets\./.test(read(file));
  check('W5', 'Результат job зберігається (artifact), секретів немає', artifact && !secrets,
    `artifact: ${artifact}; secrets: ${secrets}`);
}

// ---- run ---------------------------------------------------------------------------
const TITLES = { agent: 'Агент', project: 'Файли проєкту', git: 'Git', build: 'Складання і тести', workflow: 'GitHub Actions' };
const RUN = { agent, project, git, build, workflow };
for (const group of GROUPS.filter(enabled)) {
  console.log(`\n== ${TITLES[group]}`);
  const start = results.length;
  RUN[group]();
  for (const r of results.slice(start)) {
    console.log(`${r.ok ? '[ OK ]' : '[FAIL]'} ${r.id.padEnd(3)} ${r.title}`);
    if (!r.ok && r.details) console.log(String(r.details).replace(/^/gm, '       '));
  }
}
const failed = results.filter((r) => !r.ok);
console.log(`\ncheck: ${failed.length ? 'FAILED' : 'OK'} - ${results.length - failed.length}/${results.length} перевірок пройдено`
  + (failed.length ? `, помилок: ${failed.length} (${failed.map((r) => r.id).join(', ')})` : ''));
process.exit(failed.length ? 1 : 0);
