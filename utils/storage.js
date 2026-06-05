/**
 * Chrome Storage 工具模块
 * 封装 Chrome Storage API，提供类型安全的读写操作
 */

// ==================== 存储键常量 ====================
const STORAGE_KEYS = {
  API_KEY: 'transcise_api_key',           // DeepSeek API Key
  DEFAULT_LANG: 'transcise_default_lang', // 默认目标语言
  MODEL: 'transcise_model',               // 使用的模型名称
  AUTO_TRIGGER: 'transcise_auto_trigger', // 自动触发开关
  TRANSLATION_CACHE: 'transcise_cache'    // 翻译缓存
};

// ==================== 默认值 ====================
const DEFAULTS = {
  [STORAGE_KEYS.DEFAULT_LANG]: 'zh',
  [STORAGE_KEYS.MODEL]: 'deepseek-chat',
  [STORAGE_KEYS.API_KEY]: '',
  [STORAGE_KEYS.AUTO_TRIGGER]: false
};

/**
 * 从 Chrome Storage 获取配置值
 * @param {string} key - 存储键名（使用 STORAGE_KEYS 常量）
 * @param {*} fallback - 键不存在时的默认值
 * @returns {Promise<*>} 存储的值
 */
async function getStorageItem(key, fallback = null) {
  try {
    const result = await chrome.storage.sync.get(key);
    const value = result[key];
    // 如果值为 undefined 或 null，使用 fallback 或默认值
    if (value === undefined || value === null) {
      return fallback !== null ? fallback : DEFAULTS[key];
    }
    return value;
  } catch (error) {
    console.error('[Transcise] 读取存储失败:', key, error);
    return fallback !== null ? fallback : DEFAULTS[key];
  }
}

/**
 * 保存配置到 Chrome Storage
 * @param {string} key - 存储键名
 * @param {*} value - 要保存的值
 * @returns {Promise<void>}
 */
async function setStorageItem(key, value) {
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch (error) {
    console.error('[Transcise] 保存存储失败:', key, error);
    throw error;
  }
}

/**
 * 批量获取多个存储项
 * @param {string[]} keys - 键名数组
 * @returns {Promise<Object>} 键值对对象
 */
async function getStorageItems(keys) {
  try {
    const result = await chrome.storage.sync.get(keys);
    // 为缺失的键填充默认值
    const merged = {};
    for (const key of keys) {
      merged[key] = result[key] !== undefined ? result[key] : DEFAULTS[key];
    }
    return merged;
  } catch (error) {
    console.error('[Transcise] 批量读取存储失败:', keys, error);
    return {};
  }
}

/**
 * 获取翻译缓存
 * @param {string} text - 原文
 * @param {string} targetLang - 目标语言
 * @returns {Promise<string|null>} 缓存的译文，若无缓存则返回 null
 */
async function getTranslationCache(text, targetLang) {
  try {
    const cacheKey = await hashText(text, targetLang);
    const result = await chrome.storage.local.get(cacheKey);
    const cached = result[cacheKey];

    if (cached && cached.expires > Date.now()) {
      return cached.translation;
    }
    return null;
  } catch (error) {
    console.warn('[Transcise] 读取翻译缓存失败:', error);
    return null;
  }
}

/**
 * 设置翻译缓存
 * @param {string} text - 原文
 * @param {string} targetLang - 目标语言
 * @param {string} translation - 译文
 * @returns {Promise<void>}
 */
async function setTranslationCache(text, targetLang, translation) {
  try {
    const cacheKey = await hashText(text, targetLang);
    const cacheData = {
      translation: translation,
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7天过期
    };
    await chrome.storage.local.set({ [cacheKey]: cacheData });
  } catch (error) {
    console.warn('[Transcise] 写入翻译缓存失败:', error);
  }
}

/**
 * 生成文本哈希（用于缓存键）
 * 使用简单的字符串哈希算法
 * @param {string} text - 待哈希文本
 * @param {string} lang - 目标语言
 * @returns {Promise<string>} 哈希字符串
 */
async function hashText(text, lang) {
  let hash = 0;
  const combined = text + '|' + lang;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'tc_' + Math.abs(hash).toString(36);
}
