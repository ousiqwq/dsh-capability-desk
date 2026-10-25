import z from '@deepseek-ai/schemastery';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CapabilitySkillProvider } from './skill-provider.js';
import { PolicyStore } from './store.js';
import { collectWorkspaces } from './workspaces.js';
import { Discovery } from './discovery.js';
import { createRuntime } from './runtime.js';
import { createApi, BASE } from './http-api.js';
import { TranslationService } from './translations.js';

export const name = 'workspace-capabilities';
export const inject = ['skills', 'tools', 'agents', 'workspaceRegistry'];
export const Config = z.object({ dataDir: z.string(), skillRoots: z.array(String).default([]) });

export async function apply(ctx, config) {
  const home = homedir(), dshHome = process.env.DSH_HOME || join(home, '.dsh');
  const baseline = await ctx.skills.snapshot({ cwd: process.cwd() });
  const store = await new PolicyStore(join(config.dataDir || join(dshHome, 'workspace-capabilities'), 'policy.json')).init(baseline.skills.map(item => item.name));
  const workspaces = async () => collectWorkspaces({
    cwd: process.cwd(), registered: ctx.workspaceRegistry.list(),
    agents: ctx.agents.list(), rules: store.state.workspaces
  });
  let runtime;
  let externalFiber;
  let sourceQueue = Promise.resolve();
  function syncSources() { sourceQueue = sourceQueue.then(performSourceSync, performSourceSync); return sourceQueue; }
  async function performSourceSync() {
    const enabled = store.state.discovery.includeExternal;
    if (enabled && !externalFiber) {
      externalFiber = ctx.plugin({ name: 'capabilities-external-skills', inject: ['skills'], async apply(child) {
        let provider;
        child.skills.registerProvider(control => provider = new CapabilitySkillProvider(child, control, {
          providerName: 'workspace-capabilities-filesystem', includeDefaultRoots: true,
          customSkillDirs: [join(home, '.cc-switch/skills'), join(home, '.codex/skills'), join(home, '.codex/skills/.system'), join(home, '.claude/skills'), ...config.skillRoots]
        }));
        child.effect(() => () => provider.dispose(), 'capabilities: external skill watchers');
      }});
      await externalFiber.await();
    } else if (!enabled && externalFiber) {
      const old = externalFiber; externalFiber = undefined; await old.dispose();
    }
    // Drain an old scan first so disabling external sources cannot publish a stale mixed catalog.
    if (discovery.scanPromise) await discovery.scanPromise;
    await discovery.scan(); await runtime.changed();
  }
  const discovery = new Discovery({ home, dshHome, workspaces, schemas: () => ctx.tools.schemas(), snapshot: options => runtime.originalSnapshot(options), includeExternal: () => store.state.discovery.includeExternal });
  runtime = createRuntime(ctx, store, discovery);
  await syncSources();
  const translations = await new TranslationService(ctx, join(config.dataDir || join(dshHome, 'workspace-capabilities'), 'translations.json')).init();
  ctx.effect(() => () => translations.close(), 'capabilities: translation lifecycle');
  ctx.inject(['settings'], child => child.settings.configure({ auto: false }, ctx.fiber));
  ctx.inject(['webServer', 'connection'], child => {
    const api = createApi(child, store, discovery, runtime, { syncSources, translations });
    child.effect(() => child.webServer.register({ kind: 'prefix', path: BASE, handler: api.handler }), 'capabilities: authenticated settings API');
  });
  let scanning = false;
  const timer = setInterval(async () => {
    if (scanning) return; scanning = true;
    try { await discovery.scan(); await runtime.sync(); } catch { /* Keep last known catalog, never execute a failed discovery. */ }
    finally { scanning = false; }
  }, 15000);
  timer.unref(); ctx.effect(() => () => clearInterval(timer), 'capabilities: discovery refresh');
}
