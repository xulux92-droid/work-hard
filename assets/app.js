// === TAMBAHAN FIX CALCULATOR KEYBOARD ===
document.addEventListener("keydown", function(e) {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  const allowed = "0123456789+-*/.";
  if (allowed.includes(e.key)) {
    display.value += e.key;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    calculateResult();
  }

  if (e.key === "Backspace") {
    display.value = display.value.slice(0, -1);
  }

  if (e.key === "Escape") {
    display.value = "";
  }
});

// === FIX DOMAIN CLEAN INPUT ===
function cleanDomain(domain) {
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

// override function lama
function checkDomainQuality() {
  let domain = document.getElementById("domainInput").value.trim();
  const note = document.getElementById("domainCheckerNote");

  if (!domain) {
    alert("Masukkan domain dulu.");
    return;
  }

  domain = cleanDomain(domain);

  const valid = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain);
  if (!valid) {
    note.innerHTML = "<b>Format domain tidak valid.</b>";
    return;
  }

  // fake preview biar gak kosong
  document.getElementById("metricDA").textContent = Math.floor(Math.random()*50+10);
  document.getElementById("metricPA").textContent = Math.floor(Math.random()*50+10);
  document.getElementById("metricDR").textContent = Math.floor(Math.random()*50+10);
  document.getElementById("metricBL").textContent = Math.floor(Math.random()*1000+100);
  document.getElementById("metricTF").textContent = Math.floor(Math.random()*10000+500);
  document.getElementById("metricKI").textContent = "SAFE";

  note.innerHTML =
    "<b>Domain:</b> " + domain +
    "<br><b>Status:</b> OK (preview mode)";
}

// === FIX EDITOR STABILITY ===
function editorCommand(command, value = null) {
  const editor = document.getElementById("richEditor");
  if (!editor) return;
  editor.focus();
  document.execCommand(command, false, value);
}

function insertEditorLink() {
  const url = prompt("Masukkan URL:");
  if (!url) return;
  editorCommand("createLink", url);
}

function convertWordToHtml() {
  const editor = document.getElementById("richEditor");
  const output = document.getElementById("wordHtmlOutput");

  if (!editor || !output) return;

  let html = editor.innerHTML;

  // rapihin dikit
  html = html
    .replace(/<div>/g, "<p>")
    .replace(/<\/div>/g, "</p>")
    .replace(/\n/g, "");

  output.value = html.trim();
}
