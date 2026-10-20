// Prints a short build summary (OS, Node.js, tests, executable) and appends it
// to $GITHUB_STEP_SUMMARY when running inside GitHub Actions.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import os from 'node:os';

const exe = process.platform === 'win32' ? 'build/hello.exe' : 'build/hello';
const junitPath = 'build/test-results/junit.xml';
const junit = existsSync(junitPath) ? readFileSync(junitPath, 'utf8') : '';

const totals = junit.match(/<testsuites[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*errors="(\d+)"/);
const tests = totals
  ? `${totals[1]} tests, ${totals[2]} failures, ${totals[3]} errors`
  : 'JUnit report not found';
const cases = [...junit.matchAll(/<testcase[^>]*name="([^"]+)"/g)]
  .map((m) => m[1].replace(/&gt;/g, '>'))
  .join(', ');

const exeExists = existsSync(exe);
const size = exeExists ? `${(statSync(exe).size / 1048576).toFixed(1)} MiB` : 'missing';
const output = exeExists ? execFileSync(exe, { encoding: 'utf8' }).trim() : '';

const text = [
  `### hello-ts - ${os.type()} ${os.arch()}`,
  '',
  '| Item | Value |',
  '|---|---|',
  `| Node.js | ${process.version} |`,
  `| Unit tests | ${tests} |`,
  `| Test cases | ${cases || '-'} |`,
  `| Executable | \`${exe}\` (${size}) |`,
  '',
  '```text',
  output,
  '```',
  '',
].join('\n');

console.log(text);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
}
