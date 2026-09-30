import {
  GREETINGS, QUEST_PROMPTS, QUEST_DONE, WISDOM, GREGORY_LINES, GREGORY_ANNOYED, MEMES,
  BREAK_QUESTS, FOCUS_DONE_LINES, LEVELS, SCENES,
} from "./slang.js";
import { createSnake, createReflex, createBall } from "./games.js";
import { setVibe, setVolume, blip } from "./audio.js";
import { renderBoss } from "./boss.js";

const $ = (id) => document.getElementById(id);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const hasChrome = typeof chrome !== "undefined" && chrome.storage?.local;

/* ---------- State + storage (falls back to localStorage outside Chrome) ---------- */
const DEFAULTS = {
  name: "",
  quests: null, // { date, items: [{ text, done, paid }], bonus }
  tasks: [],
  aura: 0,
  streak: 0,
  lastActive: null,
  best: { snake: 0, reflex: null },
  focus: null, // { end, mins }
  settings: { hydrate: true, h24: false, scene: null, zen: false },
};
let state = structuredClone(DEFAULTS);

async function load() {
  let saved = {};
  try {
    if (hasChrome) saved = await chrome.storage.local.get(null);
    else saved = JSON.parse(localStorage.getItem("tgt") || "{}");
  } catch { /* fresh start */ }
  if (saved.quest && !saved.quests) { // v1 stored a single main quest
    saved.quests = { date: saved.quest.date, items: [{ text: saved.quest.text, done: saved.quest.done, paid: saved.quest.done }] };
  }
  delete saved.quest;
  try { if (hasChrome) chrome.storage.local.remove("quest"); } catch { /* ignore */ }
  state = { ...structuredClone(DEFAULTS), ...saved };
  state.settings = { ...DEFAULTS.settings, ...(saved.settings || {}) };
  state.best = { ...DEFAULTS.best, ...(saved.best || {}) };
}

function save() {
  try {
    if (hasChrome) chrome.storage.local.set(state);
    else localStorage.setItem("tgt", JSON.stringify(state));
  } catch { /* storage full or blocked, keep running */ }
}

const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const say = (type, extra = {}) => { try { if (hasChrome) chrome.runtime.sendMessage({ type, ...extra }); } catch { /* no background */ } };

/* ---------- Aura, levels, streak ---------- */
function levelFor(aura) {
  let idx = 0;
  LEVELS.forEach(([min], i) => { if (aura >= min) idx = i; });
  const next = LEVELS[idx + 1];
  const min = LEVELS[idx][0];
  return { name: LEVELS[idx][1], progress: next ? (aura - min) / (next[0] - min) : 1 };
}

function renderAura() {
  const lv = levelFor(state.aura);
  $("level").textContent = lv.name;
  $("aura-pts").textContent = state.aura;
  $("streak").textContent = state.streak;
  $("aura-bar").style.width = `${Math.round(lv.progress * 100)}%`;
}

function touchStreak() {
  const today = dayKey();
  if (state.lastActive === today) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  state.streak = state.lastActive === dayKey(y) ? state.streak + 1 : 1;
  state.lastActive = today;
}

function addAura(n, celebrate = false) {
  const before = levelFor(state.aura).name;
  state.aura += n;
  touchStreak();
  save();
  renderAura();
  blip();
  if (celebrate || levelFor(state.aura).name !== before) confetti();
}

function confetti() {
  const bits = ["✨", "🔥", "💅", "🐸", "💯", "🎉"];
  for (let i = 0; i < 14; i++) {
    const el = document.createElement("span");
    el.className = "confetti";
    el.textContent = pick(bits);
    el.style.left = `${45 + Math.random() * 10}vw`;
    el.style.top = "45vh";
    el.style.setProperty("--dx", `${(Math.random() - 0.5) * 60}vw`);
    el.style.setProperty("--dy", `${(Math.random() - 0.7) * 50}vh`);
    el.style.setProperty("--r", `${Math.random() * 360}deg`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }
}

/* ---------- Clock + greeting ---------- */
function renderClock() {
  const now = new Date();
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  $("clock").textContent = state.settings.h24 ? `${String(h).padStart(2, "0")}:${m}` : `${h % 12 || 12}:${m}`;
}

function period(h) {
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 23) return "evening";
  return "night";
}

function renderGreeting() {
  const name = state.name || "bestie";
  $("greeting").textContent = pick(GREETINGS[period(new Date().getHours())]).replace("{name}", name);
}

/* ---------- Scenes ---------- */
function applyScene(i) {
  const s = SCENES[i];
  const root = document.documentElement.style;
  root.setProperty("--c1", s.c1);
  root.setProperty("--c2", s.c2);
  root.setProperty("--c3", s.c3);
  $("scene-name").textContent = s.name;
  state.settings.scene = i;
}

function initScene() {
  const h = new Date().getHours();
  const auto = h < 5 ? 3 : h < 11 ? 1 : h < 17 ? 2 : h < 21 ? 4 : 0;
  applyScene(state.settings.scene ?? auto);
}

/* ---------- Main quests (up to 3 a day) ---------- */
const MAX_QUESTS = 3;

function todaysQuests() {
  if (!state.quests || state.quests.date !== dayKey()) state.quests = { date: dayKey(), items: [], bonus: false };
  return state.quests.items;
}

function renderQuest() {
  const items = todaysQuests();
  const list = $("quest-list");
  list.replaceChildren();
  items.forEach((q, i) => {
    const li = document.createElement("li");
    li.className = q.done ? "done" : "";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = q.done;
    cb.setAttribute("aria-label", `Main quest done: ${q.text}`);
    cb.addEventListener("change", () => {
      q.done = cb.checked;
      if (q.done && !q.paid) { q.paid = true; addAura(30, true); } // paid once, so un-ticking can't farm aura
      const all = items.length >= 2 && items.every((x) => x.done);
      if (all && !state.quests.bonus) { state.quests.bonus = true; addAura(20, true); }
      save();
      renderQuest();
    });
    const span = document.createElement("span");
    span.textContent = q.text;
    const del = document.createElement("button");
    del.className = "ghost";
    del.textContent = "✕";
    del.setAttribute("aria-label", `Delete main quest: ${q.text}`);
    del.addEventListener("click", () => { items.splice(i, 1); save(); renderQuest(); });
    li.append(cb, span, del);
    list.append(li);
  });
  const done = items.filter((q) => q.done).length;
  $("quest-form").hidden = items.length >= MAX_QUESTS;
  $("quest-label").textContent = items.length ? "Main quests today" : "Main quests today (up to 3)";
  $("quest-input").placeholder = items.length ? "+ Add another main quest" : pick(QUEST_PROMPTS);
  $("quest-msg").textContent = !items.length ? "" : done === items.length && items.length >= 2 ? `${pick(QUEST_DONE)} Board cleared, +20 bonus.` : done === items.length ? pick(QUEST_DONE) : `${done} of ${items.length} done`;
}

$("quest-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("quest-input").value.trim();
  const items = todaysQuests();
  if (!text || items.length >= MAX_QUESTS) return;
  items.push({ text, done: false, paid: false });
  $("quest-input").value = "";
  save();
  renderQuest();
  if (items.length < MAX_QUESTS) $("quest-input").focus();
});

/* ---------- Panels ---------- */
let openPanel = null;
function open(name) {
  closePanels();
  openPanel = name;
  $("overlay").hidden = false;
  document.querySelectorAll("[data-panel]").forEach((s) => { s.hidden = s.dataset.panel !== name; });
  if (name === "focus") renderFocus();
  if (name === "settings") renderSettings();
  if (name === "games") selectGame(currentGame);
}
function closePanels() {
  if (openPanel === "games") { snake.stop(); reflex.stop(); }
  openPanel = null;
  $("overlay").hidden = true;
}
document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => open(b.dataset.open)));
$("panel-close").addEventListener("click", closePanels);
$("overlay").addEventListener("mousedown", (e) => { if (e.target === $("overlay")) closePanels(); });

/* ---------- Focus timer ---------- */
let focusMins = 25;
const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function renderFocus() {
  const f = state.focus;
  $("focus-timer").textContent = f ? fmt(f.end - Date.now()) : `${String(focusMins).padStart(2, "0")}:00`;
  $("focus-start").hidden = !!f;
  $("focus-cancel").hidden = !f;
  $("focus-choices").hidden = !!f;
  $("dock-focus").classList.toggle("live", !!f);
}

function finishFocus() {
  const mins = state.focus.mins;
  state.focus = null;
  addAura(Math.round((mins / 25) * 50), true);
  save();
  $("focus-msg").textContent = `${pick(FOCUS_DONE_LINES)} Break quest: ${pick(BREAK_QUESTS)}`;
  document.title = "New Tab";
  renderFocus();
}

setInterval(() => {
  if (!state.focus) return;
  if (Date.now() >= state.focus.end) finishFocus();
  else {
    const t = fmt(state.focus.end - Date.now());
    $("focus-timer").textContent = t;
    document.title = `${t} locked in`;
  }
}, 500);

$("focus-choices").addEventListener("click", (e) => {
  const b = e.target.closest("[data-mins]");
  if (!b) return;
  focusMins = Number(b.dataset.mins);
  document.querySelectorAll("#focus-choices .chip").forEach((c) => c.classList.toggle("on", c === b));
  renderFocus();
});
$("focus-start").addEventListener("click", () => {
  state.focus = { end: Date.now() + focusMins * 60000, mins: focusMins };
  save();
  say("focus-start", { end: state.focus.end });
  $("focus-msg").textContent = "Locked in. Phone face down. Let's cook.";
  renderFocus();
});
$("focus-cancel").addEventListener("click", () => {
  state.focus = null;
  save();
  say("focus-cancel");
  document.title = "New Tab";
  $("focus-msg").textContent = "Bailed. No aura, no shame. Try again when ready.";
  renderFocus();
});

/* ---------- Side quests (live on the main page) ---------- */
function renderTasks() {
  const list = $("task-list");
  list.replaceChildren();
  // Open ones first, finished ones sink to the bottom.
  const order = state.tasks.map((t, i) => ({ t, i })).sort((a, b) => a.t.done - b.t.done);
  order.forEach(({ t, i }) => {
    const li = document.createElement("li");
    li.className = t.done ? "done" : "";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.done;
    cb.setAttribute("aria-label", `Done: ${t.text}`);
    cb.addEventListener("change", () => {
      t.done = cb.checked;
      if (t.done && !t.paid) { t.paid = true; addAura(10); }
      save();
      renderTasks();
    });
    const span = document.createElement("span");
    span.textContent = t.text;
    const del = document.createElement("button");
    del.className = "ghost";
    del.textContent = "✕";
    del.setAttribute("aria-label", `Delete: ${t.text}`);
    del.addEventListener("click", () => { state.tasks.splice(i, 1); save(); renderTasks(); });
    li.append(cb, span, del);
    list.append(li);
  });
  const left = state.tasks.filter((t) => !t.done).length;
  $("sq-count").textContent = state.tasks.length ? `${left} left` : "";
  $("sq-clear").hidden = !state.tasks.some((t) => t.done);
  $("task-input").placeholder = state.tasks.length ? "+ Add another side quest" : "+ Add a side quest and hit enter";
}
$("task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("task-input").value.trim();
  if (!text) return;
  state.tasks.push({ text, done: false, paid: false });
  $("task-input").value = "";
  save();
  renderTasks();
});
$("sq-clear").addEventListener("click", () => { state.tasks = state.tasks.filter((t) => !t.done); save(); renderTasks(); });

/* ---------- Games ---------- */
let currentGame = "snake";
const snake = createSnake($("snake"), {
  onScore: (s) => { $("snake-score").textContent = s; },
  onEnd: (s) => {
    if (s > state.best.snake) { state.best.snake = s; $("snake-best").textContent = s; }
    if (s >= 3) addAura(Math.floor(s / 3));
    save();
  },
});
const reflex = createReflex($("reflex-pad"), {
  onResult: (ms) => {
    if (state.best.reflex === null || ms < state.best.reflex) {
      state.best.reflex = ms;
      $("reflex-best").textContent = `${ms} ms`;
      addAura(10);
    }
    save();
  },
});
createBall($("ball"), $("ball-form"), $("ball-input"), $("ball-answer"));

function selectGame(name) {
  currentGame = name;
  snake.stop();
  reflex.stop();
  document.querySelectorAll("#game-tabs .chip").forEach((c) => c.classList.toggle("on", c.dataset.game === name));
  document.querySelectorAll("[data-gamebox]").forEach((g) => { g.hidden = g.dataset.gamebox !== name; });
  $("snake-best").textContent = state.best.snake;
  $("reflex-best").textContent = state.best.reflex === null ? "none yet" : `${state.best.reflex} ms`;
  if (name === "quest") nextGrass();
}
$("game-tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-game]");
  if (b) selectGame(b.dataset.game);
});
$("snake-start").addEventListener("click", () => snake.start());

let grassDone = false;
function nextGrass() {
  $("grass-text").textContent = pick(BREAK_QUESTS);
  grassDone = false;
  $("grass-done").disabled = false;
}
$("grass-next").addEventListener("click", nextGrass);
$("grass-done").addEventListener("click", () => {
  if (grassDone) return;
  grassDone = true;
  $("grass-done").disabled = true;
  addAura(5, true);
});

/* ---------- Vibes ---------- */
$("vibe-choices").addEventListener("click", (e) => {
  const b = e.target.closest("[data-vibe]");
  if (!b) return;
  setVibe(b.dataset.vibe);
  $("dock-vibes").classList.toggle("live", b.dataset.vibe !== "off");
  document.querySelectorAll("#vibe-choices .chip").forEach((c) => c.classList.toggle("on", c === b));
});
$("vibe-vol").addEventListener("input", (e) => setVolume(e.target.value / 100));

/* ---------- Settings ---------- */
function renderSettings() {
  $("set-name").value = state.name;
  $("set-24h").checked = state.settings.h24;
  $("set-hydrate").checked = state.settings.hydrate;
  $("set-msg").textContent = "";
}
$("set-name").addEventListener("change", (e) => { state.name = e.target.value.trim(); save(); renderGreeting(); });
$("set-24h").addEventListener("change", (e) => { state.settings.h24 = e.target.checked; save(); renderClock(); });
$("set-hydrate").addEventListener("change", (e) => { state.settings.hydrate = e.target.checked; save(); });
$("set-reset").addEventListener("click", async () => {
  if (!confirm("Wipe everything? Aura, streak, quests, all of it.")) return;
  try { if (hasChrome) await chrome.storage.local.clear(); else localStorage.removeItem("tgt"); } catch { /* ignore */ }
  say("focus-cancel");
  location.reload();
});

/* ---------- Gregory, memes, wisdom ---------- */
let pokes = 0, bubbleTimer;
$("gregory").addEventListener("click", () => {
  pokes++;
  const line = pokes % 5 === 0 ? pick(GREGORY_ANNOYED) : pick(GREGORY_LINES);
  const b = $("gregory-bubble");
  b.textContent = line;
  b.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { b.hidden = true; }, 4500);
});

function nextMeme() {
  const [a, b, emoji] = pick(MEMES);
  $("meme-a").textContent = a;
  $("meme-b").textContent = b;
  $("meme-emoji").textContent = emoji;
}
$("meme-next").addEventListener("click", nextMeme);

$("scene-btn").addEventListener("click", () => { applyScene(((state.settings.scene ?? 0) + 1) % SCENES.length); save(); });

/* ---------- Boss key ---------- */
let bossOn = false;
function toggleBoss() {
  bossOn = !bossOn;
  $("boss").hidden = !bossOn;
  if (bossOn) {
    $("boss").scrollTop = 0;
    document.title = renderBoss($("boss"));
  } else {
    document.title = "New Tab";
  }
}

/* ---------- Full screen and zen ---------- */
async function toggleFullscreen() {
  try {
    const w = await chrome.windows.getCurrent();
    await chrome.windows.update(w.id, { state: w.state === "fullscreen" ? "normal" : "fullscreen" });
  } catch {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }
}
function applyZen() { document.body.classList.toggle("zen", !!state.settings.zen); }
function toggleZen() { state.settings.zen = !state.settings.zen; save(); applyZen(); }
$("btn-full").addEventListener("click", toggleFullscreen);
$("btn-zen").addEventListener("click", toggleZen);

document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName) && document.activeElement.type !== "checkbox";
  if (e.key === "Escape") { if (bossOn) toggleBoss(); else closePanels(); return; }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === "b") toggleBoss();
  if (bossOn) return;
  if (k === "f") toggleFullscreen();
  if (k === "z") toggleZen();
});

/* ---------- Name onboarding ---------- */
$("name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  state.name = $("name-input").value.trim();
  save();
  $("name-modal").hidden = true;
  renderGreeting();
});

/* ---------- Boot ---------- */
(async function init() {
  await load();
  applyZen();
  initScene();
  renderClock();
  setInterval(renderClock, 1000);
  renderGreeting();
  renderQuest();
  renderTasks();
  renderAura();
  nextMeme();
  $("wisdom").textContent = pick(WISDOM);
  $("name-modal").hidden = !!state.name;
  if (!state.name) $("name-input").focus();
  // A lock-in that ended while this tab was closed still counts.
  if (state.focus && Date.now() >= state.focus.end) finishFocus();
  renderFocus();
})();
