import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'problems.db');

export function openDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initDb(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      term TEXT NOT NULL,
      problem_number INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_image TEXT,
      type TEXT NOT NULL CHECK(type IN ('open','multiple_choice')),
      options TEXT,
      correct_answer TEXT NOT NULL,
      answer_image TEXT,
      hint TEXT,
      solution_steps TEXT NOT NULL,
      topic TEXT NOT NULL CHECK(topic IN (
        'cisla_operace','cisla_vyrazy','vyrazy_promennou','prevody_jednotek',
        'mnohocleny','rovnice','slovni_ulohy','grafy_tabulky',
        'umernost','pomer_mapa','procenta','pythagorova_veta',
        'geometrie_rovina','geometrie_prostor','konstrukcni_ulohy',
        'aplikacni_ulohy','sumernost'
      )),
      source_url TEXT
    );

    CREATE TABLE IF NOT EXISTS student_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id TEXT NOT NULL,
      student_answer TEXT,
      is_correct INTEGER NOT NULL,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    );
  `);
}
