let audioCtx = null;

const music = new Audio('audio/Orbital Colossus.mp3');
music.loop = true;
music.volume = 0.35;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  music.play().catch(() => {});
}

function playTone(freq, endFreq, type, duration, volume) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function playShoot()      { playTone(880, 440, 'sawtooth', 0.08, 0.15); }
function playPlayerHit()  { playTone(150,  60, 'square',   0.30, 0.40); }
function playEnemyDeath() { playTone(440,  55, 'sawtooth', 0.20, 0.30); }
