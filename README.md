# 🌐 Transcise — Markdown Translator

> Chrome 浏览器插件，自动渲染 Markdown 文件并通过 DeepSeek AI 实时翻译。

## 安装

1. 下载项目 → `chrome://extensions/` → 开启开发者模式 → 加载已解压的扩展
2. 插件详情中开启「允许访问文件网址」（用于本地 .md 文件）

## 使用

**配置 API Key**：打开任意 .md 文件，弹窗内粘贴 Key 回车即可。[获取 Key](https://platform.deepseek.com/api_keys)

**翻译**：打开 .md 文件 → 选择目标语言 → 点击翻译（首批 20 段，滚动续翻）

**独立 Viewer**：点击 Transcise 图标选择文件，或直接打开 `viewer/viewer.html` 拖拽文件

| 模式 | 效果 |
|------|------|
| 双语 | 原文 + 译文并排 |
| 仅译文 | 只显示译文，代码块保持可见 |
| 仅原文 | 只显示原文（与初始渲染一致） |

## 版本历史

| 版本 | 说明 |
|------|------|
| v1.3.0 | 分步懒加载翻译、语言变更自动重翻、修复多项渲染 bug |
| v1.2.0 | 独立 Viewer + Mermaid + 预览模式、并发翻译提速 |
| v1.1.0 | Viewer 页面、弹窗文件上传 |
| v1.0.0 | 基础功能：Markdown 渲染 + DeepSeek AI 翻译 |

## 技术栈

Chrome Extension MV3 / Vanilla JS / marked.js / Mermaid.js / DeepSeek Chat API

## 常见问题

**弹窗不出现？** 确认 URL 以 .md 结尾，刷新页面。

**翻译失败？** 检查 API Key（以 sk- 开头），确认网络可访问 api.deepseek.com。

**本地文件打不开？** 插件详情中开启「允许访问文件网址」。

**翻译不完整？** 首批只译 20 段，滚动到底部自动续翻。

## License

MIT
