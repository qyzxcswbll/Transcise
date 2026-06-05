/**
 * DeepSeek 翻译模块
 * 封装 DeepSeek Chat API 调用，管理并发、重试和错误处理
 */

// ==================== 翻译配置 ====================
const TRANSLATOR_CONFIG = {
  API_ENDPOINT: 'https://api.deepseek.com/chat/completions',
  MAX_CONCURRENCY: 3,      // 最大并发请求数
  MAX_RETRIES: 3,          // 最大重试次数
  REQUEST_TIMEOUT: 30000,  // 请求超时 (ms)
  BASE_DELAY: 1000,        // 重试基础延迟 (ms)
  MAX_CHUNK_SIZE: 2000     // 单段最大字符数
};

// ==================== 语言映射 ====================
const LANG_MAP = {
  'zh': '简体中文',
  'zh-TW': '繁体中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'ru': 'Русский',
  'ar': 'العربية',
  'pt': 'Português',
  'it': 'Italiano',
  'vi': 'Tiếng Việt',
  'th': 'ไทย',
  'id': 'Bahasa Indonesia'
};

/**
 * 将 Markdown 文本拆分为可翻译的段落块
 * 保持 Markdown 结构（代码块不翻译、标题等）
 * @param {string} markdown - 原始 Markdown 文本
 * @returns {Array<{id: number, text: string, type: string}>} 段落块数组
 */
function splitMarkdownIntoChunks(markdown) {
  const lines = markdown.split('\n');
  const chunks = [];
  let id = 0;
  let currentChunk = '';
  let inCodeBlock = false;

  for (const line of lines) {
    // 检测代码块边界
    if (line.trim().startsWith('```')) {
      // 如果当前有累积的文本，先保存
      if (currentChunk.trim()) {
        chunks.push({ id: id++, text: currentChunk.trim(), type: inCodeBlock ? 'code' : 'text' });
        currentChunk = '';
      }
      // 代码块标记行单独作为 code 类型
      chunks.push({ id: id++, text: line, type: 'code' });
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // 代码块内的行不翻译
    if (inCodeBlock) {
      chunks.push({ id: id++, text: line, type: 'code' });
      continue;
    }

    // 空行作为段落分隔
    if (line.trim() === '') {
      if (currentChunk.trim()) {
        chunks.push({ id: id++, text: currentChunk.trim(), type: 'text' });
        currentChunk = '';
      }
      continue;
    }

    // 累积文本行
    currentChunk += (currentChunk ? '\n' : '') + line;

    // 如果累积超过最大块大小，分割
    if (currentChunk.length >= TRANSLATOR_CONFIG.MAX_CHUNK_SIZE) {
      chunks.push({ id: id++, text: currentChunk.trim(), type: 'text' });
      currentChunk = '';
    }
  }

  // 保存最后一段
  if (currentChunk.trim()) {
    chunks.push({ id: id++, text: currentChunk.trim(), type: inCodeBlock ? 'code' : 'text' });
  }

  return chunks;
}

/**
 * 构建翻译系统提示词
 * @param {string} targetLang - 目标语言代码
 * @returns {string} 系统提示词
 */
function buildSystemPrompt(targetLang) {
  const langName = LANG_MAP[targetLang] || targetLang;
  return `你是一个专业的 Markdown 文档翻译助手。请将以下 Markdown 文本翻译为${langName}。

翻译规则：
1. 严格保持原文的 Markdown 格式（标题 #、粗体 **、斜体 *、链接 [text](url)、列表 -、序号 1. 等）
2. 只翻译文本内容，不对 Markdown 语法标记做任何修改
3. 代码片段和代码块中的内容不翻译
4. URL 链接地址不翻译，只翻译链接显示文本
5. 技术术语保持专业准确
6. 保持段落的自然流畅

请直接返回翻译后的 Markdown 文本，不要添加任何解释或说明。`;
}

/**
 * 发送单个翻译请求到 DeepSeek API
 * @param {string} text - 待翻译文本
 * @param {string} targetLang - 目标语言
 * @param {string} apiKey - API 密钥
 * @returns {Promise<string>} 翻译后的文本
 */
async function callDeepSeekAPI(text, targetLang, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSLATOR_CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(TRANSLATOR_CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: (typeof transciseState !== 'undefined' && transciseState.model) || 'deepseek-chat',
        messages: [
          { role: 'system', content: buildSystemPrompt(targetLang) },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 4096,
        stream: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 带重试的翻译请求
 * @param {string} text - 待翻译文本
 * @param {string} targetLang - 目标语言
 * @param {string} apiKey - API 密钥
 * @returns {Promise<string>} 翻译结果
 */
async function translateWithRetry(text, targetLang, apiKey) {
  let lastError = null;

  for (let attempt = 0; attempt < TRANSLATOR_CONFIG.MAX_RETRIES; attempt++) {
    try {
      return await callDeepSeekAPI(text, targetLang, apiKey);
    } catch (error) {
      lastError = error;

      // 不重试身份验证错误（401/403）
      if (error.message.includes('401') || error.message.includes('403')) {
        throw error;
      }

      // 如果不是最后一次尝试，等待后重试
      if (attempt < TRANSLATOR_CONFIG.MAX_RETRIES - 1) {
        const delay = TRANSLATOR_CONFIG.BASE_DELAY * Math.pow(2, attempt);
        console.warn(`[Transcise] 翻译失败，${delay}ms 后重试 (${attempt + 1}/${TRANSLATOR_CONFIG.MAX_RETRIES}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * 批量翻译 Markdown 文本（带并发控制）
 * @param {Array<{id: number, text: string, type: string}>} chunks - 段落块数组
 * @param {string} targetLang - 目标语言代码
 * @param {string} apiKey - API 密钥
 * @param {Function} onProgress - 进度回调 (completed, total)
 * @returns {Promise<Object<number, string>>} id → 译文的映射
 */
async function batchTranslate(chunks, targetLang, apiKey, onProgress) {
  const translations = {};
  const textChunks = chunks.filter(chunk => chunk.type === 'text');
  let completed = 0;
  const total = textChunks.length;

  // 信号量控制并发
  const semaphore = new Array(TRANSLATOR_CONFIG.MAX_CONCURRENCY).fill(Promise.resolve());

  /**
   * 处理单个文本块的翻译（含缓存检查）
   * @param {Object} chunk - 文本块
   * @returns {Promise<void>}
   */
  async function processChunk(chunk) {
    // 先查缓存
    const cached = await getTranslationCache(chunk.text, targetLang);
    if (cached) {
      translations[chunk.id] = cached;
      completed++;
      if (onProgress) onProgress(completed, total);
      return;
    }

    // 调用 API 翻译
    const translation = await translateWithRetry(chunk.text, targetLang, apiKey);

    // 写入缓存
    await setTranslationCache(chunk.text, targetLang, translation);

    translations[chunk.id] = translation;
    completed++;
    if (onProgress) onProgress(completed, total);
  }

  // 将文本块按并发限制分批执行
  const tasks = textChunks.map(chunk => {
    // 找到最快完成的信号量槽位
    const slot = Promise.race(
      semaphore.map((p, i) => p.then(() => i))
    );
    return slot.then(index => {
      semaphore[index] = processChunk(chunk);
      return semaphore[index];
    });
  });

  await Promise.all(tasks);

  return translations;
}
