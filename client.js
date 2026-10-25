window.__ModuleLoader__.load({
  id: 'dsh-plugin-workspace-capabilities',
  factory: require => {
    const React = require('react'), h = React.createElement;
    const BASE = '/workspace-capabilities/v1';
    const css = `
.wc-page{box-sizing:border-box;width:100%;min-width:0;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:14px;padding:6px 0;font-size:13px;line-height:1.6}
.wc-page *{box-sizing:border-box}.wc-page h2{font-size:18px;margin:0}.wc-page p{margin:0}.wc-muted{color:var(--dsw-alias-label-secondary);font-size:12px;overflow-wrap:anywhere}
.wc-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0}.wc-row>.wc-grow{flex:1;min-width:160px}
.wc-scope-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end}.wc-scope-controls>.wc-grow{min-width:0}
.wc-scope-controls select,.wc-scope-controls>button{height:38px}
.wc-page button,.wc-page select,.wc-page input{font:inherit;color:inherit;background:var(--dsw-alias-bg-module-platform,#292a2b);border:1px solid var(--dsw-alias-border-l2,#48494b);border-radius:8px;min-height:36px;padding:7px 10px;min-width:0;max-width:100%}
.wc-page button{cursor:pointer}.wc-page button:disabled,.wc-page select:disabled{opacity:.5;cursor:default}.wc-page :focus-visible{outline:2px solid #8baeff;outline-offset:2px}
.wc-page label{display:flex;flex-direction:column;gap:6px}.wc-card{border:1px solid var(--dsw-alias-border-l2,#48494b);border-radius:12px;padding:13px;display:flex;flex-direction:column;gap:9px;min-width:0}
.wc-tabs button[aria-selected=true]{background:color-mix(in srgb,#759ce8 18%,transparent);border-color:#759ce8}.wc-name{font-size:14px;font-weight:600;overflow-wrap:anywhere;min-width:0;flex:1}
.wc-badge{font-size:11px;border-radius:16px;padding:2px 8px;background:color-mix(in srgb,#888 17%,transparent);white-space:nowrap}.wc-on{color:#85d0a5}.wc-off{color:var(--dsw-alias-label-secondary)}
.wc-error{color:#ff99a2;white-space:pre-wrap;overflow-wrap:anywhere}.wc-success{color:#85d0a5;font-size:12px}.wc-description{overflow-wrap:anywhere;font-size:12px}.wc-source{font-size:11px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
.wc-translated{white-space:pre-wrap;overflow-wrap:anywhere}.wc-translated-title{font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary)}.wc-tools{display:flex;flex-direction:column;gap:10px}.wc-tool{border-top:1px solid var(--dsw-alias-border-l2);padding-top:9px;min-width:0}.wc-progress{font-size:12px;color:#8baeff;overflow-wrap:anywhere}
.wc-translation-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;min-width:0;margin-top:2px}.wc-page .wc-translation-actions button{display:inline-flex;align-items:center;justify-content:center;gap:5px;flex:none;min-height:28px;height:28px;padding:3px 7px;font-size:12px;line-height:20px;background:transparent;color:var(--dsw-alias-label-secondary);border-color:transparent}
.wc-page .wc-translation-actions button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.14));color:var(--dsw-alias-label-primary)}.wc-page .wc-translation-actions .wc-translate-icon{width:28px;padding:4px}.wc-page .wc-translate-icon[aria-pressed=true]{color:#8baeff;background:color-mix(in srgb,#759ce8 12%,transparent)}.wc-translation-actions svg{display:block;width:18px;height:18px;flex:none}.wc-tool{display:flex;flex-direction:column;gap:7px}
.wc-primary{background:#4269ae!important;color:#fff!important}.wc-list{display:flex;flex-direction:column;gap:10px}.wc-rule{min-width:124px}.wc-count{font-size:12px}.wc-page details summary{cursor:pointer}.wc-default{display:flex!important;flex-direction:row!important;align-items:center;gap:8px!important}.wc-default input{min-height:0;accent-color:#759ce8}
@media(max-width:650px){
.wc-row>.wc-grow{flex-basis:100%;min-width:0}.wc-rule{width:100%}.wc-card{padding:11px}
[data-shortcut-modal="settings"]:has(.wc-page){flex-direction:column;width:calc(100vw - 24px);max-width:calc(100vw - 24px);height:calc(100dvh - 24px)}
[data-shortcut-modal="settings"]:has(.wc-page)>nav{width:100%;min-width:0;flex-direction:row;align-items:center;gap:8px;padding:12px 12px 0}
[data-shortcut-modal="settings"]:has(.wc-page)>nav>:first-child{flex:none;white-space:nowrap;padding:0}
[data-shortcut-modal="settings"]:has(.wc-page)>nav>:last-child{flex:1;min-width:0;flex-direction:row;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin}
[data-shortcut-modal="settings"]:has(.wc-page)>nav button{flex:none;height:36px;padding:7px 10px}
[data-shortcut-modal="settings"]:has(.wc-page)>nav+div{min-height:0}
[data-shortcut-modal="settings"]:has(.wc-page)>nav+div>:first-child{height:42px;padding:8px 12px 4px}
[data-shortcut-modal="settings"]:has(.wc-page)>nav+div>:last-child{padding:0 14px 14px}
}
`;
    const statusLabels = { connected: '已连接', 'connected-no-tools': '已连接／暂无工具', connecting: '连接中', error: '连接失败，请检查源配置或重新启用', disconnected: '未连接', native: 'DSH 原生连接', configured: '原生配置／未发现工具' };
    async function request(path, value, signal) {
      const response = await fetch(BASE + path, { credentials: 'same-origin', cache: 'no-store', signal, ...(value === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || '请求失败'); return data;
    }
    function CapabilitySettings({ getModelContext, registeredWorkspaces }) {
      const [workspace, setWorkspace] = React.useState(''), [view, setView] = React.useState(null);
      const [tab, setTab] = React.useState('skills'), [search, setSearch] = React.useState(''), [error, setError] = React.useState('');
      const [busy, setBusy] = React.useState(false), [message, setMessage] = React.useState(''), [path, setPath] = React.useState('');
      const [progress, setProgress] = React.useState(''), [showTranslation, setShowTranslation] = React.useState(() => { try { return localStorage.getItem('dsh-capabilities-show-translations') !== 'false'; } catch { return true; } });
      const translating = React.useRef(null);
      const [translationOverrides, setTranslationOverrides] = React.useState({});
      const epoch = React.useRef(0), locked = React.useRef(false), revision = React.useRef(null);
      React.useEffect(() => {
        const current = ++epoch.current; setView(null); setError('');
        async function load() {
          if (locked.current) return;
          try {
            const context = getModelContext();
            const params = new URLSearchParams({ workspace, ...(context.sessionId ? { sessionId: context.sessionId } : {}), ...(context.selection ? { provider: context.selection.provider, model: context.selection.model } : {}) });
            const data = await request('/state?' + params);
            if (epoch.current !== current || locked.current) return;
            revision.current = data.revision; setView(data);
          } catch (cause) { if (epoch.current === current) setError(cause.message); }
        }
        load(); const timer = setInterval(() => { if (!document.hidden) load(); }, 4000);
        return () => { ++epoch.current; clearInterval(timer); translating.current?.abort(); };
      }, [workspace]);
      async function action(value) {
        if (locked.current || !view) return;
        const current = epoch.current; locked.current = true; setBusy(true); setError(''); setMessage('');
        try {
          const data = await request('/action', { workspace, revision: revision.current, ...getModelContext(), ...value });
          if (epoch.current === current) { revision.current = data.revision; setView(data); setMessage(value.action === 'refresh' ? '发现列表已刷新。' : '已保存，当前及后续 Agent 调用即时使用新规则。'); }
          if (value.action === 'workspace') { setPath(''); setWorkspace(data.workspace); }
        } catch (cause) { if (epoch.current === current) setError(cause.message); }
        finally { locked.current = false; setBusy(false); }
      }
      const button = (text, onClick, options = {}) => h('button', { type: 'button', onClick, disabled: busy, ...options }, text);
      const workspaceOptions = new Map((view?.workspaces ?? []).map(item => [item.path, item]));
      // The sidebar's live store wins over older HTTP responses, including polling in flight.
      for (const item of registeredWorkspaces) if (item.title) workspaceOptions.set(item.path, item);
      const items = (view?.[tab] ?? []).filter(item => [item.name, item.description, item.path, item.source, item.workspace, item.translation?.title, item.translation?.description].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase()));
      async function translate(keys, { force = false, showAll = false } = {}) {
        if (locked.current || !keys.length) return;
        const current = epoch.current, context = getModelContext();
        locked.current = true; setBusy(true); setError(''); setMessage(''); const cancel = new AbortController(); translating.current = cancel;
        try {
          let result;
          for (let offset = 0; offset < keys.length; offset += 12) {
            setProgress((force ? '正在重新翻译 ' : '正在翻译 ') + (offset + 1) + '–' + Math.min(offset + 12, keys.length) + ' / ' + keys.length + ' 条…');
            result = await request('/translate', { workspace, ...context, force, keys: keys.slice(offset, offset + 12) }, cancel.signal);
            if (epoch.current !== current) return;
            revision.current = result.view.revision; setView(result.view);
          }
          if (showAll) { setShowTranslation(true); setTranslationOverrides({}); try { localStorage.setItem('dsh-capabilities-show-translations', 'true'); } catch {} }
          else setTranslationOverrides(previous => ({ ...previous, ...Object.fromEntries(keys.map(key => [key, true])) }));
          setMessage((force ? '译文已重新生成并更新缓存' : result.cached ? '已读取本地译文缓存' : '翻译已保存') + ' · ' + result.model.provider + ' / ' + result.model.model);
        } catch (cause) { if (epoch.current === current && cause.name !== 'AbortError') setError(cause.message); }
        finally { if (epoch.current === current) { setProgress(''); setBusy(false); } locked.current = false; translating.current = null; }
      }
      function translationShown(key) { return translationOverrides[key] ?? showTranslation; }
      function translateIcon() {
        return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('path', { d: 'M2 5h12M7 2v3m-3 3 6 6M12 5c-1 4-4 7-8 9m8 8 5-10 5 10m-8-4h6' }));
      }
      function translationActions(item, key) {
        const shown = !!item.translation && translationShown(key);
        const label = item.translation ? (shown ? '查看原文' : '查看译文') : '翻译说明';
        return h('div', { className: 'wc-translation-actions' },
          item.translation && button('重新翻译', () => translate([key], { force: true }), { disabled: busy || !view.translation.available, 'aria-label': '重新翻译 ' + item.name, title: '使用当前模型重新翻译并更新缓存' }),
          button(translateIcon(), () => item.translation ? setTranslationOverrides(previous => ({ ...previous, [key]: !shown })) : translate([key]),
            { className: 'wc-translate-icon', disabled: busy || (!item.translation && !view.translation.available), 'aria-label': label + ' ' + item.name, title: label, 'aria-pressed': shown }));
      }
      function description(item, key) {
        const translated = translationShown(key) && item.translation;
        return h(React.Fragment, null,
          translated?.title && translated.title !== item.name && h('p', { className: 'wc-translated-title' }, translated.title),
          translated?.description ? h(React.Fragment, null, h('p', { className: 'wc-description wc-translated' }, translated.description),
            h('details', { className: 'wc-source' }, h('summary', null, '查看原文'), h('p', { className: 'wc-description' }, item.description))) : item.description && h('p', { className: 'wc-description' }, item.description));
      }
      function renderItem(item) {
        const isMcp = tab === 'mcp', key = isMcp ? item.id : item.name;
        const foreign = isMcp && item.workspace && workspace !== item.workspace;
        const select = h('select', { 'aria-label': item.name + ' 规则', className: 'wc-rule', value: item.rule === null ? 'inherit' : String(item.rule), disabled: busy || !!view.error || !!foreign,
          onChange: event => action({ action: 'rule', kind: tab, key, value: event.target.value === 'inherit' ? null : event.target.value === 'true' }) },
          h('option', { value: 'inherit' }, workspace ? '继承全局' : '使用默认'), h('option', { value: 'true' }, '启用'), h('option', { value: 'false' }, '禁用'));
        return h('article', { className: 'wc-card', key, 'data-capability': key },
          h('div', { className: 'wc-row' }, h('strong', { className: 'wc-name' }, item.name),
            h('span', { className: 'wc-badge ' + (item.enabled ? 'wc-on' : 'wc-off') }, item.enabled ? '可用' : isMcp && item.requested && !item.approved ? '待批准' : '已禁用'), select),
          description(item, (isMcp ? 'mcp:' : 'skill:') + key),
          h('p', { className: 'wc-source' }, '来源：' + (item.path || item.source) + (!isMcp ? ' · ' + item.provider : '')),
          isMcp && h(React.Fragment, null,
            item.workspace && h('p', { className: 'wc-source' }, '所属工作区：' + item.workspace),
            h('p', { className: 'wc-muted' }, item.transport + ' · ' + item.launch),
            h('p', { className: 'wc-muted' }, statusLabels[item.status] + ' · ' + item.tools + ' 个工具'),
            item.toolDetails?.length > 0 && h('details', null, h('summary', null, '工具说明 (' + item.toolDetails.length + ')'), h('div', { className: 'wc-tools' }, ...item.toolDetails.map(tool => h('div', { className: 'wc-tool', key: tool.name }, h('p', { className: 'wc-name' }, tool.name), description(tool, 'tool:' + tool.name), translationActions(tool, 'tool:' + tool.name))))),
            item.envNames?.length > 0 && h('p', { className: 'wc-source' }, '环境变量名称：' + item.envNames.join('、')),
            item.problem && h('p', { className: 'wc-error' }, item.problem),
            foreign && h('p', { className: 'wc-muted' }, '切换到该来源工作区后可设置。'),
            !item.native && !item.approved && item.valid && !foreign && button('批准配置并启用连接', () => action({ action: 'approve', kind: 'mcp', key, value: true, fingerprint: item.fingerprint }), { className: 'wc-primary', disabled: busy || !!view.error }),
            item.approved && !item.native && h('p', { className: 'wc-source' }, '此配置已批准；修改源配置后需要重新批准。')),
          workspace && h('p', { className: 'wc-source' }, '全局：' + (item.global ? '启用' : '禁用') + (item.rule === null ? ' · 当前继承全局' : ' · 当前使用工作区规则')),
          translationActions(item, (isMcp ? 'mcp:' : 'skill:') + key));
      }
      return h('section', { className: 'wc-page' },
        h('h2', null, 'Skill 与 MCP'),
        h('p', { className: 'wc-muted' }, '这里的全局与工作区规则仅作用于 DeepSeek Harness。默认只发现 DSH 自身的 Skill 和 MCP；其他应用来源可以单独开启。'),
        view && h('div', { className: 'wc-card' },
          h('label', { className: 'wc-default' }, h('input', { type: 'checkbox', checked: view.discovery.includeExternal, disabled: busy || !!view.error,
            onChange: event => action({ action: 'discovery', value: event.target.checked }) }), '扫描其他应用的 Skill / MCP（全局）'),
          h('p', { className: 'wc-muted' }, '可选读取 CC Switch 共享 Skill 目录，以及 Codex、Claude、Cursor 配置。扫描只读取来源；新能力默认禁用，MCP 首次连接仍需批准。')),
        h('div', { className: 'wc-row wc-scope-controls' }, h('label', { className: 'wc-grow' }, '规则范围', h('select', { 'aria-label': '规则范围', value: workspace, disabled: busy, onChange: event => setWorkspace(event.target.value) },
          h('option', { value: '' }, '全局默认'), ...[...workspaceOptions.values()].sort((a, b) => a.path.localeCompare(b.path)).map(item => h('option', { key: item.path, value: item.path }, item.title + ' — ' + item.path)))),
          button('重新发现', () => action({ action: 'refresh' }), { disabled: busy || !view })),
        h('details', null, h('summary', { className: 'wc-muted' }, '添加已有目录的工作区规则'),
          h('div', { className: 'wc-row' }, h('input', { className: 'wc-grow', 'aria-label': '工作区绝对路径', placeholder: '/home/用户名/项目', value: path, onChange: event => setPath(event.target.value) }),
            button('添加工作区', () => action({ action: 'workspace', workspace: path }), { disabled: busy || !view || !path.startsWith('/') }))),
        error && h('p', { className: 'wc-error', role: 'alert' }, error), view?.error && h('p', { className: 'wc-error', role: 'alert' }, view.error),
        message && h('p', { className: 'wc-success', role: 'status' }, message),
        progress && h('p', { className: 'wc-progress', role: 'status' }, progress),
        !view ? h('p', { className: 'wc-muted' }, '正在读取能力列表…') : h(React.Fragment, null,
          h('div', { className: 'wc-row wc-tabs', role: 'tablist', 'aria-label': '能力类型' },
            ...[['skills', 'Skills', view.skills.length], ['mcp', 'MCP', view.mcp.length]].map(([value, label, count]) => button(label + ' (' + count + ')', () => setTab(value), { key: value, role: 'tab', 'aria-selected': tab === value }))),
          h('div', { className: 'wc-card' },
            h('p', { className: 'wc-muted' }, '翻译模型：' + ((getModelContext().selection ?? view.translation.model) ? (getModelContext().selection ?? view.translation.model).model + '（跟随当前界面）' : '请先选择模型')),
            h('label', { className: 'wc-default' }, h('input', { type: 'checkbox', checked: showTranslation, onChange: event => { setShowTranslation(event.target.checked); setTranslationOverrides({}); try { localStorage.setItem('dsh-capabilities-show-translations', String(event.target.checked)); } catch {} } }), '显示中文译文'),
            button('翻译当前列表', () => translate(items.flatMap(item => tab === 'skills' ? ['skill:' + item.name] : ['mcp:' + item.id, ...(item.toolDetails ?? []).map(tool => 'tool:' + tool.name)]), { showAll: true }), { disabled: busy || !view.translation.available || !items.length }),
            h('p', { className: 'wc-muted' }, '点击后使用当前界面所选模型翻译名称和说明，结果保存在本地缓存。原始标识符和 Agent 调用保持不变。')),
          !workspace && h('label', { className: 'wc-default' }, h('input', { type: 'checkbox', checked: view.defaults[tab], disabled: busy || !!view.error,
            onChange: event => action({ action: 'defaults', kind: tab, value: event.target.checked }) }), tab === 'skills' ? '新发现的 Skill 默认启用' : '已批准的 MCP 默认启用'),
          h('input', { type: 'search', 'aria-label': '搜索能力', placeholder: '搜索名称、说明或来源路径', value: search, onChange: event => setSearch(event.target.value) }),
          h('p', { className: 'wc-muted' }, workspace ? '工作区：' + workspace : '全局规则将应用到未单独设置的工作区。'),
          h('div', { className: 'wc-list' }, ...items.map(renderItem)),
          !items.length && h('p', { className: 'wc-muted' }, search ? '没有匹配的能力。' : tab === 'mcp' ? '当前范围未发现 MCP。DSH 配置和工作区 .dsh/mcp.json 会自动发现；其他应用需打开上方扫描开关。' : '当前范围未发现 Skill。这里展示 DeepSeek 已注册的 Skill；其他应用需打开上方扫描开关。'),
          view.issues.length > 0 && h('details', null, h('summary', null, '发现过程中的问题 (' + view.issues.length + ')'), ...view.issues.map(item => h('p', { className: 'wc-source', key: item.source }, item.source + '：' + item.message))),
          !view.complete && h('p', { className: 'wc-muted' }, '部分 Skill 目录尚未完成扫描，请重新发现。'),
          h('p', { className: 'wc-muted' }, '这些规则控制 Agent 的 Skill 加载和 MCP 调用；源文件不会被修改。设置已持久保存，服务重启后仍然有效。')));
    }
    function apply(ctx) {
      ctx.effect(() => { const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style); return () => style.remove(); }, 'capabilities: styles');
      const subscribeWorkspaces = listener => ctx.workspaces.list.subscribe(listener);
      const getWorkspaceSnapshot = () => ctx.workspaces.list.getSnapshot();
      function getModelContext() {
        const sessionId = ctx.uiSession.current.getSnapshot()?.key;
        if (!sessionId) return {};
        try { const selection = ctx.modelDirectories.directoryFor(sessionId).store.getSnapshot().current; return { sessionId, ...(selection ? { selection } : {}) }; }
        catch { return { sessionId }; }
      }
      function Page() {
        const snapshot = React.useSyncExternalStore(subscribeWorkspaces, getWorkspaceSnapshot);
        return h(CapabilitySettings, { getModelContext, registeredWorkspaces: snapshot.items });
      }
      ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'workspace-capabilities', order: 20, label: () => 'Skill 与 MCP' }, Page));
    }
    return { name: 'workspace-capabilities-client', inject: ['slots', 'uiSession', 'modelDirectories', 'workspaces'], apply };
  }
});
