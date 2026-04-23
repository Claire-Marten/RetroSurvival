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

  shoot(mouseX, mouseY, tripleShot = false) {
    if (this.shootCooldown > 0) return null;
    this.shootCooldown = 0.2;
    const angle = Math.atan2(mouseY - this.y, mouseX - this.x);
    if (!tripleShot) return [new Bullet(this.x, this.y, angle, 500, '#00d4ff', 4, 'player')];
    return [-0.05, 0, 0.05].map(offset =>
      new Bullet(this.x, this.y, angle + offset, 500, '#00d4ff', 4, 'player')
    );
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
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 14;
    const flashing = this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0;
    ctx.fillStyle = flashing ? '#ffffff' : '#00d4ff';
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

class Powerup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.timer = 5;
    this.dead = false;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) this.dead = true;
  }

  draw(ctx) {
    const pulse = Math.sin(Date.now() / (this.timer > 2 ? 300 : 80)) * 0.5 + 0.5;
    ctx.save();
    ctx.shadowColor = '#a78bfa';
    ctx.shadowBlur = 10 + pulse * 20;
    ctx.strokeStyle = `rgba(167,139,250,${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + pulse * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#a78bfa';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('3', this.x, this.y);
    ctx.restore();
  }
}

const ENEMY_TYPES = {
  grunt:   { radius: 12, hp: 1, speed: 90,  fireRate: 2.0, color: '#ff6b35', pattern: 'single', bulletSpeed: 200, score: 100 },
  speeder: { radius: 14, hp: 1, speed: 160, fireRate: 0.6, color: '#ffd166', pattern: 'single', bulletSpeed: 350, score: 150 },
  tank:    { radius: 22, hp: 3, speed: 55,  fireRate: 1.5, color: '#c9184a', pattern: 'spread', bulletSpeed: 75, score: 300 },
  sniper:  { radius: 14, hp: 2, speed: 90,  fireRate: 3.0, color: '#b042ff', pattern: 'sniper', bulletSpeed: 600, score: 200 },
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
    this.sniperState = 'flying-in';
    this.entryTimer = 2;
    this.chargeTimer = 0;
    this.chargeMax = 1.2;
    this.targetX = 0;
    this.targetY = 0;
  }

  update(dt, playerX, playerY) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0 && this.pattern !== 'sniper') {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }

    if (this.pattern === 'sniper') {
      if (this.sniperState === 'flying-in') {
        const minDist = Math.min(this.x, W - this.x, this.y, H - this.y);
        if (minDist < 100) {
          const tdx = W / 2 - this.x;
          const tdy = H / 2 - this.y;
          const td = Math.sqrt(tdx * tdx + tdy * tdy);
          this.x += (tdx / td) * this.speed * dt;
          this.y += (tdy / td) * this.speed * dt;
        } else {
          this.sniperState = 'waiting';
        }
      } else if (this.sniperState === 'waiting') {
        this.entryTimer -= dt;
        if (this.entryTimer <= 0) {
          this.sniperState = 'cooldown';
          this.fireTimer = this.fireRate;
        }
      } else if (this.sniperState === 'cooldown') {
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
          this.sniperState = 'charging';
          this.chargeTimer = this.chargeMax;
        }
      } else if (this.sniperState === 'charging') {
        this.chargeTimer -= dt;
        this.targetX = playerX;
        this.targetY = playerY;
        if (this.chargeTimer <= 0) this.sniperState = 'fire';
      }
    } else {
      this.fireTimer -= dt;
    }

    this.spinAngle += this.spinSpeed * dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  tryShoot(playerX, playerY) {
    if (this.pattern === 'sniper') {
      if (this.sniperState !== 'fire') return [];
      this.sniperState = 'cooldown';
      this.fireTimer = this.fireRate;
      const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
      return [new Bullet(this.x, this.y, angle, this.bulletSpeed, this.color, 10, 'enemy')];
    }
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

    if (this.pattern === 'sniper' && this.sniperState === 'charging') {
      const progress = 1 - this.chargeTimer / this.chargeMax;
      const pulse = Math.sin(Date.now() / 80) * 0.3 + 0.7;
      ctx.save();
      ctx.resetTransform();
      // Charge ring on sniper
      ctx.strokeStyle = `rgba(176,66,255,${progress * pulse})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#b042ff';
      ctx.shadowBlur = 10 + progress * 14;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 4 + progress * 10, 0, Math.PI * 2);
      ctx.stroke();
      // Target outline at player position
      ctx.strokeStyle = `rgba(176,66,255,${0.3 + progress * 0.5})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(this.targetX, this.targetY, 10 + progress * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

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
