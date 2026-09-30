import { HYDRATE_LINES, FOCUS_DONE_LINES } from "./js/slang.js";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function notify(id, title, message) {
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message,
  });
}

async function syncHydrate() {
  const { settings } = await chrome.storage.local.get("settings");
  const on = settings?.hydrate ?? true;
  await chrome.alarms.clear("hydrate");
  if (on) chrome.alarms.create("hydrate", { delayInMinutes: 60, periodInMinutes: 60 });
}

chrome.runtime.onInstalled.addListener(syncHydrate);
chrome.runtime.onStartup.addListener(syncHydrate);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) {
    const before = changes.settings.oldValue?.hydrate ?? true;
    const after = changes.settings.newValue?.hydrate ?? true;
    if (before !== after) syncHydrate();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "focus-start") chrome.alarms.create("focus-end", { when: msg.end });
  if (msg?.type === "focus-cancel") chrome.alarms.clear("focus-end");
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "focus-end") notify("focus-end", "Lock-in complete", pick(FOCUS_DONE_LINES));
  if (alarm.name === "hydrate") notify("hydrate", "Water check", pick(HYDRATE_LINES));
});
