/**
 * Transcise Popup 配置面板脚本
 * 处理 API Key 配置、语言设置的表单交互和存储操作
 */

'use strict';

// ==================== DOM 元素引用 ====================
const elements = {
  apiKeyInput: document.getElementById('api-key'),
  toggleKeyBtn: document.getElementById('toggle-key-visibility'),
  apiKeyStatus: document.getElementById('api-key-status'),
  defaultLangSelect: document.getElementById('default-lang'),
  modelSelect: document.getElementById('model-select'),
  saveBtn: document.getElementById('save-btn'),
  saveStatus: document.getElementById('save-status')
};

// ==================== 初始化 ====================

/**
 * 页面加载时从存储中读取配置并填充表单
 */
async function loadSettings() {
  try {
    const settings = await getStorageItems([
      STORAGE_KEYS.API_KEY,
      STORAGE_KEYS.DEFAULT_LANG,
      STORAGE_KEYS.MODEL
    ]);

    // 填充表单字段
    if (elements.apiKeyInput && settings[STORAGE_KEYS.API_KEY]) {
      elements.apiKeyInput.value = settings[STORAGE_KEYS.API_KEY];
      updateApiKeyStatus(true);
    }

    if (elements.defaultLangSelect && settings[STORAGE_KEYS.DEFAULT_LANG]) {
      elements.defaultLangSelect.value = settings[STORAGE_KEYS.DEFAULT_LANG];
    }

    if (elements.modelSelect && settings[STORAGE_KEYS.MODEL]) {
      elements.modelSelect.value = settings[STORAGE_KEYS.MODEL];
    }
  } catch (error) {
    console.error('[Transcise] 加载配置失败:', error);
  }
}

// ==================== 事件处理 ====================

/**
 * 切换 API Key 可见性
 */
function toggleApiKeyVisibility() {
  if (!elements.apiKeyInput) return;

  const isPassword = elements.apiKeyInput.type === 'password';
  elements.apiKeyInput.type = isPassword ? 'text' : 'password';
  elements.toggleKeyBtn.textContent = isPassword ? '🙈' : '👁️';
}

/**
 * 更新 API Key 输入状态指示
 * @param {boolean} hasValue - 是否有值
 */
function updateApiKeyStatus(hasValue) {
  if (!elements.apiKeyStatus) return;

  if (hasValue) {
    elements.apiKeyStatus.textContent = '✅ API Key 已配置';
    elements.apiKeyStatus.className = 'form-hint status-success';
  } else {
    elements.apiKeyStatus.textContent = '';
    elements.apiKeyStatus.className = 'form-hint';
  }
}

/**
 * 保存配置到 Chrome Storage
 */
async function saveSettings() {
  if (!elements.saveBtn) return;

  // 禁用按钮防止重复保存
  elements.saveBtn.disabled = true;
  elements.saveBtn.textContent = '⏳ 保存中...';

  try {
    const apiKey = elements.apiKeyInput ? elements.apiKeyInput.value.trim() : '';
    const defaultLang = elements.defaultLangSelect ? elements.defaultLangSelect.value : 'zh';
    const model = elements.modelSelect ? elements.modelSelect.value : 'deepseek-chat';

    // 保存到 Chrome Storage
    await Promise.all([
      setStorageItem(STORAGE_KEYS.API_KEY, apiKey),
      setStorageItem(STORAGE_KEYS.DEFAULT_LANG, defaultLang),
      setStorageItem(STORAGE_KEYS.MODEL, model)
    ]);

    // 更新状态
    updateApiKeyStatus(!!apiKey);
    showSaveStatus('success', '✅ 设置已保存');

  } catch (error) {
    console.error('[Transcise] 保存配置失败:', error);
    showSaveStatus('error', '❌ 保存失败，请重试');
  } finally {
    elements.saveBtn.disabled = false;
    elements.saveBtn.textContent = '💾 保存设置';
  }
}

/**
 * 显示保存状态提示
 * @param {string} type - 'success' | 'error'
 * @param {string} message - 提示信息
 */
function showSaveStatus(type, message) {
  if (!elements.saveStatus) return;

  elements.saveStatus.textContent = message;
  elements.saveStatus.className = 'save-status status-' + type;
  elements.saveStatus.style.display = 'block';

  // 2 秒后自动隐藏
  setTimeout(() => {
    elements.saveStatus.style.display = 'none';
  }, 2000);
}

// ==================== 事件绑定 ====================

/**
 * 绑定所有交互事件
 */
function bindEvents() {
  // 切换 API Key 可见性
  if (elements.toggleKeyBtn) {
    elements.toggleKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  }

  // API Key 输入变更
  if (elements.apiKeyInput) {
    elements.apiKeyInput.addEventListener('input', () => {
      updateApiKeyStatus(!!elements.apiKeyInput.value.trim());
    });
  }

  // 保存按钮
  if (elements.saveBtn) {
    elements.saveBtn.addEventListener('click', saveSettings);
  }

  // 键盘快捷键 Ctrl+S / Cmd+S 保存
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveSettings();
    }
  });
}

// ==================== 启动 ====================
bindEvents();

// Open viewer tab
var openViewerBtn = document.getElementById('open-viewer');
if (openViewerBtn) {
  openViewerBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('viewer/viewer.html') });
  });
}

loadSettings();
