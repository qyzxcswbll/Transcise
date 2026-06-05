/**
 * Transcise Popup 主面板脚本
 * 文件上传 + 设置管理 + 自动触发开关
 */

'use strict';

// ==================== DOM 元素引用 ====================
const elements = {
  uploadArea: document.getElementById('upload-area'),
  uploadBtn: document.getElementById('upload-btn'),
  fileInput: document.getElementById('file-input'),
  uploadStatus: document.getElementById('upload-status'),
  uploadStatusText: document.getElementById('upload-status-text'),

  autoTriggerToggle: document.getElementById('auto-trigger-toggle'),

  apiKeyInput: document.getElementById('api-key'),
  toggleKeyBtn: document.getElementById('toggle-key-visibility'),
  apiKeyStatus: document.getElementById('api-key-status'),
  defaultLangSelect: document.getElementById('default-lang'),
  modelSelect: document.getElementById('model-select'),
  saveBtn: document.getElementById('save-btn'),
  saveStatus: document.getElementById('save-status')
};

// ==================== 存储键 ====================
const AUTO_TRIGGER_KEY = STORAGE_KEYS.AUTO_TRIGGER;
const TEMP_FILE_KEY = 'transcise_temp_file';

// ==================== 初始化 ====================
async function loadSettings() {
  try {
    const settings = await getStorageItems([
      STORAGE_KEYS.API_KEY,
      STORAGE_KEYS.DEFAULT_LANG,
      STORAGE_KEYS.MODEL,
      AUTO_TRIGGER_KEY
    ]);

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
    if (elements.autoTriggerToggle) {
      elements.autoTriggerToggle.checked = settings[AUTO_TRIGGER_KEY] === true;
    }
  } catch (error) {
    console.error('[Transcise] 加载配置失败:', error);
  }
}

// ==================== 文件上传逻辑 ====================

/**
 * 处理用户选择的 .md 文件
 * 读取内容后存储到临时存储，然后打开查看器页面
 */
function handleFile(file) {
  if (!file) return;

  // 验证文件扩展名
  const name = file.name.toLowerCase();
  const validExts = ['.md', '.markdown', '.mdown', '.mkd'];
  const isValid = validExts.some(ext => name.endsWith(ext));
  if (!isValid) {
    showUploadStatus('error', '请选择 Markdown 文件（.md, .markdown）');
    return;
  }

  showUploadStatus('loading', '正在读取文件...');

  const reader = new FileReader();
  reader.onload = async function (e) {
    const content = e.target.result;
    if (!content.trim()) {
      showUploadStatus('error', '文件内容为空');
      return;
    }

    try {
      // 保存文件内容到临时存储
      await chrome.storage.local.set({
        [TEMP_FILE_KEY]: {
          content: content,
          fileName: file.name,
          timestamp: Date.now()
        }
      });

      showUploadStatus('success', '✅ 正在打开查看器...');

      // 打开查看器页面（传递文件名参数用于显示）
      const viewerUrl = chrome.runtime.getURL('viewer/viewer.html') +
        '?source=popup&file=' + encodeURIComponent(file.name);
      chrome.tabs.create({ url: viewerUrl });

      // 延迟关闭弹窗
      setTimeout(window.close, 500);
    } catch (error) {
      console.error('[Transcise] 保存文件失败:', error);
      showUploadStatus('error', '保存文件失败，请重试');
    }
  };

  reader.onerror = function () {
    showUploadStatus('error', '读取文件失败，请重试');
  };

  reader.readAsText(file);
}

/**
 * 显示上传状态
 */
function showUploadStatus(type, message) {
  const status = elements.uploadStatus;
  const text = elements.uploadStatusText;
  if (!status || !text) return;

  status.style.display = 'block';
  status.className = 'upload-status status-' + type;
  text.textContent = message;

  // 错误状态 3 秒后自动隐藏
  if (type === 'error') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}

// ==================== 自动触发开关 ====================

async function handleAutoTriggerChange() {
  if (!elements.autoTriggerToggle) return;
  const enabled = elements.autoTriggerToggle.checked;
  try {
    await setStorageItem(AUTO_TRIGGER_KEY, enabled);
    console.log('[Transcise] 自动触发:', enabled ? '开启' : '关闭');
  } catch (error) {
    console.error('[Transcise] 保存自动触发设置失败:', error);
  }
}

// ==================== API Key 可见性切换 ====================

function toggleApiKeyVisibility() {
  if (!elements.apiKeyInput) return;
  const isPassword = elements.apiKeyInput.type === 'password';
  elements.apiKeyInput.type = isPassword ? 'text' : 'password';
  if (elements.toggleKeyBtn) {
    elements.toggleKeyBtn.textContent = isPassword ? '🙈' : '👁️';
  }
}

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

// ==================== 保存设置 ====================

async function saveSettings() {
  if (!elements.saveBtn) return;

  elements.saveBtn.disabled = true;
  elements.saveBtn.textContent = '⏳ 保存中...';

  try {
    const apiKey = elements.apiKeyInput ? elements.apiKeyInput.value.trim() : '';
    const defaultLang = elements.defaultLangSelect ? elements.defaultLangSelect.value : 'zh';
    const model = elements.modelSelect ? elements.modelSelect.value : 'deepseek-chat';

    await Promise.all([
      setStorageItem(STORAGE_KEYS.API_KEY, apiKey),
      setStorageItem(STORAGE_KEYS.DEFAULT_LANG, defaultLang),
      setStorageItem(STORAGE_KEYS.MODEL, model)
    ]);

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

function showSaveStatus(type, message) {
  if (!elements.saveStatus) return;
  elements.saveStatus.textContent = message;
  elements.saveStatus.className = 'save-status status-' + type;
  elements.saveStatus.style.display = 'block';
  setTimeout(() => {
    elements.saveStatus.style.display = 'none';
  }, 2000);
}

// ==================== 拖拽支持 ====================

function setupDragDrop() {
  const area = elements.uploadArea;
  if (!area) return;

  // 阻止默认行为（防止浏览器打开文件）
  document.addEventListener('dragover', (e) => { e.preventDefault(); });
  document.addEventListener('drop', (e) => { e.preventDefault(); });

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    area.classList.add('drag-over');
  });

  area.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    area.classList.remove('drag-over');
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    area.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
}

// ==================== 事件绑定 ====================

function bindEvents() {
  // 文件上传按钮
  if (elements.uploadBtn && elements.fileInput) {
    elements.uploadBtn.addEventListener('click', () => {
      elements.fileInput.click();
    });
    elements.fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
      // 重置 input 以便重复选择同一文件
      e.target.value = '';
    });
  }

  // 点击上传区域也触发文件选择
  if (elements.uploadArea && elements.fileInput) {
    elements.uploadArea.addEventListener('click', (e) => {
      // 防止点击内部按钮时触发两次
      if (e.target === elements.uploadArea || e.target.closest('.upload-icon') ||
          e.target.closest('.upload-title') || e.target.closest('.upload-hint')) {
        elements.fileInput.click();
      }
    });
  }

  // 自动触发开关
  if (elements.autoTriggerToggle) {
    elements.autoTriggerToggle.addEventListener('change', handleAutoTriggerChange);
  }

  // API Key 可见性切换
  if (elements.toggleKeyBtn) {
    elements.toggleKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  }

  // API Key 输入实时状态
  if (elements.apiKeyInput) {
    elements.apiKeyInput.addEventListener('input', () => {
      updateApiKeyStatus(!!elements.apiKeyInput.value.trim());
    });
  }

  // 保存按钮
  if (elements.saveBtn) {
    elements.saveBtn.addEventListener('click', saveSettings);
  }

  // 快捷键 Ctrl+S / Cmd+S
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveSettings();
    }
  });
}

// ==================== 启动 ====================
setupDragDrop();
bindEvents();
loadSettings();
