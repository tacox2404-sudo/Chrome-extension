// All the words live here so the vibe is easy to edit without touching logic.

export const GREETINGS = {
  morning: [
    "Rise and grind, {name}",
    "Morning, {name}. Coffee first, chaos second",
    "New day, new aura, {name}",
    "Lock in, {name}. The day is not gonna beat itself",
  ],
  afternoon: [
    "Afternoon slump detected, {name}",
    "Still standing, {name}? Respect",
    "Halftime, {name}. Hydrate and reset",
    "Mid-day check, {name}. You are cooking",
  ],
  evening: [
    "Evening, {name}. Main character hours",
    "Sun's out, stress's out, {name}",
    "Golden hour, {name}. Go be iconic",
    "Wind down mode, {name}. You earned it",
  ],
  night: [
    "Why are you up, {name}? Sleep is free aura",
    "Night owl mode, {name}. Do not doomscroll",
    "It's late, {name}. Future you says go to bed",
    "3am thoughts hit different, {name}",
  ],
};

export const QUEST_PROMPTS = [
  "What's the main quest today?",
  "What's the one thing that gets you the W today?",
  "What are we locking in on?",
  "What's the plan, boss?",
];

export const QUEST_DONE = [
  "Main quest cleared. Absolute W.",
  "You ate that. No crumbs.",
  "Certified finisher. Go touch grass.",
  "Boss defeated. Aura +++",
];

export const WISDOM = [
  "Be the reason your group project actually gets finished.",
  "Deadlines are just suggestions with consequences.",
  "You don't need motivation. You need a snack and a 25 minute timer.",
  "Hydrate or diedrate.",
  "Comparison is the thief of joy. Also of battery life.",
  "One tab at a time. Yes, I see the other 47.",
  "Rest is part of the grind. Not a bug, a feature.",
  "Small W's stack up. That's the whole cheat code.",
  "Nobody is watching your progress bar. Do it for you.",
  "Your future self is reading this. Say thanks.",
  "Delulu is the solulu, but only if you do the work too.",
  "Perfect is the enemy of posted.",
  "Sleep is the cheapest performance upgrade.",
  "If it takes two minutes, do it now. If it takes two hours, start for two minutes.",
];

export const GREGORY_LINES = [
  "Ribbit. That means you're doing great.",
  "I'm a frog. I have no idea what a deadline is. Be like me.",
  "Bro, your posture. Fix it. I'll wait.",
  "Sip some water. I'm serious.",
  "You've got main character energy. Also a lot of tabs.",
  "No thoughts. Head empty. Only vibes.",
  "Touch grass? Bestie, I LIVE on grass.",
  "Fun fact: I'm not a real frog. I'm a real vibe.",
  "Respectfully, go stretch.",
  "This is your sign to take a 5 minute break.",
];
export const GREGORY_ANNOYED = [
  "Ok that's five pokes. Bold move.",
  "Stop it. I'm ticklish.",
  "You're gonna poke me into the shadow realm.",
  "I'm calling the frog union.",
];

// Two-liner memes: [setup, punchline, emoji]
export const MEMES = [
  ["Me: I'll start at 6", "Me at 6:01: one more video", "⏰"],
  ["Teacher: any questions?", "Whole class: what's the deadline again", "🦗"],
  ["Brain at 3am: remember that cringe thing from 2016?", "Me: please no", "🧠"],
  ["My plan: sleep 8 hours", "My body: how about 4 and a vibe", "🛌"],
  ["Me opening a new tab", "Also me: I don't know why I'm here", "🪟"],
  ["Battery at 1%", "Me: I can make it", "🔋"],
  ["Group project chat", "One person typing... for 3 hours", "💬"],
  ["Me: I'm not hungry", "Also me at the fridge every 20 min", "🍕"],
  ["Studying for 5 minutes", "Me: time to reward myself for 40", "🎮"],
  ["Me: I'll just check one notification", "Two hours later: what year is it", "📱"],
  ["Motivation: gone", "Deadline: hello", "🚨"],
  ["POV: you closed 3 tabs", "Chrome: here are 9 new ones", "🗂️"],
  ["Wifi: 5 bars", "Me: still can't load my homework", "📶"],
  ["Coffee: kicks in", "Me: I can solve any problem", "☕"],
  ["Me: I'll be productive today", "Day: 'ok but what if no'", "🫠"],
  ["Sigma grindset", "Also me: rewatching the same episode again", "📺"],
];

export const BREAK_QUESTS = [
  "Drink a full glass of water. Slowly. Like a legend.",
  "Stand up and stretch like you just woke up in a movie.",
  "Look out the window for 20 seconds. Yes, it counts.",
  "Do 10 squats. Nobody's watching. Probably.",
  "Text someone you like something nice.",
  "Dance to one full song. No half-vibing.",
  "Walk to another room and back. Quest complete.",
  "Roll your shoulders 10 times. Your neck says thanks.",
  "Take 5 slow breaths. In through the nose, out with attitude.",
  "Step outside for 2 minutes. Real grass preferred.",
];

export const HYDRATE_LINES = [
  "Hydrate or diedrate, bestie. Sip time.",
  "Water check. Your body is 60 percent water, let's keep it that way.",
  "Bro, drink something. I'm not asking twice.",
];

export const FOCUS_DONE_LINES = [
  "Lock-in complete. That was a W. Go touch grass for 5.",
  "Timer's done. You ate that session. Take a break.",
  "Focus session cleared. Aura up. Stretch time.",
];

export const BALL_ANSWERS = [
  "No cap, yes.",
  "Bet.",
  "Ask again after a snack.",
  "It's giving... maybe.",
  "Hard pass, chief.",
  "Big yikes. No.",
  "100 percent. Send it.",
  "The vibes say wait.",
  "Not in this economy.",
  "Absolutely, main character.",
  "Cannot predict. I'm a ball, not a professor.",
  "Down bad? Slow down. Ask again.",
];

export const REFLEX_RANKS = [
  [180, "Inhuman. Are you a bot? Respect."],
  [250, "Sweaty gamer reflexes. Certified."],
  [330, "Solid. Main character speed."],
  [450, "Mid. Coffee might help."],
  [Infinity, "NPC loading... try again."],
];

export const LEVELS = [
  [0, "NPC"],
  [100, "Side Character"],
  [300, "Main Character"],
  [700, "Certified Menace"],
  [1500, "Sigma Legend"],
  [3000, "Final Boss"],
];

// Background scenes: name + two/three colors used by the CSS variables.
export const SCENES = [
  { name: "Synthwave sunset", c1: "#ff4d8d", c2: "#7b2ff7", c3: "#1a1040" },
  { name: "Matcha latte", c1: "#8fd694", c2: "#2f9e8f", c3: "#0f2e2b" },
  { name: "Cotton candy", c1: "#ffb3e6", c2: "#8ec5ff", c3: "#3a2a5c" },
  { name: "Midnight city", c1: "#3a86ff", c2: "#3a0ca3", c3: "#080b1e" },
  { name: "Lava lamp", c1: "#ff9e00", c2: "#ff3d54", c3: "#3d0b2b" },
];

export const FAKE_DOC_TITLE = "Q3 Synergy Alignment Report.docx";
export const FAKE_DOC_LINES = [
  "Executive Summary",
  "In order to leverage cross-functional synergies, stakeholders should circle back on the key deliverables and align on next steps going forward.",
  "1.1 Strategic Overview",
  "Moving the needle on scalable outcomes requires a holistic paradigm shift in our value-add proposition.",
  "1.2 Action Items",
  "Touch base offline. Ping the team. Take this conversation to the next level.",
];
