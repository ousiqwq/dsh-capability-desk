import { realpathSync } from 'node:fs';
import { isAbsolute, normalize } from 'node:path';
import { scopeChainOf } from '@deepseek-ai/dsh-scope';

export class PolicyError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function canonical(path) {
  if (typeof path !== 'string' || !isAbsolute(path) || path.includes('\0')) return '';
  try { return realpathSync(path); } catch { return normalize(path); }
}
// An agent's workspace is anchored to its root session, never a tool's cwd argument.
export function workspaceOf(scope, cwd) {
  const chain = scopeChainOf(scope);
  for (const item of chain.reverse()) {
    const path = item?.session?.header?.cwd;
    if (path) return canonical(path);
  }
  return canonical(cwd);
}
export function emptyPolicy() {
  return { version: 1, revision: 0, discovery: { includeExternal: false }, defaults: { skills: false, mcp: false }, global: { skills: {}, mcp: {} }, workspaces: {}, approvals: {} };
}
export function allowed(state, kind, key, workspace = '', sourceWorkspace = '') {
  if (!state || state.blocked) return false;
  if (sourceWorkspace && canonical(sourceWorkspace) !== canonical(workspace)) return false;
  const rules = state.workspaces[canonical(workspace)]?.[kind];
  if (rules && Object.hasOwn(rules, key)) return rules[key];
  if (Object.hasOwn(state.global[kind], key)) return state.global[kind][key];
  return state.defaults[kind];
}
export function validateState(state) {
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const safeKey = key => !['__proto__', 'constructor', 'prototype'].includes(key) && key.length > 0 && key.length <= 4096;
  function rules(value) {
    if (!record(value) || Object.keys(value).length > 10000) throw new Error('invalid rules');
    for (const [key, enabled] of Object.entries(value)) if (!safeKey(key) || typeof enabled !== 'boolean') throw new Error('invalid rule');
  }
  if (!record(state) || state.version !== 1 || !Number.isSafeInteger(state.revision) || state.revision < 0) throw new Error('invalid policy');
  // Version 1 policies written before source selection migrate to DSH-only discovery.
  state.discovery ??= { includeExternal: false };
  if (!record(state.discovery) || typeof state.discovery.includeExternal !== 'boolean') throw new Error('invalid discovery options');
  if (!record(state.defaults) || typeof state.defaults.skills !== 'boolean' || typeof state.defaults.mcp !== 'boolean') throw new Error('invalid defaults');
  if (!record(state.global) || !record(state.workspaces) || !record(state.approvals)) throw new Error('invalid policy maps');
  rules(state.global.skills); rules(state.global.mcp);
  for (const [path, value] of Object.entries(state.workspaces)) {
    if (!isAbsolute(path) || !record(value)) throw new Error('invalid workspace');
    rules(value.skills); rules(value.mcp);
  }
  for (const [key, hash] of Object.entries(state.approvals)) if (!safeKey(key) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error('invalid approval');
  return state;
}
