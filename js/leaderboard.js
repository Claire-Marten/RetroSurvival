const LEADERBOARD_KEY = 'retro_survival_scores';
const MAX_SCORES = 5;

function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
  } catch {
    return [];
  }
}

function saveScore(initials, score) {
  const scores = loadScores();
  scores.push({ initials: initials.join(''), score });
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, MAX_SCORES);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  return trimmed;
}

function isHighScore(score) {
  const scores = loadScores();
  return scores.length < MAX_SCORES || score > scores[scores.length - 1].score;
}
