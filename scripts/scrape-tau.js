/**
 * Scrapes all math exercises from tau.cermat.cz (grade 9 math).
 * Navigates each exercise via PHP session, screenshots questions,
 * submits a dummy answer to reveal the correct one.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb, initDb } from '../server/db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.join(__dirname, '..', 'data', 'images', 'tau');
mkdirSync(IMG_DIR, { recursive: true });

const BASE = 'https://tau.cermat.cz';

const CATEGORY_TOPICS = {
  1: 'arithmetic',    2: 'arithmetic',    3: 'fractions',
  4: 'percentages',   5: 'arithmetic',    6: 'algebra',
  7: 'algebra',       8: 'algebra',       9: 'geometry',
  10: 'geometry',     11: 'geometry',     12: 'geometry',
  13: 'statistics',   14: 'word_problems',15: 'word_problems',
  16: 'algebra',      17: 'arithmetic',
};

// Difficulty based on category (rough estimate — can be refined later)
const CATEGORY_DIFFICULTY = {
  1:1, 2:1, 3:2, 4:2, 5:2, 6:2, 7:2, 8:3, 9:2, 10:2, 11:2, 12:2, 13:2, 14:3, 15:2, 16:3, 17:2
};

async function initSession(page, categoryId) {
  await page.goto(`${BASE}/vyber.php?trida=9&predmet=ma`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('cookiesConsent', JSON.stringify(['functional', 'analytics']));
  });
  await page.waitForTimeout(400);
  await page.click('#vyber_ulohy').catch(() => {});
  await page.waitForTimeout(300);
  await page.evaluate((id) => {
    const r = document.querySelector(`input[name="kategorie"][value="${id}"]`);
    if (r) r.click();
  }, String(categoryId));
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    document.getElementById('myForm').action = 'test-kategorie.php';
    document.getElementById('myForm').submit();
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
}

async function getExerciseCount(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.pocet_text');
    return el ? parseInt(el.innerText) || 0 : 0;
  });
}

async function scrapeExercise(page, exerciseNum, categoryId) {
  // Navigate to exercise N in the current session
  await page.goto(`${BASE}/test-kategorie.php?poradi_ulohy=${exerciseNum}`, {
    waitUntil: 'networkidle'
  });
  await page.waitForTimeout(400);

  const url = page.url();

  // Extract text content
  const data = await page.evaluate(() => {
    const context  = document.querySelector('.zadani_pod p')?.innerText?.trim() ?? '';
    const question = document.querySelector('.vypis_zadani')?.innerText?.trim()
                  ?? document.querySelector('.vypis_zadani p')?.innerText?.trim() ?? '';
    const unit     = document.querySelector('.odpoved_text')?.innerText?.trim() ?? '';
    const points   = document.querySelector('.body_odpoved, .bod_text, [class*="body"]')?.innerText?.trim() ?? '';
    // Multiple choice options
    const mcOptions = [...document.querySelectorAll('.mc_odpoved_text, .volba_text, .moznost')]
      .map(e => e.innerText.trim()).filter(Boolean);
    const isMC = document.querySelector('.mc_odpoved, [class*="volba"], .moznost') !== null;
    return { context, question, unit, points, mcOptions, isMC };
  });

  if (!data.question) {
    // Fallback: get first meaningful text from body
    const bodyText = await page.evaluate(() => document.body.innerText);
    const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
    // Skip header lines (numbers, "počet chyb" etc.)
    const questionLine = lines.find(l => l.length > 20 && !/^\d+$/.test(l) && !l.includes('počet') && !l.includes('body'));
    if (questionLine) data.question = questionLine;
  }

  if (!data.question) {
    console.log(`    No question at exercise ${exerciseNum}`);
    return null;
  }

  // Screenshot the question
  const imgName = `cat${categoryId}-ex${String(exerciseNum).padStart(3,'0')}.png`;
  const imgPath = path.join(IMG_DIR, imgName);

  if (!existsSync(imgPath)) {
    // Crop: skip header (top 100px), capture question area
    await page.screenshot({
      path: imgPath,
      clip: { x: 0, y: 95, width: 1280, height: 450 }
    }).catch(() => {});
  }

  // ── Get correct answer by submitting wrong one ────────────────────────
  let correctAnswer = '';
  try {
    const hasInput = await page.$('input#odpoved1, input.input-odpoved') !== null;
    if (hasInput) {
      // Type into input (triggers oninput event → enables submit button)
      await page.focus('input#odpoved1, input.input-odpoved');
      await page.keyboard.type('0');
      await page.waitForTimeout(300);

      // Submit
      const submitBtn = await page.$('#submitButton1:not([disabled]), .zkontrolovat_text');
      if (submitBtn) {
        await submitBtn.click({ force: true });
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(600);

        // Extract correct answer
        correctAnswer = await page.evaluate(() => {
          // Try various selectors
          const selectors = [
            '.spravna_odpoved', '.correct_answer', '.spravna',
            '.vysledek_spravne', '.oprava_spravne', '[class*="spravna"]',
            '.zadani_vysledek', '.vysledek', '.odpoved_spravna'
          ];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim()) return el.innerText.trim();
          }
          // Fallback: parse body text for "Správná odpověď"
          const body = document.body.innerText;
          const m = body.match(/[Ss]právn[aá] odpověď[:\s]+([^\n]+)/);
          if (m) return m[1].trim();
          return '';
        });
      }
    }

    // Multiple choice: click wrong option then check
    if (!correctAnswer && data.isMC) {
      const firstOpt = await page.$('.mc_odpoved, .volba, [class*="volba-"]:first-child');
      if (firstOpt) {
        await firstOpt.click({ force: true });
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(600);
        correctAnswer = await page.evaluate(() => {
          const el = document.querySelector('.spravna_odpoved, [class*="spravna"], .correct');
          return el ? el.innerText.trim() : '';
        });
      }
    }
  } catch (e) {
    // answer extraction failed — that's ok
  }

  return {
    question: data.context ? `${data.context}\n\n${data.question}` : data.question,
    unit: data.unit,
    isMC: data.isMC,
    options: data.mcOptions,
    correctAnswer,
    imgName,
    imgPath,
    url,
  };
}

async function run() {
  const db = openDb();
  initDb(db);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO problems
      (id, year, term, problem_number, question_text, question_image, type,
       options, correct_answer, solution_steps, topic, difficulty, source_url)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const catIds = process.argv.slice(2).map(Number).filter(Boolean);
  const toProcess = catIds.length ? catIds : Object.keys(CATEGORY_TOPICS).map(Number);

  const browser = await chromium.launch({ headless: true });
  try {
    for (const catId of toProcess) {
      const existing = db.prepare('SELECT COUNT(*) as c FROM problems WHERE id LIKE ?')
        .get(`tau-cat${catId}-%`).c;
      if (existing > 0) {
        console.log(`Category ${catId}: SKIP (${existing} already in DB)`);
        continue;
      }

      console.log(`\n━━━ Category ${catId} — ${CATEGORY_TOPICS[catId]} ━━━`);
      const page = await browser.newPage();
      page.setDefaultTimeout(15000);

      await initSession(page, catId);
      const total = await getExerciseCount(page);
      console.log(`  ${total} exercises`);

      if (total === 0) { await page.close(); continue; }

      for (let i = 1; i <= total; i++) {
        process.stdout.write(`  [${i}/${total}] `);
        const result = await scrapeExercise(page, i, catId).catch(e => {
          console.error(`ERR: ${e.message}`); return null;
        });
        if (!result) continue;

        const id = `tau-cat${catId}-${String(i).padStart(3,'0')}`;
        insert.run(
          id, 0, `cat${catId}`, i,
          result.question,
          existsSync(result.imgPath) ? `data/images/tau/${result.imgName}` : null,
          result.isMC ? 'multiple_choice' : 'open',
          result.options.length ? JSON.stringify(result.options) : null,
          result.correctAnswer,
          JSON.stringify([]),
          CATEGORY_TOPICS[catId],
          CATEGORY_DIFFICULTY[catId],
          result.url
        );
        const q = result.question.replace(/\n/g,' ').substring(0, 55);
        const a = result.correctAnswer || '(no answer)';
        console.log(`${q}… → "${a}"`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const total = db.prepare('SELECT COUNT(*) as cnt FROM problems').get();
  console.log(`\n✓ Total in DB: ${total.cnt}`);
  db.prepare("SELECT topic, COUNT(*) as cnt FROM problems GROUP BY topic").all()
    .forEach(r => console.log(`  ${r.topic}: ${r.cnt}`));
}

await run();
