# DSH Capability Desk

[简体中文](https://github.com/ousiqwq/dsh-capability-desk/blob/main/README.md) | **English**

A Skill and MCP manager for DeepSeek Harness. Control available capabilities globally or per workspace, discover configured Skills and MCP servers, and translate names and descriptions using the current model.

Open **Settings → Skills & MCP**. Package: `dsh-plugin-workspace-capabilities`.

The interface uses DSH native i18n and follows language changes immediately. Chinese and English dictionaries are included; other interface languages use the native English fallback.

## One-command installation

Compatible with DeepSeek Harness **0.2.1-rc.3 / 0.2.1-rc.5 / 0.2.2-rc.2** and Node.js **26**.

Install with **npx** (Node.js 26; no global dsh or pnpm installation required):

```bash
npx --yes --package=@deepseek-ai/dsh@0.2.2-rc.2 --package=pnpm@11.28.5 dsh plugin --profile web add dsh-plugin-workspace-capabilities@latest
```

Run this on the DSH host with the same account and `DSH_HOME` as your existing instance. The command pins the verified official CLI and installs the latest plugin into the `web` profile. With the DSH CLI already installed, you can also use:

```bash
dsh plugin --profile web add dsh-plugin-workspace-capabilities
```

Enable the plugin in DSH's plugin manager, restart DSH, refresh the page, and open **Settings → Skills & MCP**.

## Agent preset compatibility

Verified against the native DeepSeek Harness **0.2.2-rc.2** Web service using real sessions, executors and file APIs:

| Preset | Capability Desk | Soul Desk | File Bridge |
| --- | --- | --- | --- |
| Standard `standard` | Skill/MCP catalogs, rules and invocation guards work | All three injection modes, memories and child policies work | Download and access checks work |
| PTC `ptc` | Disabled tools are omitted from the SDK and nested calls remain guarded | Preserves the `run_code` protocol and SDK; memory tools work through SDK calls | Works independently of tool-call style |
| Minimal `minimal` | Rules work without adding a Skill loader, editor or subagent tools | Persona and memory support preserves the preset's existing tool boundary | Works |
| Creation `cordis` | Skill/MCP rules preserve native creation tools | All three injection modes, memories and child policies work | Works |

Minimal does not ship a Skill loader or subagents; enabling a Skill does not install those tools into that preset. Global plugins can still contribute their own memory or MCP tools. Soul child policies default to no persona; parent reuse is explicit. Soul's Complete mode replaces the preset's prompt body while preserving executor protocol/SDK sections, tool schemas and native runtime context. Use Priority or Append to keep the original task instructions. Custom presets that isolate or replace underlying registries, and external ACP backends, need separate verification.

See [four-preset acceptance](docs/AGENT-PRESET-COMPATIBILITY.md).

## Features

- **Global and workspace rules:** inherit, enable, or disable individual capabilities. Workspace labels follow sidebar renames in real time.
- **Discovery:** scan DSH by default; optionally include CC Switch's shared Skills and Codex, Claude, or Cursor configurations.
- **Skill controls:** manage catalog visibility and content loading. Disabled items remain visible in settings.
- **MCP controls:** native stdio and Streamable HTTP clients, tools, resources, related prompts, connection status, and tool descriptions.
- **Capability translations:** choose a target language or follow the interface, translate with the selected model, cache results, skip matching languages, or force an individual translation.
- **Persistent updates:** apply rules to subsequent calls with revision checks, hot-reload support, light/dark themes, and responsive layouts.

### Workspace rules and Skill translations

Select a scope, change each capability's rule, and manage translated text using the item icons and Show translations switch.

![Workspace Skill rules and translations](https://raw.githubusercontent.com/ousiqwq/dsh-capability-desk/main/docs/images/skills.en.png?v=1.3.2)

### MCP connections and tool descriptions

Inspect sources, connection status, and tool lists, and configure availability for each server.

![MCP connection status, tool descriptions, and translations](https://raw.githubusercontent.com/ousiqwq/dsh-capability-desk/main/docs/images/mcp.en.png?v=1.3.2)

## Usage

1. Choose **Global default** to configure defaults and individual capability rules.
2. Select a workspace and choose **Inherit global / Enable / Disable**.
3. Enable **Scan other applications’ Skills / MCP (global)** when additional sources are needed.
4. Select **Approve configuration and enable connection** for newly discovered external MCP servers. Changed configurations require approval again.
5. Set **Translate into** and choose **Save language**, or leave the target blank to follow the interface.
6. Valid cached translations appear automatically without a model call. Each item has one translation icon: one click regenerates its translation using the current model, including same-language content. Only **Translate this list** skips matching languages and reuses cached results. **Show translations** can temporarily show originals; reopening the page defaults to cached translations again.

Subagents use the root session's workspace rules. Changes do not require a new conversation, but cannot retract content already loaded into the model context. Ordinary file and terminal tools continue to follow DSH's own permissions.

## Discovery sources

Skills come from DSH's native providers. MCP sources include DSH configuration, `~/.dsh/mcp.json`, workspace `.dsh/mcp.json`, and the active tool registry. Example MCP JSON:

```json
{
  "mcpServers": {
    "example": {
      "command": "your-mcp-command",
      "args": []
    }
  }
}
```

Discovery reads source configurations; rules affect DSH. Turning off additional sources removes the associated Skill watchers and stops external MCP connections managed by this plugin. SSE and other applications' private OAuth state are not imported.

## Translation and storage

Enter a target in **Translate into**, or leave it blank to follow the DSH interface. The preference is persisted through native DSH settings. Model context follows DSH's native current-session state live and is read again before each request. If a retained session model is absent from the available catalog, translation uses the current DSH default and explains the fallback without changing the session selection. Batch translation detects source languages and may preserve same-language content; each item button always forces translation. Displayed caches are identified by original content and target language, so changing models does not hide them. Existing model-specific records are retained; native model history can rebuild display references for old entries. Opening settings, changing models and discovering capabilities do not call a model. Translated labels and descriptions only affect presentation, preserving Skill/MCP identifiers and calls.

Translations use capability names and descriptions while retaining original identifiers and Agent calls. Viewing cached text does not trigger translation. Failed retranslations retain the previous result.

Data is stored in `$DSH_HOME/workspace-capabilities/`, or `~/.dsh/workspace-capabilities/` by default:

| File | Purpose |
| --- | --- |
| `policy.json` | Global/workspace rules, discovery options, and configuration approvals |
| `policy.json.bak` | Previous policy revision |
| `translations.json` | Translation cache |

Each item has Remove translation and Retranslate icons. Removal clears only that item’s cache for the current target language and restores its original text; Retranslate regenerates with the current model in one click. Up to eight translation requests run concurrently, with additional items queued. You can keep adding other items while jobs run, and failed jobs do not block the queue. Cached translations are still shown automatically.

## Development

```bash
npm ci --ignore-scripts
npm run check
npm test
npm pack
```

The plugin uses JavaScript ES Modules and needs no build step. See [TESTING.md](https://github.com/ousiqwq/dsh-capability-desk/blob/main/docs/TESTING.md) for browser checks.

## License

[MIT](https://github.com/ousiqwq/dsh-capability-desk/blob/main/LICENSE) © 2026 osiqwq
