# DSH Capability Desk

**简体中文** | [English](https://github.com/ousiqwq/dsh-capability-desk/blob/main/README.en.md)

DeepSeek Harness 的 Skill 与 MCP 管理插件。按全局或工作区设置可用能力，发现已配置的 Skill/MCP，并使用当前模型翻译名称和说明。

入口：**设置 → Skill 与 MCP** · 插件包：`dsh-plugin-workspace-capabilities`

界面接入 DSH 原生 i18n，实时跟随 DSH 的语言设置。内置中英文词典；其他界面语言按 DSH 的规则回退到英文。

## 功能

- **全局与工作区规则**：为每项能力选择继承、启用或禁用；工作区名称随侧边栏重命名实时更新。
- **能力发现**：默认扫描 DSH 自身；可选读取 CC Switch 共享 Skill 目录及 Codex、Claude、Cursor 配置。
- **Skill 控制**：管理能力目录与正文加载；禁用的项目仍保留在设置列表中。
- **MCP 控制**：支持原生 stdio / Streamable HTTP 客户端，管理工具、资源及相关提示词，查看连接状态和工具说明。
- **能力翻译**：目标语言可自定义，默认跟随界面；使用当前模型翻译并缓存，支持同语跳过和单项强制翻译。
- **即时保存**：规则用于后续调用，支持修订检查、热更新、深浅主题与窄屏。

### 工作区规则与 Skill 翻译

选择规则范围，单独调整能力状态，在卡片右下角切换译文。

![工作区 Skill 规则与译文](https://raw.githubusercontent.com/ousiqwq/dsh-capability-desk/main/docs/images/skills.png?v=1.3.2)

### MCP 连接与工具说明

查看来源、连接状态与工具列表，为每个 MCP 设置可用规则。

![MCP 状态、工具说明与翻译](https://raw.githubusercontent.com/ousiqwq/dsh-capability-desk/main/docs/images/mcp.png?v=1.3.2)

## 一键安装

兼容 DeepSeek Harness **0.2.1-rc.3 / 0.2.1-rc.5 / 0.2.2-rc.2**，Node.js **26**。

```bash
dsh plugin --profile web add dsh-plugin-workspace-capabilities
```

在插件管理中启用插件，重启 DSH 并刷新页面，打开 **设置 → Skill 与 MCP**。

## 使用

1. 选择 **全局默认**，设定新能力默认状态及各项能力的规则。
2. 选择工作区，设置 **继承全局 / 启用 / 禁用**。
3. 需要额外来源时，开启 **扫描其他应用的 Skill / MCP**。
4. 对新发现的外部 MCP 点击 **批准配置并启用连接**；配置发生变化后重新批准。
5. 在 **翻译成** 设置目标语言并点击 **保存语言**，留空跟随界面。
6. 点击 **翻译当前列表** 批量翻译，同语默认保留原文；单项翻译按钮可强制翻译，**重新翻译** 会更新缓存。

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

在“翻译成”填写目标语言，留空跟随 DSH 界面；设置通过 DSH 原生配置接口持久保存。原语言自动判断。同语内容默认保留原文，单项翻译与重新翻译按钮可强制生成译文。首次同语判断使用当前模型，结果和译文均按目标语言、模型及原文内容缓存；打开设置或发现列表不会自动调用模型。名称和说明的译文仅用于显示，Skill/MCP 标识符和调用保持原样。

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

项目使用 JavaScript ES Modules，无需编译。浏览器检查命令见 [TESTING.md](https://github.com/ousiqwq/dsh-capability-desk/blob/main/docs/TESTING.md)。

## 许可证

[MIT](https://github.com/ousiqwq/dsh-capability-desk/blob/main/LICENSE) © 2026 osiqwq
