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
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
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

class Particle {
  constructor(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 75 + Math.random() * 125;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.radius = 1.5 + Math.random() * 1.5;
    this.life = 1;
    this.decay = 1.67 + Math.random() * 1.0;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= this.decay * dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * this.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const ENEMY_TYPES = {
  grunt:   { radius: 12, hp: 1, speed: 90,  fireRate: 2.0, color: '#ff6b35', pattern: 'single', bulletSpeed: 200, score: 100 },
  speeder: { radius: 14, hp: 1, speed: 160, fireRate: 0.6, color: '#ffd166', pattern: 'single', bulletSpeed: 350, score: 150 },
  tank:    { radius: 22, hp: 3, speed: 55,  fireRate: 1.5, color: '#c9184a', pattern: 'spread', bulletSpeed: 150, score: 300 },
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
    this.scoreValue = cfg.score;
    this.fireTimer = Math.random() * cfg.fireRate;
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
