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

## Enemies

Three enemy types approach from the arena edges and fire back:

| Type | Behaviour |
|---|---|
| **Grunt** | Slow, fires single shots every 2s |
| **Speeder** | Fast, fires rapidly every 0.6s |
| **Tank** | Slow, fires a 3-way spread every 1.5s, takes 3 hits to kill |

## Waves

| Wave | Grunts | Speeders | Tanks |
|---|---|---|---|
| 1 | 4 | 2 | 0 |
| 2 | 4 | 3 | 2 |
| 3 | 6 | 4 | 3 |

Enemies spawn one at a time every 1.5 seconds. Clear all enemies in wave 3 to win.

## Rules

- You have **3 HP**. A brief invincibility window prevents multi-hit from the same bullet.
- Reaching 0 HP ends the game immediately.
- Surviving all three waves shows the win screen.

## Tech

Vanilla HTML5 Canvas — no frameworks, no build tools. Three script files: `js/waves.js`, `js/entities.js`, `js/game.js`.
