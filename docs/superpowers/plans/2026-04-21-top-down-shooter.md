# Top-Down Shooter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable browser top-down shooter where the player survives 3 waves of enemies using arrow keys to move and mouse clicks to shoot.

**Architecture:** Pure vanilla HTML5 Canvas, no dependencies. `index.html` loads three JS files in order: `js/waves.js` (data), `js/entities.js` (classes), `js/game.js` (loop + rendering + state). All game objects live in plain arrays; no build step required — open `index.html` directly in a browser to play.

**Tech Stack:** HTML5 Canvas API, vanilla ES6 JavaScript, no libraries.

**Note on testing:** This is a pure browser game with no build system or test runner. Each task ends with an explicit browser verification checklist. Pass every item before committing.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Canvas element, page styles, script load order |
| `js/waves.js` | `WAVES` array — wave definitions; also defines globals `W=800` and `H=600` |
| `js/entities.js` | `Player`, `Bullet`, `Enemy` classes; `ENEMY_TYPES` config |
| `js/game.js` | Game loop, state machine, input, collision detection, all rendering |

---

### Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `js/waves.js`
- Create: `js/entities.js`
- Create: `js/game.js`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Survive</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    canvas { display: block; cursor: none; }
  </style>
</head>
<body>
  <canvas id="gameCanvas" width="800" height="600"></canvas>
  <script src="js/waves.js"></script>
  <script src="js/entities.js"></script>
  <script src="js/game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `js/waves.js` stub**

`W` and `H` live here because `waves.js` is the first script loaded — game.js and entities.js can use them as globals.

```js
const W = 800;
const H = 600;

const WAVES = []; // populated in Task 5
```

- [ ] **Step 3: Create `js/entities.js` stub**

```js
// Player, Bullet, Enemy — added in Tasks 3 and 5
```

- [ ] **Step 4: Create `js/game.js` stub**

```js
// Game loop — added in Task 2
```

- [ ] **Step 5: Verify in browser**

Open `index.html` directly in a browser (file:// URL is fine).
- Dark navy (`#0a0a1a`) page with an 800×600 rectangle visible in the center
- No console errors (open DevTools → Console)

- [ ] **Step 6: Commit**

```bash
git init
git add index.html js/waves.js js/entities.js js/game.js
git commit -m "feat: project scaffold"
```

---

### Task 2: Game Loop + Menu Screen

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Replace `js/game.js` with full game loop and menu state**

```js
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
```

- [ ] **Step 2: Verify in browser**

Reload `index.html`.
- Navy canvas with a dark grid visible (faint lines every 40px)
- "SURVIVE" in glowing crimson, subtitle, pulsing "CLICK TO PLAY" text
- No console errors
- Clicking changes `state` to `'playing'` (no visible change yet — verify via DevTools console: type `state` and press Enter, it should read `'playing'` after a click)

- [ ] **Step 3: Commit**

```bash
git add js/game.js
git commit -m "feat: game loop, background, menu screen"
```

---

### Task 3: Player + Bullet Classes

**Files:**
- Modify: `js/entities.js`

- [ ] **Step 1: Replace `js/entities.js` with Player and Bullet classes**

```js
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.speed = 180;
    this.hp = 3;
    this.maxHp = 3;
    this.angle = 0;
    this.shootCooldown = 0;
    this.invincibleTimer = 0;
  }

  update(dt, keys, mouseX, mouseY) {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'])  dx -= 1;
    if (keys['ArrowRight']) dx += 1;
    if (keys['ArrowUp'])    dy -= 1;
    if (keys['ArrowDown'])  dy += 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    this.x = Math.max(this.radius, Math.min(W - this.radius, this.x + dx * this.speed * dt));
    this.y = Math.max(this.radius, Math.min(H - this.radius, this.y + dy * this.speed * dt));
    this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
  }

  shoot(mouseX, mouseY) {
    if (this.shootCooldown > 0) return null;
    this.shootCooldown = 0.2;
    const angle = Math.atan2(mouseY - this.y, mouseX - this.x);
    return new Bullet(this.x, this.y, angle, 500, '#e94560', 4, 'player');
  }

  takeDamage() {
    if (this.invincibleTimer > 0) return false;
    this.hp -= 1;
    this.invincibleTimer = 0.6;
    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // angle from atan2 points right at 0; rotate +90° so triangle tip points "forward"
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.shadowColor = '#e94560';
    ctx.shadowBlur = 14;
    const flashing = this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0;
    ctx.fillStyle = flashing ? '#ffffff' : '#e94560';
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius * 0.65, this.radius * 0.7);
    ctx.lineTo(-this.radius * 0.65, this.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, angle, speed, color, radius, owner) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.radius = radius;
    this.owner = owner; // 'player' or 'enemy'
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  isOutOfBounds() {
    return this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
```

- [ ] **Step 2: Verify — no console errors**

Reload `index.html`. Open DevTools Console. Type:
```js
const p = new Player(400, 300); p.x
```
Expected output: `400`

Type:
```js
const b = new Bullet(100, 100, 0, 500, '#e94560', 4, 'player'); b.vx
```
Expected output: `500`

- [ ] **Step 3: Commit**

```bash
git add js/entities.js
git commit -m "feat: Player and Bullet classes"
```

---

### Task 4: Wire Player Into Game — Movement, Aim, Shooting

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Add `pendingShot` variable and update `mousemove` listener**

After the `let mouseY = H / 2;` line, add:
```js
let pendingShot = false;
```

- [ ] **Step 2: Add game-state variables for playing state**

After `let state = 'menu';`, add:
```js
let player, enemies, bullets;
let waveIndex = 0;
let spawnQueue = [];
let spawnTimer = 0;
let waveClearTimer = 0;
let waveClearPhase = 'complete';
```

- [ ] **Step 3: Add `initGame` and `startWave` functions**

Add before `drawBackground`:
```js
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
```

- [ ] **Step 4: Replace the `update` function**

```js
function update(dt) {
  if (state === 'playing') updatePlaying(dt);
}

function updatePlaying(dt) {
  if (pendingShot) {
    const b = player.shoot(mouseX, mouseY);
    if (b) bullets.push(b);
    pendingShot = false;
  }

  player.update(dt, keys, mouseX, mouseY);

  for (const bullet of bullets) {
    bullet.update(dt);
    if (bullet.isOutOfBounds()) bullet.dead = true;
  }
  bullets = bullets.filter(b => !b.dead);
}
```

- [ ] **Step 5: Update `draw` to render player and bullets in playing state**

Replace the current `draw` function with:
```js
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
  player.draw(ctx);
}
```

- [ ] **Step 6: Update the click handler to call `initGame` and set `pendingShot`**

Replace the existing click handler with:
```js
canvas.addEventListener('click', () => {
  if (state === 'menu')                         { initGame(); state = 'playing'; return; }
  if (state === 'game-over' || state === 'win') { initGame(); state = 'playing'; return; }
  if (state === 'playing') pendingShot = true;
});
```

- [ ] **Step 7: Verify in browser**

Reload and click to start.
- Crimson glowing triangle appears in the centre facing the cursor
- Arrow keys move the player; diagonal movement works
- Player cannot move off the canvas edges
- Left-clicking fires crimson bullets that travel toward where you clicked
- Rapid clicking respects the 200ms cooldown (bullets don't spray)
- Player triangle rotates as the mouse moves

- [ ] **Step 8: Commit**

```bash
git add js/game.js
git commit -m "feat: player movement, aim, and shooting"
```

---

### Task 5: Enemy Class + Wave Definitions

**Files:**
- Modify: `js/entities.js`
- Modify: `js/waves.js`

- [ ] **Step 1: Append `ENEMY_TYPES` and `Enemy` class to `js/entities.js`**

```js
const ENEMY_TYPES = {
  grunt:   { radius: 12, hp: 1, speed: 90,  fireRate: 2.0, color: '#ff6b35', pattern: 'single', bulletSpeed: 200 },
  speeder: { radius: 14, hp: 1, speed: 160, fireRate: 0.6, color: '#ffd166', pattern: 'single', bulletSpeed: 350 },
  tank:    { radius: 22, hp: 3, speed: 55,  fireRate: 1.5, color: '#c9184a', pattern: 'spread', bulletSpeed: 150 },
};

class Enemy {
  constructor(type, x, y) {
    const cfg = ENEMY_TYPES[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = cfg.radius;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.fireRate = cfg.fireRate;
    this.color = cfg.color;
    this.pattern = cfg.pattern;
    this.bulletSpeed = cfg.bulletSpeed;
    this.fireTimer = Math.random() * cfg.fireRate; // stagger initial shots
    this.spinAngle = 0;
    this.spinSpeed = (Math.random() * 1.5 + 0.5) * (Math.random() < 0.5 ? 1 : -1);
    this.dead = false;
    this.hitFlash = 0;
  }

  update(dt, playerX, playerY) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
    this.spinAngle += this.spinSpeed * dt;
    this.fireTimer -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  tryShoot(playerX, playerY) {
    if (this.fireTimer > 0) return [];
    this.fireTimer = this.fireRate;
    const angle = Math.atan2(playerY - this.y, playerX - this.x);
    if (this.pattern === 'single') {
      return [new Bullet(this.x, this.y, angle, this.bulletSpeed, this.color, 4, 'enemy')];
    }
    // spread: centre ± 0.35 rad (~20°)
    return [-0.35, 0, 0.35].map(offset =>
      new Bullet(this.x, this.y, angle + offset, this.bulletSpeed, this.color, 4, 'enemy')
    );
  }

  takeDamage() {
    this.hp -= 1;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spinAngle);
    const color = this.hitFlash > 0 ? '#ffffff' : this.color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    const r = this.radius;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // HP pips below multi-HP enemies (Tank)
    if (this.maxHp > 1) {
      for (let i = 0; i < this.maxHp; i++) {
        ctx.fillStyle = i < this.hp ? '#ffffff' : 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(-((this.maxHp - 1) * 5) + i * 10, r + 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
```

- [ ] **Step 2: Replace `js/waves.js` with full wave definitions**

```js
const W = 800;
const H = 600;

const WAVES = [
  ['grunt','grunt','grunt','grunt','speeder','speeder'],
  ['grunt','grunt','grunt','grunt','speeder','speeder','speeder','tank','tank'],
  ['grunt','grunt','grunt','grunt','grunt','grunt','speeder','speeder','speeder','speeder','tank','tank','tank'],
];
```

- [ ] **Step 3: Verify — no console errors and class is correct**

Reload `index.html`. In DevTools Console, type:
```js
const e = new Enemy('tank', 100, 100); [e.radius, e.hp, e.color]
```
Expected: `[22, 3, "#c9184a"]`

```js
WAVES[2].length
```
Expected: `13`

- [ ] **Step 4: Commit**

```bash
git add js/entities.js js/waves.js
git commit -m "feat: Enemy class, ENEMY_TYPES, wave definitions"
```

---

### Task 6: Enemy Spawning + Movement

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Add `spawnEnemy` function**

Add after `startWave`:
```js
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
```

- [ ] **Step 2: Add spawn queue logic and enemy movement to `updatePlaying`**

Replace `updatePlaying` with:
```js
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

  // Move enemies
  for (const enemy of enemies) {
    if (!enemy.dead) enemy.update(dt, player.x, player.y);
  }

  for (const bullet of bullets) {
    bullet.update(dt);
    if (bullet.isOutOfBounds()) bullet.dead = true;
  }
  enemies = enemies.filter(e => !e.dead);
  bullets = bullets.filter(b => !b.dead);
}
```

- [ ] **Step 3: Add enemy rendering to `draw`**

In the `draw` function, in the playing-state section, add enemy rendering before `player.draw(ctx)`:
```js
  for (const e of enemies) if (!e.dead) e.draw(ctx);
```

The playing-state section of `draw` should now read:
```js
  for (const b of bullets) b.draw(ctx);
  for (const e of enemies) if (!e.dead) e.draw(ctx);
  player.draw(ctx);
```

- [ ] **Step 4: Verify in browser**

Click to start the game.
- After 1.5 seconds, a spinning diamond appears on an arena edge and slowly drifts toward the player
- A new enemy appears every 1.5 seconds
- Enemies are different sizes: small grunts (12px), medium speeders (14px), and large tanks (22px)
- Enemies reach the player and pass through (no collision yet)
- Shooting enemies has no visible effect yet

- [ ] **Step 5: Commit**

```bash
git add js/game.js
git commit -m "feat: enemy spawning and movement"
```

---

### Task 7: Enemy Shooting

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Add enemy `tryShoot` calls to `updatePlaying`**

In `updatePlaying`, replace the enemy movement block with:
```js
  // Move enemies and collect their bullets
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    enemy.update(dt, player.x, player.y);
    const newBullets = enemy.tryShoot(player.x, player.y);
    bullets.push(...newBullets);
  }
```

- [ ] **Step 2: Verify in browser**

Click to start.
- Grunts fire single slow orange bullets toward the player every ~2 seconds
- Speeders fire single fast yellow bullets toward the player every ~0.6 seconds
- Tanks fire 3-way spread bursts of deep-red bullets every ~1.5 seconds
- All enemy bullets travel in straight lines and disappear when they leave the canvas
- Enemy bullets pass through the player (no damage yet)

- [ ] **Step 3: Commit**

```bash
git add js/game.js
git commit -m "feat: enemy shooting (grunt single, speeder rapid, tank spread)"
```

---

### Task 8: Collision Detection + Damage

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Add `checkCollisions` function**

Add before `update`:
```js
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
```

- [ ] **Step 2: Call `checkCollisions` in `updatePlaying`**

Add after the bullet movement block (before the filter lines) in `updatePlaying`:
```js
  checkCollisions();
```

The end of `updatePlaying` should now read:
```js
  for (const bullet of bullets) {
    bullet.update(dt);
    if (bullet.isOutOfBounds()) bullet.dead = true;
  }

  checkCollisions();

  enemies = enemies.filter(e => !e.dead);
  bullets = bullets.filter(b => !b.dead);
}
```

- [ ] **Step 3: Verify in browser**

Click to start.
- Shooting a Grunt destroys it in one hit (diamond disappears)
- Shooting a Tank requires 3 hits; the 3 white HP pips below it decrease with each hit
- Tanks and Speeders flash white briefly when hit
- An enemy bullet touching the player causes the player triangle to flash white and reduces HP (will verify HP display in Task 10)
- Being hit grants ~0.6s invincibility — rapid bullets don't multi-hit
- Getting hit 3 times changes `state` to `'game-over'` (verify via DevTools Console: type `state`)

- [ ] **Step 4: Commit**

```bash
git add js/game.js
git commit -m "feat: collision detection, player damage, enemy death"
```

---

### Task 9: Wave Management + State Transitions

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Add wave-completion check to `updatePlaying`**

Append to the end of `updatePlaying`, after the filter lines:
```js
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
```

- [ ] **Step 2: Add `updateWaveClear` function**

Add after `updatePlaying`:
```js
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
```

- [ ] **Step 3: Update `update` to call `updateWaveClear`**

Replace:
```js
function update(dt) {
  if (state === 'playing') updatePlaying(dt);
}
```

With:
```js
function update(dt) {
  if (state === 'playing')         updatePlaying(dt);
  else if (state === 'wave-clear') updateWaveClear(dt);
}
```

- [ ] **Step 4: Verify in browser**

Kill all 6 Wave 1 enemies.
- Game transitions to `state = 'wave-clear'` (verify via DevTools: type `state`)
- After 2 seconds transitions back to `playing` with `waveIndex = 1`
- Wave 2 spawns 9 enemies (4 grunts, 3 speeders, 2 tanks)
- After Wave 2 clears, Wave 3 spawns 13 enemies
- After Wave 3 clears, `state` becomes `'win'`
- Taking 3 hits at any point sets `state` to `'game-over'`
- Clicking during `game-over` or `win` resets everything and returns to `playing` (Wave 1)

- [ ] **Step 5: Commit**

```bash
git add js/game.js
git commit -m "feat: wave management, wave-clear transitions, win and game-over states"
```

---

### Task 10: HUD, Crosshair, and State Overlays

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Add `drawHeart` helper function**

Add after `drawBackground`:
```js
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
```

- [ ] **Step 2: Add `drawCrosshair` function**

```js
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
```

- [ ] **Step 3: Add `drawHUD` function**

```js
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
```

- [ ] **Step 4: Add `drawOverlay` helper for Game Over and Win screens**

```js
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
```

- [ ] **Step 5: Replace the `draw` function with the complete final version**

```js
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
```

- [ ] **Step 6: Verify the complete game**

Play through the full game and confirm each item:

**Menu:**
- [ ] "SURVIVE" title glows crimson, "CLICK TO PLAY" pulses

**Gameplay:**
- [ ] HUD shows 3 filled hearts top-left, "1 / 3" wave counter top-centre, enemy count top-right
- [ ] Crosshair (circle + lines) follows the mouse cursor
- [ ] Enemy count counts down as enemies die and ticks down as queued enemies are yet to spawn
- [ ] Taking a hit removes one heart; at 0 hearts Game Over overlay appears
- [ ] Player flashes white for ~0.6s after being hit (invincibility window)
- [ ] Tanks show 3 white HP pips below them; pips reduce on each hit

**Wave clear:**
- [ ] Killing all Wave 1 enemies shows gold "WAVE 1 COMPLETE" overlay for 2 seconds
- [ ] Then shows crimson "WAVE 2 INCOMING..." for 2 seconds, then Wave 2 begins
- [ ] Same transition between Wave 2 → 3

**End states:**
- [ ] Surviving Wave 3 shows "YOU SURVIVED / All 3 Waves Cleared / Click to Play Again"
- [ ] Dying shows "GAME OVER / Click to Restart"
- [ ] Clicking on either end-state overlay restarts from Wave 1

- [ ] **Step 7: Commit**

```bash
git add js/game.js
git commit -m "feat: HUD, crosshair, wave-clear overlay, game-over and win screens"
```
