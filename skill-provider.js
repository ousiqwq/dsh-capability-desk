import { join } from 'node:path';
import { FileSystemSkillProvider } from '@deepseek-ai/dsh-skill-filesystem';
import { canonical } from './policy.js';

// Retain DSH's parser, precedence and bounded watchers; add common project roots.
export class CapabilitySkillProvider extends FileSystemSkillProvider {
  async roots(cwd) {
    const roots = await super.roots(cwd);
    if (cwd) {
      const projectRoot = canonical(cwd);
      roots.push({ path: join(projectRoot, '.claude/skills'), source: 'project-claude', rank: 210, projectRoot },
        { path: join(projectRoot, '.codex/skills'), source: 'project-codex', rank: 220, projectRoot });
    }
    return roots;
  }
}
