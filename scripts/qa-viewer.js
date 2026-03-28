/**
 * QA viewer — runs after seeding, before pushing.
 *
 * 1. Automated checks: each problem must have an image that is readable and
 *    tall enough to contain real content (not just a blank strip).
 * 2. Generates qa-report.html showing every crop with its metadata so you
 *    can visually scan for wrong splits before committing.
 *
 * Usage:
 *   node scripts/qa-viewer.js
 *   # then open qa-report.html in a browser
 */
import { readFileSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const problems = JSON.parse(readFileSync(path.join(ROOT, 'src/data/problems.json'), 'utf8'));

// ── Automated checks ──────────────────────────────────────────────────────
const MIN_HEIGHT = 150;   // px — a crop shorter than this is almost certainly wrong
let errors = 0;
let warnings = 0;

function checkImage(imgPath, label) {
  if (!imgPath) return;
  // Handle JSON-array images
  const paths = imgPath.startsWith('[') ? JSON.parse(imgPath) : [imgPath];
  for (const rel of paths) {
    const abs = path.join(ROOT, 'public', rel);
    try {
      statSync(abs);
    } catch {
      console.error(`  ✗ MISSING  ${label}: ${rel}`);
      errors++;
      return;
    }
    // Use ImageMagick identify to get height
    try {
      const out = execSync(`identify -format "%h" "${abs}"`, { encoding: 'utf8' }).trim();
      const h = parseInt(out, 10);
      if (h < MIN_HEIGHT) {
        console.warn(`  ⚠ TOO SHORT  ${label}: ${rel}  (${h}px < ${MIN_HEIGHT}px)`);
        warnings++;
      }
    } catch {
      console.warn(`  ⚠ identify failed for ${rel}`);
      warnings++;
    }
  }
}

console.log('\n── Automated image checks ──────────────────────────────────────────────');
for (const p of problems) {
  checkImage(p.question_image, `${p.id} question`);
  if (p.answer_image) checkImage(p.answer_image, `${p.id} answer`);
}

if (errors === 0 && warnings === 0) {
  console.log('  ✓ All images present and above minimum height.');
} else {
  console.log(`\n  ${errors} error(s), ${warnings} warning(s).`);
}

// ── Generate HTML report ──────────────────────────────────────────────────
// Group by year+term
const groups = new Map();
for (const p of problems) {
  const key = `${p.year}-${p.term}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p);
}
for (const arr of groups.values()) {
  arr.sort((a, b) => a.problem_number - b.problem_number);
}

function imgTag(rel, alt) {
  if (!rel) return '<span style="color:#aaa">—</span>';
  const rels = rel.startsWith('[') ? JSON.parse(rel) : [rel];
  return rels.map(r =>
    `<img src="../public/${r}" alt="${alt}" style="max-width:100%;display:block;margin-bottom:4px">`
  ).join('');
}

const rows = [];
for (const [key, probs] of [...groups.entries()].sort()) {
  rows.push(`<tr><td colspan="4" style="background:#1e293b;color:#f8fafc;font-weight:bold;padding:10px 8px;font-size:15px">📋 Sada ${key} (${probs.length} úloh)</td></tr>`);
  for (const p of probs) {
    const hasAnswer = !!p.answer_image;
    rows.push(`
      <tr style="border-bottom:1px solid #e2e8f0;vertical-align:top">
        <td style="padding:8px;font-size:12px;white-space:nowrap;color:#64748b">
          <strong style="color:#1e293b">${p.problem_number}</strong><br>
          <code>${p.id}</code><br><br>
          <span style="background:#e0e7ff;color:#3730a3;padding:2px 6px;border-radius:9999px;font-size:11px">${p.topic}</span><br><br>
          <span style="font-size:11px;color:#94a3b8">${p.type}</span>
          ${hasAnswer ? '<br><span style="font-size:11px;color:#059669">✓ answer img</span>' : ''}
        </td>
        <td style="padding:8px;max-width:480px">${imgTag(p.question_image, 'otázka')}</td>
        <td style="padding:8px;max-width:400px">${imgTag(p.answer_image, 'odpověď')}</td>
        <td style="padding:8px;font-size:11px;max-width:220px;color:#475569;word-break:break-word">
          <strong>Odpověď:</strong><br>${(p.correct_answer || '').replace(/;/g, ';<br>')}<br><br>
          ${p.hint ? `<strong>Nápověda:</strong><br>${p.hint.slice(0, 120)}…` : ''}
        </td>
      </tr>`);
  }
}

const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>QA Report — CERMAT tutor</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #f8fafc; }
  h1 { margin: 16px; font-size: 18px; color: #1e293b; }
  .summary { margin: 0 16px 16px; padding: 10px 14px; border-radius: 8px; font-size: 14px; }
  .ok { background: #dcfce7; color: #166534; }
  .fail { background: #fee2e2; color: #991b1b; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 12px; color: #64748b; }
</style>
</head>
<body>
<h1>QA Report — ${problems.length} problémů</h1>
<div class="summary ${errors > 0 ? 'fail' : 'ok'}">
  ${errors > 0 ? `⚠ ${errors} chybějících obrázků` : `✓ ${problems.length} příkladů — ${warnings} varování`}
  &nbsp;|&nbsp; Vygenerováno: ${new Date().toLocaleString('cs-CZ')}
</div>
<table>
  <thead>
    <tr>
      <th style="width:120px">#</th>
      <th>Zadání</th>
      <th>Odpověď</th>
      <th>Metadata</th>
    </tr>
  </thead>
  <tbody>
    ${rows.join('\n')}
  </tbody>
</table>
</body>
</html>`;

const outPath = path.join(ROOT, 'qa-report.html');
writeFileSync(outPath, html);
console.log(`\n── HTML report ──────────────────────────────────────────────────────────`);
console.log(`  Generated: ${outPath}`);
console.log(`  Open in browser to visually verify all crops.\n`);
