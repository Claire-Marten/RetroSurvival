const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
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
let player, enemies, bullets, particles, score;
let waveIndex = 0;
let waveTimer = 0;
let spawnTimer = 0;
let waveClearTimer = 0;
let waveClearPhase = 'complete';
let powerup = null;
let powerupSpawnTimer = 0;
let tripleShotTimer = 0;

function initGame() {
  player = new Player(W / 2, H / 2);
  enemies = [];
  bullets = [];
  particles = [];
  score = 0;
  waveIndex = 0;
  startWave(0);
}

function startWave(index) {
  waveTimer = WAVE_DURATION;
  spawnTimer = 0;
  enemies = [];
  bullets = [];
  particles = [];
  powerup = null;
  powerupSpawnTimer = WAVES[index].powerupTime;
}

function spawnParticles(x, y, color) {
  const count = 6;
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function randomEnemyType() {
  const weights = WAVES[waveIndex].weights;
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return type;
  }
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

  // Wave timer — top right
  const timeLeft = Math.ceil(waveTimer);
  const timerColor = timeLeft <= 5 ? '#ffd166' : '#aaa';
  ctx.textAlign = 'right';
  ctx.font = '10px monospace';
  ctx.fillStyle = '#555';
  ctx.fillText('TIME', W - 14, 18);
  ctx.font = 'bold 26px monospace';
  ctx.fillStyle = timerColor;
  ctx.shadowColor = timerColor;
  ctx.shadowBlur = timeLeft <= 5 ? 12 : 0;
  ctx.fillText(`${timeLeft}s`, W - 14, 46);
  ctx.shadowBlur = 0;

  // Triple shot indicator — bottom left
  if (tripleShotTimer > 0) {
    ctx.textAlign = 'left';
    ctx.font = '10px monospace';
    ctx.fillStyle = '#555';
    ctx.fillText('POWER', 14, H - 30);
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#a78bfa';
    ctx.shadowColor = '#a78bfa';
    ctx.shadowBlur = 10;
    ctx.fillText(`TRIPLE  ${Math.ceil(tripleShotTimer)}s`, 14, H - 12);
    ctx.shadowBlur = 0;
  }

  // Score — bottom centre
  ctx.textAlign = 'center';
  ctx.font = '10px monospace';
  ctx.fillStyle = '#555';
  ctx.fillText('SCORE', W / 2, H - 30);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#e94560';
  ctx.shadowColor = '#e94560';
  ctx.shadowBlur = 10;
  ctx.fillText(String(score).padStart(6, '0'), W / 2, H - 12);
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
  if (powerup) powerup.draw(ctx);
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
    drawOverlay('YOU SURVIVED', [`Score: ${String(score).padStart(6, '0')}`, 'All 3 Waves Cleared', 'Click to Play Again']);
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
          if (enemy.dead) { score += enemy.scoreValue; spawnParticles(enemy.x, enemy.y, enemy.color); playEnemyDeath(); }
          bullet.dead = true;
          break;
        }
      }
    } else {
      if (Math.hypot(player.x - bullet.x, player.y - bullet.y) < player.radius + bullet.radius) {
        if (player.takeDamage()) { bullet.dead = true; playPlayerHit(); }
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
    const bs = player.shoot(mouseX, mouseY, tripleShotTimer > 0);
    if (bs) { bullets.push(...bs); playShoot(); }
    pendingShot = false;
  }

  player.update(dt, keys, mouseX, mouseY);

  // Wave countdown
  waveTimer -= dt;

  // Continuous enemy spawning
  spawnTimer -= dt;
  if (spawnTimer <= 0 && waveTimer > 0) {
    spawnEnemy(randomEnemyType());
    spawnTimer = WAVES[waveIndex].spawnRate;
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

  // Powerup spawn
  if (powerupSpawnTimer > 0) {
    powerupSpawnTimer -= dt;
    if (powerupSpawnTimer <= 0 && !powerup) {
      powerup = new Powerup(
        80 + Math.random() * (W - 160),
        80 + Math.random() * (H - 160)
      );
    }
  }

  // Powerup update and pickup
  if (powerup) {
    powerup.update(dt);
    if (powerup.dead) {
      powerup = null;
    } else if (Math.hypot(player.x - powerup.x, player.y - powerup.y) < player.radius + powerup.radius) {
      tripleShotTimer = 8;
      powerup = null;
    }
  }

  tripleShotTimer = Math.max(0, tripleShotTimer - dt);

  if (waveTimer <= 0) {
    enemies = [];
    bullets = [];
    powerup = null;
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
  if (state === 'menu')                         { initAudio(); initGame(); state = 'playing'; return; }
  if (state === 'game-over' || state === 'win') { initAudio(); initGame(); state = 'playing'; return; }
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
