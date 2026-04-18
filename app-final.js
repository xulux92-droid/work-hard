// ================= CORE =================
let currentView = "dashboard";

function showView(v) {
  currentView = v;
  document.querySelectorAll(".view").forEach(el => el.classList.remove("active"));
  document.getElementById("view-" + v)?.classList.add("active");
}

function debounce(fn, d=300){
  let t; return (...a)=>{clearTimeout(t); t=setTimeout(()=>fn(...a),d);}
}

function limit(text, max=30000){
  if((text||"").length>max){
    alert("Input terlalu besar"); return true;
  }
  return false;
}

// ================= BASE64 =================
function encodeBase64(){
  let v = document.getElementById("base64Input").value;
  if(limit(v)) return;
  document.getElementById("base64Output").value = btoa(v);
}

function decodeBase64(){
  let v = document.getElementById("base64Input").value;
  try{
    document.getElementById("base64Output").value = atob(v);
  }catch{
    alert("Base64 salah");
  }
}

// ================= PHP OBFUS =================
function obfuscatePHP(){
  let code = document.getElementById("phpInput").value;
  if(limit(code,50000)) return;

  code = code.replace(/\s+/g," ");
  code = code.replace(/\$([a-zA-Z]+)/g,(_,v)=>"$"+btoa(v).slice(0,5));
  let encoded = btoa(code);

  document.getElementById("phpOutput").value =
    `<?php eval(base64_decode('${encoded}')); ?>`;
}

// ================= HTML CLEANER =================
function cleanHTML(){
  let html = document.getElementById("htmlInput").value;
  html = html.replace(/<script.*?>.*?<\/script>/gi,"");
  html = html.replace(/style=".*?"/gi,"");
  document.getElementById("htmlOutput").value = html;
}

// ================= KEYWORD =================
function keywordDensity(){
  let text = document.getElementById("kwInput").value.toLowerCase();
  if(limit(text)) return;

  let words = text.split(/\s+/);
  let map = {};

  words.forEach(w=>{
    if(!w) return;
    map[w]=(map[w]||0)+1;
  });

  let result = Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10)
    .map(([k,v])=>`${k}: ${(v/words.length*100).toFixed(2)}%`)
    .join("\n");

  document.getElementById("kwOutput").value = result;
}

// ================= SEO-XU =================
function seoCheck(){
  let url = document.getElementById("seoUrl").value;
  document.getElementById("seoResult").innerText =
`INDEX: site:${url}
ROBOTS: ${url}/robots.txt
SITEMAP: ${url}/sitemap.xml`;
}

// ================= AI =================
function openAI(type){
  const links = {
    chatgpt:"https://chat.openai.com",
    gemini:"https://gemini.google.com"
  };
  window.open(links[type],"_blank");
}

// ================= SCANNER =================
function scanText(){
  if(currentView!=="scanner") return;

  let t = document.getElementById("scanInput").value;
  if(limit(t)) return;

  let score=0;
  if(/eval\(/i.test(t)) score+=20;
  if(/base64_decode/i.test(t)) score+=15;
  if(/exec\(/i.test(t)) score+=20;

  document.getElementById("scanOutput").innerText =
    "Score: "+score;
}

// ================= CALCULATOR =================
function calc(v){
  const el=document.getElementById("calc");
  if(v==="="){
    try{el.value=eval(el.value)}catch{alert("Error")}
  }else{
    el.value+=v;
  }
}

// ================= WORD COUNTER =================
const countDebounce = debounce(()=>{
  let t=document.getElementById("wc").value;
  document.getElementById("wcOut").innerText =
    "Words: "+(t.trim().split(/\s+/).length);
},200);

// ================= AI PROMPT =================
function generateSEO(){
  let kw=document.getElementById("aiKw").value;
  document.getElementById("aiOut").value =
    `Artikel SEO tentang ${kw} dengan H1 H2 H3`;
}