import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb, initDb } from './db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const db = openDb();
initDb(db);

app.use(cors());
app.use(express.json());

// Serve problem images
app.use('/data', express.static(path.join(__dirname, '..', 'data')));
// Serve built frontend in production
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// ── Problems ──────────────────────────────────────────────────────────────

app.get('/api/problems', (req, res) => {
  const { topic, limit = 50, offset = 0 } = req.query;
  let sql = 'SELECT * FROM problems WHERE 1=1';
  const params = [];
  if (topic) { sql += ' AND topic = ?'; params.push(topic); }
  sql += ' ORDER BY year DESC, term, problem_number LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/topics', (req, res) => {
  const rows = db.prepare(
    'SELECT topic, COUNT(*) as count FROM problems GROUP BY topic ORDER BY topic'
  ).all();
  res.json(rows);
});

app.get('/api/problems/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM problems WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// ── Attempts ──────────────────────────────────────────────────────────────

app.post('/api/attempts', (req, res) => {
  const { problem_id, student_answer } = req.body;
  const problem = db.prepare('SELECT correct_answer FROM problems WHERE id = ?').get(problem_id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  const correct_answer = problem.correct_answer;
  const is_correct = checkAnswer(student_answer, correct_answer) ? 1 : 0;

  const { lastInsertRowid } = db.prepare(
    'INSERT INTO student_attempts (problem_id, student_answer, is_correct) VALUES (?, ?, ?)'
  ).run(problem_id, student_answer, is_correct);

  res.json({ id: lastInsertRowid, is_correct: !!is_correct, correct_answer });
});

app.get('/api/stats', (req, res) => {
  const overall = db.prepare(`
    SELECT COUNT(*) as attempted, SUM(is_correct) as correct FROM student_attempts
  `).get();
  const byTopic = db.prepare(`
    SELECT p.topic, COUNT(*) as attempted, SUM(a.is_correct) as correct
    FROM student_attempts a JOIN problems p ON a.problem_id = p.id
    GROUP BY p.topic
  `).all();
  res.json({ overall, byTopic });
});

// ── Helper ────────────────────────────────────────────────────────────────

function normalize(s) {
  return s.toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/,/g, '.')        // decimal comma → dot
    .replace(/\u00bd/g, '0.5') // ½
    .replace(/[^\w\d\.\-\/]/g, '');
}

function checkAnswer(student, correct) {
  if (!correct) return false;
  const s = normalize(student);
  // Try each part of a multi-part answer (separated by ;)
  const parts = correct.split(';').map(p => p.trim());
  // Student is correct if their answer matches ANY correct sub-part
  // or if it matches after stripping option letter (A) B) etc.)
  return parts.some(part => {
    const clean = normalize(part.replace(/^\w\)|^\w\.\s*/, '').replace(/[a-záčďéěíňóřšťúůýž]+ /gi, ''));
    return s === clean || s === normalize(part);
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
