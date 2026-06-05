/**
 * Transcise 翻译工具栏模块
 * 动态创建和管理翻译控制工具栏 UI
 * 与 content.js 共享全局作用域，通过 transciseState 和全局函数交互
 */

'use strict';
console.log('[Transcise] toolbar.js loaded');

// ==================== 工具栏 DOM 创建 ====================

/**
 * 创建并注入翻译工具栏到页面顶部（sticky 定位）
 * 包含品牌标识、语言选择器、翻译按钮、显示模式切换、状态提示
 */
function injectToolbar() {
  // 防止重复注入
  if (document.getElementById('transcise-toolbar')) {
    return;
  }

  // 构建工具栏 HTML 结构
  var toolbarHtml = '<div class="transcise-toolbar-inner">' +
    '<span class="transcise-brand">🌐 Transcise</span>' +
    '<div class="transcise-controls">' +
      // 目标语言选择器
      '<select id="transcise-lang-select" class="transcise-select" title="选择翻译目标语言">' +
        '<option value="zh">🇨🇳 中文</option>' +
        '<option value="en">🇺🇸 English</option>' +
        '<option value="ja">🇯🇵 日本語</option>' +
        '<option value="ko">🇰🇷 한국어</option>' +
        '<option value="fr">🇫🇷 Français</option>' +
        '<option value="de">🇩🇪 Deutsch</option>' +
        '<option value="es">🇪🇸 Español</option>' +
        '<option value="ru">🇷🇺 Русский</option>' +
        '<option value="pt">🇵🇹 Português</option>' +
        '<option value="it">🇮🇹 Italiano</option>' +
        '<option value="vi">🇻🇳 Tiếng Việt</option>' +
        '<option value="th">🇹🇭 ไทย</option>' +
        '<option value="id">🇮🇩 Bahasa Indonesia</option>' +
      '</select>' +
      // 翻译触发按钮
      '<button id="transcise-translate-btn" class="transcise-btn transcise-btn-primary" title="开始翻译">翻译</button>' +
      // 显示模式切换按钮组
      '<div class="transcise-mode-group">' +
        '<button class="transcise-mode-btn active" data-mode="both" title="原文和译文同时显示">双语</button>' +
        '<button class="transcise-mode-btn" data-mode="translation" title="仅显示译文">仅译文</button>' +
        '<button class="transcise-mode-btn" data-mode="original" title="仅显示原文">仅原文</button>' +
      '</div>' +
    '</div>' +
    // 状态信息显示区
    '<span id="transcise-status" class="transcise-status"></span>' +
  '</div>' +
  // 翻译进度条
  '<div id="transcise-progress-bar" class="transcise-progress-bar" style="display: none;">' +
    '<div id="transcise-progress-fill" class="transcise-progress-fill"></div>' +
  '</div>';

  var toolbar = document.createElement('div');
  toolbar.id = 'transcise-toolbar';
  toolbar.className = 'transcise-toolbar';
  toolbar.innerHTML = toolbarHtml;

  // 插入到 <body> 顶部
  if (document.body.firstChild) {
    document.body.insertBefore(toolbar, document.body.firstChild);
  } else {
    document.body.appendChild(toolbar);
  }

  // 绑定交互事件
  bindToolbarEvents();

  // 设置当前语言选项
  var langSelect = document.getElementById('transcise-lang-select');
  if (langSelect && transciseState.targetLang) {
    langSelect.value = transciseState.targetLang;
  }
}

// ==================== 事件绑定 ====================

/**
 * 为工具栏各控件绑定事件监听器
 */
function bindToolbarEvents() {
  // 翻译按钮点击事件
  var translateBtn = document.getElementById('transcise-translate-btn');
  if (translateBtn) {
    translateBtn.addEventListener('click', function () {
      if (!transciseState.isTranslating) {
        performTranslation();
      }
    });
  }

  // 语言选择变更事件
  var langSelect = document.getElementById('transcise-lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', function (event) {
      transciseState.targetLang = event.target.value;
      // 持久化用户语言偏好到 Chrome Storage
      setStorageItem(STORAGE_KEYS.DEFAULT_LANG, event.target.value);
    });
  }

  // 显示模式切换按钮事件
  var modeButtons = document.querySelectorAll('.transcise-mode-btn');
  for (var i = 0; i < modeButtons.length; i++) {
    modeButtons[i].addEventListener('click', function (event) {
      var mode = event.target.getAttribute('data-mode');
      if (mode) {
        applyDisplayMode(mode);
      }
    });
  }
}

// ==================== UI 状态更新函数 ====================

/**
 * 更新翻译按钮的视觉状态
 * @param {string} status - 'idle' | 'loading' | 'done' | 'error'
 */
function updateTranslateButtonState(status) {
  var btn = document.getElementById('transcise-translate-btn');
  var statusEl = document.getElementById('transcise-status');
  var progressBar = document.getElementById('transcise-progress-bar');

  if (!btn) return;

  switch (status) {
    case 'loading':
      btn.disabled = true;
      btn.classList.add('loading');
      btn.textContent = '翻译中...';
      if (progressBar) progressBar.style.display = 'block';
      break;

    case 'done':
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.textContent = '重新翻译';
      btn.classList.add('success');
      if (statusEl) {
        statusEl.textContent = '✅ 翻译完成';
        statusEl.className = 'transcise-status status-success';
      }
      if (progressBar) progressBar.style.display = 'none';
      // 3 秒后自动恢复为普通按钮样式
      setTimeout(function () {
        btn.classList.remove('success');
        btn.textContent = '重新翻译';
      }, 3000);
      break;

    case 'error':
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.textContent = '重试';
      btn.classList.add('error');
      if (progressBar) progressBar.style.display = 'none';
      break;

    default: // idle - 初始状态
      btn.disabled = false;
      btn.classList.remove('loading', 'success', 'error');
      btn.textContent = '翻译';
      if (statusEl) statusEl.textContent = '';
      if (progressBar) progressBar.style.display = 'none';
      break;
  }
}

/**
 * 更新翻译进度显示
 * @param {number} completed - 已完成段数
 * @param {number} total - 总段数
 */
function updateTranslateButtonProgress(completed, total) {
  var statusEl = document.getElementById('transcise-status');
  var progressFill = document.getElementById('transcise-progress-fill');

  if (statusEl) {
    statusEl.textContent = '翻译中 ' + completed + '/' + total + '...';
    statusEl.className = 'transcise-status status-loading';
  }

  if (progressFill) {
    var percentage = Math.round((completed / total) * 100);
    progressFill.style.width = percentage + '%';
  }
}

/**
 * 更新显示模式按钮的激活状态
 * @param {string} activeMode - 当前激活的显示模式
 */
function updateModeButtons(activeMode) {
  var buttons = document.querySelectorAll('.transcise-mode-btn');
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i].getAttribute('data-mode') === activeMode) {
      buttons[i].classList.add('active');
    } else {
      buttons[i].classList.remove('active');
    }
  }
}

/**
 * 在工具栏显示错误提示
 * @param {string} message - 错误提示文本
 */
function showToolbarError(message) {
  var statusEl = document.getElementById('transcise-status');
  if (statusEl) {
    statusEl.textContent = '❌ ' + message;
    statusEl.className = 'transcise-status status-error';
  }
}

// ==================== API Key 提示弹窗 ====================

/**
 * 显示 API Key 未配置的醒目提示
 * 在页面上方显示引导用户配置 API Key 的弹窗卡片
 */
function showApiKeyPrompt() {
  if (document.getElementById("transcise-apikey-prompt")) return;

  // 遮罩层
  var overlay = document.createElement("div");
  overlay.id = "transcise-apikey-prompt";
  overlay.className = "transcise-popup-overlay";
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) dismissApiKeyPrompt();
  });

  // 弹出卡片
  var card = document.createElement("div");
  card.className = "transcise-popup-card";
  card.innerHTML =
    '<span id="transcise-popup-close" class="transcise-popup-close" title="关闭">✕</span>' +
    '<div class="transcise-popup-header">' +
      '<div class="transcise-popup-icon-box">🔑</div>' +
      '<div class="transcise-popup-title">配置 API Key</div>' +
    '</div>' +
    '<div class="transcise-popup-row">' +
      '<input id="transcise-inline-apikey" class="transcise-popup-input" type="password" ' +
        'placeholder="sk-..." autocomplete="off" spellcheck="false">' +
      '<button id="transcise-inline-save-btn" class="transcise-popup-btn">保存</button>' +
    '</div>' +
    '<span id="transcise-inline-status" class="transcise-popup-status"></span>' +
    '<div class="transcise-popup-footer">' +
      '<a href="https://platform.deepseek.com/api_keys" target="_blank">📋 获取 Key</a>' +
      '<span class="transcise-popup-hint">Enter 快捷提交</span>' +
    '</div>';

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // 绑定事件
  var inputEl = document.getElementById("transcise-inline-apikey");
  var saveBtn = document.getElementById("transcise-inline-save-btn");
  var statusEl = document.getElementById("transcise-inline-status");

  if (saveBtn && inputEl) {
    saveBtn.addEventListener("click", function () { handleInlineApiKeySave(inputEl, saveBtn, statusEl); });
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); handleInlineApiKeySave(inputEl, saveBtn, statusEl); }
    });
    inputEl.addEventListener("input", function () {
      if (statusEl) { statusEl.textContent = ""; statusEl.className = "transcise-popup-status"; }
      inputEl.classList.remove("input-error");
    });
    setTimeout(function () { inputEl.focus(); }, 350);
  }

  document.getElementById("transcise-popup-close").addEventListener("click", dismissApiKeyPrompt);
}

async function handleInlineApiKeySave(inputEl, saveBtn, statusEl) {
  var apiKey = inputEl.value.trim();
  if (!apiKey) { showInlineStatus(statusEl, "请输入 API Key", "error"); inputEl.classList.add("input-error"); inputEl.focus(); return; }
  if (!apiKey.startsWith("sk-")) { showInlineStatus(statusEl, "格式不正确，应以 sk- 开头", "error"); inputEl.classList.add("input-error"); inputEl.focus(); return; }
  if (apiKey.length < 20) { showInlineStatus(statusEl, "Key 长度不足，请检查是否完整复制", "error"); inputEl.classList.add("input-error"); inputEl.focus(); return; }

  saveBtn.disabled = true;
  saveBtn.textContent = "保存中…";
  showInlineStatus(statusEl, "正在保存…", "loading");

  try {
    await setStorageItem(STORAGE_KEYS.API_KEY, apiKey);
    transciseState.apiKey = apiKey;
    showInlineStatus(statusEl, "✅ 已保存，即将翻译", "success");
    setTimeout(dismissApiKeyPrompt, 500);
    setTimeout(performTranslation, 700);
  } catch (e) {
    showInlineStatus(statusEl, "保存失败: " + e.message, "error");
    saveBtn.disabled = false;
    saveBtn.textContent = "保存";
  }
}

function showInlineStatus(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = "transcise-popup-status status-" + type;
}


function dismissApiKeyPrompt() {
  var prompt = document.getElementById("transcise-apikey-prompt");
  if (prompt) {
    prompt.style.opacity = "0";
    prompt.style.transform = "translateY(-10px)";
    setTimeout(function () {
      if (prompt.parentNode) {
        prompt.parentNode.removeChild(prompt);
      }
    }, 300);
  }

  // 清除工具栏错误状态
  var statusEl = document.getElementById("transcise-status");
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.className = "transcise-status";
  }
}
