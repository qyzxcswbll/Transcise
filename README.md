# 🌐 Transcise — Markdown Translator

> Chrome 浏览器插件，自动渲染 Markdown 文件并通过 DeepSeek AI 实时翻译。支持双语对照、仅译文、仅原文三种模式。

## 功能

- **自动检测** — 打开任意 .md 文件自动激活，无需手动操作
- **一键翻译** — 配置 DeepSeek API Key 后打开文件即自动翻译，也可手动触发
- **三种显示模式** — 双语对照 / 仅译文 / 仅原文，一键切换
- **Markdown 渲染** — 基于 marked.js，GitHub 风格，支持代码高亮、表格、引用等
- **智能分段** — 代码块保护不翻译，段落级并发翻译，失败自动重试
- **翻译缓存** — 7 天本地缓存，避免重复 API 调用
- **内联配置** — 未配置 Key 时弹出配置卡片，粘贴即保存即翻译，无需离开页面

## 安装

1. 下载或克隆本项目到本地
2. 打开 Chrome，地址栏输入 chrome://extensions/
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
4. 翻译完成后每段原文下方显示蓝色译文

### 显示模式

| 模式 | 效果 |
|------|------|
| 双语 | 原文 + 译文并排 |
| 仅译文 | 只显示翻译结果 |
| 仅原文 | 只显示原始内容 |

## 版本历史

### v1.0.0
- 🎉 初始版本：Markdown 渲染 + DeepSeek AI 翻译
- 支持双语对照、仅译文、仅原文三种模式
- 内联 API Key 配置、翻译缓存、并发控制

## 项目结构

` +
'''' + '`
transcise/
├── manifest.json              # Chrome MV3 配置
├── content/                   # 页面注入层
│   ├── content.js             # 核心：Markdown 渲染 → 翻译调度
│   ├── toolbar.js             # 工具栏 UI + API Key 弹窗
│   └── content.css            # 注入样式
├── popup/                     # 配置面板
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── background/
│   └── service-worker.js      # API 代理 + 缓存
├── utils/
│   ├── storage.js             # Chrome Storage 封装
│   └── translator.js          # DeepSeek API + 分段 + 并发
├── lib/
│   └── marked.min.js          # Markdown 解析器
├── icons/                     # 16/48/128 图标
├── docs/                      # 设计 & 部署文档
└── test/                      # 测试文件
` +
'''' + '`' + @'

## 技术栈

| 技术 | 用途 |
|------|------|
| Chrome Extension MV3 | 插件框架 |
| Vanilla JavaScript | 零依赖业务逻辑 |
| marked.js | Markdown → HTML |
| DeepSeek Chat API | AI 翻译 |
| Chrome Storage API | 配置 + 翻译缓存 |

## 开发

` +
'''' + 'bash
# 修改代码后重新加载
chrome://extensions/ → 移除 Transcise → 加载已解压的扩展程序 → 选择项目目录
` +
'''' + '`' + @'

关键模块：

- content/content.js — initTranscise() 统一入口，performTranslation() 翻译主流程
- content/toolbar.js — showApiKeyPrompt() 弹窗，handleInlineApiKeySave() 保存逻辑
- utils/translator.js — splitMarkdownIntoChunks() 分段，batchTranslate() 并发翻译

## 常见问题

**弹窗不出现？** 确认当前 URL 以 .md 结尾，刷新页面。

**翻译失败？** 检查 API Key 是否正确（以 sk- 开头），确认网络可访问 api.deepseek.com。

**本地文件打不开？** 插件详情中开启「允许访问文件网址」。

## License

MIT