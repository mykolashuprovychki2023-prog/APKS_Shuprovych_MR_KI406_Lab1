// Packs build/hello.cjs into a single executable (Node.js SEA):
// build/hello.exe on Windows, build/hello on Linux and macOS.
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import postject from 'postject';

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const exe = isWindows ? 'build/hello.exe' : 'build/hello';
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

if (!existsSync('build/hello.cjs')) {
  console.error('[package] build/hello.cjs not found - run "npm run build" first.');
  process.exit(1);
}

// 1. SEA blob from sea-config.json. 2. Copy of the Node.js binary. 3. Blob injected into the copy.
run(process.execPath, ['--experimental-sea-config', 'sea-config.json']);
rmSync(exe, { force: true });
copyFileSync(process.execPath, exe);
if (!isWindows) chmodSync(exe, 0o755);
if (isMac) run('codesign', ['--remove-signature', exe]);
await postject.inject(exe, 'NODE_SEA_BLOB', readFileSync('build/sea-prep.blob'), {
  sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  machoSegmentName: isMac ? 'NODE_SEA' : undefined,
});
if (isMac) run('codesign', ['--sign', '-', exe]); // macOS runs only signed binaries

console.log(`[package] executable created: ${exe}`);
