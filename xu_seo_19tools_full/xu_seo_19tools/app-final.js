let currentView = "dashboard";

const views = [
  "dashboard",
  "auth",
  "notepad",
  "wordcounter",
  "filemanager",
  "uploader",
  "calculator",
  "wordtohtml",
  "scanner",
  "domainchecker",
  "phpobfuscator",
  "base64tool",
  "aitools",
  "seoxu",
  "htmlcleaner",
  "keyworddensity",
  "musicplayer",
  "terminal",
  "settings"
];

const suspiciousPatterns = [
  { label: "eval()", pattern: /eval\s*\(/gi, score: 18, severity: "danger" },
  { label: "base64_decode()", pattern: /base64_decode\s*\(/gi, score: 12, severity: "warning" },
  { label: "shell_exec()", pattern: /shell_exec\s*\(/gi, score: 20, severity: "danger" },
  { label: "exec()", pattern: /exec\s*\(/gi, score: 16, severity: "danger" },
  { label: "system()", pattern: /system\s*\(/gi, score: 16, severity: "danger" },
  { label: "passthru()", pattern: /passthru\s*\(/gi, score: 20, severity: "danger" },
  { label: "popen()", pattern: /popen\s*\(/gi, score: 15, severity: "danger" },
  { label: "assert()", pattern: /assert\s*\(/gi, score: 12, severity: "warning" },
  { label: "create_function()", pattern: /create_function\s*\(/gi, score: 10, severity: "warning" },
  { label: "move_uploaded_file()", pattern: /move_uploaded_file\s*\(/gi, score: 8, severity: "warning" },
  { label: "iframe hidden", pattern: /<iframe[\s\S]*?(display\s*:\s*none|visibility\s*:\s*hidden|width\s*=\s*["']?0|height\s*=\s*["']?0)/gi, score: 18, severity: "danger" },
  { label: "fromCharCode", pattern: /fromCharCode\s*\(/gi, score: 8, severity: "warning" },
  { label: "hex2bin()", pattern: /hex2bin\s*\(/gi, score: 8, severity: "warning" },
  { label: "gzinflate()", pattern: /gzinflate\s*\(/gi, score: 10, severity: "warning" },
  { label: "long base64 blob", pattern: /[A-Za-z0-9+/]{200,}={0,2}/g, score: 22, severity: "danger" },
  { label: "obfuscated script", pattern: /(document\.write\s*\(|unescape\s*\(|atob\s*\()/gi, score: 12, severity: "warning" },
  { label: "webshell keyword", pattern: /(wso|alfa|indoxploit|b374k|minishell|webconsole)/gi, score: 25, severity: "danger" }
];

let selectedUploadFile = null;
let savedEditorRange = null;
let lastUploadObjectUrl = "";
let lastPreviewObjectUrl = "";

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function isTooLarge(text, max = 50000) {
  const size = (text || "").length;
  if (size > max) {
    alert(`Input terlalu besar. Maksimal ${max.toLocaleString()} karakter.`);
    return true;
  }
  return false;
}

function copyField(id) {
  const field = document.getElementById(id);
  if (!field) return alert("Field tidak ditemukan.");
  const value = field.value || field.textContent || "";
  if (!value.trim()) return alert("Belum ada data untuk dicopy.");
  navigator.clipboard.writeText(value);
  alert("Berhasil dicopy.");
}

function normalizeUrlInput(value) {
  const raw = (value || "").trim();
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function stripHtmlToText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getKeywordDensityData(text, limit = 10) {
  const clean = String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stop = new Set(["dan","yang","di","ke","dari","untuk","dengan","atau","ini","itu","the","a","an","of","to","is","are","in","on","for","as","by","be","if","it","at","from","your","you","gua","gw","lo"]);
  const words = clean ? clean.split(" ") : [];
  const filtered = words.filter(word => word.length > 2 && !stop.has(word));
  const total = filtered.length;
  const map = new Map();
  filtered.forEach(word => map.set(word, (map.get(word) || 0) + 1));
  const top = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count, density: total ? ((count / total) * 100) : 0 }));
  return { total, top };
}

function cleanHtmlString(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+=(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\sstyle=(".*?"|'.*?')/gi, "")
    .replace(/\sclass=(".*?"|'.*?')/gi, "")
    .replace(/\sid=(".*?"|'.*?')/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}


function showView(viewName) {
  currentView = viewName;
  views.forEach(view => {
    const viewEl = document.getElementById("view-" + view);
    if (viewEl) viewEl.classList.remove("active");

    const navBtn = document.querySelector(`[data-view-target="${view}"]`);
    if (navBtn) navBtn.classList.remove("active");
  });

  const activeView = document.getElementById("view-" + viewName);
  if (activeView) activeView.classList.add("active");

  const activeBtn = document.querySelector(`[data-view-target="${viewName}"]`);
  if (activeBtn) activeBtn.classList.add("active");
}

function filterTools() {
  const inputEl = document.getElementById("toolSearch");
  const countEl = document.getElementById("toolCount");
  const cards = document.querySelectorAll("#toolGrid .tool-card");
  if (!inputEl || !countEl || !cards.length) return;

  const input = inputEl.value.toLowerCase();
  let visible = 0;

  cards.forEach(card => {
    const text = (card.dataset.name || "").toLowerCase();
    const match = text.includes(input);
    card.style.display = match ? "flex" : "none";
    if (match) visible++;
  });

  countEl.textContent = visible;
}

function resetSearch() {
  const inputEl = document.getElementById("toolSearch");
  if (!inputEl) return;
  inputEl.value = "";
  filterTools();
}

function simulateLogin() {
  const usernameEl = document.getElementById("loginUsername");
  if (!usernameEl) return;

  const username = usernameEl.value.trim();
  if (!username) return alert("Masukkan username dulu.");

  localStorage.setItem("xuUser", username);
  updateUserUI(username);
  alert("Login demo berhasil untuk user: " + username);
  showView("dashboard");
}

function simulateRegister() {
  const usernameEl = document.getElementById("registerUsername");
  const emailEl = document.getElementById("registerEmail");
  if (!usernameEl || !emailEl) return;

  const username = usernameEl.value.trim();
  const email = emailEl.value.trim();

  if (!username || !email) return alert("Isi username dan email dulu.");

  localStorage.setItem("xuUser", username);
  updateUserUI(username);
  alert("Register demo berhasil: " + username);
  showView("dashboard");
}

function updateUserUI(username) {
  const userStatus = document.getElementById("userStatus");
  const activeUserBox = document.getElementById("activeUserBox");

  if (userStatus) userStatus.textContent = "User: " + username;
  if (activeUserBox) activeUserBox.textContent = username;
}

function saveNote() {
  const titleEl = document.getElementById("noteTitle");
  const textEl = document.getElementById("notepadText");
  if (!titleEl || !textEl) return;

  localStorage.setItem("xuNoteTitle", titleEl.value);
  localStorage.setItem("xuNoteText", textEl.value);
  alert("Catatan disimpan.");
}

function clearNote() {
  const titleEl = document.getElementById("noteTitle");
  const textEl = document.getElementById("notepadText");

  if (titleEl) titleEl.value = "";
  if (textEl) textEl.value = "";

  localStorage.removeItem("xuNoteTitle");
  localStorage.removeItem("xuNoteText");
}

function loadNote() {
  const titleEl = document.getElementById("noteTitle");
  const textEl = document.getElementById("notepadText");

  if (titleEl) titleEl.value = localStorage.getItem("xuNoteTitle") || "";
  if (textEl) textEl.value = localStorage.getItem("xuNoteText") || "";
}

const debouncedCountWords = debounce(() => countWords(), 120);

function countWords() {
  const textEl = document.getElementById("wordCounterInput");
  if (!textEl) return;

  const text = textEl.value;
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;
  const paragraphs = trimmed ? text.split(/\n\s*\n|\n/).filter(p => p.trim()).length : 0;
  const readSeconds = Math.ceil(words / 3.3) || 0;

  setText("countWords", words);
  setText("countChars", chars);
  setText("countParagraphs", paragraphs);
  setText("countRead", readSeconds + " dtk");
}

function renderFiles() {
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  if (!fileInput || !fileList) return;

  const files = fileInput.files || [];

  if (!files.length) {
    fileList.innerHTML = '<div class="empty-state">Belum ada file yang dipilih.</div>';
    return;
  }

  fileList.innerHTML = Array.from(files).map(file => `
    <div class="file-item">
      <span>${escapeHtml(file.name)}</span>
      <strong>${formatBytes(file.size)}</strong>
    </div>
  `).join("");
}

function renderFolderFiles(event) {
  const files = event.target.files;
  const fileList = document.getElementById("fileList");
  if (!files.length || !fileList) return;

  const items = Array.from(files).slice(0, 20).map(file => `
    <div class="file-item">
      <span>${escapeHtml(file.webkitRelativePath || file.name)}</span>
      <strong>${formatBytes(file.size)}</strong>
    </div>
  `).join("");

  const more = files.length > 20
    ? `<div class="empty-state">+ ${files.length - 20} file lain terdeteksi.</div>`
    : "";

  fileList.innerHTML = items + more;
}

function clearFiles() {
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  if (fileInput) fileInput.value = "";
  if (fileList) fileList.innerHTML = '<div class="empty-state">Belum ada file yang dipilih.</div>';
}

function clearFolder() {
  const folderInput = document.getElementById("folderInput");
  const fileList = document.getElementById("fileList");
  if (folderInput) folderInput.value = "";
  if (fileList) fileList.innerHTML = '<div class="empty-state">Belum ada file yang dipilih.</div>';
}

function handleUploaderFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  setSelectedUploaderFile(file);
}

function setSelectedUploaderFile(file) {
  selectedUploadFile = file;

  const meta = document.getElementById("uploaderMeta");
  const preview = document.getElementById("uploaderPreview");

  if (meta) {
    meta.innerHTML = `File: <b>${escapeHtml(file.name)}</b> • Size: <b>${formatBytes(file.size)}</b> • Type: <b>${escapeHtml(file.type || "unknown")}</b>`;
  }

  setUploadProgress(100);

  if (preview) {
    if (lastPreviewObjectUrl) {
      try { URL.revokeObjectURL(lastPreviewObjectUrl); } catch (e) {}
      lastPreviewObjectUrl = "";
    }

    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      lastPreviewObjectUrl = previewUrl;
      preview.innerHTML = `<img class="upload-preview-image" src="${previewUrl}" alt="preview" />`;
    } else {
      preview.innerHTML = `<div class="upload-preview-file">File siap dipakai: ${escapeHtml(file.name)}</div>`;
    }
  }

  fillLocalUploadOutput(file);
}

function fillLocalUploadOutput(file) {
  if (lastUploadObjectUrl) {
    try { URL.revokeObjectURL(lastUploadObjectUrl); } catch (e) {}
  }

  const objectUrl = URL.createObjectURL(file);
  lastUploadObjectUrl = objectUrl;

  const uploadUrl = document.getElementById("uploadUrl");
  const uploadFilename = document.getElementById("uploadFilename");
  const uploadHtmlEmbed = document.getElementById("uploadHtmlEmbed");
  const uploadMarkdown = document.getElementById("uploadMarkdown");

  if (uploadUrl) uploadUrl.value = objectUrl;
  if (uploadFilename) uploadFilename.value = file.name;

  if (file.type.startsWith("image/")) {
    if (uploadHtmlEmbed) uploadHtmlEmbed.value = `<img src="${objectUrl}" alt="${escapeHtml(file.name)}" />`;
    if (uploadMarkdown) uploadMarkdown.value = `![${file.name}](${objectUrl})`;
  } else {
    if (uploadHtmlEmbed) uploadHtmlEmbed.value = `<a href="${objectUrl}" download="${escapeHtml(file.name)}">${escapeHtml(file.name)}</a>`;
    if (uploadMarkdown) uploadMarkdown.value = `[${file.name}](${objectUrl})`;
  }
}

function copyUploaderField(id) {
  const field = document.getElementById(id);
  if (!field || !field.value) return alert("Belum ada data untuk dicopy.");
  navigator.clipboard.writeText(field.value);
  alert("Berhasil dicopy.");
}

function resetUploader() {
  selectedUploadFile = null;

  if (lastUploadObjectUrl) {
    try { URL.revokeObjectURL(lastUploadObjectUrl); } catch (e) {}
    lastUploadObjectUrl = "";
  }

  if (lastPreviewObjectUrl) {
    try { URL.revokeObjectURL(lastPreviewObjectUrl); } catch (e) {}
    lastPreviewObjectUrl = "";
  }

  const uploaderInput = document.getElementById("uploaderInput");
  const uploaderMeta = document.getElementById("uploaderMeta");
  const uploadUrl = document.getElementById("uploadUrl");
  const uploadFilename = document.getElementById("uploadFilename");
  const uploadHtmlEmbed = document.getElementById("uploadHtmlEmbed");
  const uploadMarkdown = document.getElementById("uploadMarkdown");
  const uploaderPreview = document.getElementById("uploaderPreview");

  if (uploaderInput) uploaderInput.value = "";
  if (uploaderMeta) uploaderMeta.textContent = "Belum ada file dipilih.";
  if (uploadUrl) uploadUrl.value = "";
  if (uploadFilename) uploadFilename.value = "";
  if (uploadHtmlEmbed) uploadHtmlEmbed.value = "";
  if (uploadMarkdown) uploadMarkdown.value = "";
  if (uploaderPreview) uploaderPreview.textContent = "Preview akan muncul di sini.";

  setUploadProgress(0);
}

function setUploadProgress(value) {
  const uploadBar = document.getElementById("uploadBar");
  const uploadPercent = document.getElementById("uploadPercent");
  if (uploadBar) uploadBar.style.width = `${value}%`;
  if (uploadPercent) uploadPercent.textContent = `${value}%`;
}

function setupDropzone() {
  const dropzone = document.getElementById("dropzone");
  if (!dropzone) return;

  ["dragenter", "dragover"].forEach(evt => {
    dropzone.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(evt => {
    dropzone.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", e => {
    const file = e.dataTransfer.files[0];
    if (file) setSelectedUploaderFile(file);
  });
}

function sanitizeCalcValue(value) {
  return String(value)
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[^0-9+\-*/().%]/g, "");
}

function appendCalc(value) {
  const display = document.getElementById("calcDisplay");
  if (!display) return;
  display.value = sanitizeCalcValue(display.value + value);
  display.focus();
}

function clearCalc() {
  const display = document.getElementById("calcDisplay");
  if (display) display.value = "";
}

function backspaceCalc() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;
  display.value = display.value.slice(0, -1);
  display.focus();
}

function calculateResult() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  try {
    const expression = sanitizeCalcValue(display.value || "0");
    if (!expression) {
      display.value = "";
      return;
    }

    const result = Function("return (" + expression + ")")();
    if (!Number.isFinite(result)) throw new Error("Invalid result");
    display.value = result;
  } catch (e) {
    alert("Format hitungan salah.");
  }
}

function setupCalculatorKeyboard() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  display.addEventListener("input", () => {
    display.value = sanitizeCalcValue(display.value);
  });

  display.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      calculateResult();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearCalc();
    }
  });
}

function getEditor() {
  return document.getElementById("richEditor");
}

function saveEditorSelection() {
  const selection = window.getSelection();
  const editor = getEditor();
  if (!selection || !selection.rangeCount || !editor) return;

  const range = selection.getRangeAt(0);
  if (editor.contains(range.commonAncestorContainer)) {
    savedEditorRange = range.cloneRange();
  }
}

function restoreEditorSelection() {
  const selection = window.getSelection();
  if (!selection || !savedEditorRange) return;
  selection.removeAllRanges();
  selection.addRange(savedEditorRange);
}

function focusEditor() {
  const editor = getEditor();
  if (!editor) return null;
  editor.focus();
  restoreEditorSelection();
  return editor;
}

function editorCommand(command, value = null) {
  const editor = focusEditor();
  if (!editor) return;
  document.execCommand("styleWithCSS", false, false);
  document.execCommand(command, false, value);
  normalizeEditorContent();
  saveEditorSelection();
}

function formatBlockTag(tag) {
  const editor = focusEditor();
  if (!editor) return;
  document.execCommand("formatBlock", false, `<${tag}>`);
  normalizeEditorContent();
  saveEditorSelection();
}

function setParagraph() {
  formatBlockTag("p");
}

function insertEditorLink() {
  const url = prompt("Masukkan URL link:", "https://");
  if (!url) return;
  const safeUrl = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
  editorCommand("createLink", safeUrl);
}

function insertHorizontalRule() {
  editorCommand("insertHorizontalRule");
}

function insertTablePrompt() {
  const rows = parseInt(prompt("Jumlah baris?", "2"), 10);
  const cols = parseInt(prompt("Jumlah kolom?", "2"), 10);

  if (!rows || !cols || rows < 1 || cols < 1) return;

  let html = "<table><tbody>";
  for (let r = 0; r < rows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      html += `<td>Cell ${r + 1}-${c + 1}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table><p><br></p>";

  const editor = focusEditor();
  if (!editor) return;
  document.execCommand("insertHTML", false, html);
  normalizeEditorContent();
  saveEditorSelection();
}

function normalizeEditorContent() {
  const editor = getEditor();
  if (!editor) return;

  if (!editor.innerHTML.trim()) {
    editor.innerHTML = "<p><br></p>";
    updateWordHtmlPreview();
    return;
  }

  editor.querySelectorAll("div").forEach(div => {
    if (div.closest("li, blockquote, td, th")) return;
    const p = document.createElement("p");
    p.innerHTML = div.innerHTML.trim() || "<br>";
    div.replaceWith(p);
  });

  editor.querySelectorAll("table").forEach(table => {
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.querySelectorAll("td, th").forEach(cell => {
      cell.style.border = "1px solid rgba(125,255,238,.25)";
      cell.style.padding = "8px";
      if (!cell.innerHTML.trim()) cell.innerHTML = "<br>";
    });
  });

  updateWordHtmlPreview();
}

function stripMsOfficeJunk(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?o:p[^>]*>/gi, "")
    .replace(/<\/?(meta|link|xml|style|script)[^>]*>/gi, "")
    .replace(/\s*mso-[^:"']+:[^;"']+;?/gi, "")
    .replace(/\s*class=("|\')[^"\']*(Mso|WordSection)[^"\']*("|\')/gi, "");
}

function removeUnsafeAttributes(html) {
  return html
    .replace(/\sstyle=(".*?"|'.*?')/gi, "")
    .replace(/\sclass=(".*?"|'.*?')/gi, "")
    .replace(/\slang=(".*?"|'.*?')/gi, "")
    .replace(/\swidth=(".*?"|'.*?')/gi, "")
    .replace(/\sheight=(".*?"|'.*?')/gi, "")
    .replace(/\salign=(".*?"|'.*?')/gi, "")
    .replace(/\sdata-[a-z0-9_-]+=(".*?"|'.*?')/gi, "")
    .replace(/\sid=(".*?"|'.*?')/gi, "");
}

function normalizeSemanticTags(html) {
  return html
    .replace(/<b(\s[^>]*)?>/gi, "<strong>")
    .replace(/<\/b>/gi, "</strong>")
    .replace(/<i(\s[^>]*)?>/gi, "<em>")
    .replace(/<\/i>/gi, "</em>");
}

function unwrapGarbageSpans(html) {
  let previous = "";
  let current = html;

  while (previous !== current) {
    previous = current;
    current = current.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, "$1");
  }

  return current;
}

function convertLooseDivsToParagraphs(html) {
  return html
    .replace(/<div[^>]*>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>");
}

function removeEmptyNodes(html) {
  return html
    .replace(/<p>\s*(<br\s*\/?>|\&nbsp;|\s)*<\/p>/gi, "")
    .replace(/<strong>\s*<\/strong>/gi, "")
    .replace(/<em>\s*<\/em>/gi, "")
    .replace(/<h1>\s*<\/h1>/gi, "")
    .replace(/<h2>\s*<\/h2>/gi, "")
    .replace(/<h3>\s*<\/h3>/gi, "")
    .replace(/<blockquote>\s*<\/blockquote>/gi, "")
    .replace(/\n{3,}/g, "\n\n");
}

function cleanWordHtml() {
  const editor = getEditor();
  if (!editor) return;

  let html = editor.innerHTML || "";
  if (isTooLarge(html, 100000)) return;
  html = stripMsOfficeJunk(html);
  html = removeUnsafeAttributes(html);
  html = normalizeSemanticTags(html);
  html = unwrapGarbageSpans(html);
  html = convertLooseDivsToParagraphs(html);
  html = removeEmptyNodes(html);

  editor.innerHTML = html.trim() || "<p><br></p>";
  normalizeEditorContent();
  saveEditorSelection();
  convertWordToHtml();
  alert("HTML berhasil dibersihkan.");
}

function formatHtmlOutput(html) {
  return html
    .replace(/></g, ">\n<")
    .replace(/<p><\/p>/g, "")
    .trim();
}

function updateWordHtmlPreview() {
  const editor = getEditor();
  const preview = document.getElementById("wordHtmlPreview");
  if (!editor || !preview) return;
  preview.innerHTML = editor.innerHTML.trim() || "Preview HTML akan muncul di sini.";
}

function convertWordToHtml() {
  if (currentView !== "wordtohtml") return;
  const editor = getEditor();
  const output = document.getElementById("wordHtmlOutput");
  if (!editor || !output) return;

  normalizeEditorContent();
  output.value = formatHtmlOutput(editor.innerHTML);
  updateWordHtmlPreview();
}

function clearWordHtml() {
  const editor = getEditor();
  const output = document.getElementById("wordHtmlOutput");
  const preview = document.getElementById("wordHtmlPreview");
  if (editor) editor.innerHTML = "<p><br></p>";
  if (output) output.value = "";
  if (preview) preview.textContent = "Preview HTML akan muncul di sini.";
}

function copyWordHtml() {
  const output = document.getElementById("wordHtmlOutput");
  if (!output || !output.value) return alert("Belum ada HTML untuk dicopy.");
  navigator.clipboard.writeText(output.value);
  alert("HTML berhasil dicopy.");
}

function copyEditorPlainText() {
  const editor = getEditor();
  if (!editor) return;
  navigator.clipboard.writeText(editor.innerText || "");
  alert("Plain text berhasil dicopy.");
}

function downloadWordHtml() {
  const output = document.getElementById("wordHtmlOutput");
  if (!output || !output.value) {
    alert("Belum ada HTML untuk didownload.");
    return;
  }

  const blob = new Blob([output.value], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "word-to-html-output.html";
  a.click();
  URL.revokeObjectURL(url);
}

function setupWordToHtmlEditor() {
  const editor = getEditor();
  if (!editor) return;

  ["keyup", "mouseup", "focus"].forEach(eventName => {
    editor.addEventListener(eventName, saveEditorSelection);
  });

  editor.addEventListener("paste", () => {
    setTimeout(() => {
      normalizeEditorContent();
      saveEditorSelection();
      convertWordToHtml();
    }, 0);
  });

  const debouncedEditorConvert = debounce(() => {
    if (currentView !== "wordtohtml") return;
    convertWordToHtml();
  }, 180);

  editor.addEventListener("input", () => {
    normalizeEditorContent();
    debouncedEditorConvert();
  });

  editor.addEventListener("keydown", event => {
    if (event.key === "Tab") {
      event.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  });

  normalizeEditorContent();
  convertWordToHtml();
}

function loadScannerFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const scannerInput = document.getElementById("scannerInput");
    if (scannerInput) scannerInput.value = e.target.result;
  };
  reader.readAsText(file);
}

function getScannerVerdict(score) {
  if (score >= 45) return { label: "DANGEROUS", className: "scan-danger" };
  if (score >= 20) return { label: "WARNING", className: "scan-warning" };
  return { label: "SAFE-ish", className: "scan-safe" };
}

function buildScannerPreview(text, foundLabels) {
  let preview = escapeHtml(text);
  foundLabels.forEach(label => {
    const safe = escapeRegExp(label);
    preview = preview.replace(new RegExp(safe, "gi"), match => `<span class="mark-hit">${match}</span>`);
  });
  return preview;
}

function runScanner() {
  if (currentView !== "scanner") return;

  const inputEl = document.getElementById("scannerInput");
  const result = document.getElementById("scannerResult");
  const summary = document.getElementById("scannerSummary");
  const preview = document.getElementById("scannerPreview");
  const scoreBoard = document.getElementById("scannerScoreBoard");
  if (!inputEl || !result || !summary || !preview || !scoreBoard) return;

  const input = inputEl.value;
  if (isTooLarge(input, 80000)) return;
  result.innerHTML = "";
  scoreBoard.innerHTML = "";

  if (!input.trim()) {
    summary.textContent = "Belum ada input untuk discan.";
    preview.textContent = "Belum ada preview hasil scan.";
    return;
  }

  const findings = [];
  let totalScore = 0;

  suspiciousPatterns.forEach(item => {
    if (totalScore > 80) return;
    const matches = input.match(item.pattern);
    if (matches && matches.length) {
      findings.push({
        label: item.label,
        count: matches.length,
        severity: item.severity,
        score: item.score * matches.length
      });
      totalScore += item.score * matches.length;
    }
  });

  const verdict = getScannerVerdict(totalScore);

  summary.innerHTML = `<b class="${verdict.className}">${verdict.label}</b><br>Total risk score: <b>${totalScore}</b>`;

  scoreBoard.innerHTML = `
    <div class="score-card">Patterns<strong>${findings.length}</strong></div>
    <div class="score-card">Risk Score<strong>${totalScore}</strong></div>
    <div class="score-card">Length<strong>${input.length}</strong></div>
    <div class="score-card">Status<strong class="${verdict.className}">${verdict.label}</strong></div>
  `;

  if (!findings.length) {
    result.innerHTML = `<div class="scanner-hit scan-safe">Tidak ada pattern mencurigakan yang cocok.</div>`;
    preview.innerHTML = escapeHtml(input);
    return;
  }

  result.innerHTML = findings.map(item => `
    <div class="scanner-hit ${item.severity === "danger" ? "scan-danger" : "scan-warning"}">
      <b>${escapeHtml(item.label)}</b><br>
      Ditemukan: ${item.count}x • Score: ${item.score}
    </div>
  `).join("");

  preview.innerHTML = buildScannerPreview(input, findings.map(f => f.label));
}

function clearScanner() {
  const input = document.getElementById("scannerInput");
  const file = document.getElementById("scannerFile");
  const summary = document.getElementById("scannerSummary");
  const result = document.getElementById("scannerResult");
  const preview = document.getElementById("scannerPreview");
  const scoreBoard = document.getElementById("scannerScoreBoard");

  if (input) input.value = "";
  if (file) file.value = "";
  if (summary) summary.textContent = "Belum ada scan dijalankan.";
  if (result) result.innerHTML = "";
  if (preview) preview.textContent = "Belum ada preview hasil scan.";
  if (scoreBoard) scoreBoard.innerHTML = "";
}

/* DOMAIN CHECKER NORMAL */
function normalizeDomainInput(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function checkDomainQuality() {
  const domainInput = document.getElementById("domainInput");
  const note = document.getElementById("domainCheckerNote");
  const tips = document.getElementById("domainCheckerTips");

  if (!domainInput || !note || !tips) return;

  const rawDomain = domainInput.value;
  const domain = normalizeDomainInput(rawDomain);

  if (!domain) {
    alert("Masukkan domain dulu.");
    return;
  }

  const looksValid = /^(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain);

  if (!looksValid) {
    note.innerHTML = "<b>Format domain tidak valid.</b><br>Contoh benar: example.com";
    tips.textContent = "Gunakan format domain bersih tanpa path tambahan.";
    resetDomainMetricsOnly();
    return;
  }

  setText("metricDR", "CHECK");
  setText("metricDA", "CHECK");
  setText("metricPA", "CHECK");
  setText("metricBL", "CHECK");
  setText("metricTF", "CHECK");
  setText("metricNW", "MANUAL");

  note.innerHTML = `
    <b>Domain:</b> ${escapeHtml(domain)}<br>
    <b>Status:</b> Format valid<br>
    <b>Mode:</b> Normal checker<br>
    <b>Hasil:</b> Tidak menampilkan angka palsu. Gunakan tombol shortcut untuk cek real.
  `;

  tips.innerHTML = `
    <b>Cek real:</b><br>
    • DR / BACKLINK / TRAFFIC → Ahrefs<br>
    • DA / PA → Moz<br>
    • NAWALA → cek manual / TrustPositif<br><br>
    <b>Catatan:</b><br>
    • Versi ini sengaja normal dan jujur<br>
    • Tidak ada metrik prediksi / fake score
  `;
}

function openAhrefsDomain() {
  const domain = normalizeDomainInput(document.getElementById("domainInput")?.value || "");
  if (!domain) return alert("Masukkan domain dulu.");
  window.open(`https://ahrefs.com/site-explorer/overview/v2/subdomains/live?target=${encodeURIComponent(domain)}`, "_blank");
}

function openMozDomain() {
  const domain = normalizeDomainInput(document.getElementById("domainInput")?.value || "");
  if (!domain) return alert("Masukkan domain dulu.");
  window.open(`https://moz.com/domain-analysis?site=${encodeURIComponent(domain)}`, "_blank");
}

function openNawalaDomain() {
  const domain = normalizeDomainInput(document.getElementById("domainInput")?.value || "");
  if (!domain) return alert("Masukkan domain dulu.");
  window.open("https://trustpositif.kominfo.go.id/", "_blank");
}

function resetDomainMetricsOnly() {
  setText("metricDR", "-");
  setText("metricDA", "-");
  setText("metricPA", "-");
  setText("metricBL", "-");
  setText("metricTF", "-");
  setText("metricNW", "-");
}

function resetDomainChecker() {
  const input = document.getElementById("domainInput");
  const note = document.getElementById("domainCheckerNote");
  const tips = document.getElementById("domainCheckerTips");

  if (input) input.value = "";
  resetDomainMetricsOnly();
  if (note) note.textContent = "Belum ada domain dicek.";
  if (tips) tips.textContent = "Shortcut dan catatan akan muncul di sini.";
}



function runPhpObfuscator() {
  const input = document.getElementById("phpObfuscatorInput");
  const output = document.getElementById("phpObfuscatorOutput");
  const info = document.getElementById("phpObfuscatorInfo");
  if (!input || !output || !info) return;

  let code = input.value.trim();
  if (!code) return alert("Masukkan kode PHP dulu.");
  if (isTooLarge(code, 120000)) return;

  code = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1")
    .replace(/\n+/g, "\n")
    .replace(/\s{2,}/g, " ")
    .trim();

  let varIndex = 0;
  const varMap = new Map();
  code = code.replace(/\$[a-zA-Z_][a-zA-Z0-9_]*/g, match => {
    if (["$_GET", "$_POST", "$_SERVER", "$_REQUEST", "$_FILES", "$_COOKIE", "$_SESSION", "$this"].includes(match)) return match;
    if (!varMap.has(match)) {
      varIndex += 1;
      varMap.set(match, "$x" + varIndex.toString(36));
    }
    return varMap.get(match);
  });

  const encoded = btoa(unescape(encodeURIComponent(code)));
  output.value = `<?php\n/* Xu_SEO PHP Obfuscator */\neval(base64_decode('${encoded}'));\n?>`;
  info.innerHTML = `Variabel diacak: <b>${varMap.size}</b> • Panjang output: <b>${output.value.length}</b> karakter`;
}

function resetPhpObfuscator() {
  const input = document.getElementById("phpObfuscatorInput");
  const output = document.getElementById("phpObfuscatorOutput");
  const info = document.getElementById("phpObfuscatorInfo");
  if (input) input.value = "";
  if (output) output.value = "";
  if (info) info.textContent = "Belum ada proses dijalankan.";
}

function encodeBase64Text() {
  const input = document.getElementById("base64Input");
  const output = document.getElementById("base64Output");
  if (!input || !output) return;
  const value = input.value;
  if (!value.trim()) return alert("Masukkan text dulu.");
  if (isTooLarge(value, 120000)) return;
  output.value = btoa(unescape(encodeURIComponent(value)));
  setText("base64Meta", `Text berhasil di-encode. Panjang output: ${output.value.length} karakter.`);
}

function decodeBase64Text() {
  const input = document.getElementById("base64Input");
  const output = document.getElementById("base64Output");
  if (!input || !output) return;
  const value = input.value.trim();
  if (!value) return alert("Masukkan text Base64 dulu.");
  try {
    output.value = decodeURIComponent(escape(atob(value)));
    setText("base64Meta", `Base64 berhasil di-decode. Panjang text: ${output.value.length} karakter.`);
  } catch (e) {
    alert("Format Base64 tidak valid.");
  }
}

function handleBase64File(event) {
  const file = event.target.files[0];
  const output = document.getElementById("base64Output");
  const meta = document.getElementById("base64Meta");
  if (!file || !output || !meta) return;
  const reader = new FileReader();
  reader.onload = e => {
    const result = e.target.result || "";
    const base64 = String(result).split(",")[1] || "";
    output.value = base64;
    meta.innerHTML = `File: <b>${escapeHtml(file.name)}</b> • Size: <b>${formatBytes(file.size)}</b> • Base64 siap dicopy.`;
  };
  reader.readAsDataURL(file);
}

function resetBase64Tool() {
  ["base64Input", "base64Output", "base64File"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if ("value" in el) el.value = "";
  });
  setText("base64Meta", "Mode text/file siap dipakai.");
}

function openAiTool(type) {
  const map = {
    chatgpt: "https://chatgpt.com/",
    gemini: "https://gemini.google.com/",
    sora: "https://openai.com/sora/"
  };
  const url = map[type];
  if (url) window.open(url, "_blank", "noopener");
}

function generateAiPrompt() {
  const keyword = (document.getElementById("aiPromptKeyword")?.value || "").trim();
  const type = document.getElementById("aiPromptType")?.value || "article";
  const output = document.getElementById("aiPromptOutput");
  if (!output) return;
  if (!keyword) return alert("Masukkan keyword dulu.");

  const prompts = {
    article: `Buat artikel SEO bahasa Indonesia tentang "${keyword}". Strukturkan dengan H1, H2, H3, pembuka kuat, isi informatif, FAQ, dan CTA halus.`,
    meta: `Buat 10 variasi meta title dan meta description SEO untuk keyword "${keyword}" dengan CTR tinggi dan tetap natural.`,
    outline: `Buat outline SEO lengkap untuk keyword "${keyword}" dengan H1, H2, H3, intent pencarian, entity pendukung, dan pertanyaan turunan.`,
    faq: `Buat 12 FAQ SEO untuk keyword "${keyword}" beserta jawaban singkat, jelas, dan relevan.`
  };
  output.value = prompts[type] || prompts.article;
}

function runHtmlCleanerStandalone() {
  const input = document.getElementById("htmlCleanerInput");
  const output = document.getElementById("htmlCleanerOutput");
  if (!input || !output) return;
  const html = input.value;
  if (!html.trim()) return alert("Masukkan HTML dulu.");
  if (isTooLarge(html, 120000)) return;
  output.value = cleanHtmlString(html);
}

function resetHtmlCleanerStandalone() {
  const input = document.getElementById("htmlCleanerInput");
  const output = document.getElementById("htmlCleanerOutput");
  if (input) input.value = "";
  if (output) output.value = "";
}

function runKeywordDensityStandalone() {
  const input = document.getElementById("keywordDensityInput");
  const limitEl = document.getElementById("keywordDensityLimit");
  const output = document.getElementById("keywordDensityOutput");
  const summary = document.getElementById("keywordDensitySummary");
  if (!input || !limitEl || !output || !summary) return;
  const text = input.value;
  if (!text.trim()) return alert("Masukkan text dulu.");
  if (isTooLarge(text, 150000)) return;
  const limit = Math.max(5, Math.min(50, parseInt(limitEl.value || "15", 10)));
  const data = getKeywordDensityData(stripHtmlToText(text), limit);
  output.value = data.top.map(item => `${item.word} = ${item.count}x (${item.density.toFixed(2)}%)`).join("\n");
  summary.innerHTML = `Total kata terhitung: <b>${data.total}</b><br>Keyword unik teratas: <b>${data.top.length}</b>`;
}

function resetKeywordDensityStandalone() {
  const input = document.getElementById("keywordDensityInput");
  const output = document.getElementById("keywordDensityOutput");
  const summary = document.getElementById("keywordDensitySummary");
  if (input) input.value = "";
  if (output) output.value = "";
  if (summary) summary.textContent = "Belum ada analisa.";
}

function buildSimpleSeoAudit(html, url) {
  const raw = String(html || "");
  const title = ((raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [null, "-"])[1] || "-").replace(/\s+/g, " ").trim();
  const desc = ((raw.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i) || [null, "-"])[1] || "-").trim();
  const canonical = ((raw.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([\s\S]*?)["']/i) || [null, "-"])[1] || "-").trim();
  const h1Count = (raw.match(/<h1\b/gi) || []).length;
  const imgCount = (raw.match(/<img\b/gi) || []).length;
  const imgAltCount = (raw.match(/<img\b[^>]*\salt=/gi) || []).length;
  const escapedUrl = String(url || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const internalLinks = url ? (raw.match(new RegExp(escapedUrl, "gi")) || []).length : 0;
  const noindex = /noindex/i.test(raw) ? "YES" : "NO";
  return { title, desc, canonical, h1Count, imgCount, imgAltCount, internalLinks, noindex };
}

function runSeoXuAudit() {
  const urlInput = document.getElementById("seoXuUrl");
  const htmlInput = document.getElementById("seoXuHtml");
  if (!urlInput || !htmlInput) return;

  const url = normalizeUrlInput(urlInput.value);
  const html = htmlInput.value;
  const cleaned = cleanHtmlString(html);
  const text = stripHtmlToText(html);
  const density = getKeywordDensityData(text, 8);
  const audit = buildSimpleSeoAudit(html, url);

  const hostname = (() => {
    try { return url ? new URL(url).hostname : ""; } catch { return ""; }
  })();

  const indexResult = document.getElementById("seoXuIndexResult");
  const robotsResult = document.getElementById("seoXuRobotsResult");
  const keywordResult = document.getElementById("seoXuKeywordResult");
  const cleanerResult = document.getElementById("seoXuCleanerResult");
  const auditResult = document.getElementById("seoXuAuditResult");
  if (!indexResult || !robotsResult || !keywordResult || !cleanerResult || !auditResult) return;

  if (!url && !html.trim()) return alert("Masukkan URL atau HTML source dulu.");

  indexResult.innerHTML = hostname
    ? `Cek indeks cepat: <a href="https://www.google.com/search?q=site%3A${encodeURIComponent(hostname)}" target="_blank" rel="noopener">site:${escapeHtml(hostname)}</a><br>Status: shortcut siap dipakai.`
    : "Masukkan URL untuk membuat shortcut cek index.";

  robotsResult.innerHTML = hostname
    ? `Robots: <a href="https://${escapeHtml(hostname)}/robots.txt" target="_blank" rel="noopener">/robots.txt</a><br>Sitemap: <a href="https://${escapeHtml(hostname)}/sitemap.xml" target="_blank" rel="noopener">/sitemap.xml</a>`
    : "Masukkan URL untuk shortcut robots dan sitemap.";

  keywordResult.innerHTML = density.top.length
    ? density.top.map(item => `${escapeHtml(item.word)} = <b>${item.count}x</b> (${item.density.toFixed(2)}%)`).join("<br>")
    : "Paste HTML/text untuk analisa keyword.";

  cleanerResult.innerHTML = cleaned
    ? `HTML bersih siap dipakai. Panjang hasil: <b>${cleaned.length}</b> karakter.<br><a href="#" onclick="copySeoXuCleaner(event)">Copy cleaned HTML</a>`
    : "Belum ada HTML untuk dibersihkan.";
  window.__seoXuCleanedHtml = cleaned;

  auditResult.innerHTML = `Title: <b>${escapeHtml(audit.title || "-")}</b><br>Meta Description: <b>${escapeHtml(audit.desc || "-")}</b><br>Canonical: <b>${escapeHtml(audit.canonical || "-")}</b><br>H1 Count: <b>${audit.h1Count}</b><br>Images with Alt: <b>${audit.imgAltCount}/${audit.imgCount}</b><br>Noindex: <b>${audit.noindex}</b><br>Internal Link Mentions: <b>${audit.internalLinks}</b>`;
}

function copySeoXuCleaner(event) {
  event.preventDefault();
  const value = window.__seoXuCleanedHtml || "";
  if (!value) return alert("Belum ada cleaned HTML.");
  navigator.clipboard.writeText(value);
  alert("Cleaned HTML berhasil dicopy.");
}

function resetSeoXuAudit() {
  ["seoXuUrl", "seoXuHtml"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  ["seoXuIndexResult", "seoXuRobotsResult", "seoXuKeywordResult", "seoXuCleanerResult", "seoXuAuditResult"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "Belum ada hasil.";
  });
  window.__seoXuCleanedHtml = "";
}

function loadMusic(event) {
  const file = event.target.files[0];
  if (!file) return;

  const player = document.getElementById("musicPlayer");
  const meta = document.getElementById("musicMeta");
  if (!player || !meta) return;

  player.src = URL.createObjectURL(file);
  meta.innerHTML = "Audio: <b>" + escapeHtml(file.name) + "</b> • Size: <b>" + formatBytes(file.size) + "</b>";
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function handleTerminal(event) {
  if (event.key === "Enter") runTerminalCommand();
}

function runTerminalCommand() {
  const input = document.getElementById("terminalInput");
  const output = document.getElementById("terminalOutput");
  if (!input || !output) return;

  const cmd = input.value.trim().toLowerCase();
  if (!cmd) return;

  let response = "";

  if (cmd === "help") {
    response = "Available commands: help, status, clear, seo-scan, whoami";
  } else if (cmd === "status") {
    response = "System online | theme neon tosca | build stable | storage local mode";
  } else if (cmd === "seo-scan") {
    response = "Scanner module ready. Use the Scanner tab.";
  } else if (cmd === "whoami") {
    response = "Current user: " + (localStorage.getItem("xuUser") || "Guest");
  } else if (cmd === "clear") {
    output.textContent = "Xu_SEO terminal initialized...\nType: help";
    input.value = "";
    return;
  } else {
    response = "Command not found: " + cmd;
  }

  output.textContent += "\n> " + cmd + "\n" + response;
  output.scrollTop = output.scrollHeight;
  input.value = "";
}

function applyUsername() {
  const usernameEl = document.getElementById("settingsUsername");
  if (!usernameEl) return;

  const username = usernameEl.value.trim();
  if (!username) return alert("Isi nama user dulu.");

  localStorage.setItem("xuUser", username);
  updateUserUI(username);
  alert("Nama user diperbarui.");
}

function applyBrand() {
  const brandEl = document.getElementById("settingsBrand");
  const brandTitle = document.getElementById("brandTitle");
  if (!brandEl || !brandTitle) return;

  const brand = brandEl.value.trim();
  if (!brand) return alert("Isi judul brand dulu.");

  brandTitle.textContent = brand;
  document.title = brand + " Dashboard";
  localStorage.setItem("xuBrand", brand);
  alert("Brand diperbarui.");
}

function loadSettings() {
  const savedBrand = localStorage.getItem("xuBrand");
  const savedUser = localStorage.getItem("xuUser");
  const brandTitle = document.getElementById("brandTitle");

  if (savedBrand && brandTitle) {
    brandTitle.textContent = savedBrand;
    document.title = savedBrand + " Dashboard";
  }

  updateUserUI(savedUser || "Guest");
  const settingsUsername = document.getElementById("settingsUsername");
  const settingsBrand = document.getElementById("settingsBrand");
  if (settingsUsername) settingsUsername.value = savedUser || "";
  if (settingsBrand) settingsBrand.value = savedBrand || "";
}

function resetAppData() {
  localStorage.removeItem("xuUser");
  localStorage.removeItem("xuBrand");
  localStorage.removeItem("xuNoteTitle");
  localStorage.removeItem("xuNoteText");
  location.reload();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

window.onload = function () {
  loadNote();
  loadSettings();
  countWords();
  setupDropzone();
  setupCalculatorKeyboard();
  setupWordToHtmlEditor();
  filterTools();
};
