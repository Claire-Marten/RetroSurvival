const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const SPAWN_INTERVAL = 1.5;
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
let player, enemies, bullets;
let waveIndex = 0;
let spawnQueue = [];
let spawnTimer = 0;
let waveClearTimer = 0;
let waveClearPhase = 'complete';

function initGame() {
  player = new Player(W / 2, H / 2);
  enemies = [];
  bullets = [];
  waveIndex = 0;
  startWave(0);
}

function startWave(index) {
  spawnQueue = [...WAVES[index]].sort(() => Math.random() - 0.5);
  spawnTimer = 0;
  enemies = [];
  bullets = [];
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

  for (const b of bullets) b.draw(ctx);
  for (const e of enemies) if (!e.dead) e.draw(ctx);
  player.draw(ctx);
}

function checkCollisions() {
  for (const bullet of bullets) {
    if (bullet.dead) continue;
    if (bullet.owner === 'player') {
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < enemy.radius + bullet.radius) {
          enemy.takeDamage();
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
      spawnTimer = SPAWN_INTERVAL;
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
