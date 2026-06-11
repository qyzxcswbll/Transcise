<p align="center">
  <h1 align="center">🌐 Transcise</h1>
  <p align="center">Markdown 实时翻译 · Chrome 扩展</p>
  <p align="center">
    <img src="https://img.shields.io/badge/version-v1.3.0-blue" alt="version">
    <img src="https://img.shields.io/badge/Chrome%20Extension-MV3-green" alt="MV3">
    <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="license">
  </p>
</p>

---

## 功能

- **📖 Markdown 实时渲染** — 打开任意 .md 文件，自动渲染为格式化页面，支持代码块、表格、引用等 GFM 语法
- **🌍 AI 翻译** — 对接 DeepSeek Chat API，段落级翻译，首批 20 段快速响应，滚动续翻
- **🔄 三种显示模式** — 双语对照 / 仅译文 / 仅原文，一键切换
- **📂 独立 Viewer** — 拖拽本地 .md 文件到扩展页面查看和翻译，支持替换
- **📊 Mermaid 流程图** — 支持渲染 Mermaid 流程图
- **⚙️ 内联配置** — 未配置 API Key 时弹出配置卡片，粘贴即保存即翻译

> 截图待补充

## 安装

```bash
# 1. 下载项目
git clone https://github.com/qyzxcswbll/Transcise.git

# 2. 打开 Chrome 扩展管理
chrome://extensions/

# 3. 开启「开发者模式」→ 加载已解压的扩展 → 选择项目目录

# 4. 插件详情中开启「允许访问文件网址」（用于本地 .md 文件）
```

## 使用示例

### 自动注入模式

打开任意 .md 文件（GitHub / GitLab / 本地文件），扩展自动注入翻译工具栏：

```
1. 页面自动渲染 Markdown 为格式化页面
2. 顶部工具栏选择目标语言（支持 13 种语言）
3. 点击「翻译」→ 首批 20 段翻译完成
4. 滚动到底部附近 → 自动继续翻译后续内容
```

### 独立 Viewer 模式

点击 Transcise 图标 → 选择 .md 文件，或直接访问 `viewer/viewer.html` 拖拽文件：

```
📄 拖拽文件到页面或点击选择文件
├─ 自动渲染 Markdown
├─ 点击「翻译」→ 分步懒加载翻译
├─ 切换「双语 / 仅译文 / 仅原文」
└─ 拖入新文件替换当前内容
```

### 显示模式

| 模式 | 效果 |
|------|------|
| 双语 | 原文 + 译文并排显示 |
| 仅译文 | 只显示翻译结果，代码块保持可见 |
| 仅原文 | 只显示原文，与初始渲染效果一致 |

## 配置

| 配置项 | 说明 |
|--------|------|
| DeepSeek API Key | 翻译服务密钥（以 sk- 开头），[获取 Key](https://platform.deepseek.com/api_keys) |
| 目标语言 | 支持中文、英文、日文、韩文、法文、德文、西班牙文、俄文、葡萄牙文、意大利文、越南文、泰文、印尼文 |
| 翻译模型 | DeepSeek-V3（快） / DeepSeek-R1（精细） |
| 自动触发 | 开启后浏览 .md 文件时自动注入翻译工具栏 |

配置入口：浏览器工具栏点击 Transcise 图标，或首次翻译时内联弹窗。

## FAQ

**弹窗不出现？** 确认 URL 以 .md 结尾，刷新页面。

**翻译失败？** 检查 API Key（以 sk- 开头），确认网络可访问 api.deepseek.com。

**本地文件打不开？** 插件详情中开启「允许访问文件网址」。

**翻译不完整？** 首批只译 20 段，滚动到底部自动续翻。

## License

MIT
