const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WAVE_CLEAR_DURATION = 2.0;

// Input
const keys = {};
let mouseX = W / 2;
let mouseY = H / 2;
let pendingShot = false;

document.addEventListener('keydown', e => {
  if (state === 'enter-initials') { handleInitialsKey(e.key); e.preventDefault(); return; }
  if (state === 'game-over' && e.key === ' ') { initAudio(); initGame(); state = 'playing'; return; }
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
let initialsEntry = ['A', 'A', 'A'];
let initialsSlot = 0;

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

function handleInitialsKey(key) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idx = letters.indexOf(initialsEntry[initialsSlot]);
  if (key === 'ArrowUp')   initialsEntry[initialsSlot] = letters[(idx + 1) % 26];
  if (key === 'ArrowDown') initialsEntry[initialsSlot] = letters[(idx + 25) % 26];
  if (key === 'ArrowRight' || key === 'Enter') {
    if (initialsSlot < 2) {
      initialsSlot++;
    } else {
      saveScore(initialsEntry, score);
      state = 'win';
    }
  }
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
  ctx.fillStyle = filled ? '#00d4ff' : '#2a2a4a';
  if (filled) { ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 8; }
  ctx.fill();
  ctx.restore();
}

function drawCrosshair() {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,212,255,0.6)';
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

function drawLeaderboard(centreX, startY) {
  const scores = loadScores();
  const entries = [...scores, ...Array(MAX_SCORES).fill(null)].slice(0, MAX_SCORES);
  ctx.textAlign = 'center';
  ctx.font = '10px monospace';
  ctx.fillStyle = '#555';
  ctx.fillText('HIGH SCORES', centreX, startY);
  entries.forEach((entry, i) => {
    const y = startY + 26 + i * 26;
    ctx.font = i === 0 ? 'bold 14px monospace' : '13px monospace';
    ctx.fillStyle = i === 0 ? '#ffd166' : '#aaa';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}.`, centreX - 110, y);
    ctx.fillText(entry ? entry.initials : '---', centreX - 80, y);
    ctx.textAlign = 'right';
    ctx.fillText(entry ? String(entry.score).padStart(6, '0') : '------', centreX + 110, y);
  });
}

function drawInitialsEntry() {
  drawBackground();
  ctx.save();
  ctx.textAlign = 'center';

  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = '#ffd166';
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 16;
  ctx.fillText('NEW HIGH SCORE', W / 2, 120);
  ctx.shadowBlur = 0;

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#e94560';
  ctx.shadowColor = '#e94560';
  ctx.shadowBlur = 10;
  ctx.fillText(String(score).padStart(6, '0'), W / 2, 162);
  ctx.shadowBlur = 0;

  ctx.font = '11px monospace';
  ctx.fillStyle = '#555';
  ctx.fillText('↑ ↓  CHANGE     →  NEXT', W / 2, 196);

  const slotW = 52, slotH = 60, gap = 18;
  const totalW = 3 * slotW + 2 * gap;
  const startX = W / 2 - totalW / 2;
  const slotY = 220;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (slotW + gap);
    const active = i === initialsSlot;
    const pulse = active ? 0.5 + 0.5 * Math.sin(Date.now() / 180) : 0;
    ctx.strokeStyle = active ? '#e94560' : '#30363d';
    ctx.lineWidth = 2;
    if (active) { ctx.shadowColor = '#e94560'; ctx.shadowBlur = 8 + pulse * 10; }
    ctx.strokeRect(x, slotY, slotW, slotH);
    ctx.shadowBlur = 0;
    ctx.font = 'bold 38px monospace';
    ctx.fillStyle = active ? '#e94560' : '#666';
    ctx.textAlign = 'center';
    ctx.fillText(initialsEntry[i], x + slotW / 2, slotY + slotH - 10);
  }

  drawLeaderboard(W / 2, 340);
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

  if (state === 'enter-initials') { drawInitialsEntry(); return; }

  if (state === 'menu') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 68px monospace';
    ctx.fillStyle = '#e94560';
    ctx.shadowColor = '#e94560';
    ctx.shadowBlur = 24;
    ctx.fillText('SURVIVE', W / 2, 100);
    ctx.shadowBlur = 0;
    ctx.font = '16px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('3 WAVES · 3 LIVES · NO MERCY', W / 2, 148);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#e94560';
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 500);
    ctx.fillText('CLICK TO PLAY', W / 2, 188);
    ctx.globalAlpha = 1;
    ctx.restore();
    drawLeaderboard(W / 2, 230);
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
    drawOverlay('GAME OVER', ['Space to Restart']);
    drawLeaderboard(W / 2, H / 2 + 50);
  } else if (state === 'win') {
    drawOverlay('YOU SURVIVED', ['Click to Play Again']);
    drawLeaderboard(W / 2, H / 2 + 50);
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
      if (isHighScore(score)) {
        initialsEntry = ['A', 'A', 'A'];
        initialsSlot = 0;
        state = 'enter-initials';
      } else {
        state = 'win';
      }
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
  if (state === 'menu') { initAudio(); initGame(); state = 'playing'; return; }
  if (state === 'win')  { initAudio(); initGame(); state = 'playing'; return; }
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
