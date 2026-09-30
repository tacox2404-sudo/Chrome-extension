import { BALL_ANSWERS, REFLEX_RANKS } from "./slang.js";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- Snake ---------- */
export function createSnake(canvas, { onScore, onEnd }) {
  const ctx = canvas.getContext("2d");
  const N = 16;
  const size = canvas.width / N;
  let snake, dir, nextDir, apple, score, timer, running = false;

  const spawnApple = () => {
    do {
      apple = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
    } while (snake.some((s) => s.x === apple.x && s.y === apple.y));
  };

  const draw = () => {
    ctx.fillStyle = "#12081f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${size - 2}px serif`;
    ctx.textBaseline = "top";
    ctx.fillText("🍎", apple.x * size, apple.y * size + 1);
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#a7ff83" : "#4ade80";
      ctx.beginPath();
      ctx.roundRect(s.x * size + 1, s.y * size + 1, size - 2, size - 2, 5);
      ctx.fill();
    });
  };

  const tick = () => {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const dead = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || snake.some((s) => s.x === head.x && s.y === head.y);
    if (dead) return end();
    snake.unshift(head);
    if (head.x === apple.x && head.y === apple.y) {
      score++;
      onScore(score);
      spawnApple();
    } else {
      snake.pop();
    }
    draw();
  };

  const end = () => {
    stop();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Skill issue. Go again.", canvas.width / 2, canvas.height / 2 - 12);
    ctx.textAlign = "start";
    onEnd(score);
  };

  const key = (e) => {
    const map = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    const m = map[e.key];
    if (!m || !running) return;
    e.preventDefault();
    if (m[0] === -dir.x && m[1] === -dir.y) return; // no instant 180
    nextDir = { x: m[0], y: m[1] };
  };

  function start() {
    stop();
    snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
    dir = nextDir = { x: 1, y: 0 };
    score = 0;
    onScore(0);
    spawnApple();
    draw();
    running = true;
    document.addEventListener("keydown", key);
    timer = setInterval(tick, 115);
  }

  function stop() {
    running = false;
    clearInterval(timer);
    document.removeEventListener("keydown", key);
  }

  snake = [{ x: 8, y: 8 }];
  apple = { x: 12, y: 8 };
  draw();
  return { start, stop };
}

/* ---------- Reflex test ---------- */
export function createReflex(pad, { onResult }) {
  let state = "idle"; // idle | wait | go
  let timeout, goAt;

  const set = (s, text) => {
    state = s;
    pad.className = `pad ${s}`;
    pad.textContent = text;
  };

  const reset = () => { clearTimeout(timeout); set("idle", "Tap to start"); };

  pad.addEventListener("click", () => {
    if (state === "idle") {
      set("wait", "Wait for green...");
      timeout = setTimeout(() => { goAt = performance.now(); set("go", "NOW!"); }, 1500 + Math.random() * 2500);
    } else if (state === "wait") {
      clearTimeout(timeout);
      set("idle", "Too early, bestie. Tap to retry.");
    } else {
      const ms = Math.round(performance.now() - goAt);
      const rank = REFLEX_RANKS.find(([lim]) => ms <= lim)[1];
      set("idle", `${ms} ms. ${rank} Tap to retry.`);
      onResult(ms);
    }
  });

  reset();
  return { stop: reset };
}

/* ---------- Vibe ball ---------- */
export function createBall(ballEl, form, input, answerEl) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!input.value.trim()) { answerEl.textContent = "Ask something first, chief."; return; }
    ballEl.classList.remove("shake");
    void ballEl.offsetWidth;
    ballEl.classList.add("shake");
    answerEl.textContent = "...";
    setTimeout(() => { answerEl.textContent = pick(BALL_ANSWERS); }, 600);
  });
}
