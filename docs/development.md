# 开发文档 - Transcise Chrome 插件

## 版本记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0.0 | 2026-05 | 初始架构：Content Script + Service Worker + Popup |

---

## 1. 项目结构

```
transcise-chrome-extension/
├── manifest.json                # Chrome MV3 扩展配置
├── popup/                       # 弹窗设置页
│   ├── popup.html               # API Key 配置 + 语言选择
│   ├── popup.js                 # 配置读写逻辑
│   └── popup.css                # 弹窗样式
├── content/                     # 内容脚本
│   ├── content.js               # Markdown 检测 + 注入工具栏
│   ├── toolbar.js               # 工具栏 UI 交互
│   └── content.css              # 共享样式（注入 + Viewer）
├── background/                  # Service Worker
│   └── service-worker.js        # API 请求中转
├── viewer/                      # 独立 Viewer 页面
│   ├── viewer.html              # 拖拽入口 + 渲染容器
│   └── viewer.js                # 全部 Viewer 逻辑（渲染/翻译/工具栏）
├── lib/
│   ├── marked.min.js            # Markdown 解析器
│   └── mermaid.min.js           # Mermaid 流程图渲染
├── utils/
│   ├── translator.js            # DeepSeek API 调用
│   └── storage.js               # Chrome Storage 封装
├── docs/                        # 文档
│   ├── requirements.md          # 需求文档
│   ├── development.md           # 开发文档
│   └── deployment.md            # 部署文档
└── icons/                       # 扩展图标
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 2. 核心模块

### 2.1 Content Script（content.js）

**触发条件**：
- URL 以 .md 结尾的页面，自动注入翻译工具栏

**主要流程**：
1. initTranscise() - 初始化，检查页面类型
2. isMarkdownPage() - URL 检测
3. renderMarkdown() - 使用 marked.js 渲染
4. performTranslation() - 调用翻译

### 2.2 Viewer 页面（viewer.js）

**核心功能**：
- 拖拽 .md 文件到页面渲染
- 分步懒加载翻译（首批 20 段，滚动续翻）
- 三种显示模式：双语 / 仅译文 / 仅原文
- 预览/翻译模式切换
- Mermaid 流程图渲染

**翻译流程**：
1. splitChunks(md) - 将 Markdown 拆分为 text/code chunk
2. performTranslation() - 首批翻译 20 段
3. rebuildContent() - 重建 DOM 插入译文
4. translateNextBatch() - 滚动触发继续翻译
5. finishTranslation() - 全部完成收尾

### 2.3 工具栏（toolbar.js）

**工具栏结构**：
```html
<div id="transcise-toolbar">
  <span class="transcise-brand">Transcise</span>
  <select id="transcise-lang-select">
    <option value="zh">中文</option>
    <!-- 13 种语言 -->
  </select>
  <div class="transcise-view-toggle">
    <button data-view="preview">预览</button>
    <button data-view="translate">翻译</button>
  </div>
  <div class="transcise-mode-group">
    <button data-mode="both">双语</button>
    <button data-mode="translation">仅译文</button>
    <button data-mode="original">仅原文</button>
  </div>
  <span id="transcise-status">状态信息</span>
</div>
```

### 2.4 翻译服务（translator.js）

**API 请求格式**：
```json
{
  "model": "deepseek-chat",
  "messages": [
    {"role": "system", "content": "你是一个专业翻译..."},
    {"role": "user", "content": "待翻译文本"}
  ],
  "temperature": 0.3,
  "max_tokens": 4096
}
```

**分块策略**：
- 将 Markdown 按段落和代码块拆分为 chunk
- text chunk 提交翻译，code chunk 保留原文
- 首批最多 20 个 text chunk，后续每批 10 个

**并发控制**：
- 最多同时 3 个翻译请求
- 失败重试 3 次，退避策略 1000 × 2^attempt ms

**缓存机制**：
- Key：hash(原文 + 目标语言)
- 存储于 Chrome Storage local
- TTL：7 天

### 2.5 设置界面（popup/）

**配置项**：
- API Key 输入与保存
- 默认目标语言
- 翻译模型选择（DeepSeek-V3 / DeepSeek-R1）
- 自动触发开关

### 2.6 Service Worker（service-worker.js）

**职责**：
- 中转 API 请求解决 CORS
- 处理 content script 的翻译请求

## 3. 数据流

### 翻译请求流程

```
Viewer/Content Script    Service Worker        DeepSeek API
     │                        │                     │
     │  chrome.runtime        │                     │
     │  .sendMessage ────────>│                     │
     │                        │  POST /chat/        │
     │                        │  completions ──────>│
     │                        │                     │
     │                        │  <──── 响应 ────────│
     │  <────── 返回 ──────── │                     │
     │                        │                     │
     │  rebuildContent()      │                     │
     │  (插入译文到 DOM)      │                     │
```

### 分步翻译流程

```
用户点击翻译
  └─> performTranslation()
       ├─ splitChunks() → 74 text chunks
       ├─ 首批翻译 20 chunks
       ├─ rebuildContent() → 显示原文 + 译文
       ├─ setupScrollTrigger()
       └─ 状态："已翻译前部，滚动续译剩余 54 段"

用户滚动到底部附近
  └─> translateNextBatch()
       ├─ 翻译下 10 个 chunk
       ├─ rebuildContent() → 更新译文
       ├─ 仍有剩余 → 继续监听滚动
       └─ 无剩余 → cleanupScrollTrigger() + finishTranslation()
```

## 4. 异常处理

| 场景 | 处理方式 |
| --- | --- |
| API Key 未配置 | 弹出内联配置窗口 |
| API 请求超时 | 3 次重试 + 退避，最终标记为错误段落 |
| 部分翻译失败 | 状态栏显示失败数，不影响已翻译内容 |
| Markdown 解析失败 | 回退为纯文本 `<pre>` 显示 |
| 语言变更 | 清空旧译文，重新翻译全部 |
