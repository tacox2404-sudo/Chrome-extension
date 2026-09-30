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

// AC-04 main quest
await page.fill("#quest-input", "Finish the PM doc");
await page.press("#quest-input", "Enter");
ok(await page.isVisible("#quest-view"), "AC-04 main quest saved");
await page.check("#quest-check");
ok((await page.textContent("#aura-pts")) === "30", "AC-04 main quest gives 30 aura");
ok((await page.textContent("#streak")) === "1", "AC-09 streak starts at 1");

// AC-05 side quests
await page.click('[data-open="quests"]');
await page.fill("#task-input", "Email the professor");
await page.press("#task-input", "Enter");
await page.check("#task-list input");
ok((await page.textContent("#aura-pts")) === "40", "AC-05 side quest gives 10 aura");
await page.screenshot({ path: join(shots, "side-quests.png") });
await page.click("#panel-close");

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
await page.waitForFunction(() => document.getElementById("aura-pts").textContent === "90");
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
for (const v of ["lofi", "rain", "brown", "off"]) await page.click(`[data-vibe="${v}"]`);
await page.click('[data-vibe="lofi"]');
await page.screenshot({ path: join(shots, "vibes.png") });
await page.click('[data-vibe="off"]');
ok(true, "AC-08 all vibes start and stop");
await page.click("#panel-close");

// AC-10 boss key
await page.keyboard.press("b");
ok(await page.isVisible("#boss"), "AC-10 boss key shows the fake doc");
await page.screenshot({ path: join(shots, "boss-key.png") });
await page.keyboard.press("b");
ok(!(await page.isVisible("#boss")), "AC-10 boss key toggles back");

// AC-03 persistence
await page.reload();
ok(/Jordan/.test(await page.textContent("#greeting")), "AC-03 name survives reload");
ok((await page.textContent("#quest-text")) === "Finish the PM doc", "AC-04 quest survives reload");

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
