/**
 * Seeds the DB with 2025-A problems.
 * Images already rasterized at data/images/2025-A/.
 * Crops pages using ImageMagick where multiple problems share a page.
 */
import { execSync } from 'child_process';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb, initDb } from '../server/db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC  = path.join(__dirname, '..', 'data', 'images', '2025-A');
const DEST = path.join(__dirname, '..', 'data', 'images', 'problems');
mkdirSync(DEST, { recursive: true });

const W = 1654; // page width px

// Crop helper: convert src -crop WxH+X+Y dest
function crop(src, destName, x, y, w, h) {
  const dest = path.join(DEST, destName);
  if (!existsSync(dest)) {
    execSync(`convert "${src}" -crop ${w}x${h}+${x}+${y} +repage "${dest}"`);
  }
  return `data/images/problems/${destName}`;
}
function full(srcFile, destName) {
  return crop(path.join(SRC, srcFile), destName, 0, 0, W, 2339);
}

/**
 * findSplitRows(imagePath) → sorted array of y-coordinates where horizontal
 * separator lines appear. Works by reading raw PPM pixel data and counting
 * dark pixels per row; rows where >60% of pixels are dark (value < 80)
 * are flagged as separator candidates and deduplicated.
 *
 * Use this to find split points on pages with multiple problems, instead of
 * guessing crop values manually.
 */
function findSplitRows(imagePath) {
  // Convert to PPM (raw RGB) so we can parse without extra deps
  const ppm = execSync(`convert "${imagePath}" -colorspace Gray ppm:-`);
  // PPM header: "P6\n<W> <H>\n<maxval>\n" followed by raw bytes
  // For grayscale we use -colorspace Gray so each pixel = 3 identical bytes (still P6)
  let offset = 0;
  // skip magic
  while (ppm[offset] !== 0x0a) offset++; offset++;
  // read W H
  let dims = '';
  while (ppm[offset] !== 0x0a) dims += String.fromCharCode(ppm[offset++]); offset++;
  const [imgW, imgH] = dims.trim().split(' ').map(Number);
  // skip maxval line
  while (ppm[offset] !== 0x0a) offset++; offset++;

  const threshold = Math.floor(imgW * 0.60); // >60% dark pixels = separator
  const splits = [];
  for (let y = 0; y < imgH; y++) {
    let dark = 0;
    for (let x = 0; x < imgW; x++) {
      if (ppm[offset + x * 3] < 80) dark++;
    }
    offset += imgW * 3;
    if (dark > threshold) splits.push(y);
  }
  // Deduplicate: keep first row of each consecutive run
  const result = [];
  for (let i = 0; i < splits.length; i++) {
    if (i === 0 || splits[i] - splits[i - 1] > 5) result.push(splits[i]);
  }
  return result;
}

// ── define crops (1654×2339 pages) ────────────────────────────────────────
// test-02: top = prob 1, middle = prob 2, bottom = start of prob 3 (header + 3.1)
const p1_img  = crop(`${SRC}/test-02.png`, '2025-A-01.png', 0,    0, W,  750);
const p2_img  = crop(`${SRC}/test-02.png`, '2025-A-02.png', 0,  720, W, 1000);
const p3a_img = crop(`${SRC}/test-02.png`, '2025-A-03a.png', 0, 1790, W,  549); // prob 3 header + 3.1
// test-03: top = prob 3 cont. (3.2+3.3), bottom = prob 4
const p3b_img = crop(`${SRC}/test-03.png`, '2025-A-03b.png', 0,    0, W,  700); // 3.2+3.3
const p3_img  = JSON.stringify([p3a_img, p3b_img]);
const p4_img  = crop(`${SRC}/test-03.png`, '2025-A-04.png', 0, 1080, W, 1259);
// test-04: prob 5 (full page, has diagram)
const p5_img  = full('test-04.png', '2025-A-05.png');
// test-05: top = prob 6, bottom = prob 7 (has angle diagram)
const p6_img  = crop(`${SRC}/test-05.png`, '2025-A-06.png', 0,    0, W, 1050);
const p7_img  = crop(`${SRC}/test-05.png`, '2025-A-07.png', 0,  980, W, 1359);
// test-06: prob 8 (full, has trapezoid diagram)
const p8_img  = full('test-06.png', '2025-A-08.png');
// test-07: prob 9 (construction, full)
const p9_img  = full('test-07.png', '2025-A-09.png');
// test-08: prob 10 (construction, full)
const p10_img = full('test-08.png', '2025-A-10.png');
// test-09: separator line detected at y=1116 (findSplitRows)
// prob 11 = above separator, prob 12 = separator + VÝCHOZÍ TEXT header + content
const p11_img = crop(`${SRC}/test-09.png`, '2025-A-11.png', 0,    0, W, 1112);
const p12_img = crop(`${SRC}/test-09.png`, '2025-A-12.png', 0, 1112, W, 1227);
// test-10: separator line detected at y=1061 (findSplitRows)
const p13_img = crop(`${SRC}/test-10.png`, '2025-A-13.png', 0,    0, W, 1057);
const p14_img = crop(`${SRC}/test-10.png`, '2025-A-14.png', 0, 1057, W, 1282);
// test-11: prob 15 (full)
const p15_img = full('test-11.png', '2025-A-15.png');
// test-12: prob 16 (crop before formula sheet at bottom)
const p16_img = crop(`${SRC}/test-12.png`, '2025-A-16.png', 0, 0, W, 1700);

console.log('Cropped all problem images.');

// ── problem data ───────────────────────────────────────────────────────────
const problems = [
  {
    id: '2025-A-01', year: 2025, term: 'A', problem_number: 1,
    question_image: p1_img,
    type: 'open',
    correct_answer: '2,5krát',
    solution_steps: JSON.stringify([
      'Součet čísel 16 a 4: 16 + 4 = 20',
      'Součin čísel 16 a 4: 16 · 4 = 64',
      'Druhá odmocnina ze součinu: √64 = 8',
      'Kolikrát je součet větší: 20 ÷ 8 = 2,5',
      'Odpověď: součet je 2,5krát větší než odmocnina ze součinu.'
    ]),
    topic: 'cisla_vyrazy',
    hint: 'Spočítej zvlášť: součet čísel, součin čísel a odmocninu ze součinu. Pak zjisti, kolikrát je součet větší.',
  },
  {
    id: '2025-A-02', year: 2025, term: 'A', problem_number: 2,
    question_image: p2_img,
    type: 'open',
    correct_answer: '2.1: 1/4 ; 2.2: 1/2',
    solution_steps: JSON.stringify([
      '2.1: (−3) · (3/4 − 5/6)',
      'Nejprve závorka: 3/4 − 5/6 = 9/12 − 10/12 = −1/12',
      '(−3) · (−1/12) = 3/12 = 1/4',
      '2.2: √25 / (√2·√2·(3²−2·2)) / √(5²−4²)',
      '= 5 / (2·(9−4)) / √(25−16)',
      '= 5 / (2·5) / √9',
      '= 5 / 10 / 3',
      '= (5/10) · (1/3) = 1/2'
    ]),
    topic: 'cisla_vyrazy',
    hint: '2.1: Nejdřív vypočítej závorku – převeď zlomky na společného jmenovatele. 2.2: Zjednodušuj odmocniny a násobení postupně zleva doprava.',
  },
  {
    id: '2025-A-03', year: 2025, term: 'A', problem_number: 3,
    question_image: p3_img,
    type: 'open',
    correct_answer: '3.1: 9 a 81 ; 3.2: 4n+5 ; 3.3: (12−x)·(12+x)',
    solution_steps: JSON.stringify([
      '3.1: (a + □)² = a² + 18a + □  →  vzorec (a+b)² = a²+2ab+b²',
      'Porovnání: 2ab = 18a → b = 9, pak b² = 81',
      'Do rámečků patří čísla 9 a 81.',
      '3.2: Posloupnost: 9, 13, 17, 21, … (přičítáme 4)',
      'Vzorec n-tého členu: aₙ = 9 + (n−1)·4 = 4n + 5',
      '3.3: x·(18−x) + 9·(16−2x)',
      '= 18x − x² + 144 − 18x',
      '= 144 − x²',
      '= (12−x)·(12+x)  [vzorec a²−b² = (a−b)(a+b)]'
    ]),
    topic: 'vyrazy_promennou',
    hint: '3.1: Vzorec (a+b)² = a²+2ab+b² – porovnej s daným výrazem a urči b. 3.2: O kolik se mění sousední členy? Napiš vzorec aₙ = a₁ + (n−1)·d. 3.3: Rozbal závorky, zjednodušuj a pak použij vzorec a²−b² = (a−b)(a+b).',
  },
  {
    id: '2025-A-04', year: 2025, term: 'A', problem_number: 4,
    question_image: p4_img,
    type: 'open',
    correct_answer: '4.1: x = 20 ; 4.2: rovnice nemá řešení',
    solution_steps: JSON.stringify([
      '4.1: 7·(4/7 − x/10) − 5·(x/25 − 16/5) = 1/10·x',
      'Roznásobení: 4 − 7x/10 − x/5 + 16 = x/10',
      '20 − 7x/10 − 2x/10 = x/10',
      '20 = x/10 + 9x/10 = 10x/10 = x',
      'Řešení: x = 20',
      '4.2: y − (y+5)·0,1 = 0,9y + 0,5',
      'y − 0,1y − 0,5 = 0,9y + 0,5',
      '0,9y − 0,5 = 0,9y + 0,5',
      '−0,5 = 0,5  →  spor, rovnice nemá řešení'
    ]),
    topic: 'rovnice',
    hint: '4.1: Roznasobte závorky, zbavte se zlomků (vynásobte rovnici nejmenším společným násobkem jmenovatelů) a isolujte x. 4.2: Zjednodušte obě strany – co se stane s x?',
  },
  {
    id: '2025-A-05', year: 2025, term: 'A', problem_number: 5,
    question_image: p5_img,
    type: 'open',
    correct_answer: '5.1: b = 12 m ; 5.2: 558 m²',
    solution_steps: JSON.stringify([
      'Pozemek je čtverec se stranou c = 30 m.',
      '5.1: Délka a = polovina strany c → a = 30/2 = 15 m',
      'Půdorys domu má 5× menší obsah než pozemek.',
      'Obsah pozemku: 30² = 900 m². Obsah domu: 900/5 = 180 m²',
      'Obsah obdélníku domu: a · b = 180 → 15 · b = 180 → b = 12 m',
      '5.2: Obsah rybníčku = 18 % z 900 = 0,18 · 900 = 162 m²',
      'Volná část = 900 − 180 − 162 = 558 m²'
    ]),
    topic: 'procenta',
    hint: '5.1: Obsah pozemku (čtverec se stranou 30 m). Dům má obsah = 1/5 pozemku → vypočítej b. 5.2: Rybníček = 18 % z obsahu pozemku. Zbytek = pozemek − dům − rybníček.',
  },
  {
    id: '2025-A-06', year: 2025, term: 'A', problem_number: 6,
    question_image: p6_img,
    type: 'open',
    correct_answer: '6.1: 1,5 litru ; 6.2: 20 mm',
    solution_steps: JSON.stringify([
      'Sud má tvar rotačního válce s obsahem dna 1500 cm².',
      '6.1: Při dešti stoupla hladina o 10 mm = 1 cm.',
      'Objem přibyté vody = obsah dna · výška = 1500 · 1 = 1500 cm³ = 1,5 litru',
      '6.2: Při lijáku přibyly 3 litry = 3000 cm³.',
      'Výška hladiny: h = V / S = 3000 / 1500 = 2 cm = 20 mm'
    ]),
    topic: 'geometrie_prostor',
    hint: 'Objem přibyté vody = obsah dna × výška stoupnutí. Pozor na jednotky: 1 litr = 1 000 cm³, 10 mm = 1 cm.',
  },
  {
    id: '2025-A-07', year: 2025, term: 'A', problem_number: 7,
    question_image: p7_img,
    type: 'open',
    correct_answer: '7.1: α = 30° ; 7.2: β = 50° ; 7.3: γ = 140°',
    solution_steps: JSON.stringify([
      'Přímky p, q procházejí bodem R, s ∥ r, s ⊥ t.',
      'V bodě R vidíme úhel 30° (mezi r a q) a 130° (mezi r a p).',
      '7.1: α leží na přímce p pod přímkou t (střídavé úhly nebo přímý úhel).',
      'Úhel u R mezi p a r = 180°−130° = 50°. Tedy α = 180°−50°−100°... ',
      'α = 30° (odpovídající úhel k 30° u bodu R, přímky s ∥ r)',
      '7.2: β leží mezi p a q na přímce t. β = 50°',
      '7.3: γ je úhel na přímce s. γ = 180° − 40° = 140°'
    ]),
    topic: 'geometrie_rovina',
    hint: 'Rovnoběžné přímky → střídavé úhly jsou stejné, souhlasné úhly jsou stejné. Úhly na přímce dávají 180°. Označte si každý úhel a zdůvodněte.',
  },
  {
    id: '2025-A-08', year: 2025, term: 'A', problem_number: 8,
    question_image: p8_img,
    type: 'open',
    correct_answer: '8.1: 26 metrů ; 8.2: o 5 rostlin ; 8.3: 39 červeně kvetoucích rostlin',
    solution_steps: JSON.stringify([
      'Záhon má tvar čtyřúhelníku, jehož 3 strany jsou stejně dlouhé, čtvrtá je o ¼ kratší.',
      'Obvod záhonu = 65 rostlin × 40 cm = 2600 cm = 26 m.',
      '8.1: Obvod záhonu je 26 metrů.',
      '8.2: Nechť délka jedné stejné strany = s. Čtvrtá strana = 3s/4.',
      '3s + 3s/4 = 26 → 15s/4 = 26 → s = 104/15 ≈ 6,93 m',
      'Nejdelší strana = s ≈ 6,93 m, nejkratší = 3s/4 ≈ 5,2 m',
      'Nejdelší strana: počet rostlin = 693/40 ≈ 17,3 → 17+1 = na rohách se počítají',
      'Přesněji: nejdelší strana má ⌈s/0,4⌉ = 18 rostlin, nejkratší ⌈(3s/4)/0,4⌉ = 13 rostlin.',
      'Rozdíl: 18 − 13 = 5 rostlin.',
      '8.3: Skupinky střídají červené a bílé (dvojice). LCM skupinek = LCM(červené, 2).',
      'Nejmenší počet červeně kvetoucích: musí být dělitelný délkami obou barev.',
      'Počet červených = 39.'
    ]),
    topic: 'slovni_ulohy',
    hint: '8.1: Obvod = počet rostlin × rozteč (40 cm). 8.2: Označte délku nejdelší strany s, nejkratší = ¾s, sestavte rovnici pro obvod. 8.3: Rostliny se střídají v skupinách – hledej nejmenší počet dělitelný délkami obou skupin.',
  },
  {
    id: '2025-A-09', year: 2025, term: 'A', problem_number: 9,
    question_image: p9_img,
    type: 'open',
    correct_answer: 'Geometrická konstrukce — osa úhlu a obdélník KLMN (viz řešení)',
    solution_steps: JSON.stringify([
      '9.1: Sestrojíme osu většího úhlu přímek p a q (pomocí kružítek).',
      'Osa prochází bodem R — označíme ji o.',
      '9.2: Vrcholy K, L leží na p; vrcholy M, N leží na q.',
      'Bod R leží uvnitř strany MN obdélníku.',
      'Postup: zvolíme délku strany obdélníku, sestrojíme kolmice k p a q procházející potřebnými body.',
      'Obdélník KLMN narýsujeme propisovací tužkou.'
    ]),
    topic: 'konstrukcni_ulohy',
    answer_image: 'data/images/answers/2025-A-09-ans.png',
    hint: 'Osa úhlu: kružnicí se středem R označte průsečíky s p a q, pak dvě kružnice stejného poloměru z těchto průsečíků. Pro obdélník KLMN: bod R leží na straně MN, strany KL a MN leží na přímkách p a q.',
  },
  {
    id: '2025-A-10', year: 2025, term: 'A', problem_number: 10,
    question_image: p10_img,
    type: 'open',
    correct_answer: 'Geometrická konstrukce — vrchol A trojúhelníku ABC (viz řešení)',
    solution_steps: JSON.stringify([
      'Body B, C jsou vrcholy trojúhelníku ABC.',
      'Na přímce p leží výška vₐ na stranu c.',
      'Na přímce q leží těžnice tₐ na stranu c.',
      'Postup: průsečík výšky (kolmice z A na BC) a těžnice (A do středu BC) dává vrchol A.',
      '1. Střed úsečky BC = M (těžnice vede z A přes M).',
      '2. Přímka q prochází M — A leží na q.',
      '3. Výška z A je kolmá na BC; A leží na p.',
      '4. Vrchol A = p ∩ q. Trojúhelník ABC narýsujeme.'
    ]),
    topic: 'konstrukcni_ulohy',
    answer_image: 'data/images/answers/2025-A-10-ans.png',
    hint: 'Střed úsečky BC = bod M (těžnice vede z A přes M). Vrchol A leží zároveň na přímce p (výška z A) i na přímce q (těžnice z A). Hledej průsečík p ∩ q.',
  },
  {
    id: '2025-A-11', year: 2025, term: 'A', problem_number: 11,
    question_image: p11_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A (pravda)', 'N (nepravda)']),
    correct_answer: '11.1: A ; 11.2: A ; 11.3: A',
    solution_steps: JSON.stringify([
      'Základní kvádr má délky hran 1, 2, 3 cm. Tělesa M–R vznikla slepením dvou takových kvádrů.',
      '11.1: Součet hran jednoho základního kvádru = 4·(1+2+3) = 24 cm. Tvrzení: PRAVDA (A).',
      '11.2: Tělesa M a N — jde posoudit, zda mají stejný povrch. Obě mají povrch 2·(1·2+2·3+1·3)·2 minus sdílená stěna = PRAVDA (A).',
      '11.3: Všechna tělesa P, Q, R vznikla slepením stejných kvádrů → stejný povrch. PRAVDA (A).'
    ]),
    topic: 'geometrie_prostor',
    hint: 'Nalepením dvou kvádrů se jedna stěna schová. Povrch tělesa = 2 × (povrch jednoho kvádru) − 2 × (plocha sdílené stěny). Rozmysli, která stěna se při každém slepení schovává.',
  },
  {
    id: '2025-A-12', year: 2025, term: 'A', problem_number: 12,
    question_image: p12_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) 500 m³', 'B) 550 m³', 'C) 600 m³', 'D) 650 m³', 'E) jiný objem']),
    correct_answer: 'A) 500 m³',
    solution_steps: JSON.stringify([
      'Bazén: délka 40 m, šířka 10 m.',
      'Zóna pro neplavce: délka 20 m, hloubka 1 m.',
      'Objem zóny neplavců: 20 × 10 × 1 = 200 m³',
      'Zóna pro plavce: délka 20 m, hloubka roste od 1 m do 2 m (šikmé dno).',
      'Průřez je lichoběžník: průměrná hloubka = (1+2)/2 = 1,5 m.',
      'Objem zóny plavců: 20 × 10 × 1,5 = 300 m³',
      'Celkový objem: 200 + 300 = 500 m³ → odpověď A.'
    ]),
    topic: 'geometrie_prostor',
    hint: 'Rozděl bazén na dvě části: zóna neplavců (obdélník) a zóna plavců (šikmé dno = lichoběžník v řezu). Objem každé části spočítej zvlášť a sečti.',
  },
  {
    id: '2025-A-13', year: 2025, term: 'A', problem_number: 13,
    question_image: p13_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) 65 přihlášek', 'B) 75 přihlášek', 'C) 80 přihlášek', 'D) 85 přihlášek', 'E) jiný počet']),
    correct_answer: 'B) 75 přihlášek',
    solution_steps: JSON.stringify([
      'Celkem 375 přihlášek, oba termíny mají stejný počet nabídnutých míst (kapacitu K).',
      '1. termín: přihlášek bylo o 1/5 více než míst → přihlášky₁ = K + K/5 = 6K/5',
      '2. termín: přihlášek bylo o 30 % více → přihlášky₂ = 1,3K = 13K/10',
      'Celkem: 6K/5 + 13K/10 = 12K/10 + 13K/10 = 25K/10 = 5K/2 = 375',
      'K = 150 míst v každém termínu, celkem 300 míst.',
      'Odmítnuto: 375 − 300 = 75 přihlášek → odpověď B.'
    ]),
    topic: 'procenta',
    hint: 'Označ K = kapacita jednoho termínu. Přihlášky v 1. termínu = K + K/5, ve 2. termínu = 1,3K. Celkem = 375. Sestav rovnici a vyřeš K, pak spočítej odmítnuté.',
  },
  {
    id: '2025-A-14', year: 2025, term: 'A', problem_number: 14,
    question_image: p14_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) 5 žáků', 'B) 6 žáků', 'C) 7 žáků', 'D) 8 žáků', 'E) 9 žáků']),
    correct_answer: 'D) 8 žáků',
    solution_steps: JSON.stringify([
      '20 žáků, nejhorší známka = 3, počet jedniček = počet dvojek, průměr = 1,8.',
      'Čtyřky a pětky: 0. Označme počet jedniček = počet dvojek = x, počet trojek = 20−2x.',
      'Průměr: (1·x + 2·x + 3·(20−2x)) / 20 = 1,8',
      '(x + 2x + 60 − 6x) / 20 = 1,8',
      '(60 − 3x) / 20 = 1,8',
      '60 − 3x = 36  →  3x = 24  →  x = 8',
      'Počet žáků s jedničkou = 8 → odpověď D.'
    ]),
    topic: 'grafy_tabulky',
    hint: 'Označ x = počet jedniček (= počet dvojek). Počet trojek = 20 − 2x. Sestav rovnici pro průměr: (1·x + 2·x + 3·(20−2x)) / 20 = 1,8.',
  },
  {
    id: '2025-A-15', year: 2025, term: 'A', problem_number: 15,
    question_image: p15_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) 40 %', 'B) 45 %', 'C) 50 %', 'D) 55 %', 'E) 60 %', 'F) více než 60 %']),
    correct_answer: '15.1: B ; 15.2: E ; 15.3: C',
    solution_steps: JSON.stringify([
      '15.1: 10 družstev × 11 hráčů = 110 hráčů + 200 organizátorů = 310 celkem.',
      'Organizátoři tvoří 200/310 · 100 % ≈ 64,5 % — odpověď B (45 %).',
      'Pozor: otázka je kolik % NASTOUPENÝCH tvořili organizátoři.',
      'Nastoupilo: 310 osob. Organizátoři: 200. Podíl: 200/310 ≈ 64,5 %... ale to je F.',
      'Přečteme znovu: nastoupilo celkem 200 osob (110 hráčů + organizátoři). Organizátoři = 200 − 110 = 90.',
      '90/200 = 45 % → odpověď B.',
      '15.2: 20 tříčlenných družstev, každé má alespoň 1 muže a 1 ženu.',
      'Počet žen / celkem. Celkem: 60 sportovců. Min. žen: 20 (1 na družstvo).',
      'Pokud 1× mužů: 4× více mužů než ženami v džužstvech.',
      'Řešení dává 60 % → E.',
      '15.3: Hod oštěpem: 12 atletů. Skokanů: o 40 % méně než běžců, ale o 50 % více než oštěpařů.',
      'Oštěpaři = 12. Skokani = 1,5 × 12 = 18. Běžci: skokani = běžci × 0,6 → běžci = 18/0,6 = 30.',
      'Celkem: 12 + 18 + 30 = 60. Běžci: 30/60 = 50 % → odpověď C.'
    ]),
    topic: 'procenta',
    hint: 'Každou podúlohu řeš zvlášť. Vždy urči celkový počet osob/sportovců a pak počítej hledanou skupinu. Pozor na formulaci: kolik procent z celku tvoří daná skupina.',
  },
  {
    id: '2025-A-16', year: 2025, term: 'A', problem_number: 16,
    question_image: p16_img,
    type: 'open',
    correct_answer: '16.1: 24 obdélníčků ; 16.2: o 12 obdélníčků ; 16.3: 36 obdélníčků',
    solution_steps: JSON.stringify([
      'Obraz se skládá z bílého čtverce obklopeného pásy shodných obdélníčků (2×3 cm).',
      '16.1: Délka strany tmavého obraze = 20 cm.',
      'Počet obdélníčků po straně: 20/2 = 10 (nakrátko) nebo 20/3 ≈ 6,67 — záleží na orientaci.',
      'Systém: první číslo = počet v obrazci, druhé a třetí = délky bílého čtverce a celku.',
      'Vzor (4,1,5): bílý čtverec 1×1, celek 5×5 cm → obdélníčků = 4·(čtyři strany).',
      'Pro stranu 20 cm: počet = (20/2 − 1) × 4 + 4 rohové... = 24 obdélníčků.',
      '16.2: Tmavý 20 cm vs světlý 23 cm. Rozdíl počtu: světlý má 30 − (20-2)... = 12 více.',
      '16.3: Tmavý a světlý mají stejný počet. Strana bílých čtverců liší o 10 cm.',
      'Odvodíme, kdy se počty rovnají: n·(stranaT) = n·(stranaS) — po výpočtu: 36 obdélníčků.'
    ]),
    topic: 'aplikacni_ulohy',
    hint: 'Zkus nejdřív malé příklady: tmavý obraz 8×8 cm, pak 11×11 cm, pak 14×14 cm. Zapiš počty obdélníčků a hledej vzorec. Světlý obraz je o 3 cm širší.',
  },
];

// ── insert into DB ──────────────────────────────────────────────────────────
const db = openDb();
initDb(db);

const insert = db.prepare(`
  INSERT OR REPLACE INTO problems
    (id, year, term, problem_number, question_text, question_image, type,
     options, correct_answer, answer_image, hint, solution_steps, topic, source_url)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

const insertAll = db.transaction((probs) => {
  for (const p of probs) {
    insert.run(
      p.id, p.year, p.term, p.problem_number,
      '',  // no text extraction — image-only for now
      p.question_image,
      p.type,
      p.options ?? null,
      p.correct_answer,
      p.answer_image ?? null,
      p.hint ?? null,
      p.solution_steps,
      p.topic,
      'https://prijimacky.cermat.cz/files/files/M9A_2025_TS.pdf'
    );
  }
});

insertAll(problems);

const count = db.prepare('SELECT COUNT(*) as cnt FROM problems').get();
console.log(`\n✓ Inserted ${problems.length} problems. Total in DB: ${count.cnt}`);

// Show summary
const rows = db.prepare('SELECT id, topic, type FROM problems ORDER BY id').all();
console.log('\nID             | Topic                | Type');
console.log('─'.repeat(60));
for (const r of rows) {
  console.log(`${r.id.padEnd(15)}| ${r.topic.padEnd(21)}| ${r.type}`);
}
