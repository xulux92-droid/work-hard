
const SAVE_KEY = "crimson_anime_mmorpg_lite_v1";
let currentView = "town";
let currentEnemy = null;
let isMuted = false;
let audioStarted = false;

const classPresets = {
  Warrior: { atk: 10, def: 8, maxHp: 115, crit: 8, skillPower: 16 },
  Mage: { atk: 13, def: 4, maxHp: 88, crit: 12, skillPower: 24 },
  Assassin: { atk: 11, def: 5, maxHp: 96, crit: 18, skillPower: 20 }
};

const shopItems = [
  { id: "potion", name: "Potion", type: "consumable", price: 25, effect: { heal: 35 }, desc: "Pulihkan HP saat battle." },
  { id: "hi_potion", name: "Hi-Potion", type: "consumable", price: 70, effect: { heal: 80 }, desc: "Heal lebih besar. Dompet menangis sedikit." },
  { id: "scarlet_blade", name: "Scarlet Blade", type: "weapon", price: 120, bonus: { atk: 6 }, desc: "Pedang merah menyala penuh drama." },
  { id: "moon_staff", name: "Moon Staff", type: "weapon", price: 120, bonus: { atk: 7 }, desc: "Tongkat penyihir untuk ledakan damage." },
  { id: "shadow_dagger", name: "Shadow Dagger", type: "weapon", price: 120, bonus: { atk: 5, crit: 6 }, desc: "Cocok untuk pembunuh berkelas." },
  { id: "ruby_armor", name: "Ruby Armor", type: "armor", price: 130, bonus: { def: 5, maxHp: 20 }, desc: "Armor glamor, luka sedikit lebih sopan." },
  { id: "lucky_charm", name: "Lucky Charm", type: "charm", price: 95, bonus: { crit: 5 }, desc: "Sedikit keberuntungan palsu tapi berguna." }
];

const skills = [
  { id: "iron_skin", name: "Iron Skin", cost: 1, max: 5, desc: "+2 DEF per level", apply: (s, lvl) => s.def += lvl * 2 },
  { id: "berserk", name: "Berserk", cost: 1, max: 5, desc: "+3 ATK per level", apply: (s, lvl) => s.atk += lvl * 3 },
  { id: "vital_bloom", name: "Vital Bloom", cost: 1, max: 5, desc: "+12 Max HP per level", apply: (s, lvl) => s.maxHp += lvl * 12 },
  { id: "killer_instinct", name: "Killer Instinct", cost: 1, max: 5, desc: "+3% Crit per level", apply: (s, lvl) => s.crit += lvl * 3 }
];

const questsMaster = [
  { id: "slime_hunt", title: "Slime Cleanup", need: { kills: 3, target: "Slime" }, reward: { gold: 45, exp: 45 }, desc: "Bersihkan slime yang ganggu alun-alun." },
  { id: "wolf_hunt", title: "Night Wolf Patrol", need: { kills: 2, target: "Night Wolf" }, reward: { gold: 60, exp: 65, item: "Potion" }, desc: "Serigala liar mulai terlalu berani." },
  { id: "shadow_core", title: "Shadow Rift Probe", need: { dungeonRuns: 1 }, reward: { gold: 90, exp: 110 }, desc: "Masuk dungeon dan pulang hidup-hidup." },
  { id: "goblin_hunt", title: "Goblin Crusher", need: { kills: 2, target: "Goblin" }, reward: { gold: 75, exp: 80 }, desc: "Goblin kampungan makin meresahkan." }
];

const enemiesMaster = [
  { name: "Slime", avatar: "🟢", hp: 42, atk: 8, def: 2, gold: 18, exp: 20 },
  { name: "Night Wolf", avatar: "🐺", hp: 58, atk: 11, def: 3, gold: 24, exp: 28 },
  { name: "Goblin", avatar: "👺", hp: 72, atk: 14, def: 5, gold: 35, exp: 36 },
  { name: "Crimson Bat", avatar: "🦇", hp: 55, atk: 12, def: 4, gold: 26, exp: 29 },
  { name: "Shadow Knight", avatar: "🛡️", hp: 95, atk: 18, def: 8, gold: 55, exp: 58 }
];

const npcData = [
  { name: "Airi", role: "Quest Master", text: "Quest baru selalu ada. Sayangnya kerja juga begitu.", btn: "Buka Quest", view: "quests" },
  { name: "Rena", role: "Merchant", text: "Beli potion dulu sebelum sok jago masuk dungeon.", btn: "Buka Shop", view: "shop" },
  { name: "Kuro", role: "Dungeon Guard", text: "Shadow Rift lapar korban. Semoga bukan lo.", btn: "Masuk Dungeon", view: "dungeon" },
  { name: "Mika", role: "Skill Tutor", text: "Skill point itu investasi. Gunakan lebih baik dari gaji bulanan.", btn: "Upgrade Skills", view: "skills" }
];

function defaultState() {
  return {
    created: false,
    hero: {
      name: "",
      className: "Warrior",
      avatar: "🌸",
      level: 1,
      exp: 0,
      nextExp: 100,
      gold: 120,
      skillPoints: 0,
      stats: { atk: 10, def: 8, maxHp: 115, hp: 115, crit: 8, skillPower: 16 },
      equipment: { weapon: null, armor: null, charm: null },
      inventory: [{ name: "Potion", qty: 3, type: "consumable", effect: { heal: 35 } }]
    },
    quests: questsMaster.map(q => ({ ...structuredClone(q), accepted: false, done: false, progress: 0 })),
    journal: ["Selamat datang di Crimson Sakura City."],
    dungeonRuns: 0
  };
}

let state = loadState();

function structuredClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  toast("Game saved.");
}

function resetState() {
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  currentEnemy = null;
  logJournal("Save di-reset. Kadang mulai ulang memang lebih waras.");
  renderAll();
  updateCreatorVisibility();
}

function toast(msg) {
  logBattle(`[SYSTEM] ${msg}`);
}

function showView(view) {
  currentView = view;
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${view}`)?.classList.add("active");
}

function updateCreatorVisibility() {
  document.getElementById("creatorPanel").style.display = state.created ? "none" : "block";
}

function createHero() {
  const name = document.getElementById("heroNameInput").value.trim() || "XuHero";
  const className = document.getElementById("heroClassInput").value;
  const avatar = document.getElementById("heroAvatarInput").value;
  const preset = structuredClone(classPresets[className]);

  state = defaultState();
  state.created = true;
  state.hero.name = name;
  state.hero.className = className;
  state.hero.avatar = avatar;
  state.hero.stats = { ...preset, hp: preset.maxHp };
  state.hero.gold = 120;
  state.hero.inventory = [
    { name: "Potion", qty: 3, type: "consumable", effect: { heal: 35 } }
  ];
  logJournal(`Hero ${name} the ${className} memulai petualangan.`);
  saveState();
  renderAll();
  updateCreatorVisibility();
  startMusicSafe();
}

function getHeroComputedStats() {
  const base = structuredClone(state.hero.stats);
  const gear = state.hero.equipment || {};
  const computed = {
    atk: base.atk,
    def: base.def,
    maxHp: base.maxHp,
    hp: base.hp,
    crit: base.crit,
    skillPower: base.skillPower
  };

  Object.values(gear).forEach(item => {
    if (item?.bonus) {
      if (item.bonus.atk) computed.atk += item.bonus.atk;
      if (item.bonus.def) computed.def += item.bonus.def;
      if (item.bonus.maxHp) computed.maxHp += item.bonus.maxHp;
      if (item.bonus.crit) computed.crit += item.bonus.crit;
    }
  });

  skills.forEach(skill => {
    const lvl = state.hero[skill.id] || 0;
    if (lvl > 0) skill.apply(computed, lvl);
  });

  computed.hp = Math.min(computed.hp, computed.maxHp);
  return computed;
}

function syncHeroStats(computed) {
  state.hero.stats.hp = Math.min(state.hero.stats.hp, computed.maxHp);
}

function expToLevelUp() {
  while (state.hero.exp >= state.hero.nextExp) {
    state.hero.exp -= state.hero.nextExp;
    state.hero.level += 1;
    state.hero.skillPoints += 1;
    state.hero.nextExp = Math.floor(state.hero.nextExp * 1.22);
    state.hero.stats.maxHp += 12;
    state.hero.stats.atk += 2;
    state.hero.stats.def += 1;
    state.hero.stats.crit += 1;
    state.hero.stats.hp = state.hero.stats.maxHp;
    logJournal(`Level up! ${state.hero.name} sekarang level ${state.hero.level}.`);
    logBattle(`[LEVEL UP] ${state.hero.name} mencapai level ${state.hero.level}!`);
    playSfx("level");
  }
}

function addInventoryItem(itemName, qty = 1) {
  const found = state.hero.inventory.find(i => i.name === itemName);
  if (found) found.qty += qty;
  else {
    const fromShop = shopItems.find(i => i.name === itemName);
    if (fromShop) state.hero.inventory.push({ name: fromShop.name, qty, type: fromShop.type, effect: fromShop.effect, bonus: fromShop.bonus });
    else state.hero.inventory.push({ name: itemName, qty, type: "material" });
  }
}

function consumeItem(name) {
  const item = state.hero.inventory.find(i => i.name === name && i.qty > 0);
  if (!item) return false;
  item.qty -= 1;
  if (item.qty <= 0) {
    state.hero.inventory = state.hero.inventory.filter(i => !(i.name === name && i.qty <= 0));
  }
  return item;
}

function renderHeroStats() {
  const stats = getHeroComputedStats();
  syncHeroStats(stats);
  document.getElementById("heroStats").innerHTML = `
    <div class="mini-card"><div class="label">Hero</div><div class="value">${escapeHtml(state.hero.name || "Unknown")}</div></div>
    <div class="mini-card"><div class="label">Class</div><div class="value">${escapeHtml(state.hero.className)}</div></div>
    <div class="mini-card"><div class="label">Level</div><div class="value">${state.hero.level}</div></div>
    <div class="mini-card"><div class="label">Gold</div><div class="value">${state.hero.gold}</div></div>
    <div class="mini-card"><div class="label">HP</div><div class="value">${state.hero.stats.hp}/${stats.maxHp}</div></div>
    <div class="mini-card"><div class="label">Skill Points</div><div class="value">${state.hero.skillPoints}</div></div>
  `;

  document.getElementById("quickInfo").innerHTML = `
    <div class="stat-line"><span>ATK</span><strong>${stats.atk}</strong></div>
    <div class="stat-line"><span>DEF</span><strong>${stats.def}</strong></div>
    <div class="stat-line"><span>CRIT</span><strong>${stats.crit}%</strong></div>
    <div class="stat-line"><span>EXP</span><strong>${state.hero.exp}/${state.hero.nextExp}</strong></div>
  `;

  document.getElementById("battlePlayerName").textContent = `${state.hero.avatar} ${state.hero.name}`;
  document.getElementById("playerBattleStats").innerHTML = `ATK ${stats.atk} • DEF ${stats.def} • CRIT ${stats.crit}%`;
  updateBars();
}

function renderNPCs() {
  document.getElementById("npcGrid").innerHTML = npcData.map(npc => `
    <div class="npc-card">
      <div class="item-meta"><span class="badge">${escapeHtml(npc.role)}</span></div>
      <h4>${escapeHtml(npc.name)}</h4>
      <p>${escapeHtml(npc.text)}</p>
      <button class="rainbow-btn" onclick="showView('${npc.view}')">${escapeHtml(npc.btn)}</button>
    </div>
  `).join("");
}

function renderQuests() {
  document.getElementById("questGrid").innerHTML = state.quests.map(q => `
    <div class="quest-card">
      <div class="quest-meta">
        <span class="badge">${q.done ? "Done" : q.accepted ? "Accepted" : "Available"}</span>
        <span class="badge">Reward ${q.reward.gold}g / ${q.reward.exp}xp</span>
      </div>
      <h4>${escapeHtml(q.title)}</h4>
      <p>${escapeHtml(q.desc)}</p>
      <p><strong>Progress:</strong> ${questProgressText(q)}</p>
      <button class="${q.done ? "ghost-btn" : "rainbow-btn"}" ${q.done ? "disabled" : ""} onclick="${q.accepted ? `claimQuest('${q.id}')` : `acceptQuest('${q.id}')`}">
        ${q.accepted ? (q.done ? "Claimed" : "Check / Claim") : "Accept Quest"}
      </button>
    </div>
  `).join("");
}

function questProgressText(q) {
  if (q.need.kills) return `${q.progress}/${q.need.kills} ${q.need.target}`;
  if (q.need.dungeonRuns) return `${q.progress}/${q.need.dungeonRuns} Dungeon Run`;
  return `${q.progress}`;
}

function acceptQuest(id) {
  const q = state.quests.find(x => x.id === id);
  if (!q || q.accepted) return;
  q.accepted = true;
  logJournal(`Quest accepted: ${q.title}.`);
  saveState();
  renderQuests();
}

function claimQuest(id) {
  const q = state.quests.find(x => x.id === id);
  if (!q || !q.accepted) return;

  const done = isQuestComplete(q);
  if (!done) {
    toast("Quest belum selesai.");
    return;
  }

  state.hero.gold += q.reward.gold;
  state.hero.exp += q.reward.exp;
  if (q.reward.item) addInventoryItem(q.reward.item, 1);
  q.done = true;
  q.accepted = false;
  q.progress = 0;
  expToLevelUp();
  logJournal(`Quest selesai: ${q.title}. Reward didapat.`);
  playSfx("coin");
  saveState();
  renderAll();
}

function isQuestComplete(q) {
  if (q.need.kills) return q.progress >= q.need.kills;
  if (q.need.dungeonRuns) return q.progress >= q.need.dungeonRuns;
  return false;
}

function updateQuestProgress(enemyName, dungeonRunComplete = false) {
  state.quests.forEach(q => {
    if (!q.done && q.accepted) {
      if (q.need.kills && q.need.target === enemyName) q.progress += 1;
      if (q.need.dungeonRuns && dungeonRunComplete) q.progress += 1;
    }
  });
}

function randomEnemy(multiplier = 1) {
  const base = structuredClone(enemiesMaster[Math.floor(Math.random() * enemiesMaster.length)]);
  base.hp = Math.floor(base.hp * multiplier);
  base.maxHp = base.hp;
  base.atk = Math.floor(base.atk * multiplier);
  base.def = Math.floor(base.def * multiplier);
  base.gold = Math.floor(base.gold * multiplier);
  base.exp = Math.floor(base.exp * multiplier);
  return base;
}

function spawnEnemy(multiplier = 1) {
  currentEnemy = randomEnemy(multiplier);
  document.getElementById("enemyAvatar").textContent = currentEnemy.avatar;
  document.getElementById("enemyName").textContent = currentEnemy.name;
  document.getElementById("enemyBattleStats").textContent = `ATK ${currentEnemy.atk} • DEF ${currentEnemy.def}`;
  updateBars();
  logBattle(`Enemy muncul: ${currentEnemy.name}!`);
}

function updateBars() {
  const heroStats = getHeroComputedStats();
  document.getElementById("playerHpBar").style.width = `${Math.max(0, state.hero.stats.hp / heroStats.maxHp * 100)}%`;
  if (currentEnemy) {
    document.getElementById("enemyHpBar").style.width = `${Math.max(0, currentEnemy.hp / currentEnemy.maxHp * 100)}%`;
    document.getElementById("enemyName").textContent = currentEnemy.name;
  } else {
    document.getElementById("enemyHpBar").style.width = `0%`;
    document.getElementById("enemyName").textContent = `No Enemy`;
    document.getElementById("enemyBattleStats").textContent = `Find an enemy first.`;
  }
  document.getElementById("playerBattleStats").innerHTML = `ATK ${heroStats.atk} • DEF ${heroStats.def} • CRIT ${heroStats.crit}% • HP ${state.hero.stats.hp}/${heroStats.maxHp}`;
}

function calcDamage(attackerAtk, defenderDef) {
  return Math.max(1, attackerAtk - Math.floor(defenderDef * 0.55) + rand(0, 5));
}

function attackEnemy() {
  if (!ensureBattleReady()) return;
  const stats = getHeroComputedStats();
  let damage = calcDamage(stats.atk, currentEnemy.def);
  if (rand(1, 100) <= stats.crit) {
    damage = Math.floor(damage * 1.8);
    logBattle(`✨ Critical hit!`);
  }
  currentEnemy.hp -= damage;
  logBattle(`${state.hero.name} menyerang ${currentEnemy.name} dan memberi ${damage} damage.`);
  playSfx("hit");
  if (currentEnemy.hp <= 0) {
    winBattle();
    return;
  }
  enemyTurn();
  updateBars();
  saveState();
}

function useSkillAttack() {
  if (!ensureBattleReady()) return;
  const stats = getHeroComputedStats();
  const damage = calcDamage(stats.atk + stats.skillPower, currentEnemy.def);
  currentEnemy.hp -= damage;
  logBattle(`💥 Skill digunakan! ${currentEnemy.name} kena ${damage} damage.`);
  playSfx("skill");
  if (currentEnemy.hp <= 0) {
    winBattle();
    return;
  }
  enemyTurn(true);
  updateBars();
  saveState();
}

function usePotion() {
  const item = consumeItem("Potion") || consumeItem("Hi-Potion");
  if (!item) {
    toast("Potion habis. Tentu saja, persiapan selalu diabaikan sampai telat.");
    return;
  }
  const heal = item.effect?.heal || 30;
  const stats = getHeroComputedStats();
  state.hero.stats.hp = Math.min(stats.maxHp, state.hero.stats.hp + heal);
  logBattle(`🧪 ${state.hero.name} memakai ${item.name} dan memulihkan ${heal} HP.`);
  playSfx("heal");
  if (currentEnemy) enemyTurn();
  updateBars();
  renderInventory();
  saveState();
}

function enemyTurn(afterSkill = false) {
  if (!currentEnemy) return;
  const stats = getHeroComputedStats();
  const damage = Math.max(1, calcDamage(currentEnemy.atk + (afterSkill ? 2 : 0), stats.def));
  state.hero.stats.hp -= damage;
  logBattle(`${currentEnemy.name} menyerang balik dan memberi ${damage} damage.`);
  if (state.hero.stats.hp <= 0) {
    state.hero.stats.hp = 1;
    const lost = Math.min(25, state.hero.gold);
    state.hero.gold -= lost;
    currentEnemy = null;
    logBattle(`☠️ ${state.hero.name} tumbang... tapi bangun lagi di kota. Kehilangan ${lost} gold.`);
    logJournal(`${state.hero.name} kalah di arena dan kehilangan ${lost} gold.`);
    playSfx("lose");
  }
}

function winBattle() {
  if (!currentEnemy) return;
  state.hero.gold += currentEnemy.gold;
  state.hero.exp += currentEnemy.exp;
  updateQuestProgress(currentEnemy.name, false);
  logBattle(`🏆 Menang! Dapat ${currentEnemy.gold} gold dan ${currentEnemy.exp} exp.`);
  logJournal(`Mengalahkan ${currentEnemy.name}.`);
  playSfx("win");
  currentEnemy = null;
  expToLevelUp();
  renderAll();
}

function ensureBattleReady() {
  if (!state.created) {
    toast("Buat hero dulu.");
    return false;
  }
  if (!currentEnemy) {
    toast("Cari musuh dulu.");
    return false;
  }
  return true;
}

function restAtTown() {
  const stats = getHeroComputedStats();
  state.hero.stats.hp = stats.maxHp;
  logJournal(`${state.hero.name} istirahat di kota dan pulih total.`);
  playSfx("heal");
  renderHeroStats();
  saveState();
}

function renderInventory() {
  document.getElementById("inventoryGrid").innerHTML = state.hero.inventory.length ? state.hero.inventory.map(item => `
    <div class="item-card">
      <div class="item-meta">
        <span class="badge">${escapeHtml(item.type)}</span>
        <span class="badge">Qty ${item.qty}</span>
      </div>
      <h4>${escapeHtml(item.name)}</h4>
      <p>${item.effect?.heal ? `Heal ${item.effect.heal} HP.` : item.bonus ? bonusText(item.bonus) : "Material / utility item."}</p>
      ${item.type === "consumable" ? `<button class="ghost-btn" onclick="useNamedItem('${escapeAttr(item.name)}')">Use</button>` : item.type === "weapon" || item.type === "armor" || item.type === "charm" ? `<button class="rainbow-btn" onclick="equipItem('${escapeAttr(item.name)}')">Equip</button>` : ``}
    </div>
  `).join("") : `<div class="item-card"><h4>Kosong</h4><p>Belum ada item. Pergi kerja... eh farming.</p></div>`;

  const eq = state.hero.equipment;
  document.getElementById("equipGrid").innerHTML = ["weapon", "armor", "charm"].map(slot => `
    <div class="equip-card">
      <h4>${slot.toUpperCase()}</h4>
      <p>${eq[slot] ? escapeHtml(eq[slot].name) : "Empty"}</p>
      ${eq[slot] ? `<button class="ghost-btn" onclick="unequipSlot('${slot}')">Unequip</button>` : ""}
    </div>
  `).join("");
}

function bonusText(bonus) {
  return Object.entries(bonus).map(([k,v]) => `${k.toUpperCase()} +${v}`).join(" • ");
}

function useNamedItem(name) {
  const item = consumeItem(name);
  if (!item) return;
  if (item.effect?.heal) {
    const stats = getHeroComputedStats();
    state.hero.stats.hp = Math.min(stats.maxHp, state.hero.stats.hp + item.effect.heal);
    logBattle(`🧪 ${item.name} dipakai. Heal ${item.effect.heal} HP.`);
    playSfx("heal");
  }
  renderAll();
  saveState();
}

function equipItem(name) {
  const item = state.hero.inventory.find(i => i.name === name);
  if (!item) return;
  const slot = item.type;
  state.hero.equipment[slot] = { name: item.name, bonus: item.bonus };
  logJournal(`${item.name} dipasang pada slot ${slot}.`);
  renderAll();
  saveState();
}

function unequipSlot(slot) {
  state.hero.equipment[slot] = null;
  renderAll();
  saveState();
}

function renderShop() {
  document.getElementById("shopGrid").innerHTML = shopItems.map(item => `
    <div class="item-card">
      <div class="item-meta">
        <span class="badge">${escapeHtml(item.type)}</span>
        <span class="badge">${item.price} Gold</span>
      </div>
      <h4>${escapeHtml(item.name)}</h4>
      <p>${escapeHtml(item.desc)}</p>
      <p>${item.effect?.heal ? `Heal ${item.effect.heal} HP` : item.bonus ? bonusText(item.bonus) : ""}</p>
      <button class="rainbow-btn" onclick="buyItem('${item.id}')">Buy</button>
    </div>
  `).join("");
}

function buyItem(id) {
  const item = shopItems.find(x => x.id === id);
  if (!item) return;
  if (state.hero.gold < item.price) {
    toast("Gold kurang. Kaya itu memang fitur premium.");
    return;
  }
  state.hero.gold -= item.price;
  addInventoryItem(item.name, 1);
  logJournal(`Membeli ${item.name}.`);
  playSfx("coin");
  renderAll();
  saveState();
}

function renderSkills() {
  document.getElementById("skillGrid").innerHTML = skills.map(skill => {
    const lvl = state.hero[skill.id] || 0;
    const can = state.hero.skillPoints > 0 && lvl < skill.max;
    return `
      <div class="skill-card">
        <div class="skill-meta">
          <span class="badge">Level ${lvl}/${skill.max}</span>
          <span class="badge">Cost ${skill.cost} SP</span>
        </div>
        <h4>${escapeHtml(skill.name)}</h4>
        <p>${escapeHtml(skill.desc)}</p>
        <button class="${can ? "rainbow-btn" : "ghost-btn"}" ${can ? "" : "disabled"} onclick="upgradeSkill('${skill.id}')">Upgrade</button>
      </div>
    `;
  }).join("");
}

function upgradeSkill(id) {
  const skill = skills.find(s => s.id === id);
  if (!skill) return;
  const lvl = state.hero[id] || 0;
  if (state.hero.skillPoints <= 0 || lvl >= skill.max) return;
  state.hero.skillPoints -= 1;
  state.hero[id] = lvl + 1;
  logJournal(`Skill upgraded: ${skill.name} ke level ${state.hero[id]}.`);
  playSfx("level");
  renderAll();
  saveState();
}

function renderJournal() {
  document.getElementById("journalLog").textContent = state.journal.slice().reverse().join("\n");
}

function logJournal(text) {
  const stamp = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  state.journal.push(`[${stamp}] ${text}`);
}

function logBattle(text) {
  const box = document.getElementById("battleLog");
  if (box) {
    box.textContent = (text + "\n" + box.textContent).slice(0, 3500);
  }
}

function renderDungeonStatus(nodes = [], logText = "") {
  document.getElementById("dungeonProgress").innerHTML = nodes.length ? nodes.map((node, i) => `
    <div class="room-node ${node.done ? "done" : node.active ? "active" : ""}">Room ${i+1}<br>${escapeHtml(node.name)}</div>
  `).join("") : `<div class="room-node">No run yet</div>`;
  if (logText) document.getElementById("dungeonLog").textContent = logText;
}

function startDungeon() {
  if (!state.created) {
    toast("Buat hero dulu.");
    return;
  }
  const nodes = Array.from({length: 5}, (_, i) => ({
    name: i === 4 ? "Boss" : `Mob ${i+1}`,
    done: false,
    active: i === 0
  }));
  let logText = "Dungeon run dimulai...\n";
  const originalHp = state.hero.stats.hp;

  for (let i = 0; i < nodes.length; i++) {
    nodes.forEach((n, idx) => n.active = idx === i);
    const enemy = randomEnemy(i < 4 ? 1.05 + i * 0.12 : 1.5);
    logText += `Room ${i+1}: ${enemy.name} muncul.\n`;
    let enemyHp = enemy.hp;

    while (enemyHp > 0 && state.hero.stats.hp > 0) {
      const stats = getHeroComputedStats();
      enemyHp -= calcDamage(stats.atk + rand(0, 4), enemy.def);
      if (enemyHp <= 0) break;
      state.hero.stats.hp -= Math.max(1, calcDamage(enemy.atk, stats.def));
    }

    if (state.hero.stats.hp <= 0) {
      const lost = Math.min(35, state.hero.gold);
      state.hero.gold -= lost;
      state.hero.stats.hp = 1;
      logText += `Kalah di room ${i+1}. Kehilangan ${lost} gold.\n`;
      playSfx("lose");
      renderDungeonStatus(nodes, logText);
      renderAll();
      saveState();
      return;
    }

    state.hero.gold += enemy.gold;
    state.hero.exp += enemy.exp;
    updateQuestProgress(enemy.name, false);
    nodes[i].done = true;
    nodes[i].active = false;
    logText += `Menang lawan ${enemy.name}. +${enemy.gold} gold / +${enemy.exp} exp.\n`;
  }

  state.dungeonRuns += 1;
  updateQuestProgress("", true);
  expToLevelUp();
  addInventoryItem("Potion", 1);
  logText += `Dungeon clear! Bonus Potion didapat.\n`;
  logJournal(`${state.hero.name} menyelesaikan Shadow Rift.`);
  playSfx("win");
  renderDungeonStatus(nodes, logText);
  renderAll();
  saveState();
}

function renderAll() {
  renderHeroStats();
  renderNPCs();
  renderQuests();
  renderInventory();
  renderShop();
  renderSkills();
  renderJournal();
  updateCreatorVisibility();
  updateBars();
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]));
}
function escapeAttr(str = "") {
  return String(str).replace(/'/g, "\\'");
}

/* ------------------ AUDIO ------------------ */
let audioCtx, masterGain, musicGain, sfxGain, musicLoopHandle = null;

function setupAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();
  masterGain = audioCtx.createGain();
  musicGain = audioCtx.createGain();
  sfxGain = audioCtx.createGain();

  masterGain.gain.value = 0.22;
  musicGain.gain.value = 0.30;
  sfxGain.gain.value = 0.42;

  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(audioCtx.destination);
}

function startMusicSafe() {
  if (audioStarted) return;
  setupAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  audioStarted = true;
  document.getElementById("startMusicBtn").textContent = "♫ Music Running";
  startMusicLoop();
}

function noteFreq(note) {
  return {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
  }[note] || 440;
}

function playTone(freq, start, duration, type = "sine", volume = 0.04, targetGain = musicGain) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(targetGain);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function startMusicLoop() {
  if (musicLoopHandle) return;
  const melody = ["E5","D5","C5","D5","E5","G5","E5","D5","C5","A4","C5","D5","E5","D5","C5","A4"];
  const bass = ["A4","A4","F4","F4","C4","C4","G4","G4"];
  let step = 0;

  musicLoopHandle = setInterval(() => {
    if (!audioCtx || isMuted) return;
    const now = audioCtx.currentTime + 0.05;
    playTone(noteFreq(melody[step % melody.length]), now, 0.26, "triangle", 0.035);
    if (step % 2 === 0) {
      playTone(noteFreq(bass[(step/2) % bass.length]), now, 0.42, "sawtooth", 0.018);
    }
    step++;
  }, 300);
}

function playSfx(type) {
  if (!audioCtx || isMuted) return;
  const now = audioCtx.currentTime + 0.01;
  if (type === "hit") {
    playTone(220, now, 0.08, "square", 0.06, sfxGain);
  } else if (type === "heal") {
    playTone(660, now, 0.12, "sine", 0.06, sfxGain);
    playTone(880, now + 0.08, 0.18, "triangle", 0.05, sfxGain);
  } else if (type === "coin") {
    playTone(880, now, 0.08, "triangle", 0.05, sfxGain);
    playTone(1320, now + 0.05, 0.12, "triangle", 0.05, sfxGain);
  } else if (type === "win") {
    playTone(523.25, now, 0.12, "triangle", 0.05, sfxGain);
    playTone(659.25, now + 0.12, 0.14, "triangle", 0.05, sfxGain);
    playTone(783.99, now + 0.24, 0.22, "triangle", 0.05, sfxGain);
  } else if (type === "lose") {
    playTone(220, now, 0.18, "sawtooth", 0.05, sfxGain);
    playTone(180, now + 0.12, 0.24, "sawtooth", 0.05, sfxGain);
  } else if (type === "skill") {
    playTone(740, now, 0.08, "square", 0.05, sfxGain);
    playTone(988, now + 0.06, 0.14, "square", 0.05, sfxGain);
  } else if (type === "level") {
    playTone(523.25, now, 0.08, "triangle", 0.04, sfxGain);
    playTone(659.25, now + 0.08, 0.08, "triangle", 0.04, sfxGain);
    playTone(880, now + 0.16, 0.18, "triangle", 0.04, sfxGain);
  }
}

function toggleMute() {
  isMuted = !isMuted;
  document.getElementById("muteBtn").textContent = isMuted ? "🔇 Sound Off" : "🔊 Sound On";
}

/* ------------------ INIT ------------------ */
function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  document.getElementById("createHeroBtn").addEventListener("click", createHero);
  document.getElementById("spawnEnemyBtn").addEventListener("click", () => spawnEnemy(1));
  document.getElementById("attackBtn").addEventListener("click", attackEnemy);
  document.getElementById("skillBtn").addEventListener("click", useSkillAttack);
  document.getElementById("healBtn").addEventListener("click", usePotion);
  document.getElementById("restBtn").addEventListener("click", restAtTown);
  document.getElementById("dungeonBtn").addEventListener("click", startDungeon);
  document.getElementById("saveBtn").addEventListener("click", saveState);
  document.getElementById("resetBtn").addEventListener("click", resetState);
  document.getElementById("startMusicBtn").addEventListener("click", startMusicSafe);
  document.getElementById("muteBtn").addEventListener("click", toggleMute);
}

bindEvents();
renderAll();
updateCreatorVisibility();
renderDungeonStatus();
if (state.created) showView("town");
