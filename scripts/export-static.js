/**
 * Exports all problems from SQLite to src/data/problems.json.
 * Run after seeding: node scripts/export-static.js
 */
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb } from '../server/db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = openDb();
const problems = db.prepare('SELECT * FROM problems ORDER BY year DESC, term, problem_number').all();

const outDir = path.join(__dirname, '..', 'src', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'problems.json'), JSON.stringify(problems, null, 2));
console.log(`Exported ${problems.length} problems to src/data/problems.json`);
