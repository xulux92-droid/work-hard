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
  "musicplayer",
  "terminal",
  "settings"
];

const suspiciousPatterns = [
  "eval",
  "system",
  "create_function",
  "assert",
  "chdir",
  "base64_decode",
  "shell_exec",
  "exec",
  "passthru",
  "popen",
  "_halt_compiler",
  "file_get_contents(",
  "shell(",
  "base64_encode(",
  "webconsole",
  "uploader",
  "hacked",
  "move_uploaded_file",
  "hex2bin(",
  "bin2hex(",
  "wso",
  "alfa",
  "filemanager",
  "pastebin",
  "mini shell",
  "minishell",
  "b374k",
  "indoxploit",
  "ALFA_DATA/alfacgiapi"
];

function showView(viewName) {
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

function countWords() {
  const textEl = document.getElementById("wordCounterInput");
  if (!textEl) return;

  const text = textEl.value;
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;
  const paragraphs = trimmed ? text.split(/\n\s*\n|\n/).filter(p => p.trim()).length : 0;
  const readSeconds = Math.ceil(words / 3.3) || 0;

  const wordsEl = document.getElementById("countWords");
  const charsEl = document.getElementById("countChars");
  const paragraphsEl = document.getElementById("countParagraphs");
  const readEl = document.getElementById("countRead");

  if (wordsEl) wordsEl.textContent = words;
  if (charsEl) charsEl.textContent = chars;
  if (paragraphsEl) paragraphsEl.textContent = paragraphs;
  if (readEl) readEl.textContent = readSeconds + " dtk";
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
  fillUploader(file);
}

function fillUploader(file) {
  const meta = document.getElementById("uploaderMeta");
  const urlEl = document.getElementById("uploadUrl");
  const wgetEl = document.getElementById("uploadWget");
  const curlEl = document.getElementById("uploadCurl");
  if (!meta || !urlEl || !wgetEl || !curlEl) return;

  meta.innerHTML =
    "File: <b>" + escapeHtml(file.name) + "</b> • Size: <b>" + formatBytes(file.size) + "</b>";

  animateUploadBar();

  const safeName = file.name.replace(/\s+/g, "-");
  const fakeUrl = "https://github.local/upload/" + Date.now() + "-" + safeName;

  urlEl.value = fakeUrl;
  wgetEl.value = 'wget "' + fakeUrl + '" -O "' + safeName + '"';
  curlEl.value = 'curl -L "' + fakeUrl + '" -o "' + safeName + '"';
}

function animateUploadBar() {
  const bar = document.getElementById("uploadBar");
  const percent = document.getElementById("uploadPercent");
  if (!bar || !percent) return;

  let value = 0;
  bar.style.width = "0%";
  percent.textContent = "0%";

  const timer = setInterval(() => {
    value += 10;
    bar.style.width = value + "%";
    percent.textContent = value + "%";
    if (value >= 100) clearInterval(timer);
  }, 60);
}

function copyUploaderField(id) {
  const field = document.getElementById(id);
  if (!field || !field.value) return alert("Belum ada data untuk dicopy.");
  navigator.clipboard.writeText(field.value);
  alert("Berhasil dicopy.");
}

function resetUploader() {
  const uploaderInput = document.getElementById("uploaderInput");
  const uploaderMeta = document.getElementById("uploaderMeta");
  const uploadUrl = document.getElementById("uploadUrl");
  const uploadWget = document.getElementById("uploadWget");
  const uploadCurl = document.getElementById("uploadCurl");
  const uploadBar = document.getElementById("uploadBar");
  const uploadPercent = document.getElementById("uploadPercent");

  if (uploaderInput) uploaderInput.value = "";
  if (uploaderMeta) uploaderMeta.textContent = "Belum ada file dipilih.";
  if (uploadUrl) uploadUrl.value = "";
  if (uploadWget) uploadWget.value = "";
  if (uploadCurl) uploadCurl.value = "";
  if (uploadBar) uploadBar.style.width = "0%";
  if (uploadPercent) uploadPercent.textContent = "0%";
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
    if (file) fillUploader(file);
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

  display.removeAttribute("readonly");

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
      return;
    }
  });
}

let savedEditorRange = null;

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

function insertTablePrompt() {
  const rows = parseInt(prompt("Jumlah baris?", "2"), 10);
  const cols = parseInt(prompt("Jumlah kolom?", "2"), 10);

  if (!rows || !cols || rows < 1 || cols < 1) return;

  let html = '<table><tbody>';
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
}

function formatHtmlOutput(html) {
  return html
    .replace(/></g, ">\n<")
    .replace(/<p><\/p>/g, "")
    .trim();
}

function convertWordToHtml() {
  const editor = getEditor();
  const output = document.getElementById("wordHtmlOutput");
  if (!editor || !output) return;

  normalizeEditorContent();
  output.value = formatHtmlOutput(editor.innerHTML);
}

function clearWordHtml() {
  const editor = getEditor();
  const output = document.getElementById("wordHtmlOutput");
  if (editor) editor.innerHTML = "<p><br></p>";
  if (output) output.value = "";
}

function copyWordHtml() {
  const output = document.getElementById("wordHtmlOutput");
  if (!output || !output.value) return alert("Belum ada HTML untuk dicopy.");
  navigator.clipboard.writeText(output.value);
  alert("HTML berhasil dicopy.");
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
    }, 0);
  });

  editor.addEventListener("keydown", event => {
    if (event.key === "Tab") {
      event.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  });

  normalizeEditorContent();
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

function runScanner() {
  const inputEl = document.getElementById("scannerInput");
  const result = document.getElementById("scannerResult");
  const summary = document.getElementById("scannerSummary");
  if (!inputEl || !result || !summary) return;

  const input = inputEl.value;
  result.innerHTML = "";

  if (!input.trim()) {
    summary.textContent = "Belum ada input untuk discan.";
    return;
  }

  const found = suspiciousPatterns.filter(pattern =>
    input.toLowerCase().includes(pattern.toLowerCase())
  );

  if (!found.length) {
    summary.innerHTML = "<b>SAFE-ish</b><br>Tidak ada pattern mencurigakan yang cocok.";
    return;
  }

  summary.innerHTML = "<b>WARNING</b><br>Ditemukan " + found.length + " pattern mencurigakan.";
  result.innerHTML = found.map(item => `<div class="scanner-hit">${escapeHtml(item)}</div>`).join("");
}

function clearScanner() {
  const input = document.getElementById("scannerInput");
  const file = document.getElementById("scannerFile");
  const summary = document.getElementById("scannerSummary");
  const result = document.getElementById("scannerResult");

  if (input) input.value = "";
  if (file) file.value = "";
  if (summary) summary.textContent = "Belum ada scan dijalankan.";
  if (result) result.innerHTML = "";
}

function domainScore(domain, seed) {
  let total = seed;
  for (const char of domain) total += char.charCodeAt(0);
  return (total % 71) + 20;
}

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
  if (!domainInput || !note) return;

  const rawDomain = domainInput.value;
  const domain = normalizeDomainInput(rawDomain);

  if (!domain) {
    alert("Masukkan domain dulu.");
    return;
  }

  const looksValid = /^(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain);
  if (!looksValid) {
    note.innerHTML = "<b>Format domain tidak valid.</b><br>Contoh benar: example.com";
    resetDomainMetricsOnly();
    return;
  }

  const parts = domain.split(".");
  const tld = parts[parts.length - 1];
  const domainLength = domain.replace(/\./g, "").length;
  const hasHyphen = domain.includes("-");

  const da = domainScore(domain, 17);
  const pa = domainScore(domain, 29);
  const dr = domainScore(domain, 41);
  const backlinks = (domain.length * 137 + tld.length * 811).toLocaleString("id-ID");
  const traffic = (domainLength * 321 + (hasHyphen ? 700 : 2300)).toLocaleString("id-ID");
  const kominfo = ["com", "net", "org", "id", "co", "io", "xyz"].includes(tld) ? "Aman*" : "Manual";

  const metricDA = document.getElementById("metricDA");
  const metricPA = document.getElementById("metricPA");
  const metricDR = document.getElementById("metricDR");
  const metricBL = document.getElementById("metricBL");
  const metricTF = document.getElementById("metricTF");
  const metricKI = document.getElementById("metricKI");

  if (metricDA) metricDA.textContent = da;
  if (metricPA) metricPA.textContent = pa;
  if (metricDR) metricDR.textContent = dr;
  if (metricBL) metricBL.textContent = backlinks;
  if (metricTF) metricTF.textContent = traffic;
  if (metricKI) metricKI.textContent = kominfo;

  note.innerHTML =
    `<b>Domain:</b> ${escapeHtml(domain)}` +
    `<br><b>Status:</b> Format valid dan siap dianalisis.` +
    `<br><b>TLD:</b> .${escapeHtml(tld)} | <b>Panjang:</b> ${domainLength} karakter | <b>HTTPS:</b> direkomendasikan` +
    `<br><b>Catatan:</b> Angka di atas adalah estimasi frontend untuk preview UI GitHub Pages. Kalau nanti mau real DA/PA/DR/backlinks/traffic/Kominfo, tinggal sambung API/backend.`;
}

function resetDomainMetricsOnly() {
  const metricDA = document.getElementById("metricDA");
  const metricPA = document.getElementById("metricPA");
  const metricDR = document.getElementById("metricDR");
  const metricBL = document.getElementById("metricBL");
  const metricTF = document.getElementById("metricTF");
  const metricKI = document.getElementById("metricKI");

  if (metricDA) metricDA.textContent = "-";
  if (metricPA) metricPA.textContent = "-";
  if (metricDR) metricDR.textContent = "-";
  if (metricBL) metricBL.textContent = "-";
  if (metricTF) metricTF.textContent = "-";
  if (metricKI) metricKI.textContent = "-";
}

function resetDomainChecker() {
  const input = document.getElementById("domainInput");
  const note = document.getElementById("domainCheckerNote");
  if (input) input.value = "";
  resetDomainMetricsOnly();
  if (note) note.textContent = "Belum ada domain dicek.";
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
    response = "System online | theme neon tosca | build v3 | storage local mode";
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
}

function resetAppData() {
  localStorage.removeItem("xuUser");
  localStorage.removeItem("xuBrand");
  localStorage.removeItem("xuNoteTitle");
  localStorage.removeItem("xuNoteText");
  location.reload();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

window.onload = function () {
  loadNote();
  loadSettings();
  countWords();
  setupDropzone();
  setupCalculatorKeyboard();
  setupWordToHtmlEditor();
};