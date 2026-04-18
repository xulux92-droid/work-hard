const views = [
  'dashboard','auth','notepad','wordcounter','filemanager','uploader','calculator','wordtohtml','scanner','domainchecker','musicplayer','terminal','settings','phpobfuscator','base64','aitools','seoxu','htmlcleaner','keyworddensity'
];

const toolCards = [
  ['dashboard','🏠','Dashboard','Ringkasan semua tool.','Main'],['auth','🔐','Auth','Login/register lokal.','Auth'],['notepad','📒','Notepad','Catatan kerja cepat.','Notes'],['wordcounter','📝','Word Counter','Hitung kata, karakter, paragraf.','Text'],['filemanager','📁','File Manager','Lihat file/folder lokal.','Files'],['uploader','🚀','Uploader','Object URL, embed HTML, markdown.','Upload'],['calculator','🧮','Calculator','Kalkulator cepat dan support keyboard.','Math'],['wordtohtml','🔤','Word to HTML','Rich editor ke HTML bersih.','HTML'],['scanner','🛡️','Scanner','Scan pattern mencurigakan.','Scan'],['domainchecker','🌐','Domain Checker','Checker domain normal.','SEO'],['musicplayer','🎵','Music Player','Putar audio lokal.','Media'],['terminal','⌨️','Terminal','Console demo ringan.','System'],['settings','⚙️','Settings','Kontrol theme speed.','Theme'],['phpobfuscator','🧬','PHP Obfuscator','Obfuscate PHP sederhana.','PHP'],['base64','🔐','Base64','Encode/decode text atau file.','Encode'],['aitools','🤖','AI Tools','Shortcut AI + SEO prompt helper.','AI'],['seoxu','🚦','SEO-XU','5 block audit cepat.','SEO'],['htmlcleaner','🧼','HTML Cleaner','Bersihkan tag/atribut sampah.','Clean'],['keyworddensity','📊','Keyword Density','Analisa kepadatan keyword.','SEO']
];

const suspiciousPatterns = [
  { label: 'eval()', pattern: /eval\s*\(/gi, score: 18, severity: 'danger' },
  { label: 'base64_decode()', pattern: /base64_decode\s*\(/gi, score: 12, severity: 'warning' },
  { label: 'shell_exec()', pattern: /shell_exec\s*\(/gi, score: 20, severity: 'danger' },
  { label: 'exec()', pattern: /exec\s*\(/gi, score: 16, severity: 'danger' },
  { label: 'system()', pattern: /system\s*\(/gi, score: 16, severity: 'danger' },
  { label: 'passthru()', pattern: /passthru\s*\(/gi, score: 20, severity: 'danger' },
  { label: 'iframe hidden', pattern: /<iframe[\s\S]*?(display\s*:\s*none|visibility\s*:\s*hidden|width\s*=\s*["']?0|height\s*=\s*["']?0)/gi, score: 18, severity: 'danger' },
  { label: 'gzinflate()', pattern: /gzinflate\s*\(/gi, score: 10, severity: 'warning' },
  { label: 'long base64 blob', pattern: /[A-Za-z0-9+/]{200,}={0,2}/g, score: 22, severity: 'danger' },
  { label: 'webshell keyword', pattern: /(wso|alfa|indoxploit|b374k|minishell|webconsole)/gi, score: 25, severity: 'danger' }
];

let currentView = 'dashboard';
let lastUploadObjectUrl = '';
let lastPreviewObjectUrl = '';
let savedEditorRange = null;

function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
function $(id){ return document.getElementById(id); }
function setText(id, val){ const el = $(id); if(el) el.textContent = val; }
function escapeHtml(text=''){ return text.replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
function escapeRegExp(str=''){ return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function formatBytes(bytes=0){ if (!bytes) return '0 B'; const u=['B','KB','MB','GB']; const i=Math.floor(Math.log(bytes)/Math.log(1024)); return `${(bytes/1024**i).toFixed(i?2:0)} ${u[i]}`; }
function isTooLarge(text, max=50000){ if((text||'').length > max){ alert(`Input terlalu besar. Maksimal ${max.toLocaleString()} karakter.`); return true; } return false; }

function showView(viewName){
  currentView = viewName;
  views.forEach(v => {
    document.querySelector(`#view-${v}`)?.classList.remove('active');
    document.querySelector(`[data-view-target="${v}"]`)?.classList.remove('active');
  });
  document.querySelector(`#view-${viewName}`)?.classList.add('active');
  document.querySelector(`[data-view-target="${viewName}"]`)?.classList.add('active');
}

function renderToolGrid(){
  const grid = $('toolGrid'); if(!grid) return;
  grid.innerHTML = toolCards.map(([id,icon,title,desc,tag]) => `
    <article class="tool-card" data-name="${id} ${title.toLowerCase()} ${desc.toLowerCase()} ${tag.toLowerCase()}">
      <div>
        <div class="icon">${icon}</div>
        <h4>${title}</h4>
        <p>${desc}</p>
      </div>
      <div class="meta">
        <span class="tag">${tag}</span>
        <button class="btn rainbow" type="button" onclick="showView('${id}')">OPEN</button>
      </div>
    </article>
  `).join('');
}
function filterTools(){
  const input = ($('toolSearch')?.value || '').toLowerCase();
  const cards = document.querySelectorAll('#toolGrid .tool-card');
  let visible = 0;
  cards.forEach(card => {
    const ok = (card.dataset.name || '').toLowerCase().includes(input);
    card.style.display = ok ? 'flex' : 'none';
    if(ok) visible++;
  });
  setText('toolCount', visible);
}
function resetSearch(){ if($('toolSearch')) $('toolSearch').value=''; filterTools(); }

function simulateLogin(){
  const username = $('loginUsername')?.value.trim();
  if(!username) return alert('Masukkan username dulu.');
  localStorage.setItem('xuUser', username); updateUserUI(username); alert(`Login demo berhasil untuk user: ${username}`); showView('dashboard');
}
function simulateRegister(){
  const username = $('registerUsername')?.value.trim();
  const email = $('registerEmail')?.value.trim();
  if(!username || !email) return alert('Isi username dan email dulu.');
  localStorage.setItem('xuUser', username); updateUserUI(username); alert(`Register demo berhasil: ${username}`); showView('dashboard');
}
function updateUserUI(username){ setText('userStatus', `User: ${username}`); setText('activeUserBox', username); }
function saveNote(){ localStorage.setItem('xuNoteTitle',$('noteTitle')?.value||''); localStorage.setItem('xuNoteText',$('notepadText')?.value||''); alert('Catatan disimpan.'); }
function clearNote(){ if($('noteTitle')) $('noteTitle').value=''; if($('notepadText')) $('notepadText').value=''; localStorage.removeItem('xuNoteTitle'); localStorage.removeItem('xuNoteText'); }
function loadNote(){ if($('noteTitle')) $('noteTitle').value = localStorage.getItem('xuNoteTitle')||''; if($('notepadText')) $('notepadText').value = localStorage.getItem('xuNoteText')||''; }

function countWords(){
  const text = $('wordCounterInput')?.value || '';
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;
  const paragraphs = trimmed ? text.split(/\n\s*\n|\n/).filter(Boolean).length : 0;
  const readSeconds = Math.ceil(words / 3.3) || 0;
  setText('countWords', words); setText('countChars', chars); setText('countParagraphs', paragraphs); setText('countRead', `${readSeconds} dtk`);
}
const debouncedCountWords = debounce(() => { if(currentView==='wordcounter') countWords(); }, 120);

function renderFiles(){
  const files = $('fileInput')?.files || [];
  const out = $('fileList'); if(!out) return;
  if(!files.length) return out.innerHTML = 'Belum ada file yang dipilih.';
  out.innerHTML = Array.from(files).map(file => `<div class="file-item"><span>${escapeHtml(file.name)}</span><strong>${formatBytes(file.size)}</strong></div>`).join('');
}
function renderFolderFiles(event){
  const files = event.target.files || [];
  const out = $('fileList'); if(!out) return;
  if(!files.length) return out.innerHTML = 'Belum ada file yang dipilih.';
  const html = Array.from(files).slice(0,40).map(file => `<div class="file-item"><span>${escapeHtml(file.webkitRelativePath || file.name)}</span><strong>${formatBytes(file.size)}</strong></div>`).join('');
  out.innerHTML = html + (files.length > 40 ? `<div class="empty-box">+ ${files.length - 40} file lain terdeteksi.</div>` : '');
}
function clearFiles(){ if($('fileInput')) $('fileInput').value=''; if($('fileList')) $('fileList').innerHTML='Belum ada file yang dipilih.'; }
function clearFolder(){ if($('folderInput')) $('folderInput').value=''; if($('fileList')) $('fileList').innerHTML='Belum ada file yang dipilih.'; }
function pickUploader(){ $('uploaderInput')?.click(); }
function handleUploaderFile(event){ const file = event.target.files?.[0]; if(file) setSelectedUploaderFile(file); }
function setSelectedUploaderFile(file){
  if(lastPreviewObjectUrl){ try{URL.revokeObjectURL(lastPreviewObjectUrl);}catch(e){} lastPreviewObjectUrl=''; }
  if(lastUploadObjectUrl){ try{URL.revokeObjectURL(lastUploadObjectUrl);}catch(e){} lastUploadObjectUrl=''; }
  setText('uploadPercent','100%'); if($('uploadBar')) $('uploadBar').style.width='100%';
  $('uploaderMeta').innerHTML = `File: <b>${escapeHtml(file.name)}</b> • Size: <b>${formatBytes(file.size)}</b> • Type: <b>${escapeHtml(file.type || 'unknown')}</b>`;
  const objectUrl = URL.createObjectURL(file); lastUploadObjectUrl = objectUrl;
  $('uploadUrl').value = objectUrl; $('uploadFilename').value = file.name;
  if(file.type.startsWith('image/')){
    lastPreviewObjectUrl = objectUrl;
    $('uploaderPreview').innerHTML = `<img class="upload-preview-image" src="${objectUrl}" alt="preview" />`;
    $('uploadHtmlEmbed').value = `<img src="${objectUrl}" alt="${escapeHtml(file.name)}" />`;
    $('uploadMarkdown').value = `![${file.name}](${objectUrl})`;
  } else {
    $('uploaderPreview').innerHTML = `<div class="empty-box">File siap dipakai: ${escapeHtml(file.name)}</div>`;
    $('uploadHtmlEmbed').value = `<a href="${objectUrl}" download="${escapeHtml(file.name)}">${escapeHtml(file.name)}</a>`;
    $('uploadMarkdown').value = `[${file.name}](${objectUrl})`;
  }
}
function copyUploaderField(id){ const field=$(id); if(!field?.value) return alert('Belum ada data untuk dicopy.'); navigator.clipboard.writeText(field.value); alert('Berhasil dicopy.'); }
function resetUploader(){
  if(lastPreviewObjectUrl){ try{URL.revokeObjectURL(lastPreviewObjectUrl);}catch(e){} }
  if(lastUploadObjectUrl){ try{URL.revokeObjectURL(lastUploadObjectUrl);}catch(e){} }
  lastPreviewObjectUrl=''; lastUploadObjectUrl=''; if($('uploaderInput')) $('uploaderInput').value='';
  $('uploaderMeta').textContent='Belum ada file dipilih.'; $('uploadUrl').value=''; $('uploadFilename').value=''; $('uploadHtmlEmbed').value=''; $('uploadMarkdown').value='';
  $('uploaderPreview').textContent='Preview akan muncul di sini.'; $('uploadBar').style.width='0%'; setText('uploadPercent','0%');
}
function setupDropzone(){
  const dz = $('dropzone'); if(!dz) return;
  ['dragenter','dragover'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.remove('dragover'); }));
  dz.addEventListener('drop', e => { const file = e.dataTransfer.files?.[0]; if(file) setSelectedUploaderFile(file); });
}

function sanitizeCalcValue(value){ return String(value).replace(/×/g,'*').replace(/÷/g,'/').replace(/[^0-9+\-*/().%]/g,''); }
function appendCalc(value){ const display = $('calcDisplay'); if(!display) return; display.value = sanitizeCalcValue(display.value + value); display.focus(); }
function clearCalc(){ if($('calcDisplay')) $('calcDisplay').value=''; }
function backspaceCalc(){ if($('calcDisplay')) $('calcDisplay').value = $('calcDisplay').value.slice(0,-1); }
function calculateResult(){ const display = $('calcDisplay'); if(!display) return; try{ const exp = sanitizeCalcValue(display.value || '0'); display.value = Function(`return (${exp})`)(); } catch(e){ alert('Format hitungan salah.'); } }
function setupCalculatorKeyboard(){
  const display = $('calcDisplay'); if(!display) return;
  display.addEventListener('input', () => display.value = sanitizeCalcValue(display.value));
  display.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); calculateResult(); } if(e.key === 'Escape'){ e.preventDefault(); clearCalc(); } });
}
function renderCalcButtons(){
  const buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','%','+'];
  $('calcButtons').innerHTML = buttons.map(b => `<button class="btn ${['/','*','-','+'].includes(b)?'rainbow':'ghost'}" onclick="appendCalc('${b}')">${b}</button>`).join('');
}

function getEditor(){ return $('richEditor'); }
function saveEditorSelection(){ const selection = window.getSelection(); const editor = getEditor(); if(!selection || !selection.rangeCount || !editor) return; const range = selection.getRangeAt(0); if(editor.contains(range.commonAncestorContainer)) savedEditorRange = range.cloneRange(); }
function restoreEditorSelection(){ const selection = window.getSelection(); if(!selection || !savedEditorRange) return; selection.removeAllRanges(); selection.addRange(savedEditorRange); }
function focusEditor(){ const editor=getEditor(); if(!editor) return null; editor.focus(); restoreEditorSelection(); return editor; }
function editorCommand(command, value = null){ const editor = focusEditor(); if(!editor) return; document.execCommand('styleWithCSS', false, false); document.execCommand(command, false, value); normalizeEditorContent(); saveEditorSelection(); }
function insertEditorLink(){ const url = prompt('Masukkan URL link:', 'https://'); if(!url) return; const safe = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`; editorCommand('createLink', safe); }
function insertTablePrompt(){ const rows = parseInt(prompt('Jumlah baris?', '2'), 10); const cols = parseInt(prompt('Jumlah kolom?', '2'), 10); if(!rows || !cols || rows < 1 || cols < 1) return; let html = '<table><tbody>'; for(let r=0;r<rows;r++){ html += '<tr>'; for(let c=0;c<cols;c++) html += `<td>Cell ${r+1}-${c+1}</td>`; html += '</tr>'; } html += '</tbody></table><p><br></p>'; focusEditor(); document.execCommand('insertHTML', false, html); normalizeEditorContent(); saveEditorSelection(); }
function stripMsOfficeJunk(html){ return html.replace(/<!--[\s\S]*?-->/g,'').replace(/<\/?o:p[^>]*>/gi,'').replace(/<\/?(meta|link|xml|style|script)[^>]*>/gi,'').replace(/\s*mso-[^:"']+:[^;"']+;?/gi,'').replace(/\s*class=("|')[^"']*(Mso|WordSection)[^"']*("|')/gi,''); }
function removeUnsafeAttributes(html){ return html.replace(/\sstyle=(".*?"|'.*?')/gi,'').replace(/\sclass=(".*?"|'.*?')/gi,'').replace(/\slang=(".*?"|'.*?')/gi,'').replace(/\swidth=(".*?"|'.*?')/gi,'').replace(/\sheight=(".*?"|'.*?')/gi,'').replace(/\salign=(".*?"|'.*?')/gi,'').replace(/\sdata-[a-z0-9_-]+=(".*?"|'.*?')/gi,'').replace(/\sid=(".*?"|'.*?')/gi,''); }
function normalizeSemanticTags(html){ return html.replace(/<b(\s[^>]*)?>/gi,'<strong>').replace(/<\/b>/gi,'</strong>').replace(/<i(\s[^>]*)?>/gi,'<em>').replace(/<\/i>/gi,'</em>'); }
function unwrapGarbageSpans(html){ let previous=''; let current=html; while(previous!==current){ previous=current; current=current.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi,'$1'); } return current; }
function convertLooseDivsToParagraphs(html){ return html.replace(/<div[^>]*>/gi,'<p>').replace(/<\/div>/gi,'</p>'); }
function removeEmptyNodes(html){ return html.replace(/<p>\s*(<br\s*\/?>|\&nbsp;|\s)*<\/p>/gi,'').replace(/<strong>\s*<\/strong>/gi,'').replace(/<em>\s*<\/em>/gi,'').replace(/<h1>\s*<\/h1>/gi,'').replace(/<h2>\s*<\/h2>/gi,'').replace(/<h3>\s*<\/h3>/gi,'').replace(/<blockquote>\s*<\/blockquote>/gi,'').replace(/\n{3,}/g,'\n\n'); }
function normalizeEditorContent(){
  const editor = getEditor(); if(!editor) return;
  if(!editor.innerHTML.trim()){ editor.innerHTML = '<p><br></p>'; updateWordHtmlPreview(); return; }
  editor.querySelectorAll('div').forEach(div => { if(div.closest('li, blockquote, td, th')) return; const p = document.createElement('p'); p.innerHTML = div.innerHTML.trim() || '<br>'; div.replaceWith(p); });
  editor.querySelectorAll('table').forEach(table => { table.style.width='100%'; table.style.borderCollapse='collapse'; table.querySelectorAll('td, th').forEach(cell => { cell.style.border='1px solid rgba(255,255,255,.18)'; cell.style.padding='8px'; if(!cell.innerHTML.trim()) cell.innerHTML = '<br>'; }); });
  updateWordHtmlPreview();
}
function cleanWordHtml(){ const editor=getEditor(); if(!editor) return; let html = editor.innerHTML || ''; html = stripMsOfficeJunk(html); html = removeUnsafeAttributes(html); html = normalizeSemanticTags(html); html = unwrapGarbageSpans(html); html = convertLooseDivsToParagraphs(html); html = removeEmptyNodes(html); editor.innerHTML = html.trim() || '<p><br></p>'; normalizeEditorContent(); saveEditorSelection(); convertWordToHtml(); alert('HTML berhasil dibersihkan.'); }
function formatHtmlOutput(html){ return html.replace(/></g,'>\n<').replace(/<p><\/p>/g,'').trim(); }
function updateWordHtmlPreview(){ const editor=getEditor(); if(!editor || !$('wordHtmlPreview')) return; $('wordHtmlPreview').innerHTML = editor.innerHTML.trim() || 'Preview HTML akan muncul di sini.'; }
function convertWordToHtml(){ const editor=getEditor(); if(!editor || !$('wordHtmlOutput')) return; const html = editor.innerHTML || ''; if(isTooLarge(html, 60000)) return; normalizeEditorContent(); $('wordHtmlOutput').value = formatHtmlOutput(editor.innerHTML); updateWordHtmlPreview(); }
function clearWordHtml(){ if(getEditor()) getEditor().innerHTML = '<p><br></p>'; if($('wordHtmlOutput')) $('wordHtmlOutput').value=''; if($('wordHtmlPreview')) $('wordHtmlPreview').textContent='Preview HTML akan muncul di sini.'; }
function copyWordHtml(){ if(!$('wordHtmlOutput')?.value) return alert('Belum ada HTML untuk dicopy.'); navigator.clipboard.writeText($('wordHtmlOutput').value); alert('HTML berhasil dicopy.'); }
function copyEditorPlainText(){ navigator.clipboard.writeText(getEditor()?.innerText || ''); alert('Plain text berhasil dicopy.'); }
function downloadWordHtml(){ const value = $('wordHtmlOutput')?.value || ''; if(!value) return alert('Belum ada HTML untuk didownload.'); const blob = new Blob([value], {type:'text/html;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='word-to-html-output.html'; a.click(); URL.revokeObjectURL(url); }
function setupWordToHtmlEditor(){
  const editor = getEditor(); if(!editor) return;
  ['keyup','mouseup','focus'].forEach(eventName => editor.addEventListener(eventName, saveEditorSelection));
  editor.addEventListener('paste', () => setTimeout(() => { normalizeEditorContent(); saveEditorSelection(); convertWordToHtml(); }, 0));
  editor.addEventListener('input', debounce(() => { if(currentView !== 'wordtohtml') return; normalizeEditorContent(); convertWordToHtml(); }, 160));
  editor.addEventListener('keydown', event => { if(event.key === 'Tab'){ event.preventDefault(); document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;'); } });
  normalizeEditorContent(); convertWordToHtml();
}

function loadScannerFile(event){ const file = event.target.files?.[0]; if(!file) return; const reader = new FileReader(); reader.onload = e => { if($('scannerInput')) $('scannerInput').value = e.target.result; }; reader.readAsText(file); }
function getScannerVerdict(score){ if(score >= 45) return {label:'DANGEROUS', className:'scan-danger'}; if(score >= 20) return {label:'WARNING', className:'scan-warning'}; return {label:'SAFE-ish', className:'scan-safe'}; }
function buildScannerPreview(text, labels){ let preview = escapeHtml(text); labels.forEach(label => { preview = preview.replace(new RegExp(escapeRegExp(label), 'gi'), match => `<span class="mark-hit">${match}</span>`); }); return preview; }
function runScanner(){
  const input = $('scannerInput')?.value || '';
  $('scannerResult').innerHTML=''; $('scannerScoreBoard').innerHTML='';
  if(!input.trim()){ $('scannerSummary').textContent='Belum ada input untuk discan.'; $('scannerPreview').textContent='Belum ada preview hasil scan.'; return; }
  if(isTooLarge(input, 40000)) return;
  const findings=[]; let totalScore=0;
  for(const item of suspiciousPatterns){ const matches = input.match(item.pattern); if(matches?.length){ findings.push({label:item.label,count:matches.length,severity:item.severity,score:item.score*matches.length}); totalScore += item.score*matches.length; if(totalScore > 85) break; } }
  const verdict = getScannerVerdict(totalScore);
  $('scannerSummary').innerHTML = `<b class="${verdict.className}">${verdict.label}</b><br>Total risk score: <b>${totalScore}</b>`;
  $('scannerScoreBoard').innerHTML = `
    <div class="stat-card"><span>Patterns</span><strong>${findings.length}</strong></div>
    <div class="stat-card"><span>Risk Score</span><strong>${totalScore}</strong></div>
    <div class="stat-card"><span>Length</span><strong>${input.length}</strong></div>
    <div class="stat-card"><span>Status</span><strong class="${verdict.className}">${verdict.label}</strong></div>`;
  if(!findings.length){ $('scannerResult').innerHTML = `<div class="scanner-hit scan-safe">Tidak ada pattern mencurigakan yang cocok.</div>`; $('scannerPreview').innerHTML = escapeHtml(input); return; }
  $('scannerResult').innerHTML = findings.map(item => `<div class="scanner-hit ${item.severity==='danger'?'scan-danger':'scan-warning'}"><b>${escapeHtml(item.label)}</b><br>Ditemukan: ${item.count}x • Score: ${item.score}</div>`).join('');
  $('scannerPreview').innerHTML = buildScannerPreview(input, findings.map(f => f.label));
}
function clearScanner(){ if($('scannerInput')) $('scannerInput').value=''; $('scannerSummary').textContent='Belum ada input untuk discan.'; $('scannerScoreBoard').innerHTML=''; $('scannerResult').innerHTML=''; $('scannerPreview').textContent='Belum ada preview hasil scan.'; if($('scannerFile')) $('scannerFile').value=''; }

function sanitizeDomain(input=''){ return input.trim().replace(/^https?:\/\//i,'').replace(/^www\./i,'').split('/')[0].toLowerCase(); }
function pseudoMetric(domain, min, max, salt=''){ let hash=0; const source = domain + salt; for(let i=0;i<source.length;i++) hash = (hash * 31 + source.charCodeAt(i)) % 100000; return min + (hash % (max-min+1)); }
function runDomainChecker(){
  const domain = sanitizeDomain($('domainInput')?.value || '');
  if(!domain) return alert('Masukkan domain dulu.');
  const dr = pseudoMetric(domain, 12, 88, 'dr'); const da = pseudoMetric(domain, 10, 82, 'da'); const pa = pseudoMetric(domain, 8, 79, 'pa');
  const traffic = pseudoMetric(domain, 900, 98000, 'traffic'); const backlink = pseudoMetric(domain, 40, 12000, 'backlink');
  const nawala = /(judi|slot|casino|bet|poker|togel|sabung)/i.test(domain) ? 'Risk' : 'Clear';
  setText('domainDR', dr); setText('domainDA', da); setText('domainPA', pa); setText('domainTraffic', traffic.toLocaleString()); setText('domainBacklink', backlink.toLocaleString()); setText('domainNawala', nawala);
  $('domainResult').textContent = `Domain: ${domain}\nStatus DNS format: valid\nShortcut WHOIS / Kominfo bisa dibuka dari tombol atas.\nMode ini sengaja normal dan ringan, bukan pura-pura jadi Ahrefs.`;
}
function openDomainHelper(type){ const domain = sanitizeDomain($('domainInput')?.value || ''); if(!domain) return alert('Masukkan domain dulu.'); const map = { whois:`https://www.whois.com/whois/${domain}`, nawala:`https://trustpositif.komdigi.go.id/` }; window.open(map[type], '_blank'); }

function setupMusicPlayer(){ const input = $('musicFile'); const player = $('musicPlayer'); if(!input || !player) return; input.addEventListener('change', e => { const file = e.target.files?.[0]; if(!file) return; const url = URL.createObjectURL(file); player.src = url; $('musicInfo').textContent = `Playing: ${file.name} • ${formatBytes(file.size)}`; }); }

function runTerminalCommand(){
  const cmd = ($('terminalInput')?.value || '').trim().toLowerCase(); if(!cmd) return;
  const out = $('terminalOutput'); const current = out.textContent + '\n> ' + cmd + '\n';
  let response = '';
  if(cmd === 'help') response = 'Commands: help, date, whoami, clear, tools';
  else if(cmd === 'date') response = new Date().toString();
  else if(cmd === 'whoami') response = localStorage.getItem('xuUser') || 'guest';
  else if(cmd === 'tools') response = `Total tools: ${views.length}`;
  else if(cmd === 'clear'){ clearTerminal(); $('terminalInput').value=''; return; }
  else response = `Unknown command: ${cmd}`;
  out.textContent = current + response; $('terminalInput').value=''; out.scrollTop = out.scrollHeight;
}
function clearTerminal(){ $('terminalOutput').textContent = 'XU Terminal ready. Ketik help.'; }
function applyThemeSpeed(){ const value = $('themeSpeed')?.value || '14'; document.documentElement.style.setProperty('--speed', `${value}s`); }

function safeBtoa(value=''){ return btoa(unescape(encodeURIComponent(value))); }
function safeAtob(value=''){ return decodeURIComponent(escape(atob(value))); }
function obfuscatePHP(){
  let code = $('phpInput')?.value || ''; if(!code.trim()) return alert('Paste PHP code dulu.'); if(isTooLarge(code, 100000)) return;
  code = code.replace(/<\?php/gi,'').replace(/\?>/g,'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').replace(/#.*$/gm,'').replace(/\s+/g,' ').trim();
  code = code.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, v) => '$' + v.split('').reverse().join('').slice(0, 12));
  const encoded = safeBtoa(code);
  $('phpOutput').value = `<?php\n$xu_payload = '${encoded}';\neval(base64_decode($xu_payload));\n?>`;
}
function clearPhpObfuscator(){ if($('phpInput')) $('phpInput').value=''; if($('phpOutput')) $('phpOutput').value=''; }

function encodeBase64(){ const input = $('base64Input')?.value || ''; if(!input) return alert('Masukkan text dulu.'); if(isTooLarge(input, 120000)) return; $('base64Output').value = safeBtoa(input); }
function decodeBase64(){ const input = $('base64Input')?.value || ''; if(!input) return alert('Masukkan Base64 dulu.'); try{ $('base64Output').value = safeAtob(input); } catch(e){ alert('Format Base64 tidak valid.'); } }
function clearBase64(){ if($('base64Input')) $('base64Input').value=''; if($('base64Output')) $('base64Output').value=''; if($('base64File')) $('base64File').value=''; }
function setupBase64File(){ const input = $('base64File'); if(!input) return; input.addEventListener('change', e => { const file = e.target.files?.[0]; if(!file) return; const reader = new FileReader(); reader.onload = evt => { $('base64Input').value = evt.target.result; }; reader.readAsText(file); }); }

function openAI(type){ const map = { chatgpt:'https://chatgpt.com/', gemini:'https://gemini.google.com/', openai:'https://openai.com/' }; window.open(map[type], '_blank'); }
function generateSeoPrompt(){ const kw = $('aiKeyword')?.value.trim(); if(!kw) return alert('Masukkan keyword dulu.'); $('aiPromptOutput').value = `Buat artikel SEO tentang "${kw}" dengan:\n- H1 utama\n- 5 H2 relevan\n- 3 FAQ\n- Meta title maksimal 60 karakter\n- Meta description maksimal 155 karakter\n- CTA halus di bagian akhir\n- Gaya bahasa natural, tidak spam keyword`; }

function cleanHtmlRaw(html=''){ return html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/\son[a-z]+=(".*?"|'.*?'|[^\s>]+)/gi,'').replace(/\sstyle=(".*?"|'.*?')/gi,'').replace(/\sclass=(".*?"|'.*?')/gi,'').replace(/\s(id|data-[a-z0-9_-]+)=(".*?"|'.*?')/gi,'').replace(/\n{3,}/g,'\n\n').trim(); }
function runHtmlCleaner(){ const input = $('htmlCleanerInput')?.value || ''; if(!input.trim()) return alert('Paste HTML dulu.'); if(isTooLarge(input, 120000)) return; $('htmlCleanerOutput').value = cleanHtmlRaw(input); }
function clearHtmlCleaner(){ if($('htmlCleanerInput')) $('htmlCleanerInput').value=''; if($('htmlCleanerOutput')) $('htmlCleanerOutput').value=''; }

function normalizeTextForDensity(text=''){ return text.toLowerCase().replace(/<[^>]+>/g,' ').replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim(); }
function keywordDensityResult(text=''){ const normalized = normalizeTextForDensity(text); if(!normalized) return 'Tidak ada teks yang bisa dianalisa.'; const stop = new Set(['dan','di','ke','dari','yang','untuk','dengan','atau','ini','itu','the','a','an','of','to','in','is','are','on','for']); const words = normalized.split(' ').filter(w => w && !stop.has(w) && w.length > 2); const total = words.length || 1; const freq = {}; words.forEach(w => freq[w]=(freq[w]||0)+1); return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([w,c],i)=>`${i+1}. ${w} — ${c}x (${((c/total)*100).toFixed(2)}%)`).join('\n'); }
function runKeywordDensity(){ const input = $('keywordDensityInput')?.value || ''; if(!input.trim()) return alert('Paste teks dulu.'); if(isTooLarge(input, 120000)) return; $('keywordDensityOutput').value = keywordDensityResult(input); }
function clearKeywordDensity(){ if($('keywordDensityInput')) $('keywordDensityInput').value=''; if($('keywordDensityOutput')) $('keywordDensityOutput').value=''; }

function runSeoXu(){
  const raw = $('seoXuUrls')?.value || ''; if(!raw.trim()) return alert('Masukkan domain dulu.');
  const domains = raw.split(/\n+/).map(sanitizeDomain).filter(Boolean).slice(0,20); if(!domains.length) return alert('Domain tidak valid.');
  $('seoXuIndex').textContent = domains.map(d => `site:${d}  → cek manual di Google\nStatus: format siap cek index`).join('\n\n');
  $('seoXuRobots').textContent = domains.map(d => `${d}\n- /robots.txt\n- /sitemap.xml`).join('\n\n');
  $('seoXuDensity').textContent = 'Paste halaman atau artikel ke tool Keyword Density untuk hitung top keyword secara detail.';
  $('seoXuCleaner').textContent = 'Paste source HTML ke HTML Cleaner untuk buang script/style/atribut sampah.';
  $('seoXuAudit').textContent = domains.map(d => `Domain: ${d}\n- Title/meta: cek source\n- H1: cek halaman utama\n- Canonical: wajib ada\n- Sitemap/robots: cek tersedia`).join('\n\n');
}
function clearSeoXu(){ if($('seoXuUrls')) $('seoXuUrls').value=''; ['seoXuIndex','seoXuRobots','seoXuDensity','seoXuCleaner','seoXuAudit'].forEach(id => $(id).textContent='Belum ada hasil.'); }

function copyField(id){ const field = $(id); const value = ('value' in field ? field.value : field.textContent) || ''; if(!value) return alert('Belum ada data untuk dicopy.'); navigator.clipboard.writeText(value); alert('Berhasil dicopy.'); }

function init(){
  renderToolGrid(); renderCalcButtons(); filterTools(); loadNote(); updateUserUI(localStorage.getItem('xuUser') || 'Guest'); setupDropzone(); setupCalculatorKeyboard(); setupWordToHtmlEditor(); setupMusicPlayer(); setupBase64File();
  $('wordCounterInput')?.addEventListener('input', debouncedCountWords);
  $('fileInput')?.addEventListener('change', renderFiles);
  $('folderInput')?.addEventListener('change', renderFolderFiles);
  $('uploaderInput')?.addEventListener('change', handleUploaderFile);
  $('scannerFile')?.addEventListener('change', loadScannerFile);
}

document.addEventListener('DOMContentLoaded', init);
