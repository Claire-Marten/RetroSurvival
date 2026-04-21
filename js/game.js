const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const SPAWN_INTERVAL = 1.5;
const WAVE_CLEAR_DURATION = 2.0;

// Input
const keys = {};
let mouseX = W / 2;
let mouseY = H / 2;

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) * (W / rect.width);
  mouseY = (e.clientY - rect.top) * (H / rect.height);
});

// Game state
let state = 'menu';

function drawBackground() {
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function draw() {
  drawBackground();

  if (state === 'menu') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 68px monospace';
    ctx.fillStyle = '#e94560';
    ctx.shadowColor = '#e94560';
    ctx.shadowBlur = 24;
    ctx.fillText('SURVIVE', W / 2, H / 2 - 60);
    ctx.shadowBlur = 0;
    ctx.font = '16px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('3 WAVES · 3 LIVES · NO MERCY', W / 2, H / 2 - 10);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#e94560';
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 500);
    ctx.fillText('CLICK TO PLAY', W / 2, H / 2 + 46);
    ctx.restore();
  }
}

function update(dt) {
  // gameplay update added in later tasks
}

canvas.addEventListener('click', () => {
  if (state === 'menu') {
    // initGame() added in Task 4
    state = 'playing';
  }
});

let lastTime = 0;
function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(loop); });
