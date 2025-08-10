import { buildDeck, Scheduler } from './scheduler.js';
import { stableQuestionColor, hsvToHex } from './colors.js';
import { Confetti } from './confetti.js';
import * as storage from './storage.js';

const DEFAULT_TABLE = 3;
const FAST_THRESHOLD_SEC = 3.0;
const HINT_DELAY_MS = 10000;
const TIMER_INTERVAL_MS = 250;
const TICK_SOUND = false;

const CHEERS = [
  'Well done Albert!',
  'Good job Biro!',
  'Amazing Albert!',
  'Great work, Biro!',
  'Superb, Albert!',
  'You rock, Biro!',
];

let cards = [];
let sched = null;
let card = null;
let questionStart = null;
let hintTimeout = null;
let hintMode = 'placeholder';
let confetti = null;
let stars = 0;
let colorHue = 0;
let bgHue = 0.65;
let lastSecond = -1;
let userIp = 'unknown';

const sideEl = document.getElementById('side');
const timesList = document.getElementById('times');
const qEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const answerDisplay = document.getElementById('answerDisplay');
const keypadEl = document.getElementById('keypad');
const checkBtn = document.getElementById('check');
const feedbackEl = document.getElementById('feedback');
const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('status');
const toggleHintBtn = document.getElementById('toggleHint');
const skipBtn = document.getElementById('skip');
const exitBtn = document.getElementById('exit');
const canvas = document.getElementById('hintCanvas');
const ctx = canvas.getContext('2d');
const progressEl = document.getElementById('progress');
const headerEl = document.getElementById('top');
const celebrationEl = document.getElementById('celebration');
const goalVideo = document.getElementById('goalVideo');
const cheerAudio = document.getElementById('cheerAudio');
const booAudio = document.getElementById('booAudio');
const tableSelect = document.getElementById('tableSelect');

[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach((n) => {
  const btn = document.createElement('button');
  btn.textContent = String(n);
  btn.dataset.digit = String(n);
  keypadEl.appendChild(btn);
});

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.width * 0.525;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

fetch('https://api.ipify.org?format=json')
  .then((r) => r.json())
  .then((d) => {
    userIp = d.ip;
  })
  .catch(() => {})
  .finally(() => {
    storage.appendUsage({ timestamp: new Date().toISOString(), ip: userIp, event: 'start' });
  });

checkBtn.addEventListener('click', check);
skipBtn.addEventListener('click', skip);
exitBtn.addEventListener('click', exitApp);
toggleHintBtn.addEventListener('click', toggleHint);
keypadEl.addEventListener('click', (e) => {
  if (e.target.matches('button')) {
    const digit = e.target.dataset.digit;
    if (typeof digit !== 'undefined' && !answerEl.disabled) {
      answerEl.value += digit;
      answerDisplay.textContent = answerEl.value;
    }
  }
});
tableSelect.addEventListener('change', () => {
  init(parseInt(tableSelect.value, 10));
});

function init(table) {
  if (hintTimeout) {
    clearTimeout(hintTimeout);
    hintTimeout = null;
  }
  tableSelect.value = String(table);
  cards = buildDeck([[table, 1, 12]]);
  const stored = storage.load();
  cards.forEach((c) => {
    const rec = stored[c.key];
    if (rec) {
      c.box = rec.box || 0;
      c.streak = rec.streak || 0;
      c.avgTime = rec.avg_time || null;
      c.attempts = rec.attempts || 0;
      c.corrects = rec.corrects || 0;
    }
  });
  sched = new Scheduler(cards);
  card = null;
  questionStart = null;
  hintMode = 'placeholder';
  confetti = null;
  stars = 0;
  timesList.innerHTML = '';
  progressEl.max = cards.length;
  updateStatus();
  nextQuestion();
}

function totalMastered() {
  return cards.filter((c) => c.mastered()).length;
}

function updateStatus() {
  progressEl.value = totalMastered();
  statusEl.textContent = `Streak ${card ? card.streak : 0} | Stars ${stars} | Mastered ${totalMastered()}/${cards.length}`;
}

function saveProgress() {
  const data = {};
  cards.forEach((c) => {
    data[c.key] = {
      box: c.box,
      streak: c.streak,
      avg_time: c.avgTime,
      attempts: c.attempts,
      corrects: c.corrects,
    };
  });
  storage.save(data);
}

function speak(text, onDone) {
  if (!('speechSynthesis' in window)) {
    onDone && setTimeout(onDone, 500);
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.onend = () => setTimeout(() => onDone && onDone(), 500);
  try {
    window.speechSynthesis.speak(u);
  } catch {
    onDone && setTimeout(onDone, 500);
  }
}

function nextQuestion() {
  card = sched.nextCard();
  if (!card) {
    alert('Awesome! You mastered all cards for this set.');
    saveProgress();
    return;
  }
  qEl.textContent = `What is ${card.a} × ${card.b} ?`;
  qEl.style.color = stableQuestionColor(card.a, card.b);
  if (goalVideo) {
    const src = card.a === 4 && card.b === 9 ? '/assets/ronaldo_.mp4' : '/assets/videoshort.mp4';
    if (goalVideo.getAttribute('src') !== src) {
      goalVideo.setAttribute('src', src);
    }
    goalVideo.load();
  }
  if (cheerAudio) {
    cheerAudio.load();
  }
  answerEl.disabled = false;
  checkBtn.disabled = false;
  answerEl.value = '';
  answerDisplay.textContent = '';
  keypadEl.querySelectorAll('button').forEach((b) => (b.disabled = false));
  feedbackEl.textContent = '';
  feedbackEl.style.color = '#93c5fd';
  hintMode = 'placeholder';
  if (hintTimeout) clearTimeout(hintTimeout);
  hintTimeout = setTimeout(showArrayHint, HINT_DELAY_MS);
  questionStart = performance.now();
  updateStatus();
  speak(`What is ${card.a} times ${card.b}?`);
}

function showArrayHint() {
  hintMode = 'array';
}
function showNumberLineHint() {
  hintMode = 'line';
}
function toggleHint() {
  if (hintMode === 'placeholder') {
    showArrayHint();
  } else if (hintMode === 'array') {
    showNumberLineHint();
  } else {
    showArrayHint();
  }
}

function logTime(a, b, elapsed, correct, fast) {
  const li = document.createElement('li');
  li.textContent = `${a}×${b} ${elapsed.toFixed(1)}s`;
  if (fast) li.textContent += ' ⚡';
  li.textContent += correct ? ' ✅' : ' ✖';
  timesList.appendChild(li);
  timesList.scrollTop = timesList.scrollHeight;
}

function recordUsage(a, b, elapsed, correct) {
  storage.appendUsage({
    timestamp: new Date().toISOString(),
    ip: userIp,
    a,
    b,
    elapsed,
    correct,
  });
}

function playCelebration() {
  if (
    !goalVideo ||
    !cheerAudio ||
    !goalVideo.getAttribute('src') ||
    !cheerAudio.getAttribute('src')
  ) {
    return;
  }
  celebrationEl.style.display = 'flex';
  goalVideo.currentTime = 0;
  cheerAudio.currentTime = 0;
  goalVideo
    .play()
    .catch(() => {
      celebrationEl.style.display = 'none';
    });
  cheerAudio.play().catch(() => {});
  goalVideo.onended = () => {
    celebrationEl.style.display = 'none';
  };
}

function check() {
  if (!card) return;
  const txt = answerEl.value.trim();
  if (!/^\d+$/.test(txt)) {
    feedbackEl.textContent = 'Please tap a number.';
    return;
  }
  const u = parseInt(txt, 10);
  const ans = card.a * card.b;
  const elapsed = (performance.now() - questionStart) / 1000;
  card.record(u === ans, elapsed);
  const fast = elapsed <= FAST_THRESHOLD_SEC;
  logTime(card.a, card.b, elapsed, u === ans, fast);
  recordUsage(card.a, card.b, elapsed, u === ans);
  if (hintTimeout) {
    clearTimeout(hintTimeout);
    hintTimeout = null;
  }
  answerEl.disabled = true;
  checkBtn.disabled = true;
  keypadEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
  if (u === ans) {
    const msg = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    feedbackEl.textContent = `${msg} (${elapsed.toFixed(1)}s)`;
    feedbackEl.style.color = '#22c55e';
    stars += 1;
    sched.reschedule(card, true, fast);
    speak(`${msg} ${card.a} times ${card.b} equals ${ans}.`, nextQuestion);
    confetti = new Confetti(canvas.width, canvas.height);
    playCelebration();
  } else {
    feedbackEl.textContent = `Not quite. It's ${ans}.`;
    feedbackEl.style.color = '#ef4444';
    stars = Math.max(0, stars - 1);
    sched.reschedule(card, false, false);
    showNumberLineHint();
    if (booAudio && booAudio.getAttribute('src')) {
      booAudio.currentTime = 0;
      booAudio.play().catch(() => {});
    }
    speak(`Not quite. ${card.a} times ${card.b} is ${ans}.`, nextQuestion);
  }
  saveProgress();
}

function skip() {
  if (card) sched.reschedule(card, false, false);
  nextQuestion();
}

function exitApp() {
  storage.clear();
  window.location.reload();
}

function tickTimer() {
  if (questionStart) {
    const elapsed = (performance.now() - questionStart) / 1000;
    timerEl.textContent = `${elapsed.toFixed(1)}s`;
    const whole = Math.floor(elapsed);
    if (TICK_SOUND && whole !== lastSecond) {
      lastSecond = whole;
      const ctxA = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctxA.createOscillator();
      const gain = ctxA.createGain();
      osc.frequency.value = 750;
      gain.gain.value = 0.1;
      osc.connect(gain).connect(ctxA.destination);
      osc.start();
      osc.stop(ctxA.currentTime + 0.04);
    }
  }
}
setInterval(tickTimer, TIMER_INTERVAL_MS);

function drawPlaceholder() {
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Try it in your head…', canvas.width / 2, 40);
}

function drawArray() {
  const rows = card.a;
  const cols = card.b;
  const w = canvas.width;
  const h = canvas.height;
  const pad = 40;
  const gridW = w - 2 * pad;
  const gridH = h - 2 * pad;
  const dotR = Math.max(6, Math.min(14, gridW / (cols * 3)));
  const xSpacing = gridW / (cols + 1);
  const ySpacing = gridH / (rows + 1);
  colorHue = (colorHue + 0.01) % 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + (c + 1) * xSpacing;
      const y = pad + (r + 1) * ySpacing;
      const hCol = (colorHue + (r * cols + c) * 0.012) % 1;
      ctx.fillStyle = hsvToHex(hCol, 0.75, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${rows} rows × ${cols} columns`, w / 2, 22);
}

function drawNumberLine() {
  const a = card.a;
  const b = card.b;
  const total = a * b;
  const w = canvas.width;
  const h = canvas.height;
  const pad = 40;
  const y = h / 2;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(w - pad, y);
  ctx.stroke();
  const ticks = b + 1;
  const span = w - 2 * pad;
  for (let i = 0; i <= ticks; i++) {
    const x = pad + (i * span) / ticks;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i * a), x, y + 22);
  }
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 3;
  for (let i = 1; i <= b; i++) {
    const x1 = pad + ((i - 1) * span) / b;
    const x2 = pad + (i * span) / b;
    const xm = (x1 + x2) / 2;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.quadraticCurveTo(xm, y - 30, x2, y);
    ctx.stroke();
    ctx.fillStyle = '#93c5fd';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`+${a}`, xm, y - 42);
  }
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Number line: ${a} repeated ${b} times = ${total}`, w / 2, 22);
}

function render() {
  bgHue = (bgHue + 0.0015) % 1;
  const bg = hsvToHex(bgHue, 0.2, 0.95);
  const panel = hsvToHex((bgHue + 0.08) % 1, 0.15, 0.9);
  document.body.style.background = bg;
  sideEl.style.background = bg;
  headerEl.style.background = panel;
  canvas.style.background = panel;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (hintMode === 'array') drawArray();
  else if (hintMode === 'line') drawNumberLine();
  else drawPlaceholder();
  if (confetti && confetti.alive) {
    confetti.draw(ctx);
  }
  requestAnimationFrame(render);
}

init(DEFAULT_TABLE);
render();
