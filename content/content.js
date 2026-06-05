/**
 * Transcise Content Script - 主逻辑模块
 * 负责检测 Markdown 文件、渲染 HTML、管理翻译生命周期
 * 注意：此文件在 content_scripts 中与 toolbar.js 共享作用域，
 * 全局变量和函数对 toolbar.js 可见
 */

'use strict';

// ==================== 全局状态（toolbar.js 也需要访问） ====================
var transciseState = {
  markdownText: '',              // 原始 Markdown 文本
  chunks: [],                    // 分段后的文本块
  translations: {},              // id → 译文映射
  targetLang: 'zh',              // 当前目标语言
  apiKey: '',                    // API 密钥
  displayMode: 'both',           // 显示模式: both / translation / original
  isTranslating: false,          // 是否正在翻译
  hasTranslation: false          // 是否已有翻译结果
};

// 兼容旧引用
var state = transciseState;

// ==================== 页面检测 ====================

/**
 * 已知的代码托管网站列表（这些网站会自行渲染 Markdown）
 * 在这些网站上，扩展只对 raw 内容生效，跳过已渲染的页面
 */
var RENDERED_MD_HOSTS = [
  'github.com', 'www.github.com',
  'gitlab.com', 'www.gitlab.com',
  'bitbucket.org', 'www.bitbucket.org',
  'gitee.com', 'www.gitee.com',
  'gitea.com', 'www.gitea.com'
];

/**
 * 检测当前页面是否为 Markdown 文件
 * 检查 URL 后缀，排除查询参数和 hash
 * 额外检查是否为代码托管网站上的已渲染页面（如 GitHub README）
 * @returns {boolean}
 */
function isMarkdownPage() {
  var url = window.location.href.toLowerCase().split('?')[0].split('#')[0];

  // 必须是 .md 后缀
  if (!url.endsWith('.md')) {
    return false;
  }

  // 跳过代码托管网站的已渲染 Markdown 页面
  // 这些网站上 .md 页面已被网站自身渲染为 HTML，不应二次处理
  // 对于 raw.githubusercontent.com 等 raw 域名仍会正常触发
  var hostname = window.location.hostname.toLowerCase();
  for (var i = 0; i < RENDERED_MD_HOSTS.length; i++) {
    if (hostname === RENDERED_MD_HOSTS[i] || hostname.endsWith('.' + RENDERED_MD_HOSTS[i])) {
      console.log('[Transcise] 跳过已渲染的 Markdown 页面:', hostname);
      return false;
    }
  }

  return true;
}

/**
 * 获取页面的原始 Markdown 文本
 * 优先从 <pre> 标签获取（浏览器默认将纯文本渲染到 <pre>），
 * 否则从 <body> 获取
 * @returns {string}
 */
function getRawMarkdownText() {
  var preElement = document.querySelector('pre');
  if (preElement && preElement.textContent.trim().length > 0) {
    return preElement.textContent;
  }
  var bodyText = document.body.textContent || '';
  if (!bodyText.trim()) {
    console.error('[Transcise] No text found in DOM');
  }
  return bodyText.trim();
}

// ==================== 渲染引擎 ====================

/**
 * 使用 marked.js 将 Markdown 渲染为 HTML
 * 清除浏览器默认的纯文本显示，创建新的阅读器界面
 * @param {string} markdown - 原始 Markdown 文本
 */
function renderMarkdown(markdown) {
  // 配置 marked 渲染选项（兼容 marked v4+ 和旧版 API）
  var markedOptions = {
    breaks: true,       // 支持 GFM 换行
    gfm: true,          // 启用 GitHub Flavored Markdown
    headerIds: true,    // 标题生成 id（用于锚点链接）
    mangle: false,      // 不混淆邮箱地址
    pedantic: false,    // 不完全遵循原始 markdown.pl
    smartLists: true    // 智能列表行为
  };

  // 尝试新版 API（marked v4+），回退到旧版
  var htmlContent;
  if (typeof marked.parse === 'function') {
    htmlContent = marked.parse(markdown, markedOptions);
  } else if (typeof marked === 'function') {
    htmlContent = marked(markdown, markedOptions);
  } else {
    // 降级：纯文本显示
    htmlContent = '<pre>' + escapeHtml(markdown) + '</pre>';
  }

  // 清除原始页面内容
  document.body.innerHTML = '';

  // 创建渲染容器
  var container = document.createElement('div');
  container.id = 'transcise-content-container';
  container.className = 'transcise-markdown-body';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // 创建并注入工具栏
  injectToolbar();
}

/**
 * HTML 转义（降级方案）
 * @param {string} text - 原始文本
 * @returns {string} 转义后的 HTML 安全文本
 */
function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

/**
 * 重建内容容器（翻译完成后调用）
 * 将原文段落和译文段落交错渲染到页面中
 * 使用逐段渲染 + 直接 DOM 拼接，避免 marked 穿透时丢失 HTML 标签
 */
function rebuildContentWithTranslations() {
  var container = document.getElementById("transcise-content-container");
  if (!container) return;

  // 清空容器
  container.innerHTML = "";

  // 将 Markdown 的 marked 解析函数统一
  var parseMD = typeof marked.parse === "function"
    ? function (t) { return marked.parse(t); }
    : (typeof marked === "function"
        ? function (t) { return marked(t); }
        : function (t) { return "<p>" + escapeHtml(t) + "</p>"; });

  // 遍历所有 chunks，逐段渲染并交错插入译文
  for (var i = 0; i < transciseState.chunks.length; i++) {
    var chunk = transciseState.chunks[i];

    if (chunk.type === "code") {
      // 代码块：不翻译，渲染为原始格式
      var codeEl = document.createElement("pre");
      codeEl.className = "transcise-code-block";
      codeEl.setAttribute("data-chunk-id", String(chunk.id));
      codeEl.innerHTML = "<code>" + escapeHtml(chunk.text) + "</code>";
      container.appendChild(codeEl);
      continue;
    }

    // 文本块：渲染原文
    var origHtml;
    try {
      origHtml = parseMD(chunk.text);
    } catch (e) {
      origHtml = "<p>" + escapeHtml(chunk.text) + "</p>";
    }
    var origEl = document.createElement("div");
    origEl.className = "transcise-original";
    origEl.setAttribute("data-chunk-id", String(chunk.id));
    origEl.innerHTML = origHtml;
    container.appendChild(origEl);

    // 渲染译文（如果有）
    var translation = transciseState.translations[chunk.id];
    if (translation) {
      var transHtml;
      try {
        transHtml = parseMD(translation);
      } catch (e) {
        transHtml = "<p>" + escapeHtml(translation) + "</p>";
      }
      var transEl = document.createElement("div");
      transEl.className = "transcise-translation";
      transEl.setAttribute("data-chunk-id", String(chunk.id));
      transEl.innerHTML = transHtml;
      container.appendChild(transEl);
    }
  }

  container.classList.add("has-translations");
}

// ==================== 翻译核心 ====================

/**
 * 执行翻译操作的主流程
 * 验证 API Key → 分段文本 → 批量翻译 → 重建内容 → 应用显示模式
 */
async function performTranslation() {
  

  // 检查 API Key 是否已配置
  if (!transciseState.apiKey) {
    showToolbarError('请先在插件弹窗中配置 DeepSeek API Key');
    return;
  }

  // 防止重复翻译
  if (transciseState.isTranslating) {
    return;
  }

  transciseState.isTranslating = true;
  updateTranslateButtonState('loading');

  try {
    // 第一步：将 Markdown 文本拆分为可翻译的段落块
    transciseState.chunks = splitMarkdownIntoChunks(transciseState.markdownText);

    // 第二步：批量翻译，带进度回调
    transciseState.translations = await batchTranslate(
      transciseState.chunks,
      transciseState.targetLang,
      transciseState.apiKey,
      function (completed, total) {
        updateTranslateButtonProgress(completed, total);
      }
    );

    // 第三步：重建内容，将译文拼接到原文后
    rebuildContentWithTranslations();
    transciseState.hasTranslation = true;

    // 第四步：应用当前显示模式
    applyDisplayMode(transciseState.displayMode);

    updateTranslateButtonState('done');

  } catch (error) {
    console.error('[Transcise] 翻译失败:', error);
    handleTranslationError(error);
  } finally {
    transciseState.isTranslating = false;
  }
}

/**
 * 应用显示模式切换
 * 通过操作 CSS class 控制原文和译文的显隐
 * @param {string} mode - 'both'（双语）| 'translation'（仅译文）| 'original'（仅原文）
 */
function applyDisplayMode(mode) {
  var container = document.getElementById('transcise-content-container');
  if (!container) return;

  // 移除旧模式类，添加新模式类
  container.classList.remove('mode-both', 'mode-translation', 'mode-original');
  container.classList.add('mode-' + mode);

  transciseState.displayMode = mode;
  updateModeButtons(mode);
}

// ==================== 错误处理 ====================

/**
 * 处理翻译过程中的各类错误
 * 根据错误类型提供对应的用户提示
 * @param {Error} error - 错误对象
 */
function handleTranslationError(error) {
  var message = '翻译失败，点击重试';
  var errStr = String(error.message || error);

  if (errStr.indexOf('401') !== -1) {
    message = 'API Key 无效，请检查配置';
  } else if (errStr.indexOf('403') !== -1) {
    message = 'API Key 权限不足';
  } else if (errStr.indexOf('429') !== -1) {
    message = '请求频率过高，请稍后重试';
  } else if (error.name === 'AbortError') {
    message = '请求超时，请检查网络后重试';
  }

  showToolbarError(message);
  updateTranslateButtonState('error');
}

// ==================== 初始化入口 ====================

/**
 * 插件主入口函数
 * 检测页面类型 → 渲染 Markdown
 */
async function initTranscise() {
  console.log('[Transcise] initTranscise() called');

  // 仅在 .md 页面上执行
  if (!isMarkdownPage()) {
    return;
  }

  // 获取原始 Markdown 文本
  transciseState.markdownText = getRawMarkdownText();
  if (!transciseState.markdownText) {
    return; // 空内容，不处理
  }

  // 从 Chrome Storage 读取用户配置
  transciseState.apiKey = await getStorageItem(STORAGE_KEYS.API_KEY, '');
  transciseState.targetLang = await getStorageItem(STORAGE_KEYS.DEFAULT_LANG, 'zh');
  transciseState.model = await getStorageItem(STORAGE_KEYS.MODEL, 'deepseek-chat');

  // 渲染 Markdown 为格式化 HTML
  renderMarkdown(transciseState.markdownText);

  // 渲染完成后自动触发翻译或提示配置 API Key
  // 使用 setTimeout 确保工具栏 DOM 已完全就绪
  setTimeout(function () {
    if (transciseState.apiKey) {
      // 已有 API Key，自动开始翻译
      performTranslation();
    } else {
      // 未配置 API Key，弹出醒目提示弹窗
      showApiKeyPrompt();
    }
  }, 300);
}

// ==================== 启动 ====================
console.log('[Transcise] content.js loaded, URL:', window.location.href);
initTranscise().catch(function(err) {
  console.error('[Transcise] 初始化失败:', err);
});
