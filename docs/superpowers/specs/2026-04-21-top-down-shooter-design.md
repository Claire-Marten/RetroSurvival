# Top-Down Shooter — Design Spec

**Date:** 2026-04-21
**Status:** Approved

---

## Overview

A browser-based top-down shooter. The player navigates a fixed arena using arrow keys, aims with the mouse, and shoots enemies by clicking. Three waves of enemies approach and fire back. The player has 3 HP. Surviving all three waves wins the game.

---

## Tech Stack

- **Runtime:** Browser only — no build tools, no dependencies
- **Entry point:** `index.html` — contains the `<canvas>` element and loads scripts
- **Scripts:**
  - `js/game.js` — game loop, state machine, collision detection, input handling
  - `js/entities.js` — `Player`, `Enemy` (Grunt/Speeder/Tank), `Bullet` classes
  - `js/waves.js` — wave definitions (enemy counts, spawn timing)

---

## Arena

- **Size:** 800×600 pixels, fixed
- **Layout:** Canvas centered on page, dark background outside canvas
- **Camera:** Static — no scrolling
- **Bounds:** Player and bullets are clamped/despawned at arena edges

---

## Visual Style

Dark dramatic palette:
- **Background:** Deep navy (`#16213e`)
- **Player:** Crimson/deep red (`#e94560`) with glow
- **Grunt:** Orange (`#ff6b35`)
- **Speeder:** Yellow (`#ffd166`)
- **Tank:** Deep red (`#c9184a`)
- **Player bullets:** Crimson gradient trail
- **Enemy bullets:** Colour-matched to their source enemy, smaller
- **Font:** Monospace, uppercase, letter-spaced for HUD text
- **No sound**

---

## Game States

```
Menu → Playing → Wave Clear → Playing → ... → Win
           ↓
       Game Over
```

| State | Description |
|---|---|
| **Menu** | Title + "Click to Play". Same dark background. |
| **Playing** | Active gameplay loop. |
| **Wave Clear** | Centre overlay: "Wave N Complete" → 2s pause → "Wave N+1 Incoming..." → auto-advances to Playing. |
| **Game Over** | Full overlay: "Game Over", "Click to Restart". |
| **Win** | Full overlay: "You Survived", "All 3 Waves Cleared", "Click to Play Again". |

---

## Player

- **Shape:** Triangle, pointing toward mouse cursor (rotates to track aim direction)
- **Size:** ~16px radius bounding circle
- **Movement:** Arrow keys, 8-directional (diagonal allowed), constant speed (~180px/s)
- **Bounds:** Clamped to arena — cannot move off screen
- **Shooting:** Left mouse click fires one bullet toward cursor position. Cooldown: 200ms.
- **Bullet speed:** ~500px/s
- **HP:** 3. Displayed as heart icons in HUD. No regeneration. 0 HP → Game Over.
- **Hit detection:** Circle-based. Any enemy bullet overlapping player radius costs 1 HP. Brief invincibility flash (~600ms) after being hit to prevent multi-hit from same collision.

---

## Enemies

All enemies spawn at random positions along the arena edges. They move toward the player's current position each frame. They do not collide with each other.

| Type | Radius | HP | Move Speed | Fire Rate | Shot Pattern | Colour |
|---|---|---|---|---|---|---|
| **Grunt** | 12px | 1 | 90px/s | 1 shot / 2s | Single bullet, 200px/s | Orange `#ff6b35` |
| **Speeder** | 14px | 1 | 160px/s | 1 shot / 0.6s | Single bullet, 350px/s | Yellow `#ffd166` |
| **Tank** | 22px | 3 | 55px/s | 1 burst / 1.5s | 3-way spread (centre + ±20°), 150px/s | Deep red `#c9184a` |

- **Shape:** Rotating diamond (square rotated 45°, slow continuous spin)
- **Death:** Removed from array immediately on HP reaching 0. No explosion animation.
- **Hit flash:** Brief colour flash on hit (white or lighter variant of enemy colour)
- **Bullet despawn:** Enemy bullets despawn when they leave the 800×600 arena bounds
- **Bullet radius:** All bullets (player and enemy) use a 4px radius for collision

---

## Waves

Enemies spawn one at a time at 1.5s intervals per wave (not all at once). A wave ends when all spawned enemies are dead.

| Wave | Grunts | Speeders | Tanks | Total |
|---|---|---|---|---|
| 1 | 4 | 2 | 0 | 6 |
| 2 | 4 | 3 | 2 | 9 |
| 3 | 6 | 4 | 3 | 13 |

Spawn positions: random point on one of the four arena edges (not corners), at least 60px from any existing enemy to avoid overlap clustering.

---

## HUD

Drawn as canvas overlays (not DOM elements).

| Element | Position | Detail |
|---|---|---|
| **Health** | Top-left | Label "HEALTH", 3 heart icons — filled (`#e94560`) = HP remaining, dark = lost |
| **Wave counter** | Top-centre | Label "WAVE", large number "N / 3" |
| **Enemies remaining** | Top-right | Label "ENEMIES", total remaining in current wave (alive on screen + not yet spawned) |
| **Crosshair** | Follows mouse | Small circle with crosshair lines, semi-transparent crimson |

---

## Collision Detection

All collision is circle-based using distance checks each frame:

- **Player bullet vs enemy:** `distance(bullet.pos, enemy.pos) < enemy.radius + bullet.radius`
- **Enemy bullet vs player:** `distance(bullet.pos, player.pos) < player.radius + bullet.radius`
- No player-vs-enemy body collision (walk-through).

---

## Game Loop

`requestAnimationFrame`-driven. Each frame:

1. Compute `dt` (delta time, capped at 100ms to prevent spiral-of-death on tab switch)
2. `update(dt)` — move player, move enemies toward player, move bullets, check collisions, check wave completion
3. `draw(ctx)` — clear canvas, draw background, draw entities, draw HUD, draw state overlays

Input is tracked via `keydown`/`keyup` listeners for arrow keys and `mousemove`/`click` listeners for aiming and shooting.

---

## Win / Lose Conditions

- **Lose:** Player HP reaches 0 at any point → Game Over state
- **Win:** Wave 3 ends with all enemies dead and player still alive → Win state
- Both states show a full-canvas overlay and wait for a click to restart
