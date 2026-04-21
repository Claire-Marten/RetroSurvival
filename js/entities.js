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
