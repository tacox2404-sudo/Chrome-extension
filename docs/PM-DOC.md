# PM-Doc: Touch Grass Tab

A Chrome extension that replaces the new tab page. It does what Momentum does (clock, focus, to-dos, pretty backgrounds) and then goes somewhere Momentum never would: a break room with games, sounds you can synthesize live, a frog that gives bad advice, and memes.

Status: v1.0 built. Owner: the team. Last updated: 2026-09-30.

---

## 1. Problem and audience

**Who:** students, roughly 17 to 25, who spend long hours on a laptop studying, writing, or doing group work.

**The problem:** a study session is not one long block of focus. It is focus, then a break where you end up in a scroll hole for 40 minutes. Momentum helps with the first part and does nothing for the second. Also, most productivity tools sound like a corporate email.

**Our idea:** make the new tab a place where you plan the day, lock in for a set time, and take breaks that are short, fun and actually restful, all in a voice that sounds like the people using it.

**Purpose (why this is more than a joke):**
- Focus: one main quest per day and a lock-in timer.
- Breaks with a shape: games and quests that take 2 to 5 minutes and end, instead of an infinite feed.
- Body care: hourly water reminder, break quests that get you off the chair.
- Motivation: aura points, ranks and streaks reward finishing, not just opening the tab.

## 2. Brainstorm

Ideas we considered, with the call we made.

| Idea | Verdict | Why |
|---|---|---|
| Clock, greeting, main focus (Momentum basics) | In | Table stakes. Kept simple. |
| Slang greetings by time of day | In | Cheap, funny, gives the whole product its voice. |
| Lock-in (Pomodoro) timer with notifications | In | The core purpose. Works even if the tab is closed. |
| Side quests (to-do list) | In | Momentum has it, students expect it. |
| Aura points, ranks, daily streak | In | Gives a reason to come back without guilt tripping. |
| Break Room: Snek, Reflex test, Vibe Ball, Grass Quest | In | Games that take under 5 minutes. Each is small enough to build and test. |
| Generated sounds (lo-fi, rain, brown noise) | In | No audio files, no copyright problem, no downloads, works offline. |
| Meme card (two-liner captions plus emoji) | In | Relatable humor, no image licensing. Rotates on click. |
| Gregory the frog (mascot with opinions) | In | Gives the extension a personality people remember. |
| Boss key (press B for a fake document) | In | Student humor, and very cheap to build. |
| Background scenes that change with the time of day | In | Pure CSS gradients, no image downloads. |
| Real photos from an image API (Unsplash style) | Later | Needs network access and an API key, which breaks our privacy promise. |
| Real meme images from Reddit or an API | Later | Same reason, plus moderation risk. |
| Weather, calendar, Spotify integration | Later | Needs accounts and permissions. Not needed to prove the idea. |
| Multiplayer or friends leaderboard | Later | Needs a backend. Good v2 talking point. |
| Site blocker | Later | Powerful, but needs broad permissions. Revisit after v1. |
| Ask-an-AI chat | No | Adds cost, privacy questions and off-topic risk. |

## 3. Product principles

1. **Private by default.** No accounts, no servers, no tracking. Everything is stored on the device.
2. **Small permissions.** Only `storage`, `alarms` and `notifications`.
3. **Fun with a job.** Every fun feature either rewards a focus habit or gives a healthy break.
4. **Fast.** The new tab must appear instantly, because people open it dozens of times a day.
5. **The voice stays consistent.** Slang and jokes live in one file (`extension/js/slang.js`) so the team can change tone without touching logic.

## 4. Features and user stories

Priority: **P0** must ship, **P1** should ship.

| ID | Feature | User story | Priority |
|---|---|---|---|
| F1 | New tab takeover | As a student, when I open a new tab I see Touch Grass Tab instead of a blank page. | P0 |
| F2 | Clock and greeting | I see the time and a slang greeting that matches the time of day and uses my name. | P0 |
| F3 | Onboarding | The first time, it asks what to call me and remembers it. | P0 |
| F4 | Main quest | I set one main goal per day, tick it off and get rewarded. It resets the next day. | P0 |
| F5 | Side quests | I keep a small to-do list that survives closing the browser. | P0 |
| F6 | Lock-in timer | I run a 15, 25 or 45 minute focus timer and get a notification when it ends, even if I closed the tab. | P0 |
| F7 | Aura, rank, streak | I earn points for finishing things, see my rank and a daily streak. | P1 |
| F8 | Break Room | I can play Snek, test my reflexes, ask the Vibe Ball, or get a real-world Grass Quest. | P1 |
| F9 | Vibes | I can play lo-fi, rain or brown noise and set the volume. | P1 |
| F10 | Memes and wisdom | I see a rotating meme and a one-line pep talk. | P1 |
| F11 | Gregory | I can poke a frog mascot for a funny line. | P1 |
| F12 | Scenes | The background changes with the time of day and I can cycle it. | P1 |
| F13 | Hydration reminder | I get an hourly water notification and can switch it off. | P1 |
| F14 | Boss key | I press B to swap the page for a boring fake document. | P1 |
| F15 | Settings and reset | I can change my name, the clock format, the reminder, and wipe my data. | P1 |

### Aura rules

| Action | Aura |
|---|---|
| Finish main quest | +30 |
| Finish a side quest | +10 |
| Finish a lock-in (25 min = 50, scales with length) | +50 for 25 min |
| Snek score of 3 or more | score divided by 3, rounded down |
| New personal best on Reflex | +10 |
| Mark a Grass Quest as done | +5 |

Ranks: NPC (0), Side Character (100), Main Character (300), Certified Menace (700), Sigma Legend (1500), Final Boss (3000).

Streak: counts consecutive days with at least one aura action. Missing a day resets it to 1 on the next action.

## 5. Acceptance criteria

The build is done when every P0 row passes. `npm run check` covers the static ones and `npm run e2e` covers the rest in a real Chromium with the extension loaded.

| ID | Criterion | How we check | Auto |
|---|---|---|---|
| AC-01 | The extension loads in Chrome as Manifest V3 and opens `newtab.html` on every new tab. | Load unpacked, open a tab. | check + e2e |
| AC-02 | The page shows the current time and a greeting containing the user's name. Greeting text matches the time-of-day group. | Look at the page at different hours. | e2e |
| AC-03 | On first run a name prompt appears. The name is saved and still shown after a reload. | Reload the page. | e2e |
| AC-04 | Main quest can be set, ticked (+30 aura) and survives reload. A quest from a previous day is not shown. | Set it, tick it, reload. | e2e |
| AC-05 | Side quests can be added, ticked (+10 aura), deleted, and survive reload. | Use the list. | e2e |
| AC-06 | The lock-in timer starts, counts down, and can be cancelled without aura. If the session ends while the tab is closed, the aura is paid on the next open. | Start, cancel, and simulate an expired session. | e2e |
| AC-07 | All four Break Room activities work. Snek runs and ends on a crash. Reflex punishes early taps and reports milliseconds. Vibe Ball answers. Grass Quest gives +5 once per quest. | Play each one. | e2e |
| AC-08 | Lo-fi, rain and brown noise each start and stop without errors, and the volume slider works. | Click each vibe. | e2e (no errors) |
| AC-09 | Rank, aura and streak update immediately and persist. Streak increases only once per day. | Do an action on two days. | e2e (day 1) |
| AC-10 | Pressing B (outside a text field) toggles the fake document. Escape also closes it. | Press B. | e2e |
| AC-11 | A focus alarm is scheduled with the browser when a lock-in starts and cleared on cancel. An hourly hydration alarm exists unless disabled. | Inspect alarms. | e2e |
| AC-12 | Privacy: zero network requests, no remote scripts, no `eval`, only the permissions `storage`, `alarms`, `notifications`. | Static scan and network log. | check + e2e |
| AC-13 | The page is ready in under 1.5 s. Everything works with keyboard only. Animations stop when the OS asks for reduced motion. | Timing and manual keyboard pass. | check + e2e (timing) |
| AC-14 | "Reset all my data" wipes everything after a confirmation and returns to the name prompt. | Use the button. | e2e |
| AC-15 | Content pack has at least 15 memes and 8 break quests and no em dashes in the copy. | Count entries. | check |

Manual checks the scripts cannot do (do these before showing it to the professor):
- Notification actually pops up when a real 15 minute timer ends (system notification settings must allow Chrome).
- Sound is pleasant on real speakers and the volume feels sane at default.
- Read all copy once out loud. If it sounds forced, fix it in `slang.js`.

## 6. Out of scope for v1

Accounts and sync, image or meme downloads, site blocking, calendar or weather, leaderboards, mobile. Every one of these needs a server or broad permissions and would break principles 1 and 2.

## 7. Architecture (short version)

| Piece | File | Job |
|---|---|---|
| Manifest | `extension/manifest.json` | MV3, overrides new tab, three permissions. |
| New tab page | `extension/newtab.html`, `css/style.css` | The whole UI. |
| App logic | `extension/js/app.js` | State, aura, panels, timer, tasks, boss key. |
| Games | `extension/js/games.js` | Snek, Reflex, Vibe Ball. |
| Audio | `extension/js/audio.js` | Web Audio synthesis for the vibes and blips. |
| Content | `extension/js/slang.js` | All jokes, greetings, memes, ranks, scenes. |
| Background worker | `extension/background.js` | Focus and hydration alarms, notifications. |
| Storage | `chrome.storage.local` | Everything the user creates. Never leaves the device. |

## 8. Risks

| Risk | Plan |
|---|---|
| Slang gets old or reads as cringe. | Content lives in one file. Ask three real students to read it and cut the worst 20 percent. |
| Sound annoys people. | Default is off. Volume slider. Fully synthesized so it never gets a copyright claim. |
| Games become a distraction. | Games are short by design, and aura only comes from lock-ins, quests and short plays, not from grinding. |
| Notifications blocked by the OS. | Timer still shows in the tab title and pays out on next open. |

## 9. Ideas for v2 (pitch material)

Study rooms with friends and a shared streak, an opt-in image pack, a site blocker during lock-in, a weekly "wrapped" recap with your stats, and user-submitted meme captions.

## 10. Demo script (2 minutes)

1. Open a new tab, enter a name, read the greeting.
2. Type the main quest, start a 15 minute lock-in.
3. Cancel it and show the aura rules by ticking a side quest.
4. Open Break Room, play Snek for 20 seconds, ask the Vibe Ball if the professor will like it.
5. Turn on lo-fi, poke Gregory five times.
6. Press B to show the boss key.
7. Show the acceptance table and run `npm run e2e`.
