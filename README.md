# DSH Capability Desk

**简体中文** | [English](README.en.md)

DeepSeek Harness 的 Skill 与 MCP 管理插件。按全局或工作区设置可用能力，发现已配置的 Skill/MCP，并使用当前模型翻译名称和说明。

入口：**设置 → Skill 与 MCP** · 插件包：`dsh-plugin-workspace-capabilities`

## 功能

- **全局与工作区规则**：为每项能力选择继承、启用或禁用；工作区名称随侧边栏重命名实时更新。
- **能力发现**：默认扫描 DSH 自身；可选读取 CC Switch 共享 Skill 目录及 Codex、Claude、Cursor 配置。
- **Skill 控制**：管理能力目录与正文加载；禁用的项目仍保留在设置列表中。
- **MCP 控制**：支持原生 stdio / Streamable HTTP 客户端，管理工具、资源及相关提示词，查看连接状态和工具说明。
- **中文翻译**：跟随当前界面模型；无会话时使用默认模型。译文按模型和原文缓存，可切换原文或重新翻译。
- **即时保存**：规则用于后续调用，支持修订检查、热更新、深浅主题与窄屏。

### 工作区规则与 Skill 翻译

选择规则范围，单独调整能力状态，在卡片右下角切换译文。

![工作区 Skill 规则与中文译文](docs/images/skills.png)

### MCP 连接与工具说明

查看来源、连接状态与工具列表，为每个 MCP 设置可用规则。

![MCP 状态、工具说明与翻译](docs/images/mcp.png)

## 安装

兼容 DeepSeek Harness **0.2.1-rc.3 / 0.2.1-rc.5**，Node.js **26**。其他 Harness 版本需确认接口兼容性。

```bash
dsh plugin --profile web add https://github.com/ousiqwq/dsh-capability-desk/releases/download/v1.2.3/dsh-plugin-workspace-capabilities-1.2.3.tgz
```

在插件管理中启用插件，重启 DSH 并刷新页面，打开 **设置 → Skill 与 MCP**。也可以从 [Releases](https://github.com/ousiqwq/dsh-capability-desk/releases) 下载后本地安装。

## 使用

1. 选择 **全局默认**，设定新能力默认状态及各项能力的规则。
2. 选择工作区，设置 **继承全局 / 启用 / 禁用**。
3. 需要额外来源时，开启 **扫描其他应用的 Skill / MCP**。
4. 对新发现的外部 MCP 点击 **批准配置并启用连接**；配置发生变化后重新批准。
5. 点击翻译图标查看译文，或用 **翻译当前列表** 批量翻译。**重新翻译** 会更新缓存。

子 Agent 沿用根会话的工作区规则。修改不需要新建对话；已加载到模型上下文中的内容不会被撤回。普通文件与终端工具仍遵循 DSH 自身权限。

## 发现来源

Skill 由 DSH 的原生提供器发现。MCP 来源包括 DSH 配置、`~/.dsh/mcp.json`、工作区 `.dsh/mcp.json` 与当前工具注册表。MCP JSON 示例：

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

扫描读取来源配置；规则只影响 DSH。关闭额外来源会移除相关 Skill 监听，并停止本插件管理的外部 MCP 连接。SSE 与其他应用的私有 OAuth 状态不在导入范围内。

## 翻译与存储

翻译使用能力名称与说明，保留原始标识符和 Agent 调用方式。已有缓存时切换显示不发起新的翻译；重新翻译失败会保留旧译文。

数据位于 `$DSH_HOME/workspace-capabilities/`，默认 `~/.dsh/workspace-capabilities/`：

| 文件 | 用途 |
| --- | --- |
| `policy.json` | 全局与工作区规则、来源选项、配置批准记录 |
| `policy.json.bak` | 上一版策略 |
| `translations.json` | 译文缓存 |

## 开发

```bash
npm ci --ignore-scripts
npm run check
npm test
npm pack
```

项目使用 JavaScript ES Modules，无需编译。浏览器检查命令见 [TESTING.md](docs/TESTING.md)。

## 许可证

[MIT](LICENSE) © 2026 osiqwq
