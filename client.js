window.__ModuleLoader__.load({
  id: 'dsh-plugin-workspace-capabilities',
  factory: require => {
    const React = require('react'), h = React.createElement;
    /* i18n:start */
const NS="capabilityDesk";
const zh={
  " · 当前使用工作区规则": " · 当前使用工作区规则",
  " · 当前继承全局": " · 当前继承全局",
  " 个工具": " 个工具",
  " 条…": " 条…",
  " 规则": " 规则",
  "/home/用户名/项目": "/home/用户名/项目",
  "DSH 原生连接": "DSH 原生连接",
  "Skill 与 MCP": "Skill 与 MCP",
  "使用当前模型重新翻译并更新缓存": "使用当前模型重新翻译并更新缓存",
  "使用默认": "使用默认",
  "保存语言": "保存语言",
  "全局规则将应用到未单独设置的工作区。": "全局规则将应用到未单独设置的工作区。",
  "全局默认": "全局默认",
  "全局：": "全局：",
  "切换到该来源工作区后可设置。": "切换到该来源工作区后可设置。",
  "原生配置／未发现工具": "原生配置／未发现工具",
  "发现列表已刷新。": "发现列表已刷新。",
  "发现过程中的问题 (": "发现过程中的问题 (",
  "可用": "可用",
  "可选读取 CC Switch 共享 Skill 目录，以及 Codex、Claude、Cursor 配置。扫描只读取来源；新能力默认禁用，MCP 首次连接仍需批准。": "可选读取 CC Switch 共享 Skill 目录，以及 Codex、Claude、Cursor 配置。扫描只读取来源；新能力默认禁用，MCP 首次连接仍需批准。",
  "启用": "启用",
  "工作区绝对路径": "工作区绝对路径",
  "工作区：": "工作区：",
  "工具说明 (": "工具说明 (",
  "已保存，当前及后续 Agent 调用即时使用新规则。": "已保存，当前及后续 Agent 调用即时使用新规则。",
  "已处理 {p0} 条，{p1} 条已是目标语言 · {p2}": "已处理 {p0} 条，{p1} 条已是目标语言 · {p2}",
  "已批准的 MCP 默认启用": "已批准的 MCP 默认启用",
  "已是目标语言": "已是目标语言",
  "已禁用": "已禁用",
  "已连接": "已连接",
  "已连接／暂无工具": "已连接／暂无工具",
  "当前范围未发现 MCP。DSH 配置和工作区 .dsh/mcp.json 会自动发现；其他应用需打开上方扫描开关。": "当前范围未发现 MCP。DSH 配置和工作区 .dsh/mcp.json 会自动发现；其他应用需打开上方扫描开关。",
  "当前范围未发现 Skill。这里展示 DeepSeek 已注册的 Skill；其他应用需打开上方扫描开关。": "当前范围未发现 Skill。这里展示 DeepSeek 已注册的 Skill；其他应用需打开上方扫描开关。",
  "待批准": "待批准",
  "所属工作区：": "所属工作区：",
  "扫描其他应用的 Skill / MCP（全局）": "扫描其他应用的 Skill / MCP（全局）",
  "批准配置并启用连接": "批准配置并启用连接",
  "搜索名称、说明或来源路径": "搜索名称、说明或来源路径",
  "搜索能力": "搜索能力",
  "新发现的 Skill 默认启用": "新发现的 Skill 默认启用",
  "日本語": "日本語",
  "显示译文": "显示译文",
  "未连接": "未连接",
  "来源：": "来源：",
  "查看原文": "查看原文",
  "查看译文": "查看译文",
  "正在翻译 ": "正在翻译 ",
  "正在读取能力列表…": "正在读取能力列表…",
  "正在重新翻译 ": "正在重新翻译 ",
  "此配置已批准；修改源配置后需要重新批准。": "此配置已批准；修改源配置后需要重新批准。",
  "没有匹配的能力。": "没有匹配的能力。",
  "添加工作区": "添加工作区",
  "添加已有目录的工作区规则": "添加已有目录的工作区规则",
  "点击后使用当前界面所选模型翻译名称和说明，结果保存在本地缓存。同语默认保留原文，单项按钮可强制翻译。原始标识符和 Agent 调用保持不变。": "点击后使用当前界面所选模型翻译名称和说明，结果保存在本地缓存。同语默认保留原文，单项按钮可强制翻译。原始标识符和 Agent 调用保持不变。",
  "环境变量名称：": "环境变量名称：",
  "禁用": "禁用",
  "简体中文": "简体中文",
  "繁體中文": "繁體中文",
  "继承全局": "继承全局",
  "翻译当前列表": "翻译当前列表",
  "翻译成": "翻译成",
  "翻译模型：": "翻译模型：",
  "翻译目标语言已保存。": "翻译目标语言已保存。",
  "翻译目标语言未保存，请刷新后重试。": "翻译目标语言未保存，请刷新后重试。",
  "翻译说明": "翻译说明",
  "能力类型": "能力类型",
  "规则范围": "规则范围",
  "请先选择模型": "请先选择模型",
  "请求失败": "请求失败",
  "跟随界面语言": "跟随界面语言",
  "这些规则控制 Agent 的 Skill 加载和 MCP 调用；源文件不会被修改。设置已持久保存，服务重启后仍然有效。": "这些规则控制 Agent 的 Skill 加载和 MCP 调用；源文件不会被修改。设置已持久保存，服务重启后仍然有效。",
  "这里的全局与工作区规则仅作用于 DeepSeek Harness。默认只发现 DSH 自身的 Skill 和 MCP；其他应用来源可以单独开启。": "这里的全局与工作区规则仅作用于 DeepSeek Harness。默认只发现 DSH 自身的 Skill 和 MCP；其他应用来源可以单独开启。",
  "连接中": "连接中",
  "连接失败，请检查源配置或重新启用": "连接失败，请检查源配置或重新启用",
  "部分 Skill 目录尚未完成扫描，请重新发现。": "部分 Skill 目录尚未完成扫描，请重新发现。",
  "重新发现": "重新发现",
  "重新翻译": "重新翻译",
  "重新翻译 ": "重新翻译 ",
  "（跟随当前界面）": "（跟随当前界面）",
  "服务配置必须是对象。": "服务配置必须是对象。",
  "源配置中已禁用，请先在源配置中启用。": "源配置中已禁用，请先在源配置中启用。",
  "此版本仅支持 stdio 和 Streamable HTTP。": "此版本仅支持 stdio 和 Streamable HTTP。",
  "args 必须是字符串数组。": "args 必须是字符串数组。",
  "env 必须是字符串字典。": "env 必须是字符串字典。",
  "HTTP 服务地址无效。": "HTTP 服务地址无效。",
  "headers 必须是字符串字典。": "headers 必须是字符串字典。",
  "未发现 command 或 url。": "未发现 command 或 url。",
  "DSH 服务环境中缺少配置引用的环境变量。": "DSH 服务环境中缺少配置引用的环境变量。",
  "文件超过 2 MiB，已跳过。": "文件超过 2 MiB，已跳过。",
  "YAML 解析失败。": "YAML 解析失败。",
  "请求超过 64 KiB。": "请求超过 64 KiB。",
  "请求不是有效的 JSON 对象。": "请求不是有效的 JSON 对象。",
  "工作区必须是绝对路径。": "工作区必须是绝对路径。",
  "工作区目录不存在或不可访问。": "工作区目录不存在或不可访问。",
  "能力类型无效。": "能力类型无效。",
  "未发现此能力，请重新扫描。": "未发现此能力，请重新扫描。",
  "规则必须为启用、禁用或继承。": "规则必须为启用、禁用或继承。",
  "此 MCP 来源于另一工作区，仅能在来源工作区启用。": "此 MCP 来源于另一工作区，仅能在来源工作区启用。",
  "批准连接参数无效。": "批准连接参数无效。",
  "源配置已改变，请重新检查并批准。": "源配置已改变，请重新检查并批准。",
  "发现来源开关无效。": "发现来源开关无效。",
  "请选择工作区。": "请选择工作区。",
  "默认规则无效。": "默认规则无效。",
  "操作无效。": "操作无效。",
  "翻译服务尚未就绪。": "翻译服务尚未就绪。",
  "重新翻译参数无效。": "重新翻译参数无效。",
  "每次请选择 1–12 条说明。": "每次请选择 1–12 条说明。",
  "该能力已不在当前发现范围，请刷新后重试。": "该能力已不在当前发现范围，请刷新后重试。",
  "请求必须使用 application/json。": "请求必须使用 application/json。",
  "设置已在别处更新，请刷新后重试。": "设置已在别处更新，请刷新后重试。",
  "翻译目标语言无效，最多 160 字符。": "翻译目标语言无效，最多 160 字符。",
  "模型返回的翻译格式不完整，请重试。": "模型返回的翻译格式不完整，请重试。",
  "模型未执行强制翻译，请重试。": "模型未执行强制翻译，请重试。",
  "请先在 DeepSeek 界面选择可用的模型。": "请先在 DeepSeek 界面选择可用的模型。",
  "当前界面所选模型的服务尚未就绪。": "当前界面所选模型的服务尚未就绪。",
  "每次最多翻译 12 条能力说明。": "每次最多翻译 12 条能力说明。",
  "另一批翻译正在进行，请稍后重试。": "另一批翻译正在进行，请稍后重试。",
  "模型未完成翻译，请重试或减少翻译条数。": "模型未完成翻译，请重试或减少翻译条数。",
  "模型返回的翻译过长。": "模型返回的翻译过长。",
  "模型未返回有效的翻译 JSON，请重试。": "模型未返回有效的翻译 JSON，请重试。",
  "模型遗漏了部分翻译，请重试。": "模型遗漏了部分翻译，请重试。",
  "请使用受信任的 Harness 页面访问设置。": "请使用受信任的 Harness 页面访问设置。",
  "操作未完成，请刷新后重试。": "操作未完成，请刷新后重试。",
  "操作未完成，请重试。": "操作未完成，请重试。",
  "翻译已取消或超时，请重试。": "翻译已取消或超时，请重试。",
  "当前模型翻译失败，请检查 DeepSeek 的模型连接后重试。": "当前模型翻译失败，请检查 DeepSeek 的模型连接后重试。",
  "策略文件无法读取，Skill 和 MCP 已暂停。请恢复 policy.json 备份后重启服务。": "策略文件无法读取，Skill 和 MCP 已暂停。请恢复 policy.json 备份后重启服务。"
};
const en={
  " · 当前使用工作区规则": " · Using workspace rules",
  " · 当前继承全局": " · Inheriting global rules",
  " 个工具": " tools",
  " 条…": " entries…",
  " 规则": " rule",
  "/home/用户名/项目": "/home/user/project",
  "DSH 原生连接": "DSH native connection",
  "Skill 与 MCP": "Skills & MCP",
  "使用当前模型重新翻译并更新缓存": "Regenerate with the current model and update the cache",
  "使用默认": "Use default",
  "保存语言": "Save language",
  "全局规则将应用到未单独设置的工作区。": "Global rules apply to workspaces without an override.",
  "全局默认": "Global default",
  "全局：": "Global: ",
  "切换到该来源工作区后可设置。": "Switch to the source workspace to configure it.",
  "原生配置／未发现工具": "Native configuration / no tools discovered",
  "发现列表已刷新。": "Discovery list refreshed.",
  "发现过程中的问题 (": "Discovery issues (",
  "可用": "Available",
  "可选读取 CC Switch 共享 Skill 目录，以及 Codex、Claude、Cursor 配置。扫描只读取来源；新能力默认禁用，MCP 首次连接仍需批准。": "Optionally read shared CC Switch Skills and Codex, Claude, and Cursor configuration. Scanning only reads sources; new capabilities default to disabled, and the first MCP connection requires approval.",
  "启用": "Enable",
  "工作区绝对路径": "Absolute workspace path",
  "工作区：": "Workspace: ",
  "工具说明 (": "Tool descriptions (",
  "已保存，当前及后续 Agent 调用即时使用新规则。": "Saved. Current and subsequent Agent calls use the new rules immediately.",
  "已处理 {p0} 条，{p1} 条已是目标语言 · {p2}": "Processed {p0} entries; {p1} already in the target language · {p2}",
  "已批准的 MCP 默认启用": "Enable approved MCP by default",
  "已是目标语言": "Already in the target language",
  "已禁用": "Disabled",
  "已连接": "Connected",
  "已连接／暂无工具": "Connected / no tools",
  "当前范围未发现 MCP。DSH 配置和工作区 .dsh/mcp.json 会自动发现；其他应用需打开上方扫描开关。": "No MCP discovered in this scope. DSH configuration and workspace .dsh/mcp.json are discovered automatically; enable the scan option for other applications.",
  "当前范围未发现 Skill。这里展示 DeepSeek 已注册的 Skill；其他应用需打开上方扫描开关。": "No Skills discovered in this scope. This list shows Skills registered with DeepSeek; enable the scan option for other applications.",
  "待批准": "Approval needed",
  "所属工作区：": "Workspace: ",
  "扫描其他应用的 Skill / MCP（全局）": "Scan other applications' Skills / MCP (global)",
  "批准配置并启用连接": "Approve configuration and enable connection",
  "搜索名称、说明或来源路径": "Search names, descriptions, or source paths",
  "搜索能力": "Search capabilities",
  "新发现的 Skill 默认启用": "Enable newly discovered Skills by default",
  "日本語": "Japanese",
  "显示译文": "Show translations",
  "未连接": "Disconnected",
  "来源：": "Source: ",
  "查看原文": "Show original",
  "查看译文": "Show translation",
  "正在翻译 ": "Translating ",
  "正在读取能力列表…": "Loading capabilities…",
  "正在重新翻译 ": "Retranslating ",
  "此配置已批准；修改源配置后需要重新批准。": "Approved. Changes to the source configuration require approval again.",
  "没有匹配的能力。": "No matching capabilities.",
  "添加工作区": "Add workspace",
  "添加已有目录的工作区规则": "Add rules for an existing workspace folder",
  "点击后使用当前界面所选模型翻译名称和说明，结果保存在本地缓存。同语默认保留原文，单项按钮可强制翻译。原始标识符和 Agent 调用保持不变。": "Translate names and descriptions with the selected model and cache results locally. Text already in the target language stays unchanged unless translated individually. Identifiers and Agent calls remain unchanged.",
  "环境变量名称：": "Environment variable names: ",
  "禁用": "Disable",
  "简体中文": "Simplified Chinese",
  "繁體中文": "Traditional Chinese",
  "继承全局": "Inherit global",
  "翻译当前列表": "Translate this list",
  "翻译成": "Translate into",
  "翻译模型：": "Translation model: ",
  "翻译目标语言已保存。": "Translation target saved.",
  "翻译目标语言未保存，请刷新后重试。": "Translation target was not saved. Refresh and try again.",
  "翻译说明": "Translate description",
  "能力类型": "Capability type",
  "规则范围": "Rule scope",
  "请先选择模型": "Select a model first",
  "请求失败": "Request failed",
  "跟随界面语言": "Follow interface language",
  "这些规则控制 Agent 的 Skill 加载和 MCP 调用；源文件不会被修改。设置已持久保存，服务重启后仍然有效。": "These rules control Agent Skill loading and MCP calls without changing source files. Settings persist across service restarts.",
  "这里的全局与工作区规则仅作用于 DeepSeek Harness。默认只发现 DSH 自身的 Skill 和 MCP；其他应用来源可以单独开启。": "Global and workspace rules apply to DeepSeek Harness. DSH's own Skills and MCP are discovered by default; other application sources are optional.",
  "连接中": "Connecting",
  "连接失败，请检查源配置或重新启用": "Connection failed; check the configuration or enable it again",
  "部分 Skill 目录尚未完成扫描，请重新发现。": "Some Skill folders have not finished scanning. Discover again.",
  "重新发现": "Discover again",
  "重新翻译": "Retranslate",
  "重新翻译 ": "Retranslate ",
  "（跟随当前界面）": " (current interface selection)",
  "服务配置必须是对象。": "Server configuration must be an object.",
  "源配置中已禁用，请先在源配置中启用。": "Disabled in the source configuration. Enable it there first.",
  "此版本仅支持 stdio 和 Streamable HTTP。": "This version supports stdio and Streamable HTTP only.",
  "args 必须是字符串数组。": "args must be a string array.",
  "env 必须是字符串字典。": "env must be a string dictionary.",
  "HTTP 服务地址无效。": "Invalid HTTP server URL.",
  "headers 必须是字符串字典。": "headers must be a string dictionary.",
  "未发现 command 或 url。": "No command or URL found.",
  "DSH 服务环境中缺少配置引用的环境变量。": "A referenced environment variable is missing from the DSH service environment.",
  "文件超过 2 MiB，已跳过。": "File exceeds 2 MiB and was skipped.",
  "YAML 解析失败。": "Could not parse YAML.",
  "请求超过 64 KiB。": "Request exceeds 64 KiB.",
  "请求不是有效的 JSON 对象。": "Request is not a valid JSON object.",
  "工作区必须是绝对路径。": "Workspace must be an absolute path.",
  "工作区目录不存在或不可访问。": "Workspace folder is missing or inaccessible.",
  "能力类型无效。": "Invalid capability type.",
  "未发现此能力，请重新扫描。": "Capability was not discovered. Scan again.",
  "规则必须为启用、禁用或继承。": "Rule must be enabled, disabled, or inherited.",
  "此 MCP 来源于另一工作区，仅能在来源工作区启用。": "This MCP belongs to another workspace and can only be enabled there.",
  "批准连接参数无效。": "Invalid connection approval parameters.",
  "源配置已改变，请重新检查并批准。": "Source configuration changed. Review and approve it again.",
  "发现来源开关无效。": "Invalid discovery source option.",
  "请选择工作区。": "Choose a workspace.",
  "默认规则无效。": "Invalid default rule.",
  "操作无效。": "Invalid operation.",
  "翻译服务尚未就绪。": "Translation service is not ready.",
  "重新翻译参数无效。": "Invalid retranslation parameter.",
  "每次请选择 1–12 条说明。": "Select 1–12 descriptions per request.",
  "该能力已不在当前发现范围，请刷新后重试。": "Capability is no longer in this discovery scope. Refresh and try again.",
  "请求必须使用 application/json。": "Requests must use application/json.",
  "设置已在别处更新，请刷新后重试。": "Settings changed elsewhere. Refresh and try again.",
  "翻译目标语言无效，最多 160 字符。": "Invalid translation target; use at most 160 characters.",
  "模型返回的翻译格式不完整，请重试。": "Model returned an incomplete translation. Retry.",
  "模型未执行强制翻译，请重试。": "Model did not perform the forced translation. Retry.",
  "请先在 DeepSeek 界面选择可用的模型。": "Select an available model in the DeepSeek interface first.",
  "当前界面所选模型的服务尚未就绪。": "The selected model's service is not ready.",
  "每次最多翻译 12 条能力说明。": "Translate at most 12 capability descriptions per request.",
  "另一批翻译正在进行，请稍后重试。": "Another translation batch is in progress. Try again later.",
  "模型未完成翻译，请重试或减少翻译条数。": "Model did not finish translating. Retry or reduce the batch size.",
  "模型返回的翻译过长。": "Model translation response is too long.",
  "模型未返回有效的翻译 JSON，请重试。": "Model did not return valid translation JSON. Retry.",
  "模型遗漏了部分翻译，请重试。": "Model omitted some translations. Retry.",
  "请使用受信任的 Harness 页面访问设置。": "Open settings from a trusted Harness page.",
  "操作未完成，请刷新后重试。": "Operation did not complete. Refresh and retry.",
  "操作未完成，请重试。": "Operation did not complete. Retry.",
  "翻译已取消或超时，请重试。": "Translation was cancelled or timed out. Retry.",
  "当前模型翻译失败，请检查 DeepSeek 的模型连接后重试。": "Translation failed. Check the DeepSeek model connection and retry.",
  "策略文件无法读取，Skill 和 MCP 已暂停。请恢复 policy.json 备份后重启服务。": "Policy file is unreadable; Skills and MCP are paused. Restore the policy.json backup and restart."
};
let nativeTranslate = null, nativeLocale = null;
function tr(key, params) { return nativeTranslate ? nativeTranslate(key, params) : params ? key.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match) : key; }
function localeId() { const id = nativeLocale?.getSnapshot().active ?? 'zh'; try { return new Intl.Locale(id === 'zh' ? 'zh-CN' : id === 'pt' ? 'pt-BR' : id).toString(); } catch { return 'en'; } }
const escapePattern = value => [...value].map(c => c === String.fromCharCode(92) || '^$.*+?()[]{}|'.includes(c) ? String.fromCharCode(92) + c : c).join('');
const messagePatterns = Object.entries(zh).flatMap(([key, value]) => [value, en[key]].filter(text => text && /\{p\d+\}/.test(text)).map(text => ({key, names: [...text.matchAll(/\{(p\d+)\}/g)].map(match => match[1]), pattern: new RegExp('^' + text.split(/\{p\d+\}/).map(escapePattern).join('(.*?)') + '$', 's')})));
function messageText(value) {
  if (!value) return '';
  if (value.localized) return tr(value.localized.key, value.localized.params);
  const text = typeof value === 'string' ? value : value.message ?? String(value);
  if (Object.hasOwn(zh, text)) return tr(text);
  const reverse = Object.keys(en).find(key => en[key] === text); if (reverse) return tr(reverse);
  const prefix = text.match(/^(?:Error: |[A-Z_]+: )/)?.[0] ?? '', body = text.slice(prefix.length);
  if (Object.hasOwn(zh, body)) return prefix + tr(body);
  for (const row of messagePatterns) { const match = row.pattern.exec(body); if (match) return prefix + tr(row.key, Object.fromEntries(row.names.map((name, i) => [name, match[i + 1]]))); }
  return text;
}
function installLocale(ctx) {
  const release = ctx.locale.register(NS, { zh, en }), bound = ctx.locale.bind(NS);
  nativeTranslate = bound; nativeLocale = ctx.locale;
  return () => { if (nativeTranslate === bound) { nativeTranslate = null; nativeLocale = null; } release(); };
}
/* i18n:end */
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
    const statusLabels = { get connected(){return tr("已连接");}, get 'connected-no-tools'(){return tr("已连接／暂无工具");}, get connecting(){return tr("连接中");}, get error(){return tr("连接失败，请检查源配置或重新启用");}, get disconnected(){return tr("未连接");}, get native(){return tr("DSH 原生连接");}, get configured(){return tr("原生配置／未发现工具");} };
    async function request(path, value, signal) {
      const response = await fetch(BASE + path, { credentials: 'same-origin', cache: 'no-store', signal, ...(value === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || tr("请求失败")); return data;
    }
    function CapabilitySettings({ getModelContext, registeredWorkspaces, languageTarget, saveLanguageTarget, uiLocale }) {
      const [workspace, setWorkspace] = React.useState(''), [view, setView] = React.useState(null);
      const [tab, setTab] = React.useState('skills'), [search, setSearch] = React.useState(''), [error, setError] = React.useState('');
      const [busy, setBusy] = React.useState(false), [message, setMessage] = React.useState(''), [path, setPath] = React.useState('');
      const [progress, setProgress] = React.useState(''), [showTranslation, setShowTranslation] = React.useState(() => { try { return localStorage.getItem('dsh-capabilities-show-translations') !== 'false'; } catch { return true; } });
      const translating = React.useRef(null);
      const [targetDraft, setTargetDraft] = React.useState(languageTarget);
      React.useEffect(() => { setTargetDraft(languageTarget); }, [languageTarget]);
      const getTranslationContext = () => ({ ...getModelContext(), targetLanguage: languageTarget, uiLocale });
      const [translationOverrides, setTranslationOverrides] = React.useState({});
      const epoch = React.useRef(0), locked = React.useRef(false), revision = React.useRef(null);
      React.useEffect(() => {
        const current = ++epoch.current; setView(null); setError(''); setBusy(false); locked.current = false; setProgress(''); setTranslationOverrides({});
        async function load() {
          if (locked.current) return;
          try {
            const context = getTranslationContext();
            const params = new URLSearchParams({ workspace, targetLanguage: languageTarget, uiLocale, ...(context.sessionId ? { sessionId: context.sessionId } : {}), ...(context.selection ? { provider: context.selection.provider, model: context.selection.model } : {}) });
            const data = await request('/state?' + params);
            if (epoch.current !== current || locked.current) return;
            revision.current = data.revision; setView(data);
          } catch (cause) { if (epoch.current === current) setError(cause.message); }
        }
        load(); const timer = setInterval(() => { if (!document.hidden) load(); }, 4000);
        return () => { ++epoch.current; clearInterval(timer); translating.current?.abort(); };
      }, [workspace, languageTarget, uiLocale]);
      async function action(value) {
        if (locked.current || !view) return;
        const current = epoch.current; locked.current = true; setBusy(true); setError(''); setMessage('');
        try {
          const data = await request('/action', { workspace, revision: revision.current, ...getTranslationContext(), ...value });
          if (epoch.current === current) { revision.current = data.revision; setView(data); setMessage(value.action === 'refresh' ? tr("发现列表已刷新。") : tr("已保存，当前及后续 Agent 调用即时使用新规则。")); }
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
        const current = epoch.current, context = getTranslationContext();
        locked.current = true; setBusy(true); setError(''); setMessage(''); const cancel = new AbortController(); translating.current = cancel;
        try {
          let result, total = 0, skipped = 0;
          for (let offset = 0; offset < keys.length; offset += 12) {
            setProgress((force ? tr("正在重新翻译 ") : tr("正在翻译 ")) + (offset + 1) + '–' + Math.min(offset + 12, keys.length) + ' / ' + keys.length + tr(" 条…"));
            result = await request('/translate', { workspace, ...context, force, keys: keys.slice(offset, offset + 12) }, cancel.signal);
            if (epoch.current !== current) return;
            revision.current = result.view.revision; setView(result.view); total += result.count; skipped += result.skipped ?? 0;
          }
          if (showAll) { setShowTranslation(true); setTranslationOverrides({}); try { localStorage.setItem('dsh-capabilities-show-translations', 'true'); } catch {} }
          else setTranslationOverrides(previous => ({ ...previous, ...Object.fromEntries(keys.map(key => [key, true])) }));
          setMessage(tr("已处理 {p0} 条，{p1} 条已是目标语言 · {p2}", {p0: total, p1: skipped, p2: result.target.label}));
        } catch (cause) { if (epoch.current === current && cause.name !== 'AbortError') setError(cause.message); }
        finally { if (translating.current === cancel) { if (epoch.current === current) { setProgress(''); setBusy(false); } locked.current = false; translating.current = null; } }
      }
      function translationShown(key) { return translationOverrides[key] ?? showTranslation; }
      function translateIcon() {
        return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('path', { d: 'M2 5h12M7 2v3m-3 3 6 6M12 5c-1 4-4 7-8 9m8 8 5-10 5 10m-8-4h6' }));
      }
      function translationActions(item, key) {
        const sameLanguage = item.translation?.status === 'same_language', translated = item.translation && !sameLanguage;
        const shown = !!translated && translationShown(key);
        const label = translated ? (shown ? tr("查看原文") : tr("查看译文")) : tr("翻译说明");
        return h('div', { className: 'wc-translation-actions' },
          sameLanguage && h('span', { className: 'wc-muted' }, tr("已是目标语言")),
          translated && button(tr("重新翻译"), () => translate([key], { force: true }), { disabled: busy || !view.translation.available, 'aria-label': tr("重新翻译 ") + item.name, title: tr("使用当前模型重新翻译并更新缓存") }),
          button(translateIcon(), () => translated ? setTranslationOverrides(previous => ({ ...previous, [key]: !shown })) : translate([key], { force: true }),
            { className: 'wc-translate-icon', disabled: busy || (!translated && !view.translation.available), 'aria-label': label + ' ' + item.name, title: label, 'aria-pressed': shown }));
      }
      function description(item, key) {
        const translated = translationShown(key) && item.translation?.status !== 'same_language' && item.translation;
        return h(React.Fragment, null,
          translated?.title && translated.title !== item.name && h('p', { className: 'wc-translated-title' }, translated.title),
          translated?.description ? h(React.Fragment, null, h('p', { className: 'wc-description wc-translated' }, translated.description),
            h('details', { className: 'wc-source' }, h('summary', null, tr("查看原文")), h('p', { className: 'wc-description' }, item.description))) : item.description && h('p', { className: 'wc-description' }, item.description));
      }
      function renderItem(item) {
        const isMcp = tab === 'mcp', key = isMcp ? item.id : item.name;
        const foreign = isMcp && item.workspace && workspace !== item.workspace;
        const select = h('select', { 'aria-label': item.name + tr(" 规则"), className: 'wc-rule', value: item.rule === null ? 'inherit' : String(item.rule), disabled: busy || !!view.error || !!foreign,
          onChange: event => action({ action: 'rule', kind: tab, key, value: event.target.value === 'inherit' ? null : event.target.value === 'true' }) },
          h('option', { value: 'inherit' }, workspace ? tr("继承全局") : tr("使用默认")), h('option', { value: 'true' }, tr("启用")), h('option', { value: 'false' }, tr("禁用")));
        return h('article', { className: 'wc-card', key, 'data-capability': key },
          h('div', { className: 'wc-row' }, h('strong', { className: 'wc-name' }, item.name),
            h('span', { className: 'wc-badge ' + (item.enabled ? 'wc-on' : 'wc-off') }, item.enabled ? tr("可用") : isMcp && item.requested && !item.approved ? tr("待批准") : tr("已禁用")), select),
          description(item, (isMcp ? 'mcp:' : 'skill:') + key),
          h('p', { className: 'wc-source' }, tr("来源：") + (item.path || item.source) + (!isMcp ? ' · ' + item.provider : '')),
          isMcp && h(React.Fragment, null,
            item.workspace && h('p', { className: 'wc-source' }, tr("所属工作区：") + item.workspace),
            h('p', { className: 'wc-muted' }, item.transport + ' · ' + item.launch),
            h('p', { className: 'wc-muted' }, statusLabels[item.status] + ' · ' + item.tools + tr(" 个工具")),
            item.toolDetails?.length > 0 && h('details', null, h('summary', null, tr("工具说明 (") + item.toolDetails.length + ')'), h('div', { className: 'wc-tools' }, ...item.toolDetails.map(tool => h('div', { className: 'wc-tool', key: tool.name }, h('p', { className: 'wc-name' }, tool.name), description(tool, 'tool:' + tool.name), translationActions(tool, 'tool:' + tool.name))))),
            item.envNames?.length > 0 && h('p', { className: 'wc-source' }, tr("环境变量名称：") + item.envNames.join('、')),
            item.problem && h('p', { className: 'wc-error' }, item.problem),
            foreign && h('p', { className: 'wc-muted' }, tr("切换到该来源工作区后可设置。")),
            !item.native && !item.approved && item.valid && !foreign && button(tr("批准配置并启用连接"), () => action({ action: 'approve', kind: 'mcp', key, value: true, fingerprint: item.fingerprint }), { className: 'wc-primary', disabled: busy || !!view.error }),
            item.approved && !item.native && h('p', { className: 'wc-source' }, tr("此配置已批准；修改源配置后需要重新批准。"))),
          workspace && h('p', { className: 'wc-source' }, tr("全局：") + (item.global ? tr("启用") : tr("禁用")) + (item.rule === null ? tr(" · 当前继承全局") : tr(" · 当前使用工作区规则"))),
          translationActions(item, (isMcp ? 'mcp:' : 'skill:') + key));
      }
      return h('section', { className: 'wc-page' },
        h('h2', null, tr("Skill 与 MCP")),
        h('p', { className: 'wc-muted' }, tr("这里的全局与工作区规则仅作用于 DeepSeek Harness。默认只发现 DSH 自身的 Skill 和 MCP；其他应用来源可以单独开启。")),
        view && h('div', { className: 'wc-card' },
          h('label', { className: 'wc-default' }, h('input', { type: 'checkbox', checked: view.discovery.includeExternal, disabled: busy || !!view.error,
            onChange: event => action({ action: 'discovery', value: event.target.checked }) }), tr("扫描其他应用的 Skill / MCP（全局）")),
          h('p', { className: 'wc-muted' }, tr("可选读取 CC Switch 共享 Skill 目录，以及 Codex、Claude、Cursor 配置。扫描只读取来源；新能力默认禁用，MCP 首次连接仍需批准。"))),
        h('div', { className: 'wc-row wc-scope-controls' }, h('label', { className: 'wc-grow' }, tr("规则范围"), h('select', { 'aria-label': tr("规则范围"), value: workspace, disabled: busy, onChange: event => setWorkspace(event.target.value) },
          h('option', { value: '' }, tr("全局默认")), ...[...workspaceOptions.values()].sort((a, b) => a.path.localeCompare(b.path)).map(item => h('option', { key: item.path, value: item.path }, item.title + ' — ' + item.path)))),
          button(tr("重新发现"), () => action({ action: 'refresh' }), { disabled: busy || !view })),
        h('details', null, h('summary', { className: 'wc-muted' }, tr("添加已有目录的工作区规则")),
          h('div', { className: 'wc-row' }, h('input', { className: 'wc-grow', 'aria-label': tr("工作区绝对路径"), placeholder: tr("/home/用户名/项目"), value: path, onChange: event => setPath(event.target.value) }),
            button(tr("添加工作区"), () => action({ action: 'workspace', workspace: path }), { disabled: busy || !view || !path.startsWith('/') }))),
        error && h('p', { className: 'wc-error', role: 'alert' }, messageText(error)), view?.error && h('p', { className: 'wc-error', role: 'alert' }, messageText(view.error)),
        message && h('p', { className: 'wc-success', role: 'status' }, messageText(message)),
        progress && h('p', { className: 'wc-progress', role: 'status' }, messageText(progress)),
        !view ? h('p', { className: 'wc-muted' }, tr("正在读取能力列表…")) : h(React.Fragment, null,
          h('div', { className: 'wc-row wc-tabs', role: 'tablist', 'aria-label': tr("能力类型") },
            ...[['skills', 'Skills', view.skills.length], ['mcp', 'MCP', view.mcp.length]].map(([value, label, count]) => button(label + ' (' + count + ')', () => setTab(value), { key: value, role: 'tab', 'aria-selected': tab === value }))),
          h('div', { className: 'wc-card' },
            h('form', { className: 'wc-row', onSubmit: async event => { event.preventDefault(); if (busy) return; setBusy(true); setError(''); try { await saveLanguageTarget(targetDraft); setMessage(tr("翻译目标语言已保存。")); } catch (cause) { setError(cause.message); } finally { setBusy(false); } } },
              h('label', { className: 'wc-grow' }, tr("翻译成"), h('input', { value: targetDraft, maxLength: 160, list: 'wc-language-targets', 'aria-label': tr("翻译成"), placeholder: tr("跟随界面语言"), onChange: event => setTargetDraft(event.target.value), disabled: busy })),
              h('datalist', { id: 'wc-language-targets' }, ...[tr("简体中文"), tr("繁體中文"), 'English', tr("日本語"), 'Español', 'Français', 'Deutsch', 'Русский', 'Português'].map(value => h('option', { key: value, value }))),
              h('button', { type: 'submit', disabled: busy || targetDraft === languageTarget }, tr("保存语言"))),
            h('p', { className: 'wc-muted' }, tr("翻译模型：") + ((getModelContext().selection ?? view.translation.model) ? (getModelContext().selection ?? view.translation.model).model + tr("（跟随当前界面）") : tr("请先选择模型"))),
            h('label', { className: 'wc-default' }, h('input', { type: 'checkbox', checked: showTranslation, onChange: event => { setShowTranslation(event.target.checked); setTranslationOverrides({}); try { localStorage.setItem('dsh-capabilities-show-translations', String(event.target.checked)); } catch {} } }), tr("显示译文")),
            button(tr("翻译当前列表"), () => translate(items.flatMap(item => tab === 'skills' ? ['skill:' + item.name] : ['mcp:' + item.id, ...(item.toolDetails ?? []).map(tool => 'tool:' + tool.name)]), { showAll: true }), { disabled: busy || !view.translation.available || !items.length }),
            h('p', { className: 'wc-muted' }, tr("点击后使用当前界面所选模型翻译名称和说明，结果保存在本地缓存。同语默认保留原文，单项按钮可强制翻译。原始标识符和 Agent 调用保持不变。"))),
          !workspace && h('label', { className: 'wc-default' }, h('input', { type: 'checkbox', checked: view.defaults[tab], disabled: busy || !!view.error,
            onChange: event => action({ action: 'defaults', kind: tab, value: event.target.checked }) }), tab === 'skills' ? tr("新发现的 Skill 默认启用") : tr("已批准的 MCP 默认启用")),
          h('input', { type: 'search', 'aria-label': tr("搜索能力"), placeholder: tr("搜索名称、说明或来源路径"), value: search, onChange: event => setSearch(event.target.value) }),
          h('p', { className: 'wc-muted' }, workspace ? tr("工作区：") + workspace : tr("全局规则将应用到未单独设置的工作区。")),
          h('div', { className: 'wc-list' }, ...items.map(renderItem)),
          !items.length && h('p', { className: 'wc-muted' }, search ? tr("没有匹配的能力。") : tab === 'mcp' ? tr("当前范围未发现 MCP。DSH 配置和工作区 .dsh/mcp.json 会自动发现；其他应用需打开上方扫描开关。") : tr("当前范围未发现 Skill。这里展示 DeepSeek 已注册的 Skill；其他应用需打开上方扫描开关。")),
          view.issues.length > 0 && h('details', null, h('summary', null, tr("发现过程中的问题 (") + view.issues.length + ')'), ...view.issues.map(item => h('p', { className: 'wc-source', key: item.source }, item.source + '：' + item.message))),
          !view.complete && h('p', { className: 'wc-muted' }, tr("部分 Skill 目录尚未完成扫描，请重新发现。")),
          h('p', { className: 'wc-muted' }, tr("这些规则控制 Agent 的 Skill 加载和 MCP 调用；源文件不会被修改。设置已持久保存，服务重启后仍然有效。"))));
    }
    function apply(ctx) {
      ctx.effect(() => installLocale(ctx), 'locale: dictionaries');
      ctx.effect(() => { const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style); return () => style.remove(); }, 'capabilities: styles');
      const languageForm = ctx.configForms.get('workspace-capabilities');
      const subscribeLanguage = listener => languageForm.subscribe(listener), languageSnapshot = () => languageForm.getSnapshot();
      const subscribeLocale = listener => ctx.locale.subscribe(listener), localeSnapshot = () => ctx.locale.getSnapshot();
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
        const language = React.useSyncExternalStore(subscribeLanguage, languageSnapshot), locale = React.useSyncExternalStore(subscribeLocale, localeSnapshot);
        const saveLanguageTarget = async value => { if (!await languageForm.set('translationTargetLanguage', value.trim())) throw new Error(tr("翻译目标语言未保存，请刷新后重试。")); };
        return h(CapabilitySettings, { getModelContext, registeredWorkspaces: snapshot.items, languageTarget: language.value?.translationTargetLanguage ?? '', saveLanguageTarget, uiLocale: locale.active });
      }
      ctx.slots.inject('settings.section', () => ctx.slots.register({ name:'settings.section',locale:NS, id: 'workspace-capabilities', order: 20, label: () => tr("Skill 与 MCP") }, Page));
    }
    return { name: 'workspace-capabilities-client', inject: ['slots', 'uiSession', 'modelDirectories', 'workspaces', 'configForms', 'locale'], apply };
  }
});
