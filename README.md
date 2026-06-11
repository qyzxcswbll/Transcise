# 🌐 Transcise

> Markdown 实时翻译 · Chrome 扩展 / Real-time Markdown Translator · Chrome Extension

<div align="center">

[![version](https://img.shields.io/badge/version-v1.3.0-blue)]()
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-green)]()
[![license](https://img.shields.io/badge/license-MIT-lightgrey)]()

</div>

---

## ✨ Features | 功能

| Feature | 功能 |
|---------|------|
| 📖 Markdown Rendering | Auto-render .md files with GFM support / 自动渲染 Markdown，支持 GFM 语法 |
| 🌍 AI Translation | Powered by DeepSeek Chat API / 对接 DeepSeek Chat API 精准翻译 |
| ⚡ Lazy Loading | First 20 segments instantly, scroll to continue / 首批 20 段快速响应，滚动续翻 |
| 📊 Mermaid | Flowchart & diagram support / 支持渲染流程图 |
| 📂 Standalone Viewer | Drag & drop .md files to view and translate / 拖拽 .md 文件查看翻译 |
| 🔄 3 Display Modes | Bilingual / Translation only / Original only / 双语 / 仅译文 / 仅原文 |
| ⚙️ Inline Config | Paste API Key and translate immediately / 粘贴 Key 即用 |

---

## 📦 Installation | 安装

```bash
# Clone / 克隆项目
git clone https://github.com/qyzxcswbll/Transcise.git
```

Open `chrome://extensions/` → Enable **Developer mode** → Load unpacked → Select project folder.

> Enable "Allow access to file URLs" for local .md files / 本地文件需开启「允许访问文件网址」。

---

## 🔧 Configuration | 配置

### Get API Key | 获取密钥

Visit [DeepSeek Platform](https://platform.deepseek.com/api_keys) to create an API Key.

### Setup | 配置方式

**Inline popup（内联弹窗）：** Open any .md file → Paste Key in popup → Press Enter.

**Settings panel（设置面板）：** Click Transcise icon in toolbar → Fill in Key → Save.

### Options | 配置项

| Config | 配置项 | Description | 说明 |
|--------|--------|-------------|------|
| API Key | API 密钥 | DeepSeek API key, starts with `sk-` | DeepSeek 密钥 |
| Target Language | 目标语言 | 13 languages supported | 支持 13 种语言 |
| Translation Model | 翻译模型 | V3 (fast) / R1 (precise) | V3（快速）/ R1（精细） |
| Auto Trigger | 自动触发 | Auto-inject toolbar on .md pages | 自动注入工具栏 |

---

## 🚀 Usage | 使用

### Auto Injection | 自动注入

Open any `.md` file (GitHub, GitLab, local) — the extension works automatically:

```
1. Page renders Markdown instantly / 页面自动渲染
2. Select target language → Click translate / 选择语言 → 点击翻译
3. First 20 segments complete in seconds / 首批 20 段秒级完成
4. Scroll to bottom → auto continue / 滚动到底部自动续翻
```

### Standalone Viewer | 独立查看器

Click Transcise icon to pick a file, or open `viewer/viewer.html` and drag:

```
📄 Drag in .md file / 拖入 .md 文件
├─ Renders Markdown / 自动渲染
├─ Click translate / 点击翻译
├─ Switch modes / 切换模式
└─ Drag new file to replace / 拖新文件替换
```

### Display Modes | 显示模式

| Mode | 模式 | Original | Translation | Code block |
|------|------|----------|-------------|------------|
| Bilingual | 双语 | ✅ | ✅ | ✅ |
| Translation only | 仅译文 | ❌ | ✅ | ✅ |
| Original only | 仅原文 | ✅ | ❌ | ✅ |

---

## ❓ FAQ | 常见问题

| Question | 问题 | Answer | 回答 |
|----------|------|--------|------|
| Toolbar not showing? | 弹窗不出现？ | Ensure URL ends with `.md`, refresh page | 确认 URL 以 `.md` 结尾，刷新 |
| Translation fails? | 翻译失败？ | Check API Key format (`sk-`), ensure network access to `api.deepseek.com` | 检查 API Key 和网络 |
| Can't open local files? | 本地文件打不开？ | Enable "Allow access to file URLs" in extension details | 开启「允许访问文件网址」 |
| Partial translation? | 翻译不完整？ | First 20 segments done, scroll to bottom for more | 首批 20 段，滚动续翻 |
| Code blocks missing? | 代码块不见了？ | Switch to bilingual or original-only mode | 切换到双语或仅原文 |

---

## 📄 License | 许可

MIT
