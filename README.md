# Touch Grass Tab

A Momentum-style new tab for Chrome, rebuilt for students who need focus and a proper break. Clock, main quest, side quests, a lock-in timer, a Break Room with games, live-generated lo-fi and rain, memes, and a frog called Gregory. Everything stays on your device.

Full product doc and acceptance criteria: [docs/PM-DOC.md](docs/PM-DOC.md)

## Install it (2 minutes)

1. Clone or download this repo.
2. Open `chrome://extensions` in Chrome.
3. Switch on **Developer mode** (top right).
4. Click **Load unpacked** and pick the `extension` folder.
5. Open a new tab.

## What is inside

| Feature | Where to find it |
|---|---|
| Time, greeting, up to 3 main quests, side quests | Center of the page |
| Lock In timer (15, 25, 45 min) | Dock, bottom |
| Break Room: Snek, Reflex, Vibe Ball, Grass Quest | Dock |
| Vibes: boom bap, trap 808, lo-fi beat, dreamy pads, rain, ocean, fireplace, brown noise | Dock |
| Aura, rank, streak | Top left |
| Meme card | Top right |
| Gregory | Bottom right, poke him |
| Boss key: a very urgent, very buzzword-heavy fake document | Press `B` |
| Full screen (hides Chrome's tab strip and toolbar) | Press `F` or the dock button |
| Zen mode (only clock and quests) | Press `Z` or the dock button |

## Test it

You need Node 20 or newer.

```bash
npm run check   # static checks: manifest, permissions, no network code
npm run e2e     # loads the extension in Chromium and walks every acceptance criterion
```

`npm run e2e` uses Playwright and saves screenshots to `docs/screenshots/`.

## Change the voice

All jokes, greetings, memes, ranks and colors live in `extension/js/slang.js`. Edit that file, reload the extension on `chrome://extensions`, and you are done.

## Layout

```
extension/     the actual Chrome extension (load this folder)
docs/          PM-Doc and screenshots
scripts/       icon generator, static checks, end-to-end test
```
