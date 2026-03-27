// localStorage-based attempt tracking (replaces /api/stats + /api/attempts)

interface Attempt {
  correct: boolean;
  ts: number;
}

type AttemptsStore = Record<string, Attempt[]>; // problemId → attempts

function load(): AttemptsStore {
  try { return JSON.parse(localStorage.getItem('cermat_attempts') || '{}'); }
  catch { return {}; }
}

export function saveAttempt(problemId: string, isCorrect: boolean) {
  const store = load();
  if (!store[problemId]) store[problemId] = [];
  store[problemId].push({ correct: isCorrect, ts: Date.now() });
  localStorage.setItem('cermat_attempts', JSON.stringify(store));
}

export interface Stats {
  overall: { attempted: number; correct: number };
  byTopic: { topic: string; attempted: number; correct: number }[];
}

export function getStats(problems: { id: string; topic: string }[]): Stats {
  const store = load();
  const topicMap: Record<string, { attempted: number; correct: number }> = {};
  let totalAttempted = 0, totalCorrect = 0;

  for (const p of problems) {
    const attempts = store[p.id] ?? [];
    if (attempts.length === 0) continue;
    // Count only the last attempt per problem
    const last = attempts[attempts.length - 1];
    totalAttempted++;
    if (last.correct) totalCorrect++;
    if (!topicMap[p.topic]) topicMap[p.topic] = { attempted: 0, correct: 0 };
    topicMap[p.topic].attempted++;
    if (last.correct) topicMap[p.topic].correct++;
  }

  return {
    overall: { attempted: totalAttempted, correct: totalCorrect },
    byTopic: Object.entries(topicMap).map(([topic, v]) => ({ topic, ...v })),
  };
}
