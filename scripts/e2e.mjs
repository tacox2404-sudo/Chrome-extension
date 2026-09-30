// Loads the unpacked extension in real Chromium and walks the acceptance criteria.
// Needs Playwright: `npm i -g playwright` (already present in the cloud sandbox).
import { createRequire } from "node:module";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require(join(process.env.NODE_PATH || "/opt/node22/lib/node_modules", "playwright"))); }

const ext = resolve("extension");
const shots = resolve(process.env.SHOTS || "docs/screenshots");
mkdirSync(shots, { recursive: true });
let failed = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) failed++; };

const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "tgt-")), {
  headless: true,
  channel: "chromium",
  viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
const errors = [];
const requests = [];
let sw = ctx.serviceWorkers()[0] || (await ctx.waitForEvent("serviceworker"));
const id = new URL(sw.url()).host;
ok(!!id, `AC-01 extension loaded with id ${id}`);

const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("request", (r) => { if (!r.url().startsWith("chrome-extension://") && !r.url().startsWith("data:")) requests.push(r.url()); });

await page.goto(`chrome-extension://${id}/newtab.html`);
await page.waitForSelector("#name-modal:not([hidden])");
await page.fill("#name-input", "Jordan");
await page.click("#name-form button");
ok(/Jordan/.test(await page.textContent("#greeting")), "AC-02/03 greeting uses the name");
ok(/^\d{1,2}:\d{2}$/.test(await page.textContent("#clock")), "AC-02 clock shows time");
await page.screenshot({ path: join(shots, "home.png") });

// AC-04 main quests (up to 3 a day)
for (const q of ["Finish the PM doc", "Study for stats quiz", "Gym at 6"]) {
  await page.fill("#quest-input", q);
  await page.press("#quest-input", "Enter");
}
ok((await page.locator("#quest-list li").count()) === 3, "AC-04 three main quests listed");
ok(!(await page.isVisible("#quest-form")), "AC-04 add box hides at the cap of 3");
await page.locator("#quest-list input").nth(0).click();
ok((await page.textContent("#aura-pts")) === "30", "AC-04 main quest gives 30 aura");
ok((await page.textContent("#streak")) === "1", "AC-09 streak starts at 1");
await page.locator("#quest-list input").nth(0).click(); // untick
await page.locator("#quest-list input").nth(0).click(); // tick again
ok((await page.textContent("#aura-pts")) === "30", "AC-04 re-ticking does not pay aura twice");
await page.locator("#quest-list input").nth(1).click();
await page.locator("#quest-list input").nth(2).click();
ok((await page.textContent("#aura-pts")) === "110", "AC-04 all three done: 3 x 30 plus 20 board-cleared bonus");

// AC-05 side quests
ok(await page.isVisible("#task-input"), "AC-05 side quests are on the main page, no panel to open");
for (const t of ["Email the professor", "Read chapter 4", "Reply to group chat", "Book library room"]) {
  await page.fill("#task-input", t);
  await page.press("#task-input", "Enter");
}
ok((await page.locator("#task-list li").count()) === 4, "AC-05 four side quests listed");
await page.locator("#task-list input").first().click(); // click, not check: the list re-sorts after ticking
ok((await page.textContent("#aura-pts")) === "120", "AC-05 side quest gives 10 aura");
ok((await page.locator("#task-list li.done").count()) === 1 && (await page.locator("#task-list li:last-child").getAttribute("class")) === "done", "AC-05 finished quest sinks to the bottom");
await page.screenshot({ path: join(shots, "home-with-side-quests.png") });

// AC-06 focus timer
await page.click('[data-open="focus"]');
await page.click("#focus-start");
ok(await page.isVisible("#focus-cancel"), "AC-06 focus started");
const alarm = await sw.evaluate(async () => (await chrome.alarms.get("focus-end"))?.name);
ok(alarm === "focus-end", "AC-11 background scheduled focus alarm");
await page.screenshot({ path: join(shots, "focus.png") });
await page.click("#focus-cancel");
ok(!(await sw.evaluate(async () => await chrome.alarms.get("focus-end"))), "AC-06 cancel clears alarm");
// simulate a session that ended while the tab was closed
await page.evaluate(() => chrome.storage.local.set({ focus: { end: Date.now() - 1000, mins: 25 } }));
await page.reload();
await page.waitForFunction(() => document.getElementById("aura-pts").textContent === "170");
ok(true, "AC-06 finished session pays 50 aura on next open");
ok(!!(await sw.evaluate(async () => (await chrome.alarms.get("hydrate"))?.periodInMinutes)), "AC-11 hydration alarm is scheduled");
await page.click("#panel-close").catch(() => {});

// AC-07 games
await page.click('[data-open="games"]');
await page.click("#snake-start");
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(400);
await page.screenshot({ path: join(shots, "snake.png") });
await page.click('[data-game="reflex"]');
await page.click("#reflex-pad");
await page.click("#reflex-pad");
ok(/too early/i.test(await page.textContent("#reflex-pad")), "AC-07 reflex punishes early taps");
await page.click("#reflex-pad");
await page.waitForFunction(() => document.getElementById("reflex-pad").classList.contains("go"), null, { timeout: 6000 });
await page.click("#reflex-pad");
ok(/ms/.test(await page.textContent("#reflex-pad")), "AC-07 reflex reports ms");
await page.click('[data-game="ball"]');
await page.fill("#ball-input", "Will I pass?");
await page.press("#ball-input", "Enter");
await page.waitForFunction(() => document.getElementById("ball-answer").textContent.length > 3 && document.getElementById("ball-answer").textContent !== "...");
ok(true, "AC-07 vibe ball answers");
await page.click('[data-game="quest"]');
const auraBefore = Number(await page.textContent("#aura-pts"));
await page.click("#grass-done");
ok(Number(await page.textContent("#aura-pts")) === auraBefore + 5, "AC-07 grass quest gives 5 aura");
await page.click("#panel-close");

// AC-08 vibes
await page.click('[data-open="vibes"]');
for (const v of ["boombap", "trap", "lofi", "dreamy", "rain", "ocean", "fire", "brown", "off"]) await page.click(`[data-vibe="${v}"]`);
await page.click('[data-vibe="boombap"]');
await page.screenshot({ path: join(shots, "vibes.png") });
await page.click('[data-vibe="off"]');
ok(true, "AC-08 all vibes start and stop");

// AC-08 sound quality: render 24 s of each vibe offline and measure it.
const levels = await page.evaluate(async () => {
  const { VIBES, buildMaster } = await import("./js/audio.js");
  const out = {};
  for (const name of Object.keys(VIBES)) {
    const secs = 24, rate = 44100;
    const c = new OfflineAudioContext(2, secs * rate, rate);
    const m = buildMaster(c, 0.5);
    VIBES[name](c, m.input).tick(secs);
    const buf = await c.startRendering();
    let peak = 0, sum = 0, bad = 0, n = 0;
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const v = d[i];
        if (!Number.isFinite(v)) bad++;
        peak = Math.max(peak, Math.abs(v)); sum += v * v; n++;
      }
    }
    out[name] = { peak, rmsDb: 20 * Math.log10(Math.sqrt(sum / n) + 1e-9), bad };
  }
  return out;
});
for (const [name, l] of Object.entries(levels)) {
  console.log(`      ${name.padEnd(7)} peak ${l.peak.toFixed(2)}  rms ${l.rmsDb.toFixed(1)} dBFS`);
  ok(l.bad === 0 && l.peak < 1 && l.rmsDb > -45 && l.rmsDb < -12, `AC-08 ${name} is audible, not clipping, no bad samples`);
}
await page.click("#panel-close");

// AC-10 boss key
await page.keyboard.press("b");
ok(await page.isVisible("#boss"), "AC-10 boss key shows the fake doc");
const bossInfo = await page.evaluate(() => ({
  h1: document.querySelector("#boss h1")?.textContent || "",
  tables: document.querySelectorAll("#boss table").length,
  svg: document.querySelectorAll("#boss svg").length,
  kpis: document.querySelectorAll("#boss .bd-kpi").length,
  comments: document.querySelectorAll("#boss .bd-comment").length,
  words: document.getElementById("boss").innerText.split(/\s+/).length,
}));
ok(/^(P0|CRITICAL|URGENT|ESCALATION):/.test(bossInfo.h1), `AC-10 boss doc has an emergency title: ${bossInfo.h1}`);
ok(bossInfo.tables >= 3 && bossInfo.svg === 1 && bossInfo.kpis === 4 && bossInfo.comments >= 3 && bossInfo.words > 700, `AC-10 boss doc looks dense (${bossInfo.tables} tables, chart, ${bossInfo.kpis} KPIs, ${bossInfo.comments} comments, ${bossInfo.words} words)`);
ok(/^[A-Za-z0-9_]+\.docx$/.test(await page.title()), `AC-10 tab title becomes a file name: ${await page.title()}`);
await page.screenshot({ path: join(shots, "boss-key.png") });
await page.keyboard.press("b");
ok(!(await page.isVisible("#boss")), "AC-10 boss key toggles back");
await page.keyboard.press("b");
const h1a = await page.textContent("#boss h1");
await page.keyboard.press("Escape");
ok(!(await page.isVisible("#boss")), "AC-10 Escape closes the boss doc");

// AC-16 zen mode and full screen
await page.keyboard.press("z");
ok(await page.evaluate(() => document.body.classList.contains("zen")), "AC-16 zen mode hides the extras");
await page.screenshot({ path: join(shots, "zen.png") });
await page.keyboard.press("z");
ok(!(await page.evaluate(() => document.body.classList.contains("zen"))), "AC-16 zen mode toggles back");
await page.click("#btn-full");
await page.waitForTimeout(500);
const fs1 = await page.evaluate(async () => (await chrome.windows.getCurrent()).state);
ok(fs1 === "fullscreen", `AC-16 full screen button puts the window in full screen (state: ${fs1})`);
await page.keyboard.press("f");
await page.waitForTimeout(500);
const fs2 = await page.evaluate(async () => (await chrome.windows.getCurrent()).state);
ok(fs2 !== "fullscreen", `AC-16 F key leaves full screen (state: ${fs2})`);

// AC-03 persistence
await page.reload();
ok(/Jordan/.test(await page.textContent("#greeting")), "AC-03 name survives reload");
ok((await page.locator("#quest-list li span").first().textContent()) === "Finish the PM doc", "AC-04 quests survive reload");

// AC-14 reset
page.once("dialog", (d) => d.accept());
await page.click('[data-open="settings"]');
await page.click("#set-reset");
await page.waitForSelector("#name-modal:not([hidden])");
ok(true, "AC-14 reset wipes data and asks for a name again");

// AC-13 speed, AC-12 network
const t0 = Date.now();
await page.reload();
await page.waitForSelector("#clock");
ok(Date.now() - t0 < 1500, `AC-13 page ready in ${Date.now() - t0} ms`);
ok(requests.length === 0, `AC-12 zero outside network requests (${requests.join(", ") || "none"})`);
ok(errors.length === 0, `no console or page errors ${errors.join(" | ")}`);

await ctx.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nAll e2e checks passed");
process.exit(failed ? 1 : 0);
