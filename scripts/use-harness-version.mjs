// Runs only in a disposable CI checkout; resolves each DSH version from scratch.
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const version = process.env.DSH_TEST_VERSION;
if (process.env.CI !== 'true' || existsSync('node_modules')) throw new Error('Use a fresh CI checkout');
if (!['0.2.1-rc.3', '0.2.1-rc.5'].includes(version)) throw new Error('Unsupported test version');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const name of Object.keys(pkg.devDependencies)) {
  if (name.startsWith('@deepseek-ai/dsh-')) pkg.devDependencies[name] = version;
}
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
rmSync('package-lock.json');
const result = spawnSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
