// Static acceptance checks: no browser needed. Run with `npm run check`.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = "extension";
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) failed++; };

const m = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
ok(m.manifest_version === 3, "AC-01 manifest is MV3");
ok(m.chrome_url_overrides?.newtab === "newtab.html", "AC-01 overrides the new tab page");
ok(existsSync(join(root, m.chrome_url_overrides.newtab)), "AC-01 newtab.html exists");
ok(existsSync(join(root, m.background.service_worker)), "AC-11 background service worker exists");
for (const p of Object.values(m.icons)) ok(existsSync(join(root, p)), `icon exists: ${p}`);

const allowed = new Set(["storage", "alarms", "notifications"]);
ok(m.permissions.every((p) => allowed.has(p)), `AC-12 permissions are minimal (${m.permissions.join(", ")})`);
ok(!m.host_permissions && !m.content_scripts, "AC-12 no host permissions or content scripts");

const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } })(root);
const text = (p) => readFileSync(p, "utf8");

const html = files.filter((f) => f.endsWith(".html"));
ok(html.every((f) => !/<script(?![^>]*\bsrc=)[^>]*>/i.test(text(f))), "AC-12 no inline scripts (MV3 CSP)");
ok(html.every((f) => !/(src|href)=["']https?:/i.test(text(f))), "AC-12 no remote scripts, styles or fonts in HTML");
const js = files.filter((f) => f.endsWith(".js"));
ok(js.every((f) => !/\b(fetch|XMLHttpRequest|WebSocket|eval)\s*\(|new Function|https?:\/\//.test(text(f))), "AC-12 no network calls or remote URLs in JS");
ok(files.filter((f) => f.endsWith(".css")).every((f) => !/url\(\s*["']?https?:/.test(text(f))), "AC-12 no remote assets in CSS");
ok(/prefers-reduced-motion/.test(text(join(root, "css/style.css"))), "AC-13 respects reduced motion");

for (const f of js) {
  try { execFileSync("node", ["--check", f], { stdio: "pipe" }); ok(true, `syntax ok: ${f}`); }
  catch (e) { ok(false, `syntax error in ${f}: ${e.stderr}`); }
}

const slang = await import(`../${root}/js/slang.js`);
ok(slang.MEMES.length >= 15, `AC-15 at least 15 memes (${slang.MEMES.length})`);
ok(slang.BREAK_QUESTS.length >= 8, `AC-15 at least 8 break quests (${slang.BREAK_QUESTS.length})`);
ok(!JSON.stringify(slang).includes("—"), "copy has no em dashes");

console.log(failed ? `\n${failed} check(s) failed` : "\nAll static checks passed");
process.exit(failed ? 1 : 0);
