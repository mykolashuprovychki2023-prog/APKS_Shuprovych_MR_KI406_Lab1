#!/usr/bin/env node
// apply-templates.mjs - idempotent template applier used by the skills of the
// build-engineer agent (.github/skills/<skill>/templates/files.json).
//
// Usage (run from the repository root):
//   node tools/apply-templates.mjs <skill> [--var KEY=VALUE]... [--only <path>]... [--dry-run]
//
// Modes of a template entry in files.json:
//   create      - create the file if it is missing; an identical file is UNCHANGED;
//                 a different file is a CONFLICT and is never overwritten
//   merge-lines - append the template lines that are missing (.gitignore, .gitattributes)
//   block       - insert a marked block <!-- name:begin --> ... <!-- name:end --> (README.md)
//
// Exit codes: 0 - success, 1 - conflict or invalid input, 2 - usage error.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const USAGE =
  'Usage: node tools/apply-templates.mjs <skill> [--var KEY=VALUE]... [--only <path>]... [--dry-run]';

function fail(message, code = 1) {
  console.error(`[apply-templates] ERROR: ${message}`);
  process.exit(code);
}

const toPosix = (p) => p.replace(/\\/g, '/').replace(/^\.\//, '');
const lf = (text) => text.replace(/\r\n/g, '\n');

// ---- command line -----------------------------------------------------------
const args = process.argv.slice(2);
const skill = args.shift();
if (!skill || skill.startsWith('-')) fail(USAGE, 2);

const cliVars = {};
const only = [];
let dryRun = false;
while (args.length > 0) {
  const arg = args.shift();
  if (arg === '--dry-run') {
    dryRun = true;
  } else if (arg === '--var') {
    const pair = args.shift() ?? '';
    const eq = pair.indexOf('=');
    if (eq < 1) fail(`--var expects KEY=VALUE, got "${pair}"`, 2);
    cliVars[pair.slice(0, eq)] = pair.slice(eq + 1);
  } else if (arg === '--only') {
    only.push(toPosix(args.shift() ?? ''));
  } else {
    fail(`unknown argument "${arg}"\n${USAGE}`, 2);
  }
}

if (!existsSync(join(ROOT, '.github', 'skills'))) {
  fail('run this script from the repository root (.github/skills not found)', 2);
}
const templatesDir = join(ROOT, '.github', 'skills', skill, 'templates');
const manifestPath = join(templatesDir, 'files.json');
if (!existsSync(manifestPath)) {
  fail(`skill "${skill}" has no ${toPosix(relative(ROOT, manifestPath))}`, 2);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

// ---- variables --------------------------------------------------------------
const values = {};
for (const [name, spec] of Object.entries(manifest.variables ?? {})) {
  const value = cliVars[name] ?? spec.default;
  if (value === undefined || value === '') fail(`variable ${name} is required`);
  if (spec.allowed && !spec.allowed.includes(value)) {
    fail(`${name}=${value} is not supported by skill "${skill}" (allowed: ${spec.allowed.join(', ')})`);
  }
  if (spec.pattern && !new RegExp(spec.pattern).test(value)) {
    fail(`${name}=${value} does not match ${spec.pattern}`);
  }
  values[name] = value;
}
for (const name of Object.keys(cliVars)) {
  if (!(name in values)) fail(`unknown variable ${name} for skill "${skill}"`);
}

const render = (text) => text.replace(/\{\{([A-Z_]+)\}\}/g, (m, n) => values[n] ?? m);
const eolFor = (file) => (/\.(bat|cmd)$/i.test(file) ? '\r\n' : '\n');

function safeTarget(to) {
  if (!to || isAbsolute(to)) fail(`invalid target path "${to}"`);
  const abs = resolve(ROOT, to);
  const rel = relative(ROOT, abs);
  if (rel.startsWith('..') || isAbsolute(rel)) fail(`target "${to}" is outside the repository`);
  return abs;
}

function write(target, text, entry) {
  if (dryRun) return;
  mkdirSync(dirname(target), { recursive: true });
  const body = lf(text);
  writeFileSync(target, eolFor(target) === '\r\n' ? body.replace(/\n/g, '\r\n') : body);
  if (entry.executable && process.platform !== 'win32') chmodSync(target, 0o755);
}

// ---- modes ------------------------------------------------------------------
function applyCreate(target, content, entry) {
  if (!existsSync(target)) {
    write(target, content, entry);
    return 'CREATED';
  }
  return lf(readFileSync(target, 'utf8')) === lf(content) ? 'UNCHANGED' : 'CONFLICT';
}

function applyMergeLines(target, content, entry) {
  if (!existsSync(target)) {
    write(target, content, entry);
    return 'CREATED';
  }
  const current = lf(readFileSync(target, 'utf8'));
  const present = new Set(current.split('\n').map((line) => line.trim()));
  const missing = lf(content)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !present.has(line));
  if (missing.length === 0) return 'UNCHANGED';
  const separator = current === '' || current.endsWith('\n') ? '' : '\n';
  write(target, `${current}${separator}# added by ${skill}\n${missing.join('\n')}\n`, entry);
  return 'MERGED';
}

function applyBlock(target, content, entry) {
  const name = entry.block ?? skill;
  const begin = `<!-- ${name}:begin -->`;
  const end = `<!-- ${name}:end -->`;
  const block = `${begin}\n${lf(content).trim()}\n${end}`;
  if (!existsSync(target)) {
    write(target, `${block}\n`, entry);
    return 'CREATED';
  }
  const current = lf(readFileSync(target, 'utf8'));
  const from = current.indexOf(begin);
  const to = current.indexOf(end);
  if (from >= 0 && to > from) {
    return current.slice(from, to + end.length) === block ? 'UNCHANGED' : 'CONFLICT';
  }
  const separator = current.endsWith('\n') ? '\n' : '\n\n';
  write(target, `${current}${separator}${block}\n`, entry);
  return 'MERGED';
}

const MODES = { create: applyCreate, 'merge-lines': applyMergeLines, block: applyBlock };

// ---- main -------------------------------------------------------------------
const shownVars = Object.entries(values)
  .map(([k, v]) => `${k}=${v}`)
  .join(', ');
console.log(`[apply-templates] skill: ${skill}${shownVars ? ` (${shownVars})` : ''}${dryRun ? ' [dry run]' : ''}`);

const counters = { CREATED: 0, MERGED: 0, UNCHANGED: 0, CONFLICT: 0 };
let matched = 0;
for (const entry of manifest.files) {
  if (only.length > 0 && !only.includes(toPosix(entry.to))) continue;
  matched += 1;
  const apply = MODES[entry.mode ?? 'create'];
  if (!apply) fail(`unknown mode "${entry.mode}" for ${entry.to}`);
  const source = join(templatesDir, entry.from);
  if (!existsSync(source)) fail(`template ${entry.from} is missing`);
  const status = apply(safeTarget(entry.to), render(readFileSync(source, 'utf8')), entry);
  counters[status] += 1;
  console.log(`  ${status.padEnd(9)} ${entry.to}`);
}
if (only.length > 0 && matched === 0) fail(`--only matched no template of skill "${skill}"`);

console.log(
  `[apply-templates] created ${counters.CREATED}, merged ${counters.MERGED}, ` +
    `unchanged ${counters.UNCHANGED}, conflicts ${counters.CONFLICT}`,
);
if (counters.CONFLICT > 0) {
  console.error(
    '[apply-templates] CONFLICT: an existing file differs from the template and was NOT changed.\n' +
      '  Compare it with the template (git diff --no-index <template> <file>) and decide manually.',
  );
  process.exit(1);
}
