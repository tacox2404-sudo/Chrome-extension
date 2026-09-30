// Boss key page: a fake "world's most urgent problem" document, all consultant buzzwords.
// It is regenerated every time so no two bosses see the same emergency.
// Everything here comes from the constant lists below, never from user input.

const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const titleCase = (s) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

const VERBS = ["leverage", "operationalize", "socialize", "de-risk", "synergize", "cascade", "right-size", "unlock", "streamline", "architect", "incentivize", "double-click on", "pressure-test", "institutionalize"];
const ADJ = ["scalable", "mission-critical", "cross-functional", "best-in-class", "holistic", "end-to-end", "agile", "data-driven", "customer-centric", "frictionless", "future-proof", "enterprise-grade", "stakeholder-aligned", "omnichannel", "paradigm-shifting"];
const NOUN = ["synergies", "value streams", "north star metrics", "touchpoints", "operating models", "capability gaps", "workstreams", "alignment vectors", "governance frameworks", "success criteria", "learnings", "bandwidth constraints", "quick wins", "thought leadership pipelines", "change agents"];
const FAIL = ["Misalignment", "Erosion", "Deficit", "Fragmentation", "Attrition", "Debt", "Drift", "Dilution"];
const IMPACT = ["Q3 Value Realization", "Enterprise-Wide Go-Forward Readiness", "the North Star Metric", "End-to-End Customer Journey Velocity", "Strategic Runway Optionality"];
const OWNERS = ["Office of the CTO", "Global Transformation PMO", "Strategy and Insights", "Enterprise Excellence", "Chief of Staff", "Center of Enablement", "Steering Committee"];
const NAMES = [["Dana K.", "DK"], ["Marcus T.", "MT"], ["Priya S.", "PS"], ["Jordan L.", "JL"], ["Elena V.", "EV"], ["Chris B.", "CB"]];

const phrase = () => `${r(ADJ)} ${r(NOUN)}`;
const TEMPLATES = [
  () => `In order to ${r(VERBS)} ${phrase()}, stakeholders must first ${r(VERBS)} the ${phrase()} across the ${r(ADJ)} ${r(NOUN)}.`,
  () => `Our analysis indicates a ${r(ADJ)} ${r(FAIL).toLowerCase()} in ${phrase()} that, if left unaddressed, will compound across ${phrase()} within the next 72 hours.`,
  () => `Leadership has requested that we ${r(VERBS)} ${phrase()} and ${r(VERBS)} ${phrase()} ahead of the next steering cycle.`,
  () => `This is not a point-in-time issue. It is a systemic ${r(FAIL).toLowerCase()} of ${phrase()} that demands a ${r(ADJ)}, ${r(ADJ)} response.`,
  () => `Preliminary findings suggest that ${phrase()} are ${r(["misaligned", "siloed", "under-leveraged", "structurally constrained", "dangerously un-socialized"])} relative to ${phrase()}.`,
  () => `Without immediate action to ${r(VERBS)} ${phrase()}, the organization risks a ${rint(12, 47)}% degradation in ${phrase()}.`,
];
const sentence = () => r(TEMPLATES)();
// Distinct templates inside one paragraph, so it does not read like a loop.
const paragraph = (n) => [...TEMPLATES].sort(() => Math.random() - 0.5).slice(0, n).map((f) => f()).join(" ");

const title = () => `${r(["P0", "CRITICAL", "URGENT", "ESCALATION"])}: ${titleCase(`${r(ADJ)} ${r(NOUN)}`)} ${r(FAIL)} Impacting ${r(IMPACT)}`;
const fileName = () => `${r(["P0", "URGENT", "CRITICAL"])}_${r(["Alignment", "Synergy", "Paradigm", "Enterprise"])}_${r(["RCA", "Framework", "Deep_Dive", "Playbook"])}_v${rint(9, 23)}_FINAL_final${rint(2, 9)}.docx`;

function chart() {
  const W = 620, H = 200, L = 40, B = 26, n = 12;
  const px = (i) => L + (i * (W - L - 10)) / (n - 1);
  const py = (v) => H - B - (v / 100) * (H - B - 12);
  let v = rint(76, 90);
  const actual = [];
  for (let i = 0; i < 9; i++) { actual.push(v); v = Math.max(12, v - rint(1, 9)); }
  const target = Array.from({ length: n }, (_, i) => Math.min(96, 55 + i * 4));
  const proj = [actual[8], ...Array.from({ length: 3 }, (_, k) => Math.min(88, actual[8] + (k + 1) * rint(6, 12)))];
  const line = (pts, off = 0) => pts.map((p, i) => `${i ? "L" : "M"}${px(i + off).toFixed(1)},${py(p).toFixed(1)}`).join(" ");
  const grid = [0, 25, 50, 75, 100].map((g) => `<line x1="${L}" x2="${W - 10}" y1="${py(g)}" y2="${py(g)}" stroke="#e3e6ea"/><text x="${L - 6}" y="${py(g) + 3}" font-size="9" text-anchor="end" fill="#777">${g}</text>`).join("");
  const labels = Array.from({ length: n }, (_, i) => `<text x="${px(i)}" y="${H - 10}" font-size="9" text-anchor="middle" fill="#777">W${i + 1}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Alignment velocity chart">
    ${grid}${labels}
    <path d="${line(target)}" fill="none" stroke="#9aa0a6" stroke-width="1.5" stroke-dasharray="5 4"/>
    <path d="${line(actual)}" fill="none" stroke="#d93025" stroke-width="2.4"/>
    <path d="${line(proj, 8)}" fill="none" stroke="#1a73e8" stroke-width="2" stroke-dasharray="2 3"/>
    <circle cx="${px(8)}" cy="${py(actual[8])}" r="4.5" fill="#d93025"/>
    <text x="${px(8) - 6}" y="${py(actual[8]) - 10}" font-size="10" text-anchor="end" fill="#d93025" font-weight="bold">Inflection event</text>
  </svg>`;
}

function gantt() {
  const rows = ["Stakeholder alignment", "Governance realignment", "Value stream mapping", "Change enablement", "Synergy validation", "Executive socialization"];
  const bars = rows.map((name, i) => {
    const start = rint(0, 45), len = rint(22, 50);
    const color = ["#1a73e8", "#188038", "#f9ab00", "#d93025", "#8430ce", "#129eaf"][i];
    return `<div class="bd-grow"><span>${name}</span><div class="bd-gtrack"><i style="left:${start}%;width:${Math.min(len, 100 - start)}%;background:${color}"></i></div></div>`;
  }).join("");
  return `<div class="bd-gantt"><div class="bd-today" style="left:calc(190px + (100% - 190px) * 0.34)"><b>TODAY</b></div>${bars}</div>`;
}

function heat(level) {
  const c = { High: "#f4c7c3", Med: "#fce8b2", Low: "#ceead6" }[level];
  return `<td style="background:${c}">${level}</td>`;
}

export function renderBoss(root) {
  const file = fileName();
  const avatars = NAMES.slice(0, 3).map(([, i], k) => `<span class="bd-av" style="background:${["#1a73e8", "#d93025", "#188038"][k]}">${i}</span>`).join("");
  const kpis = [
    ["Synergy Index", `${rint(31, 48)}%`, "▼ 14 pts WoW", "bad"],
    ["Alignment Debt", `$${(Math.random() * 6 + 2).toFixed(1)}M`, "▲ unbudgeted", "bad"],
    ["Stakeholder Sentiment", `${(Math.random() * 1.2 + 1.4).toFixed(1)} / 5`, "▼ critical", "bad"],
    ["Days to Impact", `${rint(2, 4)}`, "SLA at risk", "warn"],
  ].map(([k, v, d, c]) => `<div class="bd-kpi ${c}"><small>${k}</small><b>${v}</b><em>${d}</em></div>`).join("");

  const problems = Array.from({ length: 4 }, () => `<li>${cap(sentence())}</li>`).join("");
  const causes = Array.from({ length: 5 }, (_, i) => `<tr><td>H${i + 1}</td><td>${cap(r(ADJ))} ${r(NOUN)} ${r(FAIL).toLowerCase()} in the ${r(ADJ)} ${r(NOUN)}</td>${heat(r(["High", "High", "Med", "Low"]))}${heat(r(["High", "Med", "Med", "Low"]))}<td>${r(OWNERS)}</td></tr>`).join("");
  const streams = Array.from({ length: 5 }, (_, i) => {
    const s = r([["red", "At risk"], ["red", "Blocked"], ["amber", "Watch"], ["amber", "Watch"], ["green", "On track"]]);
    return `<tr><td>WS-${i + 1}</td><td>${cap(r(VERBS))} ${phrase()}</td><td>${r(OWNERS)}</td><td>${r(["A", "R", "C", "I"])}/${r(["A", "R", "C", "I"])}/${r(["A", "R", "C", "I"])}</td><td><i class="bd-dot ${s[0]}"></i>${s[1]}</td></tr>`;
  }).join("");
  const steps = Array.from({ length: 4 }, (_, i) => `<li><b>${["Today", "Within 24h", "This week", "Next steering cycle"][i]}:</b> ${cap(r(VERBS))} ${phrase()} and ${r(VERBS)} ${phrase()} with ${r(OWNERS)}.</li>`).join("");
  const comments = [
    ["Can we socialize this with the SteerCo before we operationalize?", 0],
    ["+1. Let's take this offline and double-click on the bandwidth constraints.", 1],
    ["Is this aligned with the North Star?", 2],
    ["Adding six more stakeholders for visibility.", 3],
    ["Reopening. We have not yet aligned on alignment.", 4],
    ["Can we get a deck for this?", 5],
    ["Let's circle back post-sync. Parking lot.", 0],
  ].sort(() => Math.random() - 0.5).slice(0, 4)
    .map(([t, k]) => `<div class="bd-comment"><span class="bd-av" style="background:${["#1a73e8", "#d93025", "#188038", "#f9ab00", "#8430ce", "#129eaf"][k]}">${NAMES[k][1]}</span><div><b>${NAMES[k][0]}</b> <small>${rint(2, 58)} min ago</small><p>${t}</p></div></div>`).join("");

  root.innerHTML = `
  <header class="bd-top">
    <span class="bd-logo">📄</span>
    <div class="bd-titlebox">
      <div class="bd-file">${file}</div>
      <div class="bd-menu">File &nbsp; Edit &nbsp; View &nbsp; Insert &nbsp; Format &nbsp; Tools &nbsp; Extensions &nbsp; Help <i>Last edit was seconds ago</i></div>
    </div>
    <div class="bd-right"><span class="bd-avs">${avatars}<span class="bd-av more">+9</span></span><span class="bd-share">Share</span></div>
  </header>
  <div class="bd-body">
    <article class="bd-page">
      <div class="bd-alert">P0 &middot; CRITICAL &middot; ESCALATED TO STEERING COMMITTEE &middot; RESPONSE REQUIRED BY EOD</div>
      <h1>${title()}</h1>
      <table class="bd-meta">
        <tr><th>Document owner</th><td>${r(OWNERS)}</td><th>Status</th><td class="bd-red">AT RISK (RED)</td></tr>
        <tr><th>Sponsor</th><td>Office of the CEO</td><th>Classification</th><td>Confidential. Do not socialize.</td></tr>
        <tr><th>Version</th><td>v${rint(9, 23)}.${rint(0, 9)} (supersedes v${rint(2, 8)}.${rint(0, 9)})</td><th>Review cycle</th><td>Hourly until resolved</td></tr>
      </table>

      <h2>1. Executive summary</h2>
      <p>${paragraph(3)}</p>
      <p>${paragraph(3)} <span class="bd-cursor">${NAMES[1][0]} is editing</span></p>
      <div class="bd-kpis">${kpis}</div>

      <h2>2. Problem statement</h2>
      <ol>${problems}</ol>

      <h2>3. Alignment velocity, trailing 12 weeks</h2>
      ${chart()}
      <p class="bd-cap">Figure 1. Actual alignment velocity (red), target trajectory (grey), and projected recovery under the proposed framework (blue). Source: internal synergy telemetry, n=${rint(3, 9)}.</p>

      <h2>4. Root cause hypothesis matrix</h2>
      <table class="bd-tbl"><tr><th>ID</th><th>Hypothesis</th><th>Likelihood</th><th>Impact</th><th>Owner</th></tr>${causes}</table>

      <h2>5. Workstreams and RACI</h2>
      <table class="bd-tbl"><tr><th>ID</th><th>Workstream</th><th>Owner</th><th>R / A / C</th><th>Status</th></tr>${streams}</table>

      <h2>6. Go-forward timeline</h2>
      ${gantt()}

      <h2>7. Recommendation and next steps</h2>
      <p>${paragraph(2)}</p>
      <ul>${steps}</ul>
      <p class="bd-foot"><sup>1</sup> Metrics are directional and subject to ongoing alignment. <sup>2</sup> This document is a living artifact and supersedes all prior artifacts. <sup>3</sup> Please do not forward, socialize or operationalize outside the steering committee.</p>
    </article>
    <aside class="bd-comments"><h4>Comments (${rint(14, 40)} open)</h4>${comments}</aside>
  </div>
  <div class="bd-hint">Press B to come back to the fun.</div>`;
  return file;
}
