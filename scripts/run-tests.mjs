import { readdirSync, statSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collectTests(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      collectTests(full, files);
    } else if (entry.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

const testFiles = collectTests(path.join(root, 'lib')).sort();

if (testFiles.length === 0) {
  console.error('No test files found');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...testFiles],
  { stdio: 'inherit', cwd: root, shell: false }
);

process.exit(result.status ?? 1);
