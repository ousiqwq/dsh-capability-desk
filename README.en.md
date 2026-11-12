# DSH Capability Desk

[简体中文](https://github.com/ousiqwq/dsh-capability-desk/blob/main/README.md) | **English**

A Skill and MCP manager for DeepSeek Harness. Control available capabilities globally or per workspace, discover configured Skills and MCP servers, and translate names and descriptions using the current model.

Open **Settings → Skills & MCP**. Package: `dsh-plugin-workspace-capabilities`.

The interface uses DSH native i18n and follows language changes immediately. Chinese and English dictionaries are included; other interface languages use the native English fallback.

## One-command installation

Compatible with DeepSeek Harness **0.2.1-rc.3 / 0.2.1-rc.5 / 0.2.2-rc.2** and Node.js **26**.

```bash
dsh plugin --profile web add dsh-plugin-workspace-capabilities
```

Enable the plugin in DSH's plugin manager, restart DSH, refresh the page, and open **Settings → Skills & MCP**.

## Features

- **Global and workspace rules:** inherit, enable, or disable individual capabilities. Workspace labels follow sidebar renames in real time.
- **Discovery:** scan DSH by default; optionally include CC Switch's shared Skills and Codex, Claude, or Cursor configurations.
- **Skill controls:** manage catalog visibility and content loading. Disabled items remain visible in settings.
- **MCP controls:** native stdio and Streamable HTTP clients, tools, resources, related prompts, connection status, and tool descriptions.
- **Capability translations:** choose a target language or follow the interface, translate with the selected model, cache results, skip matching languages, or force an individual translation.
- **Persistent updates:** apply rules to subsequent calls with revision checks, hot-reload support, light/dark themes, and responsive layouts.

### Workspace rules and Skill translations

Select a scope, change each capability's rule, and toggle translated text using the bottom-right icon.

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
6. Choose **Translate this list** to translate in batches. Matching languages stay unchanged; individual translation buttons can force a fresh translation. Use **Retranslate** to refresh a cached result.

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

Enter a target in **Translate into**, or leave it blank to follow the DSH interface. The preference is persisted through native DSH settings. Source languages are detected automatically. Same-language items retain their original text by default; item translation and retranslation buttons force a fresh translation. The first classification uses the selected model; decisions and translations are cached by target, model, and source content. Opening settings and discovering capabilities do not call a model. Translated labels and descriptions only affect presentation, preserving Skill/MCP identifiers and calls.

Translations use capability names and descriptions while retaining original identifiers and Agent calls. Viewing cached text does not trigger translation. Failed retranslations retain the previous result.

Data is stored in `$DSH_HOME/workspace-capabilities/`, or `~/.dsh/workspace-capabilities/` by default:

| File | Purpose |
| --- | --- |
| `policy.json` | Global/workspace rules, discovery options, and configuration approvals |
| `policy.json.bak` | Previous policy revision |
| `translations.json` | Translation cache |

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
