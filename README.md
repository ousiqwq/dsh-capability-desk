# DSH Capability Desk

**DeepSeek Harness 的 Skill 与 MCP 能力控制台。**

Control which Skills and MCP servers DeepSeek Harness can use globally and per workspace, with optional discovery and cached model-powered Chinese translations.

进入 **设置 → Skill 与 MCP**，管理当前 Agent 可用的能力。包名为 `dsh-plugin-workspace-capabilities`。

## 功能

- **全局与工作区规则**：每个工作区可选择继承全局、启用或禁用；子 Agent 继承根会话的工作区。
- **默认只发现 DSH 自身配置**：额外来源需手动开启，可读取 CC Switch 共享技能目录及 Codex、Claude、Cursor 配置。
- **Skill 控制**：过滤能力目录，并在正文加载时再次检查规则。
- **MCP 控制**：使用 DSH 原生 stdio / Streamable HTTP 客户端，控制工具、资源和相关提示词；新连接需要明确批准。
- **中文翻译**：使用当前界面选择的模型翻译名称和说明，无会话时使用 DSH 默认模型；仅在点击翻译时调用模型。
- **译文缓存**：按模型及原文区分，保存在本地。卡片右下角图标切换原文和译文，「重新翻译」更新缓存，失败时保留旧译文。
- **持久化与修订检查**：原子保存策略、保留上一版本，并防止多个页面覆盖彼此的修改。
- **响应式设置页**：支持深浅主题和窄窗口，翻译操作位于卡片右下角。

扫描来源只读取配置，不修改其他应用的设置。关闭额外来源会移除相关 Skill 目录监听，并停止本插件管理的外部 MCP 连接。

## 兼容性

当前版本已验证：

| 组件 | 版本 |
| --- | --- |
| DeepSeek Harness | `0.2.1-rc.3` |
| Node.js | `26` |
| Cordis | `4.0.5` |

插件依赖 DSH 原生服务接口。其他 Harness 版本需要重新验证兼容性。

## 安装

先安装并运行支持上述版本的 DeepSeek Harness。下载 [v1.2.0 插件包](https://github.com/ousiqwq/dsh-capability-desk/releases/download/v1.2.0/dsh-plugin-workspace-capabilities-1.2.0.tgz)，然后执行：

```bash
dsh plugin --profile web add ./dsh-plugin-workspace-capabilities-1.2.0.tgz
```

也可以直接使用下载链接：

```bash
dsh plugin --profile web add https://github.com/ousiqwq/dsh-capability-desk/releases/download/v1.2.0/dsh-plugin-workspace-capabilities-1.2.0.tgz
```

在 DSH 插件页面启用 `dsh-plugin-workspace-capabilities`，重启 DSH 并刷新页面，打开 **设置 → Skill 与 MCP**。已安装并启用的版本更新后无需重复启用。

### 从源码打包

```bash
git clone https://github.com/ousiqwq/dsh-capability-desk.git
cd dsh-capability-desk
npm ci --ignore-scripts
npm run check
npm test
npm pack
```

将生成的 `.tgz` 按上面的方式安装。项目以普通 JavaScript ES Modules 编写，无需编译。

## 使用

1. 选择 **全局默认**，设置 Skill 或 MCP 的默认规则。
2. 选择某个工作区，为其设置 **继承全局 / 启用 / 禁用**。
3. 需要其他应用来源时，勾选 **扫描其他应用的 Skill / MCP**。
4. 对首次接入的 MCP 检查来源并点击 **批准配置并启用连接**。源配置变化后需要重新批准。
5. 点击卡片右下角翻译图标查看译文；已有缓存时，切换显示无需调用模型。

DSH 已注册的 Skill 由原生提供器发现。MCP 默认扫描 DSH 配置、`~/.dsh/mcp.json`、工作区 `.dsh/mcp.json` 以及 DSH 当前的工具注册表。MCP JSON 使用 `mcpServers` 对象，例如：

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

运行时数据存放在 `$DSH_HOME/workspace-capabilities/`，默认是 `~/.dsh/workspace-capabilities/`：

| 文件 | 用途 |
| --- | --- |
| `policy.json` | 全局、工作区规则、来源开关与配置批准记录 |
| `policy.json.bak` | 上一次保存的策略 |
| `translations.json` | 本地译文缓存 |

模型翻译仅提交能力名称和说明，不提交 Skill 正文、MCP 环境变量或认证头。翻译使用现有模型服务，可能消耗对应服务的额度。SSE 和其他应用的私有 OAuth 状态不会导入。

## 测试与实现

`npm test` 包含 40 项自动测试，使用真实的 DSH Skill 注册器、工具执行器及原生 MCP 客户端；模型调用使用测试桩。浏览器布局和真实模型的手动验证方法见 [测试说明](docs/TESTING.md)。

| 文件 | 职责 |
| --- | --- |
| `index.js` | 插件及来源生命周期 |
| `client.js` | 设置面板与翻译控件 |
| `runtime.js` | Skill/MCP 执行策略 |
| `discovery.js` | MCP 配置发现 |
| `translations.js` | 模型选择、翻译与缓存 |
| `store.js` / `policy.js` | 策略持久化与规则 |
| `http-api.js` | 设置接口与来源认证 |

规则控制后续的 Skill 加载及 MCP 调用，不能撤回已经进入模型上下文的内容。普通文件和终端工具不在本插件控制范围内，因此这些规则不构成操作系统沙箱。网页接口沿用 DSH 自身的认证及受信来源检查。

## License

[MIT](LICENSE) © 2026 osiqwq
