// Transcise Viewer - Markdown File Drag & Drop Viewer
"use strict";

var transciseState = {
  markdownText: "", chunks: [], translations: {},
  targetLang: "zh", apiKey: "", displayMode: "both",
  isTranslating: false, hasTranslation: false,
  viewMode: "preview"   // "preview" | "translate"
};

var dropZone = document.getElementById("drop-zone");
var fileInput = document.getElementById("file-input");
var errorMsg = document.getElementById("error-msg");
var viewerArea = document.getElementById("viewer-area");
if (viewerArea) viewerArea.style.display = "none";

async function loadConfig() {
  try {
    var r = await chrome.storage.sync.get(["transcise_api_key","transcise_default_lang","transcise_model"]);
    transciseState.apiKey = r.transcise_api_key || "";
    transciseState.targetLang = r.transcise_default_lang || "zh";
    transciseState.model = r.transcise_model || "deepseek-chat";
  } catch(e) { console.error("Config load:", e); }
}

function showError(m) {
  errorMsg.textContent = m; errorMsg.style.display = "block";
  setTimeout(function() { errorMsg.style.display = "none"; }, 3000);
}

function hideDropZone() {
  dropZone.style.display = "none";
  if (viewerArea) viewerArea.style.display = "block";
}

/**
 * 重置查看器状态，为加载新文件做准备
 * 清除旧内容、旧状态、旧工具栏
 */
function resetViewer() {
  // 清除旧翻译状态
  transciseState.markdownText = "";
  transciseState.chunks = [];
  transciseState.translations = {};
  transciseState.isTranslating = false;
  transciseState.hasTranslation = false;

  // 清除旧工具栏
  var oldToolbar = document.getElementById("transcise-toolbar");
  if (oldToolbar) oldToolbar.parentNode.removeChild(oldToolbar);

  // 清除旧内容
  if (viewerArea) viewerArea.innerHTML = "";
  viewerArea.style.display = "none";

  // 清除旧进度条（可能在 body 其他地方）
  var oldProgress = document.getElementById("transcise-progress-bar");
  if (oldProgress) oldProgress.parentNode.removeChild(oldProgress);
}

function handleFile(file) {
  if (!file) return;
  var n = file.name.toLowerCase();
  var ok = [".md",".markdown",".mdown",".mkd"].some(function(e) { return n.endsWith(e); });
  if (!ok) { showError("请选择 Markdown 文件 (.md, .markdown)"); return; }
  // 如果查看器已有内容，先重置再加载新文件
  if (transciseState.markdownText) {
    resetViewer();
  }
  var r = new FileReader();
  r.onload = function(e) {
    transciseState.markdownText = e.target.result;
    if (!transciseState.markdownText.trim()) { showError("文件为空"); return; }
    // 更新文件名显示预览状态
    hideDropZone(); renderMarkdown(transciseState.markdownText);
    var brand = document.querySelector(".transcise-brand");
    if (brand) brand.textContent = "📄 " + file.name;
    // 预览模式：仅渲染 Markdown，不自动翻译
    // 用户点击 "翻译" 按钮时再执行翻译
  };
  r.onerror = function() { showError("读取文件失败"); };
  r.readAsText(file);
}

fileInput.addEventListener("change", function(e) { if (e.target.files[0]) handleFile(e.target.files[0]); });
dropZone.addEventListener("dragover", function(e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave", function(e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove("drag-over"); });
dropZone.addEventListener("drop", function(e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove("drag-over"); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });

function escapeHtml(text) {
  var d = document.createElement("div");
  d.appendChild(document.createTextNode(text));
  return d.innerHTML;
}

function renderMarkdown(md) {
  var target = viewerArea || dropZone;
  var o = { breaks: true, gfm: true, headerIds: true, mangle: false, pedantic: false, smartLists: true };
  var h;
  try {
    if (typeof marked !== "undefined" && typeof marked.parse === "function") h = marked.parse(md, o);
    else if (typeof marked === "function") h = marked(md, o);
    else h = "<pre>" + escapeHtml(md) + "</pre>";
  } catch(e) {
    h = "<pre>Render error: " + e.message + "</pre>";
  }

  // 将完整的 Mermaid 代码块 <pre><code class="language-mermaid">...</code></pre>
  // 替换为 <div class="mermaid">...</div>，供 Mermaid 库渲染流程图
  // 注意：必须用单个正则替换整个块，不能分两步全局替换
  // 否则 "</code></pre>" 的全局替换会误伤所有普通代码块，导致 HTML 结构损坏
  h = h.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi, '<div class="mermaid">$1</div>');

  target.innerHTML = "";
  var c = document.createElement("div");
  c.id = "transcise-content-container";
  c.className = "transcise-markdown-body";
  c.style.maxWidth = "95vw";
  c.style.margin = "60px auto 40px auto";
  c.style.padding = "40px 48px";
  c.style.width = "100%";
  c.style.boxSizing = "border-box";
  c.innerHTML = h;
  target.appendChild(c);
  injectToolbar();

  // 诊断：输出所有 <pre> 的计算宽度，用于排查漏斗变窄问题
  diagnoseLayout();

  // 渲染 Mermaid 流程图
  renderMermaid();
  // 初始为预览模式
  transciseState.viewMode = "preview";
}

/**
 * 渲染 Mermaid 流程图
 * 查找所有 .mermaid 元素并调用 Mermaid 库绘制 SVG
 */
function renderMermaid() {
  if (typeof mermaid === "undefined") return;
  var els = document.querySelectorAll(".mermaid");
  if (els.length === 0) return;
  mermaid.initialize({ startOnLoad: false, theme: "neutral" });
  mermaid.run({ nodes: els }).catch(function(e) {
    console.error("[Transcise] Mermaid render error:", e);
  });
}

function injectToolbar() {
  if (document.getElementById("transcise-toolbar")) return;
  var t = document.createElement("div");
  t.id = "transcise-toolbar";
  t.className = "transcise-toolbar";
  t.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;";
  t.innerHTML = "<div class=transcise-toolbar-inner>" +
    "<span class=transcise-brand>Transcise</span>" +
    "<div class=transcise-controls>" +
    "<select id=transcise-lang-select class=transcise-select>" +
    "<option value=zh>中文</option><option value=en>English</option>" +
    "<option value=ja>日本語</option><option value=ko>한국어</option>" +
    "<option value=fr>Français</option><option value=de>Deutsch</option>" +
    "<option value=es>Español</option><option value=ru>Русский</option>" +
    "<option value=pt>Português</option><option value=it>Italiano</option>" +
    "<option value=vi>Tiếng Việt</option><option value=th>ภาษาไทย</option>" +
    "<option value=id>Bahasa Indonesia</option></select>" +
    "<div class=transcise-view-toggle>" +
    "<button id=transcise-preview-btn class='transcise-mode-btn active' data-view=preview>📖 预览</button>" +
    "<button id=transcise-translate-btn class='transcise-mode-btn' data-view=translate>🌐 翻译</button></div>" +
    "<div class=transcise-mode-group id=transcise-mode-group>" +
    "<button class='transcise-mode-btn disabled' data-mode=both disabled>双语</button>" +
    "<button class='transcise-mode-btn disabled' data-mode=translation disabled>仅译文</button>" +
    "<button class='transcise-mode-btn disabled' data-mode=original disabled>仅原文</button></div></div>" +
    "<span id=transcise-status class=transcise-status></span></div>" +
    "<div id=transcise-progress-bar class=transcise-progress-bar style=display:none>" +
    "<div id=transcise-progress-fill class=transcise-progress-fill></div></div>";
  document.body.insertBefore(t, document.body.firstChild);
  document.getElementById("transcise-preview-btn").addEventListener("click", function() { switchViewMode("preview"); });
  document.getElementById("transcise-translate-btn").addEventListener("click", function() { switchViewMode("translate"); });
  var s = document.getElementById("transcise-lang-select");
  if (s) { s.value = transciseState.targetLang; s.addEventListener("change", function(e) { transciseState.targetLang = e.target.value; try { chrome.storage.sync.set({ transcise_default_lang: e.target.value }); } catch(ex) {} }); }
  // 显示模式按钮点击：只对非 disabled 的按钮生效
  document.querySelectorAll("#transcise-mode-group .transcise-mode-btn").forEach(function(b) {
    b.addEventListener("click", function() {
      if (this.disabled) return;
      applyDisplayMode(this.getAttribute("data-mode"));
    });
  });
}

function showApiKeyPrompt() {
  if (document.getElementById("transcise-apikey-prompt")) return;
  var overlay = document.createElement("div");
  overlay.id = "transcise-apikey-prompt";
  overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;padding-top:80px;";
  overlay.addEventListener("click", function(e) { if (e.target === overlay) dismissApiKeyPrompt(); });
  var card = document.createElement("div");
  card.style.cssText = "position:relative;width:380px;max-width:94vw;padding:20px 24px;background:#fff;border:1px solid #d0d7de;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.15);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:13px;color:#24292e;";
  card.innerHTML = "<span id=transcise-popup-close style='position:absolute;top:10px;right:14px;font-size:16px;color:#8b949e;cursor:pointer;'>✕</span>" +
    "<div style='display:flex;align-items:center;gap:10px;margin-bottom:14px;'>" +
    "<div style='width:36px;height:36px;border-radius:8px;background:#ddf4ff;display:flex;align-items:center;justify-content:center;font-size:17px;'>🔑</div>" +
    "<div style='font-size:14px;font-weight:600;color:#0969da;'>配置 API Key</div></div>" +
    "<div style='display:flex;gap:8px;'>" +
    "<input id=transcise-inline-apikey style='flex:1;padding:9px 12px;border:1.5px solid #d0d7de;border-radius:8px;font-size:13px;font-family:monospace;outline:none;background:#f6f8fa;' type=password placeholder='sk-...' autocomplete=off spellcheck=false>" +
    "<button id=transcise-inline-save-btn style='padding:9px 20px;background:#0969da;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;'>保存</button></div>" +
    "<span id=transcise-inline-status style='display:block;font-size:11px;margin-top:6px;min-height:16px;'></span>" +
    "<div style='margin-top:12px;display:flex;align-items:center;gap:16px;'>" +
    "<a href='https://platform.deepseek.com/api_keys' target=_blank style='font-size:11px;color:#656d76;text-decoration:none;'>📍 获取 Key</a>" +
    "<span style='font-size:11px;color:#8b949e;'>Enter 快捷提交</span></div>";
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  var inp = document.getElementById("transcise-inline-apikey");
  var btn = document.getElementById("transcise-inline-save-btn");
  var st = document.getElementById("transcise-inline-status");
  btn.addEventListener("click", function() { handleInlineApiKeySave(inp, btn, st); });
  inp.addEventListener("keydown", function(e) { if (e.key === "Enter") { e.preventDefault(); handleInlineApiKeySave(inp, btn, st); } });
  inp.addEventListener("input", function() { if (st) st.textContent = ""; inp.classList.remove("input-error"); });
  document.getElementById("transcise-popup-close").addEventListener("click", dismissApiKeyPrompt);
  setTimeout(function() { inp.focus(); }, 350);
}

async function handleInlineApiKeySave(input, saveBtn, statusEl) {
  var apiKey = input.value.trim();
  if (!apiKey) { showInlineStatus(statusEl, "请输入 API Key", "error"); input.classList.add("input-error"); input.focus(); return; }
  if (!apiKey.startsWith("sk-")) { showInlineStatus(statusEl, "格式不正确，应以 sk- 开头", "error"); input.classList.add("input-error"); input.focus(); return; }
  if (apiKey.length < 20) { showInlineStatus(statusEl, "Key 长度不足", "error"); input.classList.add("input-error"); input.focus(); return; }
  saveBtn.disabled = true; saveBtn.textContent = "保存中...";
  showInlineStatus(statusEl, "正在保存...", "loading");
  try {
    await chrome.storage.sync.set({ transcise_api_key: apiKey });
    transciseState.apiKey = apiKey;
    showInlineStatus(statusEl, "✔ 已保存，即将翻译", "success");
    setTimeout(dismissApiKeyPrompt, 500);
    setTimeout(performTranslation, 700);
  } catch(e) {
    showInlineStatus(statusEl, "保存失败: " + e.message, "error");
    saveBtn.disabled = false; saveBtn.textContent = "保存";
  }
}

function showInlineStatus(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = type === "error" ? "#cf222e" : type === "success" ? "#1a7f37" : "#0969da";
}

function dismissApiKeyPrompt() {
  var p = document.getElementById("transcise-apikey-prompt");
  if (p) { p.style.opacity = "0"; setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, 200); }
  var s = document.getElementById("transcise-status");
  if (s) { s.textContent = ""; s.className = "transcise-status"; }
}

/**
 * 切换预览/翻译模式
 * 预览模式：显示渲染后的 Markdown，不显示译文，显示模式按钮禁用
 * 翻译模式：显示译文（或触发翻译），显示模式按钮可用
 */
function switchViewMode(mode) {
  if (mode === transciseState.viewMode || !document.getElementById("transcise-content-container")) return;
  transciseState.viewMode = mode;

  var previewBtn = document.getElementById("transcise-preview-btn");
  var translateBtn = document.getElementById("transcise-translate-btn");
  var modeGroup = document.getElementById("transcise-mode-group");
  var container = document.getElementById("transcise-content-container");

  if (mode === "preview") {
    // 预览模式：切换按钮状态，禁用显示模式，隐藏译文
    if (previewBtn) previewBtn.classList.add("active");
    if (translateBtn) translateBtn.classList.remove("active");
    if (modeGroup) {
      modeGroup.querySelectorAll(".transcise-mode-btn").forEach(function(b) {
        b.classList.add("disabled");
        b.disabled = true;
      });
    }
    if (container) container.classList.add("view-preview");
    var st = document.getElementById("transcise-status");
    if (st) { st.textContent = "📖 预览"; st.className = "transcise-status"; }
  } else {
    // 翻译模式：切换按钮状态，启用显示模式，显示译文
    if (previewBtn) previewBtn.classList.remove("active");
    if (translateBtn) translateBtn.classList.add("active");
    if (modeGroup) {
      modeGroup.querySelectorAll(".transcise-mode-btn").forEach(function(b) {
        b.classList.remove("disabled");
        b.disabled = false;
      });
    }
    if (container) container.classList.remove("view-preview");

    if (transciseState.hasTranslation) {
      // 已有译文，直接切换显示模式
      applyDisplayMode(transciseState.displayMode);
      var st = document.getElementById("transcise-status");
      if (st) { st.textContent = "✔ 翻译完成"; st.className = "transcise-status status-success"; }
    } else {
      // 无译文，开始翻译
      var st = document.getElementById("transcise-status");
      if (st) { st.textContent = ""; st.className = "transcise-status"; }
      performTranslation();
    }
  }
}

/**
 * 并发翻译：支持同时发起多个请求，大幅提升翻译速度
 */
async function performTranslation() {
  if (!transciseState.apiKey) { showApiKeyPrompt(); return; }
  if (transciseState.isTranslating) return;
  transciseState.isTranslating = true; updateBtn("loading");
  try {
    transciseState.chunks = splitChunks(transciseState.markdownText);
    var tc = transciseState.chunks.filter(function(c) { return c.type === "text"; });
    var completed = 0, total = tc.length;

    if (total === 0) {
      rebuildContent();
      updateBtn("done");
      transciseState.isTranslating = false;
      return;
    }

    // 并发队列：最多同时发送 3 个翻译请求
    var CONCURRENCY = 3;
    var queue = tc.slice(); // 工作队列
    var errors = 0;

    async function translateOne(chunk) {
      try {
        var rs = await chrome.runtime.sendMessage({
          type: "TRANSLATE",
          text: chunk.text,
          targetLang: transciseState.targetLang,
          apiKey: transciseState.apiKey,
          model: transciseState.model
        });
        if (rs && rs.success) {
          transciseState.translations[chunk.id] = rs.translation;
        } else {
          errors++;
        }
      } catch(e) {
        errors++;
      }
      completed++;
      updateProgress(completed, total);
    }

    // 启动 worker，从队列取任务并发执行
    var workers = [];
    var workerCount = Math.min(CONCURRENCY, total);
    for (var w = 0; w < workerCount; w++) {
      workers.push((async function worker() {
        while (queue.length > 0) {
          var chunk = queue.shift();
          await translateOne(chunk);
        }
      })());
    }
    await Promise.all(workers);

    rebuildContent();
    transciseState.hasTranslation = true;
    applyDisplayMode(transciseState.displayMode);

    // 翻译完成后自动切换到翻译模式（启用显示模式按钮）
    transciseState.viewMode = "translate";
    var previewBtn = document.getElementById("transcise-preview-btn");
    var translateBtn = document.getElementById("transcise-translate-btn");
    var modeGroup = document.getElementById("transcise-mode-group");
    if (previewBtn) previewBtn.classList.remove("active");
    if (translateBtn) translateBtn.classList.add("active");
    if (modeGroup) {
      modeGroup.querySelectorAll(".transcise-mode-btn").forEach(function(b) {
        b.classList.remove("disabled");
        b.disabled = false;
      });
    }

    if (errors > 0 && errors < total) {
      updateBtn("done");
      showTBError("部分段落翻译失败 (" + errors + "/" + total + ")");
    } else if (errors >= total) {
      updateBtn("error");
      showTBError("翻译失败，请重试");
    } else {
      updateBtn("done");
    }
  } catch(e) {
    updateBtn("error");
    showTBError("翻译失败，点击重试");
  } finally {
    transciseState.isTranslating = false;
  }
}

function splitChunks(md) {
  var l = md.split("\n"), chunks = [], id = 0, cur = "", inCode = false;
  for (var i = 0; i < l.length; i++) {
    var li = l[i];
    if (li.trim().startsWith("`")) { if (cur.trim()) { chunks.push({ id: id++, text: cur.trim(), type: inCode ? "code" : "text" }); cur = ""; } chunks.push({ id: id++, text: li, type: "code" }); inCode = !inCode; continue; }
    if (inCode) { chunks.push({ id: id++, text: li, type: "code" }); continue; }
    if (li.trim() === "") { if (cur.trim()) { chunks.push({ id: id++, text: cur.trim(), type: "text" }); cur = ""; } continue; }
    cur += (cur ? "\n" : "") + li; if (cur.length >= 2000) { chunks.push({ id: id++, text: cur.trim(), type: "text" }); cur = ""; }
  }
  if (cur.trim()) chunks.push({ id: id++, text: cur.trim(), type: inCode ? "code" : "text" });
  return chunks;
}

function rebuildContent() {
  var c = document.getElementById("transcise-content-container"); if (!c) return; c.innerHTML = "";
  var p = typeof marked.parse === "function" ? function(t) { return marked.parse(t); } : function(t) { return "<p>" + escapeHtml(t) + "</p>"; };
  for (var i = 0; i < transciseState.chunks.length; i++) {
    var ch = transciseState.chunks[i];
    if (ch.type === "code") { var pr = document.createElement("pre"); pr.className = "transcise-code-block"; pr.setAttribute("data-chunk-id", String(ch.id)); pr.innerHTML = "<code>" + escapeHtml(ch.text) + "</code>"; c.appendChild(pr); continue; }
    var o = document.createElement("div"); o.className = "transcise-original"; o.setAttribute("data-chunk-id", String(ch.id)); o.innerHTML = p(ch.text); c.appendChild(o);
    var tr = transciseState.translations[ch.id]; if (tr) { var te = document.createElement("div"); te.className = "transcise-translation"; te.setAttribute("data-chunk-id", String(ch.id)); te.innerHTML = p(tr); c.appendChild(te); }
  }
  c.classList.add("has-translations");
}

function applyDisplayMode(m) {
  var c = document.getElementById("transcise-content-container"); if (!c) return;
  c.classList.remove("mode-both","mode-translation","mode-original"); c.classList.add("mode-" + m); transciseState.displayMode = m;
  document.querySelectorAll(".transcise-mode-btn").forEach(function(b) { b.classList.toggle("active", b.getAttribute("data-mode")===m); });
}

function updateBtn(s) {
  var b = document.getElementById("transcise-translate-btn"), st = document.getElementById("transcise-status"), pg = document.getElementById("transcise-progress-bar");
  if (!b) return;
  if (s === "loading") { b.disabled=true; b.classList.add("loading"); b.textContent="翻译中..."; if(pg) pg.style.display="block"; }
  else if (s === "done") { b.disabled=false; b.classList.remove("loading"); b.classList.add("success"); b.textContent="重新翻译"; if(st) { st.textContent="✔ 翻译完成"; st.className="transcise-status status-success"; } if(pg) pg.style.display="none"; setTimeout(function() { b.classList.remove("success"); }, 3000); }
  else if (s === "error") { b.disabled=false; b.classList.remove("loading"); b.textContent="重试"; b.classList.add("error"); if(pg) pg.style.display="none"; }
  else { b.disabled=false; b.classList.remove("loading","success","error"); b.textContent="翻译"; if(st) st.textContent=""; if(pg) pg.style.display="none"; }
}

function updateProgress(d,t) { var st=document.getElementById("transcise-status"), pf=document.getElementById("transcise-progress-fill"); if(st) { st.textContent="翻译中 "+d+"/"+t+"..."; st.className="transcise-status status-loading"; } if(pf) pf.style.width=Math.round(d/t*100)+"%"; }
function showTBError(m) { var st=document.getElementById("transcise-status"); if(st) { st.textContent="✗ "+m; st.className="transcise-status status-error"; } }

loadConfig();

// ===== 全局拖拽处理：阻止浏览器默认打开文件 =====
// 必须放在顶层注册，不能在 handleFile 内部才注册
// 否则在首次文件加载前拖拽到页面空白区会触发浏览器默认行为
document.addEventListener("dragover", function(e) {
  e.preventDefault();
});
document.addEventListener("drop", function(e) {
  e.preventDefault();
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

// 检查是否从 popup 传入的文件
checkPopupFile();

console.log("[Transcise Viewer] Ready");

/**
 * 检查是否有从 popup 传入的临时文件
 * 读取后自动加载并渲染
 */
async function checkPopupFile() {
  try {
    var params = new URLSearchParams(window.location.search);
    if (params.get("source") !== "popup") return;

    var result = await chrome.storage.local.get("transcise_temp_file");
    var fileData = result.transcise_temp_file;
    if (!fileData || !fileData.content) return;

    // 读取成功，清除临时存储
    await chrome.storage.local.remove("transcise_temp_file");

    // 加载文件内容
    transciseState.markdownText = fileData.content;
    if (!transciseState.markdownText.trim()) {
      showError("文件内容为空");
      return;
    }

    hideDropZone();
    renderMarkdown(transciseState.markdownText);

    // 在工具栏标题中显示文件名
    if (fileData.fileName) {
      var brand = document.querySelector(".transcise-brand");
      if (brand) brand.textContent = "📄 " + fileData.fileName;
    }

    setTimeout(function () {
      // 预览模式：仅渲染 Markdown，不自动翻译
      // 用户点击 "翻译" 按钮时再执行翻译
    }, 100);
  } catch (e) {
    console.error("[Transcise] 读取传入文件失败:", e);
  }
}

/**
 * 诊断函数：输出容器和所有 <pre> 的计算宽度到控制台
 * 用于排查漏斗变窄问题 — 打开 F12 > Console 查看数据
 */
function diagnoseLayout() {
  var container = document.getElementById("transcise-content-container");
  if (!container) { console.warn("[Diagnose] 容器未找到"); return; }
  var cr = container.getBoundingClientRect();
  var cs = getComputedStyle(container);
  var data = [{
    tag: "CONTAINER",
    index: "-",
    rectWidth: Math.round(cr.width),
    offsetWidth: container.offsetWidth,
    scrollWidth: container.scrollWidth,
    overflowX: cs.overflowX,
    overflowY: cs.overflowY,
    boxSizing: cs.boxSizing,
    padding: cs.padding,
    maxWidth: cs.maxWidth
  }];
  var pres = container.querySelectorAll("pre");
  pres.forEach(function(pre, i) {
    var r = pre.getBoundingClientRect();
    var s = getComputedStyle(pre);
    data.push({
      tag: "PRE",
      index: i,
      rectWidth: Math.round(r.width),
      offsetWidth: pre.offsetWidth,
      scrollWidth: pre.scrollWidth,
      overflowX: s.overflowX,
      overflowY: s.overflowY,
      boxSizing: s.boxSizing,
      padding: s.padding,
      maxWidth: s.maxWidth
    });
  });
  console.table(data);
  // 检查是否有 <pre> 的 scrollWidth > offsetWidth（水平溢出）
  var overflows = pres.filter(function(p) { return p.scrollWidth > p.offsetWidth; });
  if (overflows.length > 0) {
    console.warn("[Diagnose] 以下 <pre> 存在水平溢出（scrollWidth > offsetWidth）:", overflows.length, "个");
  }
  // 检查第一个和最后一个 <pre> 的宽度差异
  if (pres.length >= 2) {
    var first = pres[0].getBoundingClientRect().width;
    var last = pres[pres.length - 1].getBoundingClientRect().width;
    if (last < first) {
      console.warn("[Diagnose] 最后一个 <pre> 比第一个窄了", Math.round(first - last), "px");
    }
  }
  // DOM 结构检查：是否有 <pre> 嵌套？
  var nested = 0;
  pres.forEach(function(pre, i) {
    var children = pre.querySelectorAll("pre");
    if (children.length > 0) {
      nested++;
      console.warn("[Diagnose] PRE[" + i + "] 内部包含", children.length, "个子 <pre> —— DOM 结构异常嵌套!");
    }
  });
  if (nested === 0) {
    // 即使没有嵌套，检查父元素链
    console.log("[Diagnose] DOM 结构检查：无 <pre> 嵌套。检查前 5 个 <pre> 的父元素:");
    for (var i = 0; i < Math.min(5, pres.length); i++) {
      var p = pres[i].parentElement;
      console.log("  PRE[" + i + "] 父节点:", p ? p.tagName + (p.id ? "#" + p.id : "") + (p.className ? "." + p.className : "") : "null");
    }
  }
}
