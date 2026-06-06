# 项目需求 - Transcise Chrome 插件

## 版本记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0.0 | 2026-05 | 基础功能：Markdown 渲染 + DeepSeek AI 翻译 |
| v1.2.0 | 2026-06 | 独立 Viewer 页面 + Mermaid 流程图 + 拖拽替换 + 预览模式 |
| v1.3.0 | 2026-06 | 分步懒加载翻译 + 滚动触发续批 + 多处渲染修复 |

---

## 1. 项目概述

Transcise 是一个 Chrome 扩展程序，用于将 Markdown (.md) 文件渲染为格式化 HTML，并通过 DeepSeek AI 提供多语言翻译功能。

支持两种使用方式：

- 内容脚本注入：自动识别 GitHub/GitLab 等网站的 .md 页面
- 独立 Viewer 页面：拖拽本地 .md 文件到扩展页面查看和翻译

## 2. 功能特性

- 自动识别 Markdown 页面并注入翻译工具栏
- 独立拖拽式 Viewer，支持本地 .md 文件
- 多语言翻译（支持 13 种语言）
- 三种显示模式：双语 / 仅译文 / 仅原文
- 预览/翻译模式切换
- 分步懒加载翻译（首批 20 段，滚动续翻）
- Mermaid 流程图渲染支持
- API Key 内联配置弹窗

## 3. 技术需求

### 3.1 Markdown 渲染引擎

- 使用 marked.js 解析并渲染 .md 文件
- 支持 GFM（GitHub Flavored Markdown）语法
- 支持语法高亮代码块

### 3.2 Viewer 页面

- 支持拖拽 .md 文件到页面直接打开
- 支持从 Popup 弹窗传入文件
- 支持拖拽新文件替换当前内容
- 响应式布局，深色主题

### 3.3 AI 翻译（DeepSeek）

- 接入 DeepSeek Chat API 进行翻译
- 按段落拆分翻译，保留 Markdown 格式
- 并发翻译队列，最多同时 3 个请求
- 首批只翻译 20 段，滚动到底部触发续批
- 分段翻译不阻塞 UI

### 3.4 内容脚本注入

- 自动在 .md 页面注入翻译工具栏
- 支持 GitHub 原生 .md 预览页面
- 支持 file:// 协议的本地 .md 文件

### 3.5 设置界面（Popup）

- API Key 配置与保存
- 目标语言选择
- 翻译模型选择
- 自动触发开关

## 4. 非功能性需求

- 使用 Chrome Manifest V3
- 翻译缓存采用 7 天 TTL
- 并发请求限制防止 API 限流
- 分步翻译减少首次加载时间
- 使用 Chrome Storage API 存储配置

## 5. 技术栈

| 技术                      | 用途              | 版本 |
|---------------------------|-------------------|------|
| Chrome Extension MV3      | 扩展框架          | -    |
| Vanilla JavaScript (ES6+) | 核心逻辑          | -    |
| marked.js                 | Markdown 转 HTML  | v15+ |
| DeepSeek Chat API         | AI 翻译           | -    |
| Chrome Storage API        | 配置存储          | -    |

## 6. 使用限制

- 仅支持 .md / .markdown 文件
- 需要有效的 DeepSeek API Key
- 翻译功能需要网络连接
