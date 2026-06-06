# 🌐 Transcise — Markdown Translator

> Chrome 浏览器插件，自动渲染 Markdown 文件并通过 DeepSeek AI 实时翻译。支持双语对照、仅译文、仅原文三种模式。

## 功能

- **自动检测** — 打开任意 .md 文件自动激活，无需手动操作
- **一键翻译** — 配置 DeepSeek API Key 即可翻译，首批 20 段，滚动续翻
- **三种显示模式** — 双语对照 / 仅译文 / 仅原文，一键切换
- **预览/翻译切换** — 预览模式只显示原文，翻译模式显示译文
- **Markdown 渲染** — 基于 marked.js，GitHub 风格，支持代码块、表格、引用
- **Mermaid 流程图** — 支持渲染 Mermaid 流程图
- **智能分段** — 代码块保护不翻译，段落级并发翻译（最多 3 并发）
- **翻译缓存** — 7 天本地缓存，避免重复 API 调用
- **内联配置** — 未配置 Key 时弹出配置卡片，粘贴即保存即翻译
- **独立 Viewer** — 拖拽 .md 文件到扩展页面查看和翻译

## 安装

1. 下载或克隆本项目到本地
2. 打开 Chrome，地址栏输入 `chrome://extensions/`
3. 开启右上角「**开发者模式**」
4. 点击「**加载已解压的扩展程序**」
5. 选择项目根目录（包含 manifest.json 的文件夹）
6. 插件卡片 → 详细信息 → 开启「**允许访问文件网址**」（用于本地 .md 文件）

## 使用

### 配置 API Key

**方式一（推荐）：** 打开任意 .md 文件，弹窗内直接粘贴 Key，回车保存并翻译。

**方式二：** 点击浏览器工具栏 Transcise 图标 → 填入 Key → 保存。

> 获取 Key：[DeepSeek 开放平台](https://platform.deepseek.com/api_keys)

### 翻译 Markdown

1. 在 Chrome 中打开 .md 文件（GitHub、本地文件、任意 URL）
2. 页面自动渲染，顶部出现翻译工具栏
3. 选择目标语言 → 点击「翻译」（已配置 Key 则自动开始）
4. 首批只翻译 20 段，滚动到底部附近自动继续翻译

### 独立 Viewer 页面

1. 点击 Transcise 图标 → 选择 .md 文件 → 自动打开 Viewer 页面
2. 或直接在浏览器中打开 `viewer/viewer.html`，拖拽文件到页面
3. 支持预览/翻译模式切换

### 显示模式

| 模式 | 效果 |
|------|------|
| 双语 | 原文 + 译文并排显示 |
| 仅译文 | 只显示翻译结果，代码块保持可见 |
| 仅原文 | 只显示原始内容，与初始渲染效果一致 |

## 版本历史

### v1.3.0（当前）
- 分步懒加载翻译：首批只译 20 段，滚动触发续批翻译
- 语言变更自动重新翻译
- 修复正则破坏 HTML 结构导致的漏斗变窄 bug
- 修复仅原文模式排版与初始渲染不一致的问题
- 修复仅译文模式代码块被隐藏的问题

### v1.2.0
- 独立 Viewer 页面 + 拖拽替换
- Mermaid 流程图渲染
- 预览/翻译模式切换
- 并发翻译提速（3 并发）
- 修复 content.css 全局样式冲突

### v1.1.0
- 独立 Viewer 页面
- 弹窗文件上传模式

### v1.0.0
- 初始版本：Markdown 渲染 + DeepSeek AI 翻译
- 支持双语对照、仅译文、仅原文三种模式
- 内联 API Key 配置、翻译缓存、并发控制

## 项目结构

```text
transcise/
├── manifest.json              # Chrome MV3 配置
├── popup/                     # 配置弹窗
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/                   # 内容脚本（注入 .md 页面）
│   ├── content.js             # Markdown 检测 + 渲染
│   ├── toolbar.js             # 工具栏 UI
│   └── content.css            # 共享样式
├── viewer/                    # 独立 Viewer 页面
│   ├── viewer.html
│   └── viewer.js              # 渲染 + 翻译 + 工具栏（全部逻辑）
├── background/
│   └── service-worker.js      # API 代理中转
├── lib/
│   ├── marked.min.js          # Markdown 解析器
│   └── mermaid.min.js         # Mermaid 流程图
├── utils/
│   ├── storage.js             # Chrome Storage 封装
│   └── translator.js          # DeepSeek API 调用
├── docs/                      # 文档
│   ├── requirements.md        # 需求文档
│   ├── development.md         # 开发文档
│   └── deployment.md          # 部署文档
├── icons/                     # 16/48/128 图标
```

## 技术栈

| 技术 | 用途 |
|------|------|
| Chrome Extension MV3 | 插件框架 |
| Vanilla JavaScript | 零依赖业务逻辑 |
| marked.js | Markdown → HTML |
| Mermaid.js | 流程图渲染 |
| DeepSeek Chat API | AI 翻译 |
| Chrome Storage API | 配置 + 翻译缓存 |

## 开发

```bash
# 修改代码后重新加载
chrome://extensions/ → 点击 Transcise 卡片右下角刷新按钮
```

关键模块：

- `viewer/viewer.js` — Viewer 页面核心：渲染 / 分步翻译 / 工具栏 / 懒加载
- `content/content.js` — 内容脚本：initTranscise() 统一入口
- `content/toolbar.js` — 工具栏 UI、API Key 弹窗
- `utils/translator.js` — DeepSeek API 调用 + 分段 + 并发控制

## 常见问题

**弹窗不出现？** 确认当前 URL 以 .md 结尾，刷新页面。

**翻译失败？** 检查 API Key 是否正确（以 sk- 开头），确认网络可访问 api.deepseek.com。

**本地文件打不开？** 插件详情中开启「允许访问文件网址」。

**翻译不完整？** 首批只翻译 20 段，继续滚动到底部会自动触发后续翻译。

**代码块不见了？** 切换为双语或仅原文模式；仅译文模式下代码块默认保持可见。

## License

MIT
