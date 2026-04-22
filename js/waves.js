const W = 800;
const H = 600;

const WAVE_DURATION = 20;

const WAVES = [
  {
    spawnRate: 2.0,
    powerupTime: -1,
    weights: { grunt: 80, speeder: 20, tank: 0 },
  },
  {
    spawnRate: 1.3,
    powerupTime: 5,
    weights: { grunt: 50, speeder: 35, tank: 15 },
  },
  {
    spawnRate: 0.8,
    powerupTime: 7,
    weights: { grunt: 30, speeder: 35, tank: 35 },
  },
];
