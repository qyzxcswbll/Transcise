# 部署文档 - Transcise Chrome 插件

## 版本

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.3.0 | 2026-06 | 分步懒加载翻译 + 渲染修复 |

---

## 1. 环境要求

Transcise 是一个 Chrome 扩展程序，用于将 Markdown (.md) 文件渲染为格式化 HTML 并进行翻译。

- Chrome 浏览器版本 ≥ 88（需要 Manifest V3 支持）
- DeepSeek API Key（前往 [DeepSeek 平台](https://platform.deepseek.com/api_keys) 获取）

## 2. 本地安装

### 2.1 下载代码

将项目克隆或下载到本地目录。

### 2.2 加载到 Chrome

1. 打开 Chrome 浏览器，进入扩展管理页面 chrome://extensions/
2. 开启右上角**开发者模式**开关
3. 点击左上角**加载已解压的扩展程序**按钮
4. 选择项目根目录（包含 manifest.json 的文件夹）
5. 加载成功后，扩展栏出现 Transcise 图标

### 2.3 配置 API Key

1. 点击 Chrome 工具栏的 Transcise 图标打开设置弹窗
2. 在 **DeepSeek API Key** 输入框中填入 API Key（以 sk- 开头）
3. 选择目标语言和翻译模型
4. 点击**保存设置**按钮

> **获取 API Key**：前往 https://platform.deepseek.com/api_keys 注册并创建 Key

## 3. 使用方法

### 3.1 查看 Markdown 文件

1. 在 Chrome 中打开任意 .md 文件链接
   - GitHub 上的 Markdown 页面（如 https://github.com/.../README.md）
   - 本地 .md 文件（file:// 协议）
   - 任意 .md 结尾的 URL
2. 页面顶部自动注入 Transcise 工具栏，Markdown 内容渲染为格式化 HTML
3. 点击工具栏**翻译**按钮开始翻译

### 3.2 独立 Viewer 页面

通过弹窗打开 Viewer：

1. 点击 Transcise 图标 → 选择 .md 文件 → 自动打开 Viewer 页面
2. 或直接打开 viewer/viewer.html 拖拽文件

支持的操作：

| 操作 | 说明 |
| --- | --- |
| **拖拽** | 将 .md 文件拖入 Drop Zone 或页面空白区 |
| **浏览** | 点击"Open Markdown File"按钮选择文件 |
| **替换** | 新文件拖入会自动替换当前内容 |
| **预览/翻译** | 点击工具栏按钮切换模式 |

### 3.3 翻译功能

首次翻译只处理前 20 段内容，滚动到底部附近自动继续翻译后续段落。

| 模式 | 说明 |
| --- | --- |
| **预览** | 仅显示渲染后的 Markdown，隐藏译文 |
| **翻译** | 显示原文 + 译文（双语模式） |
| **双语** | 原文和译文同时显示 |
| **仅译文** | 只显示翻译后的内容（代码块保持可见） |
| **仅原文** | 只显示原文，与初始渲染效果一致 |

## 4. 构建说明

本项目为纯前端 Chrome 扩展，无需构建步骤。依赖的第三方库（marked.js、mermaid.js）已预置在 lib/ 目录中。

### 4.1 目录结构

```
├── manifest.json         # Chrome MV3 扩展配置
├── popup/                # 设置弹窗
├── content/              # 内容脚本
├── viewer/               # 独立 Viewer 页面
├── background/           # Service Worker
├── lib/                  # 第三方库
├── utils/                # 工具函数
└── icons/                # 图标
```

## 5. 故障排查

### Q: 扩展没有自动注入工具栏？

- 确认当前 URL 以 .md 结尾
- 确认扩展已启用
- 打开 F12 查看 Console 是否有错误

### Q: 翻译按钮无响应？

- 确认已在弹窗中配置有效的 API Key
- 确认 API Key 未过期
- 检查网络能否访问 api.deepseek.com

### Q: 翻译结果不完整？

- 首次只翻译前 20 段，滚动到底部自动继续
- 如果快速滚动到底部，等待翻译完成后滚动触发下一批

### Q: Markdown 渲染异常？

- 确认文件是标准 Markdown 格式
- 部分扩展语法（如自定义容器）可能不被 marked.js 支持

### Q: 如何重置？

- 在 chrome://extensions/ 中重新加载 Transcise 扩展

## 6. 注意事项

- **Manifest V3**：本扩展基于 Chrome 最新扩展规范开发
- **Content Script 注入**：仅在 .md 页面自动激活，不影响其他页面
- **翻译缓存**：7 天内重复翻译相同段落直接返回缓存
- **并发控制**：最多同时发起 3 个翻译请求
- **分步翻译**：首次只翻译 20 段，减少等待时间
- **滚动续翻**：距底部不足 1.5 屏时自动触发下一批
