#!/usr/bin/env node
/**
 * Rasterizes CERMAT PDFs and uses Claude vision to extract structured problems.
 * Usage:
 *   node scripts/extract-problems.js              # all available PDFs
 *   node scripts/extract-problems.js --year 2025 --term A
 */
import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb, initDb } from '../server/db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_DIR   = path.join(__dirname, '..', 'data', 'pdfs');
const IMG_DIR   = path.join(__dirname, '..', 'data', 'images');
const BASE_URL  = 'https://prijimacky.cermat.cz/files/files';

mkdirSync(PDF_DIR, { recursive: true });
mkdirSync(IMG_DIR, { recursive: true });

const client = new Anthropic();
const db = openDb();
initDb(db);

// ── helpers ────────────────────────────────────────────────────────────────

async function downloadPdf(url, destPath) {
  if (existsSync(destPath)) return true;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return true;
}

function rasterizePdf(pdfPath, outDir, prefix, dpi = 200) {
  mkdirSync(outDir, { recursive: true });
  const outPrefix = path.join(outDir, prefix);
  execSync(`pdftoppm -r ${dpi} -png "${pdfPath}" "${outPrefix}"`, { stdio: 'pipe' });
  return readdirSync(outDir)
    .filter(f => f.startsWith(prefix) && f.endsWith('.png'))
    .sort()
    .map(f => path.join(outDir, f));
}

function imgToBase64(p) {
  return readFileSync(p).toString('base64');
}

// ── extract test problems with vision ──────────────────────────────────────

async function extractProblems(year, term, testPages, keyPages, solutionPages) {
  const testImgContent = testPages.map(p => ({
    type: 'image',
    source: { type: 'base64', media_type: 'image/png', data: imgToBase64(p) }
  }));
  const keyImgContent = keyPages.map(p => ({
    type: 'image',
    source: { type: 'base64', media_type: 'image/png', data: imgToBase64(p) }
  }));
  const solImgContent = solutionPages.map(p => ({
    type: 'image',
    source: { type: 'base64', media_type: 'image/png', data: imgToBase64(p) }
  }));

  const systemPrompt = `Jsi expert na extrakci matematických úloh z českých přijímacích zkoušek (CERMAT JPZ).
Budeš zpracovávat naskenované strany testů a vracet POUZE validní JSON.`;

  const userContent = [
    {
      type: 'text',
      text: `Zpracuj tento CERMAT matematický test (rok ${year}, varianta ${term}) a extrahuj všechny úlohy.

STRÁNKY TESTU:`
    },
    ...testImgContent,
    { type: 'text', text: '\nROZŠÍŘENÝ KLÍČ (správné odpovědi):' },
    ...keyImgContent,
    ...(solImgContent.length > 0 ? [{ type: 'text', text: '\nVZOROVÉ ŘEŠENÍ (postupy):' }, ...solImgContent] : []),
    {
      type: 'text',
      text: `
Vrať JSON pole úloh. Každá úloha musí mít PŘESNĚ tuto strukturu:
{
  "problem_number": <číslo úlohy jako integer>,
  "question_text": "<celé znění úlohy česky, přesně jak je v testu>",
  "has_image": <true pokud úloha obsahuje obrázek/diagram>,
  "type": "open" nebo "multiple_choice",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."] nebo null,
  "correct_answer": "<správná odpověď přesně jak je v klíči>",
  "solution_steps": [
    "<krok 1 řešení česky>",
    "<krok 2>",
    ...
  ],
  "topic": jedno z: "arithmetic","geometry","algebra","word_problems","fractions","percentages","statistics",
  "difficulty": 1, 2 nebo 3 (1=lehká, 2=střední, 3=těžká)
}

DŮLEŽITÉ:
- Extrahuj VŠECHNY úlohy (obvykle 20-25 úloh)
- question_text musí obsahovat celé znění včetně číselných hodnot
- Pro otevřené úlohy type="open", pro výběrové type="multiple_choice"
- solution_steps musí mít alespoň 2 kroky v češtině
- Vrať POUZE JSON pole, žádný jiný text

JSON pole:`
    }
  ];

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }]
  });

  const raw = response.content[0].text.trim();
  // Strip markdown fences if present
  const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(jsonStr);
}

// ── save figures that appear in problems ───────────────────────────────────

async function extractAndSaveFigure(year, term, problemNum, testPages) {
  const figureId = `${year}-${term}-${String(problemNum).padStart(2,'0')}`;
  const outPath = path.join(IMG_DIR, `${figureId}.png`);
  if (existsSync(outPath)) return `data/images/${figureId}.png`;

  const imgContent = testPages.map(p => ({
    type: 'image',
    source: { type: 'base64', media_type: 'image/png', data: imgToBase64(p) }
  }));

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: [
        ...imgContent,
        {
          type: 'text',
          text: `Odpověz pouze "YES" nebo "NO": Obsahuje úloha číslo ${problemNum} v tomto testu obrázek nebo geometrický diagram, který je nezbytný pro pochopení zadání?`
        }
      ]
    }]
  });

  const answer = response.content[0].text.trim().toUpperCase();
  if (!answer.startsWith('YES')) return null;

  // Crop just the figure using another vision call to identify the page
  // For now, save the relevant test page as a proxy
  // A more sophisticated approach would crop the exact figure region
  return null; // Figures handled separately if needed
}

// ── main pipeline ──────────────────────────────────────────────────────────

async function processTest(year, term) {
  const testId = `${year}-${term}`;
  console.log(`\n━━━ Processing ${testId} ━━━`);

  // Check for existing problems
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM problems WHERE year=? AND term=?').get(year, term);
  if (existing.cnt > 0) {
    console.log(`  SKIP: ${existing.cnt} problems already in DB`);
    return;
  }

  // Download PDFs
  const testUrl  = `${BASE_URL}/M9${term}_${year}_TS.pdf`;
  const keyUrl   = `${BASE_URL}/M9${term}_${year}_rozsireny_klic.pdf`;
  const sol1Url  = `${BASE_URL}/M9${term}_${year}_vzorove_reseni.pdf`;
  const sol2Url  = `${BASE_URL}/M9${term}_${year}_pruvodce_resenimi.pdf`;

  const testPdf = path.join(PDF_DIR, `${testId}_test.pdf`);
  const keyPdf  = path.join(PDF_DIR, `${testId}_key.pdf`);
  const sol1Pdf = path.join(PDF_DIR, `${testId}_sol1.pdf`);
  const sol2Pdf = path.join(PDF_DIR, `${testId}_sol2.pdf`);

  const hasTest = await downloadPdf(testUrl, testPdf);
  const hasKey  = await downloadPdf(keyUrl,  keyPdf);
  if (!hasTest) { console.log(`  SKIP: no test PDF at ${testUrl}`); return; }
  if (!hasKey)  { console.log(`  SKIP: no key PDF at ${keyUrl}`);  return; }

  const hasSol1 = await downloadPdf(sol1Url, sol1Pdf);
  const hasSol2 = await downloadPdf(sol2Url, sol2Pdf);

  console.log(`  Downloaded: test=${hasTest} key=${hasKey} sol1=${hasSol1} sol2=${hasSol2}`);

  // Rasterize
  const imgSubDir = path.join(IMG_DIR, testId);
  const testPages = rasterizePdf(testPdf, imgSubDir, 'test');
  const keyPages  = rasterizePdf(keyPdf,  imgSubDir, 'key');
  const solPages  = hasSol1
    ? rasterizePdf(sol1Pdf, imgSubDir, 'sol')
    : (hasSol2 ? rasterizePdf(sol2Pdf, imgSubDir, 'sol2') : []);

  console.log(`  Pages: test=${testPages.length} key=${keyPages.length} sol=${solPages.length}`);

  // Extract with Claude
  console.log('  Extracting problems with Claude vision...');
  let problems;
  try {
    problems = await extractProblems(year, term, testPages, keyPages, solPages);
  } catch (e) {
    console.error(`  ERROR extracting: ${e.message}`);
    // Save raw output for debugging
    writeFileSync(path.join(IMG_DIR, `${testId}_raw_error.txt`), String(e));
    return;
  }

  console.log(`  Extracted ${problems.length} problems`);

  // Insert into DB
  const insert = db.prepare(`
    INSERT OR REPLACE INTO problems
      (id, year, term, problem_number, question_text, question_image, type,
       options, correct_answer, solution_steps, topic, difficulty, source_url)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const insertMany = db.transaction((probs) => {
    for (const p of probs) {
      const id = `${year}-${term}-${String(p.problem_number).padStart(2,'0')}`;
      insert.run(
        id, year, term, p.problem_number,
        p.question_text,
        p.has_image ? `data/images/${testId}/${id}.png` : null,
        p.type,
        p.options ? JSON.stringify(p.options) : null,
        p.correct_answer,
        JSON.stringify(p.solution_steps),
        p.topic,
        p.difficulty ?? 2,
        testUrl
      );
    }
  });

  insertMany(problems);
  console.log(`  ✓ Saved ${problems.length} problems for ${testId}`);

  // Show first 3 for verification
  const sample = db.prepare('SELECT id, question_text, type, correct_answer, topic, difficulty FROM problems WHERE year=? AND term=? LIMIT 3').all(year, term);
  console.log('\n  Sample problems:');
  for (const s of sample) {
    console.log(`    [${s.id}] ${s.topic} diff=${s.difficulty} type=${s.type}`);
    console.log(`    Q: ${s.question_text.substring(0, 80)}...`);
    console.log(`    A: ${s.correct_answer}`);
  }
}

// ── entry point ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const yearFilter = args.includes('--year') ? parseInt(args[args.indexOf('--year') + 1]) : null;
const termFilter = args.includes('--term') ? args[args.indexOf('--term') + 1].toUpperCase() : null;

// Order: start with 2025A (validation), then work backwards
const queue = [];
for (let year = 2025; year >= 2017; year--) {
  for (const term of ['A','B','C','D']) {
    if (yearFilter && year !== yearFilter) continue;
    if (termFilter && term !== termFilter) continue;
    queue.push({ year, term });
  }
}

console.log(`Processing ${queue.length} tests...`);
for (const { year, term } of queue) {
  await processTest(year, term);
}

const total = db.prepare('SELECT COUNT(*) as cnt FROM problems').get();
console.log(`\n✓ Total problems in DB: ${total.cnt}`);
