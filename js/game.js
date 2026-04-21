const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const SPAWN_INTERVALS = [1.2, 1.0, 0.8];
const WAVE_CLEAR_DURATION = 2.0;

// Input
const keys = {};
let mouseX = W / 2;
let mouseY = H / 2;
let pendingShot = false;

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
let player, enemies, bullets, particles;
let waveIndex = 0;
let spawnQueue = [];
let spawnTimer = 0;
let waveClearTimer = 0;
let waveClearPhase = 'complete';

function initGame() {
  player = new Player(W / 2, H / 2);
  enemies = [];
  bullets = [];
  particles = [];
  waveIndex = 0;
  startWave(0);
}

function startWave(index) {
  spawnQueue = [...WAVES[index]].sort(() => Math.random() - 0.5);
  spawnTimer = 0;
  enemies = [];
  bullets = [];
  particles = [];
}

function spawnParticles(x, y, color) {
  const count = 6;
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function spawnInterval() {
  return SPAWN_INTERVALS[waveIndex] ?? SPAWN_INTERVALS[SPAWN_INTERVALS.length - 1];
}

function spawnEnemy(type) {
  let x, y, attempts = 0;
  do {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0)      { x = Math.random() * W; y = 0; }
    else if (edge === 1) { x = W;                 y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H; }
    else                 { x = 0;                 y = Math.random() * H; }
    attempts++;
  } while (attempts < 20 && enemies.some(e => Math.hypot(e.x - x, e.y - y) < 60));
  enemies.push(new Enemy(type, x, y));
}

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

function drawHeart(x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(7, 12);
  ctx.bezierCurveTo(7, 10, 0, 7, 0, 4);
  ctx.bezierCurveTo(0, 0, 7, 0, 7, 4);
  ctx.bezierCurveTo(7, 0, 14, 0, 14, 4);
  ctx.bezierCurveTo(14, 7, 7, 10, 7, 12);
  ctx.fillStyle = filled ? '#e94560' : '#2a2a4a';
  if (filled) { ctx.shadowColor = '#e94560'; ctx.shadowBlur = 8; }
  ctx.fill();
  ctx.restore();
}

function drawCrosshair() {
  ctx.save();
  ctx.strokeStyle = 'rgba(233,69,96,0.6)';
  ctx.lineWidth = 1;
  const r = 8;
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mouseX - r - 4, mouseY); ctx.lineTo(mouseX + r + 4, mouseY);
  ctx.moveTo(mouseX, mouseY - r - 4); ctx.lineTo(mouseX, mouseY + r + 4);
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.save();
  ctx.shadowBlur = 0;

  // Health — top left
  ctx.font = '10px monospace';
  ctx.fillStyle = '#555';
  ctx.textAlign = 'left';
  ctx.fillText('HEALTH', 14, 18);
  for (let i = 0; i < player.maxHp; i++) drawHeart(14 + i * 22, 24, i < player.hp);

  // Wave counter — top centre
  ctx.textAlign = 'center';
  ctx.font = '10px monospace';
  ctx.fillStyle = '#555';
  ctx.fillText('WAVE', W / 2, 18);
  ctx.font = 'bold 26px monospace';
  ctx.fillStyle = '#e94560';
  ctx.shadowColor = '#e94560';
  ctx.shadowBlur = 12;
  ctx.fillText(`${waveIndex + 1} / ${WAVES.length}`, W / 2, 46);
  ctx.shadowBlur = 0;

  // Enemies remaining — top right (alive + not yet spawned)
  ctx.textAlign = 'right';
  ctx.font = '10px monospace';
  ctx.fillStyle = '#555';
  ctx.fillText('ENEMIES', W - 14, 18);
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#ff6b35';
  ctx.shadowColor = '#ff6b35';
  ctx.shadowBlur = 8;
  ctx.fillText(String(enemies.length + spawnQueue.length), W - 14, 42);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawOverlay(title, subs) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,10,26,0.85)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px monospace';
  ctx.fillStyle = '#e94560';
  ctx.shadowColor = '#e94560';
  ctx.shadowBlur = 20;
  ctx.fillText(title, W / 2, H / 2 - 30);
  ctx.shadowBlur = 0;
  ctx.font = '18px monospace';
  ctx.fillStyle = '#aaa';
  subs.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 + 20 + i * 32));
  ctx.restore();
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
    return;
  }

  for (const p of particles) p.draw(ctx);
  for (const b of bullets) b.draw(ctx);
  for (const e of enemies) if (!e.dead) e.draw(ctx);
  player.draw(ctx);
  drawHUD();
  drawCrosshair();

  if (state === 'wave-clear') {
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,26,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    const msg = waveClearPhase === 'complete'
      ? `WAVE ${waveIndex + 1} COMPLETE`
      : `WAVE ${waveIndex + 2} INCOMING...`;
    const color = waveClearPhase === 'complete' ? '#ffd166' : '#e94560';
    ctx.font = 'bold 44px monospace';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillText(msg, W / 2, H / 2);
    ctx.restore();
  } else if (state === 'game-over') {
    drawOverlay('GAME OVER', ['Click to Restart']);
  } else if (state === 'win') {
    drawOverlay('YOU SURVIVED', ['All 3 Waves Cleared', 'Click to Play Again']);
  }
}

function checkCollisions() {
  for (const bullet of bullets) {
    if (bullet.dead) continue;
    if (bullet.owner === 'player') {
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < enemy.radius + bullet.radius) {
          enemy.takeDamage();
          if (enemy.dead) spawnParticles(enemy.x, enemy.y, enemy.color);
          bullet.dead = true;
          break;
        }
      }
    } else {
      if (Math.hypot(player.x - bullet.x, player.y - bullet.y) < player.radius + bullet.radius) {
        if (player.takeDamage()) bullet.dead = true;
      }
    }
  }
}

function update(dt) {
  if (state === 'playing')         updatePlaying(dt);
  else if (state === 'wave-clear') updateWaveClear(dt);
}

function updatePlaying(dt) {
  if (pendingShot) {
    const b = player.shoot(mouseX, mouseY);
    if (b) bullets.push(b);
    pendingShot = false;
  }

  player.update(dt, keys, mouseX, mouseY);

  // Spawn next enemy from queue
  if (spawnQueue.length > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy(spawnQueue.shift());
      spawnTimer = spawnInterval();
    }
  }

  // Move enemies and collect their bullets
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    enemy.update(dt, player.x, player.y);
    const newBullets = enemy.tryShoot(player.x, player.y);
    bullets.push(...newBullets);
  }

  for (const bullet of bullets) {
    bullet.update(dt);
    if (bullet.isOutOfBounds()) bullet.dead = true;
  }
  checkCollisions();

  enemies = enemies.filter(e => !e.dead);
  bullets = bullets.filter(b => !b.dead);
  for (const p of particles) p.update(dt);
  particles = particles.filter(p => !p.dead);

  if (player.hp <= 0) { state = 'game-over'; return; }

  if (spawnQueue.length === 0 && enemies.length === 0) {
    if (waveIndex === WAVES.length - 1) {
      state = 'win';
    } else {
      state = 'wave-clear';
      waveClearTimer = WAVE_CLEAR_DURATION;
      waveClearPhase = 'complete';
    }
  }
}

function updateWaveClear(dt) {
  waveClearTimer -= dt;
  if (waveClearTimer <= 0) {
    if (waveClearPhase === 'complete') {
      waveClearPhase = 'incoming';
      waveClearTimer = WAVE_CLEAR_DURATION;
    } else {
      waveIndex++;
      startWave(waveIndex);
      state = 'playing';
    }
  }
}

canvas.addEventListener('click', () => {
  if (state === 'menu')                         { initGame(); state = 'playing'; return; }
  if (state === 'game-over' || state === 'win') { initGame(); state = 'playing'; return; }
  if (state === 'playing') pendingShot = true;
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
