import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const folders = ['.', 'tests', 'scripts'];
let checked = 0;
for (const folder of folders) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(?:js|mjs)$/.test(entry.name)) continue;
    const path = join(folder, entry.name);
    const result = spawnSync(process.execPath, ['--check', path], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
    checked++;
  }
}
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
if (manifest.license !== 'MIT') throw new Error('Expected MIT package license');
for (const file of Object.values(manifest.exports)) await access(file);
await access('LICENSE');
console.log(`Checked ${checked} JavaScript modules and package exports.`);
