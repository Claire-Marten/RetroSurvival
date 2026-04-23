# RetroSurvival

A browser-based top-down shooter. Survive three waves of enemies to win.

## Play

Open `index.html` in a browser. No installation, no build step, no dependencies.

## Controls

| Input | Action |
|---|---|
| Arrow keys | Move |
| Mouse | Aim |
| Left click | Shoot |
| Spacebar | Restart after Game Over |

## Enemies

| Type | Behaviour |
|---|---|
| **Grunt** | Slow, fires single shots every 2s |
| **Speeder** | Fast, fires rapidly every 0.6s |
| **Tank** | Slow, fires a 3-way spread every 1.5s, takes 3 hits to kill |
| **Sniper** | Flies in from the edge, parks near the border, waits 2s then fires a large fast bullet with a visible charge-up. Wave 3 only. |

## Waves

Each wave lasts 20 seconds. Enemies spawn continuously until time runs out, then all remaining enemies are cleared.

| Wave | Spawn rate | Enemy mix |
|---|---|---|
| 1 | Every 2.0s | Grunts and Speeders |
| 2 | Every 1.3s | Grunts, Speeders, Tanks — powerup at 5s |
| 3 | Every 0.8s | All types including Snipers — powerup at 7s |

## Powerup

A triple shot powerup spawns mid-wave on waves 2 and 3. Walk over it to collect it. Each click fires 3 near-parallel bullets for 8 seconds.

## Rules

- You have **3 HP**. A brief invincibility window prevents multi-hit from the same bullet.
- Reaching 0 HP ends the game immediately — press **Space** to restart.
- Kill enemies to score points. Top 5 scores are saved between sessions.
- Surviving all three waves shows the win screen and leaderboard.

## Tech

Vanilla HTML5 Canvas — no frameworks, no build tools.

| File | Responsibility |
|---|---|
| `js/waves.js` | Arena dimensions, wave duration, enemy weights |
| `js/entities.js` | Player, Bullet, Enemy, Powerup, Particle classes |
| `js/leaderboard.js` | localStorage high score management |
| `js/audio.js` | Procedural SFX and background music |
| `js/game.js` | Game loop, state machine, rendering, collision |
