/**
 * Transcise Service Worker
 * 负责后台翻译请求代理和缓存管理
 * 避免 content script 中直接调用 API 时的 CORS 限制
 */

'use strict';

// ==================== 常量 ====================
const API_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 30000;

// ==================== 安装/更新事件 ====================

/**
 * 插件安装或更新时初始化默认配置
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // 首次安装：写入默认配置
    await chrome.storage.sync.set({
      transcise_default_lang: 'zh',
      transcise_model: 'deepseek-chat'
    });
    console.log('[Transcise] 插件安装完成，默认配置已写入');
 } else if (details.reason === 'update') {
   console.log('[Transcise] 插件已更新到版本 ' + chrome.runtime.getManifest().version);
 }
});

// ==================== 消息处理 ====================

/**
 * 监听来自 content script 和 popup 的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 使用异步处理并保持消息通道开放
  handleMessageAsync(message, sender).then(sendResponse).catch(error => {
    console.error('[Transcise] 消息处理失败:', error);
    sendResponse({ success: false, error: error.message });
  });
  return true; // 保持消息通道开放
});

/**
 * 异步处理不同类型的消息
 * @param {Object} message - 消息对象
 * @param {Object} sender - 发送者信息
 * @returns {Promise<Object>} 响应数据
 */
async function handleMessageAsync(message, sender) {
  switch (message.type) {
    case 'TRANSLATE':
      return await handleTranslateRequest(message);
    case 'VALIDATE_API_KEY':
      return await handleValidateApiKey(message.apiKey);
    case 'GET_CONFIG':
      return await handleGetConfig();
    default:
      return { success: false, error: '未知消息类型' };
  }
}

/**
 * 处理翻译请求
 * 接收 text + targetLang → 调用 DeepSeek API → 返回译文
 * @param {Object} params - { text, targetLang, apiKey, model }
 * @returns {Promise<Object>} { success, translation? }
 */
async function handleTranslateRequest(params) {
  const { text, targetLang, apiKey, model } = params;

  if (!text || !targetLang || !apiKey) {
    return { success: false, error: '缺少必要参数' };
  }

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: buildTranslateSystemPrompt(targetLang)
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 4096
        })
      }, REQUEST_TIMEOUT);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const translation = data.choices[0].message.content;
      return { success: true, translation };

    } catch (error) {
      lastError = error;

      // 认证错误不重试
      if (error.message.includes('401') || error.message.includes('403')) {
        return { success: false, error: error.message };
      }

      // 重试前等待
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, attempt));
      }
    }
  }

  return { success: false, error: lastError.message };
}

/**
 * 验证 DeepSeek API Key 是否有效
 * 发送一个轻量级测试请求
 * @param {string} apiKey - 要验证的 API Key
 * @returns {Promise<Object>} { valid: boolean, error? }
 */
async function handleValidateApiKey(apiKey) {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return { valid: false, error: 'API Key 格式不正确' };
  }

  try {
    const response = await fetchWithTimeout(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1
      })
    }, 15000);

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'API Key 无效或权限不足' };
    }

    return { valid: response.ok };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * 获取当前插件配置
 * @returns {Promise<Object>}
 */
async function handleGetConfig() {
  const config = await chrome.storage.sync.get([
    'transcise_api_key',
    'transcise_default_lang',
    'transcise_model'
  ]);
  return {
    success: true,
    config: {
      apiKey: config.transcise_api_key || '',
      defaultLang: config.transcise_default_lang || 'zh',
      model: config.transcise_model || 'deepseek-chat'
    }
  };
}

// ==================== 辅助函数 ====================

/**
 * 构建翻译系统提示词
 * @param {string} targetLang - 目标语言代码
 * @returns {string}
 */
function buildTranslateSystemPrompt(targetLang) {
  const langNames = {
    'zh': '简体中文', 'zh-TW': '繁体中文', 'en': 'English',
    'ja': '日本語', 'ko': '한국어', 'fr': 'Français', 'de': 'Deutsch',
    'es': 'Español', 'ru': 'Русский', 'pt': 'Português', 'it': 'Italiano',
    'vi': 'Tiếng Việt', 'th': 'ไทย', 'id': 'Bahasa Indonesia'
  };
  const langName = langNames[targetLang] || targetLang;

  return `你是一个专业的 Markdown 文档翻译助手。请将以下 Markdown 文本翻译为${langName}。严格保持 Markdown 格式，只翻译文本内容。直接返回翻译结果，不要添加任何解释。`;
}

/**
 * 带超时的 fetch 请求封装
 * @param {string} url - 请求 URL
 * @param {Object} options - fetch 选项
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 休眠函数
 * @param {number} ms - 毫秒
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
