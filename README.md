# 🌐 Transcise

> Markdown 实时翻译 · Chrome 扩展

<div align="center">

[![version](https://img.shields.io/badge/version-v1.3.0-blue)]()
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-green)]()
[![license](https://img.shields.io/badge/license-MIT-lightgrey)]()

</div>

---

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 📖 Markdown 渲染 | 自动将 .md 文件渲染为格式化页面，支持 GFM 语法 |
| 🌍 AI 翻译 | 对接 DeepSeek Chat API，段落级精准翻译 |
| ⚡ 分步加载 | 首批 20 段快速响应，滚动到底部自动续翻 |
| 📊 Mermaid | 支持渲染流程图、时序图 |
| 📂 独立 Viewer | 拖拽本地 .md 文件查看和翻译，支持替换 |
| 🔄 三种模式 | 双语对照 / 仅译文 / 仅原文，一键切换 |
| ⚙️ 内联配置 | 未配置 Key 时弹出卡片，粘贴即用 |

---

## 📦 安装

```bash
# 方式一：从源码安装
git clone https://github.com/qyzxcswbll/Transcise.git
```

打开 `chrome://extensions/` → 开启**开发者模式** → 加载已解压的扩展 → 选择项目目录。

> 本地 .md 文件需要开启「允许访问文件网址」。

---

## 🔧 配置

### 获取 API Key

前往 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 注册并创建 API Key。

### 配置方式

**方式一（内联弹窗）：** 打开任意 .md 文件 → 页面弹出配置卡片 → 粘贴 Key → 回车保存并翻译。

**方式二（设置面板）：** 点击浏览器工具栏 Transcise 图标 → 填入 Key → 选择语言 → 保存。

### 配置项

| 配置项 | 说明 |
|--------|------|
| API Key | DeepSeek API 密钥，以 `sk-` 开头 |
| 目标语言 | 支持 13 种语言 |
| 翻译模型 | DeepSeek-V3（快速） / DeepSeek-R1（精细） |
| 自动触发 | 开启后自动注入工具栏 |

---

## 🚀 使用示例

### 自动注入

打开任意 `.md` 文件（GitHub、GitLab、本地文件），扩展自动工作：

```
1. 页面自动渲染为格式化内容
2. 顶部工具栏选择目标语言 → 点击翻译
3. 首批 20 段秒级完成
4. 滚动到底部 → 自动续翻
```

### 独立 Viewer

点击 Transcise 图标选择文件，或访问 `viewer/viewer.html` 拖拽：

```
📄 拖入 .md 文件
├─ 自动渲染 Markdown
├─ 点击「翻译」
├─ 切换模式（双语 / 仅译文 / 仅原文）
└─ 拖入新文件自动替换
```

### 显示模式对比

| 模式 | 原文 | 译文 | 代码块 |
|------|------|------|--------|
| 双语 | ✅ 显示 | ✅ 显示 | ✅ 显示 |
| 仅译文 | ❌ 隐藏 | ✅ 显示 | ✅ 显示 |
| 仅原文 | ✅ 显示 | ❌ 隐藏 | ✅ 显示 |

---

## ❓ FAQ

| 问题 | 回答 |
|------|------|
| 弹窗不出现？ | 确认 URL 以 `.md` 结尾，刷新页面 |
| 翻译失败？ | 检查 API Key 格式（`sk-` 开头），确认网络可访问 `api.deepseek.com` |
| 本地文件打不开？ | 插件详情中开启「允许访问文件网址」 |
| 翻译不完整？ | 首批只译 20 段，滚动到底部自动续翻 |
| 代码块不见了？ | 仅译文模式下代码块默认保持可见，切换到双语或仅原文 |

---

## 📄 License

MIT
