# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `index.html` directly in a browser — no build step, no server, no dependencies. All three scripts must load in the order declared in `index.html`:

```html
<script src="js/waves.js"></script>
<script src="js/entities.js"></script>
<script src="js/game.js"></script>
```

This order is load-order critical. `waves.js` declares the globals `W` (800) and `H` (600) that `entities.js` and `game.js` depend on. Reordering these tags will break the game.

## Architecture

**`js/waves.js`** — Arena dimensions and wave data only. Exports globals `W`, `H`, and `WAVES` (array of 3 enemy-type string arrays). No logic.

**`js/entities.js`** — Three classes with no DOM/canvas access:
- `Player` — movement (arrow keys, diagonal-normalised at ×0.707), mouse-aim (atan2), shoot cooldown (200ms), 3 HP, invincibility frames (600ms) after hit. `takeDamage()` returns `false` during invincibility so the bullet is not consumed.
- `Bullet` — vx/vy from angle+speed, `owner` is `'player'` or `'enemy'`, `dead` flag for deferred removal.
- `Enemy` — configured via `ENEMY_TYPES` lookup at construction. Spinning diamond render. `tryShoot()` returns a `Bullet[]` (empty if on cooldown). Tank uses spread pattern (±0.35 rad). HP pips rendered for multi-HP enemies.

**`js/game.js`** — Everything else: input handling, game loop, state machine, spawn queue, collision detection, and all canvas rendering.

### State Machine

```
menu → playing → wave-clear → playing → ... → win
                     ↓
                  game-over
```

`wave-clear` has two phases: `'complete'` (2s) → `'incoming'` (2s) → auto-advances to next wave. Both `game-over` and `win` wait for a click to call `initGame()`.

### Key Patterns

- **Delta time:** `dt = Math.min((timestamp - lastTime) / 1000, 0.1)` — capped at 100ms to prevent spiral-of-death on tab switch.
- **Enemy spawning:** `spawnQueue` is shuffled on `startWave`. Spawn interval decreases per wave (1.2s / 1.0s / 0.8s) via `SPAWN_INTERVALS[waveIndex]`. Spawn position retries up to 20 times to stay ≥60px from existing enemies.
- **Collision:** Circle–circle via `Math.hypot`. Player bullets check all enemies; enemy bullets check player only. Dead entities are filtered out after collision resolution each frame.
- **`startWave()`** clears both `enemies` and `bullets` — bullets mid-flight when a wave ends are discarded.
- **Enemies remaining counter** (`drawHUD`) = `enemies.length + spawnQueue.length`, so it counts both alive enemies and those not yet spawned.

## Commit Messages

Follow the Conventional Commits format: a short subject line prefixed with a type (`feat:`, `fix:`, `docs:`, etc.), then a blank line, then a body that explains *why* the change was made and *by how much* where relevant.

```
feat: increase wave difficulty by ~75% for V1.1

Raised enemy counts per wave (6→11, 9→16, 13→23) and introduced
per-wave spawn intervals that tighten each round (1.2s / 1.0s / 0.8s),
so later waves feel progressively more swarming.
```

The body is required whenever someone would need to open a file to understand the intent behind the change.

## Design Docs

- Spec: `docs/superpowers/specs/2026-04-21-top-down-shooter-design.md`
- Plan: `docs/superpowers/plans/2026-04-21-top-down-shooter.md`
