# 🌐 Transcise

> Real-time Markdown Translator · Chrome Extension

[中文文档](./README_zh.md) | [English](./README.md)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📖 Markdown Rendering | Auto-render .md files with GFM syntax support |
| 🌍 AI Translation | Powered by DeepSeek Chat API |
| ⚡ Lazy Loading | First 20 segments instantly, scroll to continue |
| 📊 Mermaid | Flowchart & diagram rendering |
| 📂 Standalone Viewer | Drag & drop .md files to view and translate |
| 🔄 3 Display Modes | Bilingual / Translation-only / Original-only |
| ⚙️ Inline Config | Paste API Key and translate immediately |

---

## 📦 Installation

```bash
git clone https://github.com/qyzxcswbll/Transcise.git
```

Open `chrome://extensions/` → Enable **Developer mode** → Load unpacked → Select project folder.

> Enable "Allow access to file URLs" for local .md files.

---

## 🔧 Configuration

### Get API Key

Visit [DeepSeek Platform](https://platform.deepseek.com/api_keys) to create an API Key.

### Setup

**Inline popup:** Open any .md file → Paste Key → Press Enter.

**Settings panel:** Click Transcise icon → Fill in Key → Save.

### Options

| Config | Description |
|--------|-------------|
| API Key | DeepSeek API key, starts with `sk-` |
| Target Language | 13 languages supported |
| Translation Model | V3 (fast) / R1 (precise) |
| Auto Trigger | Auto-inject toolbar on .md pages |

---

## 🚀 Usage

### Auto Injection

Open any `.md` file — the extension works automatically:

```
1. Page renders Markdown instantly
2. Select target language → Click translate
3. First 20 segments complete in seconds
4. Scroll to bottom → auto continue
```

### Standalone Viewer

Click Transcise icon to pick a file, or open `viewer/viewer.html` and drag:

```
📄 Drag in .md file
├─ Renders Markdown
├─ Click translate
├─ Switch display modes
└─ Drag new file to replace
```

### Display Modes

| Mode | Original | Translation | Code block |
|------|----------|-------------|------------|
| Bilingual | ✅ | ✅ | ✅ |
| Translation only | ❌ | ✅ | ✅ |
| Original only | ✅ | ❌ | ✅ |

---

## ❓ FAQ

| Question | Answer |
|----------|--------|
| Toolbar not showing? | Ensure URL ends with `.md`, refresh page |
| Translation fails? | Check API Key format (`sk-`), ensure network access to `api.deepseek.com` |
| Can't open local files? | Enable "Allow access to file URLs" in extension details |
| Partial translation? | First 20 segments done, scroll to bottom for more |
| Code blocks missing? | Switch to bilingual or original-only mode |

---

## 📄 License

MIT
