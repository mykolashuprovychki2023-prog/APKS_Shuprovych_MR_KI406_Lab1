// Packages build/hello.cjs into a native single executable (Node.js SEA):
//   Windows -> build/hello.exe, Linux/macOS -> build/hello
// Steps: SEA blob -> copy of the node binary -> inject the blob (postject)
// -> re-sign on macOS. Fails with a clear message if something is missing.
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import postject from 'postject';

const BUILD_DIR = 'build';
const BUNDLE = join(BUILD_DIR, 'hello.cjs');
const BLOB = join(BUILD_DIR, 'sea-prep.blob');
const SEA_FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const exe = join(BUILD_DIR, isWindows ? 'hello.exe' : 'hello');

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: 'inherit' });
}

// Windows: removes the Authenticode signature of the copied node.exe
// (same as `signtool remove /s`) - it would become invalid after injection.
function stripWindowsSignature(file) {
  const buf = readFileSync(file);
  const pe = buf.readUInt32LE(0x3c);
  if (buf.toString('latin1', pe, pe + 4) !== 'PE\0\0') return;
  const optionalHeader = pe + 24;
  const isPe32Plus = buf.readUInt16LE(optionalHeader) === 0x20b;
  const securityDir = optionalHeader + (isPe32Plus ? 112 : 96) + 4 * 8;
  const offset = buf.readUInt32LE(securityDir);
  const size = buf.readUInt32LE(securityDir + 4);
  if (size === 0) return;
  buf.writeUInt32LE(0, securityDir);
  buf.writeUInt32LE(0, securityDir + 4);
  const end = offset + size === buf.length ? offset : buf.length;
  writeFileSync(file, buf.subarray(0, end));
}

if (!existsSync(BUNDLE)) {
  console.error(`[package] ${BUNDLE} not found - run "npm run build" first.`);
  process.exit(1);
}

// 1. Generate the SEA preparation blob from sea-config.json.
run(process.execPath, ['--experimental-sea-config', 'sea-config.json']);

// 2. Copy the current Node.js binary as the base of the executable.
rmSync(exe, { force: true });
copyFileSync(process.execPath, exe);
if (!isWindows) chmodSync(exe, 0o755);

// 3. Remove the original signature before injection.
if (isMac) run('codesign', ['--remove-signature', exe]);
if (isWindows) stripWindowsSignature(exe);

// 4. Inject the blob into the binary.
await postject.inject(exe, 'NODE_SEA_BLOB', readFileSync(BLOB), {
  sentinelFuse: SEA_FUSE,
  machoSegmentName: isMac ? 'NODE_SEA' : undefined,
});

// 5. macOS: ad-hoc signature so the binary is allowed to run.
if (isMac) run('codesign', ['--sign', '-', exe]);

console.log(`[package] executable created: ${exe}`);
