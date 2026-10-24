import { readFile, mkdir, open, rename, unlink, copyFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { emptyPolicy, validateState, PolicyError } from './policy.js';

export class PolicyStore {
  constructor(file) { this.file = file; this.state = emptyPolicy(); this.queue = Promise.resolve(); this.error = ''; this.fresh = false; }
  async init(baseline = []) {
    try { this.state = validateState(JSON.parse(await readFile(this.file, 'utf8'))); }
    catch (error) {
      if (error.code !== 'ENOENT') {
        this.state = { ...emptyPolicy(), blocked: true };
        this.error = '策略文件无法读取，Skill 和 MCP 已暂停。请恢复 policy.json 备份后重启服务。';
        return this;
      }
      for (const name of baseline) this.state.global.skills[name] = true;
      await this.persist(this.state); this.fresh = true;
    }
    return this;
  }
  async persist(value) {
    await mkdir(dirname(this.file), { recursive: true, mode: 0o700 });
    const temp = this.file + '.' + randomUUID() + '.tmp';
    try {
      const handle = await open(temp, 'wx', 0o600);
      try { await handle.writeFile(JSON.stringify(value, null, 2) + '\n'); await handle.sync(); } finally { await handle.close(); }
      try { await copyFile(this.file, this.file + '.bak'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      await rename(temp, this.file);
      const directory = await open(dirname(this.file), 'r');
      try { await directory.sync(); } finally { await directory.close(); }
    } finally { await unlink(temp).catch(() => {}); }
  }
  update(revision, edit) {
    const operation = this.queue.then(async () => {
      if (this.error) throw new PolicyError(this.error, 503);
      if (!Number.isSafeInteger(revision) || revision !== this.state.revision) throw new PolicyError('设置已在别处更新，请刷新后重试。', 409);
      const next = structuredClone(this.state);
      await edit(next); next.revision++;
      validateState(next); await this.persist(next); this.state = next;
      return next;
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
}
