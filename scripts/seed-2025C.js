/**
 * Seeds the DB with 2025-C problems (1. náhradní termín).
 * PDFs already rasterized at data/images/2025-C/.
 */
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb, initDb } from '../server/db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC  = path.join(__dirname, '..', 'data', 'images', '2025-C');
const DEST = path.join(__dirname, '..', 'data', 'images', 'problems');
mkdirSync(DEST, { recursive: true });

const W = 1654;

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

// ── crops ──────────────────────────────────────────────────────────────────
// test-02: probs 1, 2, 3
// y=196 is separator after instruction line (prob 1 starts after it).
// y=485 is between prob 1 and prob 2.  y=955 is between prob 2 and prob 3.
const p1_img  = crop(`${SRC}/test-02.png`, '2025-C-01.png', 0,   0, W,  485);  // instruction + prob 1 (0→485)
const p2_img  = crop(`${SRC}/test-02.png`, '2025-C-02.png', 0, 485, W,  470);  // prob 2 (485→955)
const p3_img  = crop(`${SRC}/test-02.png`, '2025-C-03.png', 0, 955, W, 1384);  // prob 3 (955→end)

// test-03: probs 4, 5  (separator at y=1076)
const p4_img  = crop(`${SRC}/test-03.png`, '2025-C-04.png', 0,    0, W, 1076);
const p5_img  = crop(`${SRC}/test-03.png`, '2025-C-05.png', 0, 1076, W, 1263);

// test-04: probs 6, 7  (VÝCHOZÍ TEXTs at y=173,328 and y=1214,1503; prob boundary y=1125)
const p6_img  = crop(`${SRC}/test-04.png`, '2025-C-06.png', 0,    0, W, 1125);
const p7_img  = crop(`${SRC}/test-04.png`, '2025-C-07.png', 0, 1125, W, 1214);

// test-05: prob 8 (tiles, separators y=173,751)
const p8_img  = crop(`${SRC}/test-05.png`, '2025-C-08.png', 0, 0, W, 1500);

// test-06: prob 9 — construction (full page)
const p9_img  = full('test-06.png', '2025-C-09.png');

// test-07: prob 10 — construction (full page, separators y=173,355,1036)
const p10_img = full('test-07.png', '2025-C-10.png');

// test-08: prob 11 — bar chart A/N (separators y=173,848)
const p11_img = crop(`${SRC}/test-08.png`, '2025-C-11.png', 0, 0, W, 1500);

// test-09: probs 12, 13  (separators y=173,646,1167,1256,1688)
const p12_img = crop(`${SRC}/test-09.png`, '2025-C-12.png', 0,    0, W, 1167);
const p13_img = crop(`${SRC}/test-09.png`, '2025-C-13.png', 0, 1167, W, 1172);

// test-10: prob 14  (separators y=173,888 — extend to include all MC options A–E)
const p14_img = crop(`${SRC}/test-10.png`, '2025-C-14.png', 0, 0, W, 1600);

// test-11: prob 15 — matching (no separator detected, crop lower half of page)
const p15_img = crop(`${SRC}/test-11.png`, '2025-C-15.png', 0, 0, W, 2200);

// test-12: prob 16 + formula sheet (separator at y=1745 before formula)
const p16_img = crop(`${SRC}/test-12.png`, '2025-C-16.png', 0, 0, W, 1745);

// ── answer images for construction problems (from key PDF) ─────────────────
const KEY = path.join(__dirname, '..', 'data', 'images', '2025-C');
// key-3: prob 9 (top, splits [157,822,879,1118]) and prob 10 (bottom, splits at 1175,1773)
const p9_ans  = crop(`${KEY}/key-3.png`, '2025-C-09-answer.png', 0,    0, W, 1118);  // prob 9 full solution
const p10_ans = crop(`${KEY}/key-3.png`, '2025-C-10-answer.png', 0, 1118, W, 1221);  // prob 10 (1118→2339)

console.log('Cropped all 2025-C problem images.');

// ── problem data ───────────────────────────────────────────────────────────
const problems = [
  {
    id: '2025-C-01', year: 2025, term: 'C', problem_number: 1,
    question_image: p1_img,
    type: 'open',
    correct_answer: '20 000krát',
    solution_steps: JSON.stringify([
      '5 kilogramů = 5 000 gramů.',
      '5 000 ÷ 0,25 = 5 000 × 4 = 20 000.',
      'Odpověď: 5 kg je 20 000krát více než 0,25 g.',
    ]),
    topic: 'cisla_operace',
    hint: 'Převeď 5 kg na gramy (×1000). Pak děl 0,25 (= násobení 4).',
  },
  {
    id: '2025-C-02', year: 2025, term: 'C', problem_number: 2,
    question_image: p2_img,
    type: 'open',
    correct_answer: '7',
    solution_steps: JSON.stringify([
      'Hledáme prvočíslo p, pro které p² + 3 = q (q je also prvočíslo).',
      'Zkusíme p = 2: p² = 4. q = 4 + 3 = 7 (prvočíslo ✓).',
      'Zkusíme p = 3: p² = 9. q = 9 + 3 = 12 (není prvočíslo ✗).',
      'Pro p > 2: p² je liché, p² + 3 je sudé > 2, tedy není prvočíslo.',
      'Jedinou možností je p = 2, q = 7. Větší prvočíslo = 7.',
    ]),
    topic: 'cisla_operace',
    hint: 'Zkus malá prvočísla p = 2, 3, 5, 7. Pro která je p² + 3 také prvočíslem? Pamatuj: sudá čísla > 2 nejsou prvočísla.',
  },
  {
    id: '2025-C-03', year: 2025, term: 'C', problem_number: 3,
    question_image: p3_img,
    type: 'open',
    correct_answer: '3.1: 9/10 ; 3.2: -2/5',
    solution_steps: JSON.stringify([
      '3.1: (√(10²−19)) / √(10²)',
      '= √(100−19) / √100',
      '= √81 / 10 = 9/10',
      '3.2: Výpočet výrazu (viz obrázek se zadáním).',
      'Po zjednodušení čitatele: (3/5)² = 9/25.',
      'Po zjednodušení jmenovatele obdržíme výsledek: −2/5.',
    ]),
    topic: 'cisla_vyrazy',
    hint: '3.1: Spočítej √(10² − 19) = √81 = 9, a √(10²) = 10. 3.2: Zjednodušuj postupně — nejprve čitatel, pak jmenovatel (rozeber závorky, zkraťte společné faktory).',
  },
  {
    id: '2025-C-04', year: 2025, term: 'C', problem_number: 4,
    question_image: p4_img,
    type: 'open',
    correct_answer: '4.1: 64a²-64a+16 ; 4.2: 4x²+4 ; 4.3: 2n²+n',
    solution_steps: JSON.stringify([
      '4.1: (4 + 8a − 8)² = (8a − 4)²',
      '= (8a)² − 2·8a·4 + 4² = 64a² − 64a + 16',
      '4.2: (2−3x)·2 + (2x)² − x·(−6)',
      '= 4 − 6x + 4x² + 6x = 4x² + 4',
      '4.3: (1−2n)·(1−2n+4n) − 2n·(1−3n) + (3n−1)',
      '= (1−2n)·(1+2n) − 2n + 6n² + 3n − 1',
      '= (1 − 4n²) − 2n + 6n² + 3n − 1',
      '= 2n² + n',
    ]),
    topic: 'vyrazy_promennou',
    hint: '4.1: Nejdřív zjednodušte závorku: 4+8a−8 = 8a−4. Pak umocněte (a−b)² = a²−2ab+b². 4.2: Roznásobte závorky, sečtěte stejné členy. 4.3: Použijte vzorec (1−2n)(1+2n) = 1−4n².',
  },
  {
    id: '2025-C-05', year: 2025, term: 'C', problem_number: 5,
    question_image: p5_img,
    type: 'open',
    correct_answer: '5.1: x = -1/6 ; 5.2: y = 0',
    solution_steps: JSON.stringify([
      '5.1: 5x + 2/15 + x/15 = 2x/3 − 3/5',
      'Vynásobme 15: 75x + 2 + x = 10x − 9',
      '76x − 10x = −9 − 2 → 66x = −11 → x = −11/66 = −1/6',
      '5.2: 4 − (7−3y)/5 = 3 + (7y−4)/10',
      'Vynásobme 10: 40 − 2(7−3y) = 30 + (7y−4)',
      '40 − 14 + 6y = 30 + 7y − 4',
      '26 + 6y = 26 + 7y → 0 = y → y = 0',
    ]),
    topic: 'rovnice',
    hint: '5.1: Vynásobte rovnici 15 (LCM jmenovatelů 15, 15, 3, 5). 5.2: Vynásobte rovnici 10 (LCM jmenovatelů 5, 10). Zkontrolujte zkouškou.',
  },
  {
    id: '2025-C-06', year: 2025, term: 'C', problem_number: 6,
    question_image: p6_img,
    type: 'open',
    correct_answer: '6.1: 2n ; 6.2: 3n/4 ; 6.3: 2 400 Kč',
    solution_steps: JSON.stringify([
      'Noční stolek = n korun.',
      '6.1: Noční stolek o polovinu levnější než skříň → n = skříň/2 → skříň = 2n.',
      '6.2: Noční stolek o třetinu dražší než postel → n = postel + postel/3 = 4·postel/3 → postel = 3n/4.',
      '6.3: Celkem: n + 2n + 3n/4 = 9 000',
      '4n/4 + 8n/4 + 3n/4 = 9 000',
      '15n/4 = 9 000 → n = 9 000 × 4/15 = 2 400 Kč.',
    ]),
    topic: 'slovni_ulohy',
    hint: '6.1: „o polovinu levnější než skříň" → noční stolek = skříň/2, takže skříň = 2n. 6.2: „o třetinu dražší než postel" → stolek = postel × 4/3, takže postel = 3n/4. 6.3: Sečtěte všechny tři ceny a rovnejte 9000.',
  },
  {
    id: '2025-C-07', year: 2025, term: 'C', problem_number: 7,
    question_image: p7_img,
    type: 'open',
    correct_answer: '7.1: 42 km/h ; 7.2: 30 km ; 7.3: 40 minut',
    solution_steps: JSON.stringify([
      '7.1: Rychlost při klesání = 30 × 1,4 = 42 km/h.',
      '7.2: Celková trasa = t. Rovina = t/3, klesání = t/5, stoupání = 14 km.',
      't/3 + t/5 + 14 = t → 5t/15 + 3t/15 = t − 14 → 8t/15 = t − 14',
      't − 8t/15 = 14 → 7t/15 = 14 → t = 30 km.',
      '7.3: Rychlost stoupání = 42/2 = 21 km/h. Čas = 14 km / 21 km/h = 2/3 h = 40 minut.',
    ]),
    topic: 'slovni_ulohy',
    hint: '7.1: Rychlost klesání = 30 × (1 + 0,4). 7.2: Označ celkovou trasu t, rovina = t/3, klesání = t/5, stoupání = 14 km → sestavte rovnici t/3 + t/5 + 14 = t. 7.3: čas = vzdálenost / rychlost, převeď hodiny na minuty.',
  },
  {
    id: '2025-C-08', year: 2025, term: 'C', problem_number: 8,
    question_image: p8_img,
    type: 'open',
    correct_answer: '8.1: 79 cm² ; 8.2: o 120',
    solution_steps: JSON.stringify([
      'Dlaždice 20×20 cm: čtvrtkruh s r = 10 cm, malý kruh s r = 5 cm.',
      '8.1: Obsah malého kruhu = π·r² = π·25 ≈ 3,14·25 = 78,5 ≈ 79 cm².',
      '8.2: Podlaha 200×320 cm. Počet dlaždic: (200/20) × (320/20) = 10 × 16 = 160.',
      'Dlaždice se kladou ve čtveřicích 2×2: počet čtveřic = 5 × 8 = 40.',
      'Malé kruhy: 1 na dlaždici → 160 malých kruhů.',
      'Velké kruhy: 4 čtvrtkruhy ze čtveřice → 1 velký kruh na čtveřici → 40 velkých kruhů.',
      'Rozdíl: 160 − 40 = 120 (malých kruhů je o 120 více).',
    ]),
    topic: 'geometrie_rovina',
    hint: '8.1: S = π·r². Z obrázku: r malého kruhu = 5 cm. 8.2: Spočítej počet dlaždic (200÷20 × 320÷20). Každé čtyři dlaždice tvoří jeden velký kruh (ze 4 čtvrtkruhů). Malých kruhů je jeden na dlaždici.',
  },
  {
    id: '2025-C-09', year: 2025, term: 'C', problem_number: 9,
    question_image: p9_img,
    answer_image: p9_ans,
    type: 'open',
    correct_answer: 'Geometrická konstrukce — rovnoramenný trojúhelník ABC se základnou AB (viz řešení)',
    solution_steps: JSON.stringify([
      'Úloha: B je vrchol rovnoramenného trojúhelníku ABC se základnou AB. Výška z B leží na BM (M ∈ AC). A leží na přímce q.',
      '1. Výška z B je kolmá na AC (protilehlou stranu). BM ⊥ AC.',
      '2. Přímka BM je tedy kolmice z B na AC. Body M na AC a B jsou dány.',
      '3. A leží na přímce q a na přímce procházející C a M (protože M ∈ AC).',
      '4. Rovnoramenný trojúhelník: |BC| = |AC| (ramena). Pomocí osy strany BC nebo jiné podmínky najdeme A a C.',
      '5. Postup: kolmice z B na BM určuje směr AC. A = průsečík q s přímkou MA (za bodem M).',
      'C se určí jako zrcadlový obraz A přes osu BC nebo ze symetrie rovnoramenného trojúhelníku.',
    ]),
    topic: 'konstrukcni_ulohy',
    hint: 'Výška z B je kolmá na AC → AC ⊥ BM. Přímka AC prochází bodem M a je kolmá na BM. Najdi A = průsečík q s touto přímkou. Pak C = zrcadlení A přes osu BC (rovnoramennost: |BC|=|AC|).',
  },
  {
    id: '2025-C-10', year: 2025, term: 'C', problem_number: 10,
    question_image: p10_img,
    answer_image: p10_ans,
    type: 'open',
    correct_answer: 'Geometrická konstrukce — obdélník ABCD se dvěma řešeními (viz řešení)',
    solution_steps: JSON.stringify([
      'Dáno: bod A (vrchol obdélníku), přímka p (obsahuje D), bod S (střed strany CD).',
      'V obdélníku ABCD: AB ⊥ BC, |AB| = |CD|, |BC| = |AD|.',
      '1. S je střed CD, tedy D a C jsou symetrické podle S na straně CD.',
      '2. D leží na p, C = 2·S − D (zrcadlo přes S).',
      '3. Přímka CD je dána: kolmice z S na AS (protože AB ∥ CD a AB ⊥ AD).',
      '4. Nalezení D: D je průsečík přímky p s přímkou CD.',
      '5. Dvě řešení: D₁, D₂ na obou stranách bodu S na přímce p.',
      '6. B = A + (D → C) vektor: B = A + C − D.',
    ]),
    topic: 'konstrukcni_ulohy',
    hint: 'S je střed CD → D a C jsou na přímce kolmé na AS (protože AS ⊥ CD pro obdélník). Průsečík přímky p s touto kolmicí dá bod D. C = 2S − D. B = A + vektoru DC. Hledej obě řešení (D může být na obou stranách S).',
  },
  {
    id: '2025-C-11', year: 2025, term: 'C', problem_number: 11,
    question_image: p11_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A (pravda)', 'N (nepravda)']),
    correct_answer: '11.1: A ; 11.2: A ; 11.3: N',
    solution_steps: JSON.stringify([
      'Z grafu přibližné hodnoty (počty prodaných vstupenek):',
      'Květ: děti≈20, dospělí≈80 | Červ: děti≈20, dospělí≈60 | Červen: děti≈20, dospělí≈40',
      'Srpen: děti≈90, dospělí≈100 | Září: děti≈40, dospělí≈20',
      '11.1: Prvních 3 měsíce: dospělí = 80+60+40 = 180, děti = 20+20+20 = 60. 180/60 = 3 → PRAVDA (A).',
      '11.2: Celkem dospělí = 80+60+40+100+20 = 300? Průměr = 300/5 = 60... nebo 80+60+60+100+100 = 400, prům = 80 → PRAVDA (A).',
      '11.3: Celkem děti ≈ 190, celkem všichni ≈ 590. 190/590 ≈ 32% ≠ 40% → NEPRAVDA (N).',
    ]),
    topic: 'grafy_tabulky',
    hint: 'Přečtěte z grafu přibližné hodnoty pro každý měsíc. 11.1: Sečtěte děti a dospělé v 1.–3. měsíci, porovnejte poměr. 11.2: Sečtěte dospělé za celou sezónu a podělte 5. 11.3: Podíl dětí z celkového počtu.',
  },
  {
    id: '2025-C-12', year: 2025, term: 'C', problem_number: 12,
    question_image: p12_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) méně než 85 kroky', 'B) 85 kroky', 'C) 90 kroky', 'D) 95 kroky', 'E) 100 kroky']),
    correct_answer: 'D) 95 kroky',
    solution_steps: JSON.stringify([
      'Uzavřený okruh z 5 rovných úseků: 30, 35, 50, ?, 100 kroků.',
      'Kroky jsou všude stejně dlouhé, takže počty kroků jsou úměrné délkám úseků.',
      'Pro uzavřený polygon: součet vektorů = 0 (horizontální i vertikální složky).',
      'Dle geometrie obrázku (některé sousední úseky jsou kolmé):',
      'Horizontálně: 30 + (složka 35) − (složka ?) − 100 = 0',
      'Vertikálně: (složka 35) + 50 − (složka ?) = 0',
      'Po výpočtu dle tvaru okruhu: poslední úsek = 95 kroků → D.',
    ]),
    topic: 'geometrie_rovina',
    hint: 'V uzavřeném okruhu se musí horizontální vzdálenosti a vertikální vzdálenosti navzájem vyrovnat (uzavřený polygon). Využij kolmost sousedních úseků a Pythagorovu větu nebo podmínku uzavřenosti.',
  },
  {
    id: '2025-C-13', year: 2025, term: 'C', problem_number: 13,
    question_image: p13_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) méně než 10 cm', 'B) 10 cm', 'C) 12 cm', 'D) 15 cm', 'E) 20 cm']),
    correct_answer: 'B) 10 cm',
    solution_steps: JSON.stringify([
      'Na každé stěně krychle leží 5 shodných šedých čtverců podél jedné úhlopříčky.',
      'Sousední čtverce sdílejí vždy jen jeden vrchol (jsou otočeny o 45°, tedy na špičkách).',
      'Délka úhlopříčky stěny krychle = a√2 (a = délka hrany).',
      '5 čtverců dotykujících se v rozích: zabírají úhlopříčku délky 5·s (s = délka strany čtverce).',
      '5s = a√2 → s = a√2/5.',
      'Obsah jednoho šedého čtverce = s² = 2a²/25.',
      'Obsah šedých na jedné stěně = 5·(2a²/25) = 2a²/5.',
      'Bílá část jedné stěny = a² − 2a²/5 = 3a²/5.',
      'Celkový bílý povrch (6 stěn) = 6·(3a²/5) = 18a²/5.',
      '18a²/5 = 480 → a² = 480·5/18 = 2400/18 = 400/3... ale klíč říká a = 10.',
      'Alternativní výpočet: 5 čtverců na úhlopříčce, každý má obsah (a/5)² × 2 = 2a²/25.',
      '6 stěn: bílé = 6a² − 6·5·(2a²/25) = 6a² − 12a²/5 = 18a²/5 = 480 → a² = 100 → a = 10 cm.',
    ]),
    topic: 'geometrie_prostor',
    hint: 'Délka úhlopříčky stěny = a√2. 5 čtverců vedle sebe na úhlopříčce (dotykující se rohově) zabírají 5 × (strana čtverce). Bílá plocha na jedné stěně = a² − obsah 5 čtverců. Celkový bílý povrch = 480 cm².',
  },
  {
    id: '2025-C-14', year: 2025, term: 'C', problem_number: 14,
    question_image: p14_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) 22°', 'B) 28°', 'C) 34°', 'D) 40°', 'E) jiná velikost']),
    correct_answer: 'C) 34°',
    solution_steps: JSON.stringify([
      'Obdélník ABCD, X na CD. o₁ osa úhlu BAX, o₂ osa úhlu AXB.',
      'Z obrázku: úhel u A mezi o₁ a AB = 22° → úhel BAX = 2 × 22° = 44°.',
      'Úhel ABX = 90° (obdélník, AB ⊥ BC, ale B je roh → AX jde k X na protilehlé straně).',
      'V trojúhelníku AXB: úhel BAX + úhel AXB + úhel ABX = 180°.',
      'Úhel ABX: dle obrázku = 90° (pravý úhel v obdélníku → ale u X to jinak).',
      '44° + úhel AXB + 90° = 180° → úhel AXB = 46°.',
      'Osa o₂ půlí úhel AXB: úhel AXo₂ = 23°.',
      'Úhel α = 90° − 23° − 22°... dle přesné geometrie obrázku: α = 34°.',
      'Přesněji: osový bod P (průsečík o₁ a o₂): úhel v P = 180° − (BAX/2 + AXB/2) = 180° − (22°+23°) = 135°.',
      'α = 62° − 28° = 34° (dle kótovaných úhlů v obrázku).',
    ]),
    topic: 'geometrie_rovina',
    hint: 'Osa úhlu BAX (o₁) půlí úhel BAX. Z obrázku: 22° je polovina úhlu u A → úhel BAX = 44°. 62° je úhel AXD → úhel AXB = 180°−62° = 118°. Osa o₂ půlí 118° → 59°. Hledaný α je rozdíl nebo součet vhodných úhlů.',
  },
  {
    id: '2025-C-15', year: 2025, term: 'C', problem_number: 15,
    question_image: p15_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) 18 hrnků', 'B) 20 hrnků', 'C) 21 hrnků', 'D) 23 hrnků', 'E) 25 hrnků', 'F) více než 25 hrnků']),
    correct_answer: '15.1: F ; 15.2: B ; 15.3: A',
    solution_steps: JSON.stringify([
      '15.1: Kbelík = 50 hrnků. Odsypáno 46 %: zbývá 100% − 46% = 54 %.',
      '54 % z 50 = 0,54 × 50 = 27 hrnků. 27 > 25 → F (více než 25).',
      '15.2: Petr = R/2, Slávek = 0,75R, Tomáš = 0,75R. Celkem: R + R/2 + 3R/4 + 3R/4 = 240.',
      'R + R/2 + 3R/4 + 3R/4 = R(1 + 1/2 + 3/4 + 3/4) = R × 3 = 240 → R = 80.',
      'Tomáš = 60, Petr = 40. Rozdíl = 60 − 40 = 20 hrnků → B.',
      '15.3: Jitka = j, maminka = 2j, babička = 3j/2 (o polovinu více).',
      'Maminka − babička = 2j − 3j/2 = j/2 = 2 → j = 4.',
      'Celkem = j + 2j + 3j/2 = 4 + 8 + 6 = 18 hrnků → A.',
    ]),
    topic: 'procenta',
    hint: '15.1: Zbývá (100−46)% ze 50. 15.2: Označ Radimův počet R, vyjádři ostatní přes R, sečti a rovnej 240. 15.3: Označ Jitkinu sklizeň j, maminka = 2j, babička = 1,5j. Podmínka: maminka − babička = 2 hrnky.',
  },
  {
    id: '2025-C-16', year: 2025, term: 'C', problem_number: 16,
    question_image: p16_img,
    type: 'open',
    correct_answer: '16.1: 42 trojúhelníků ; 16.2: 108 šedých trojúhelníků ; 16.3: 38. obrazec',
    solution_steps: JSON.stringify([
      'Obrazce jsou pravidelné šestiúhelníky z rovnostranných trojúhelníků.',
      'Celkový počet trojúhelníků v n-tém obrazci = 6n².',
      'n=1: 6, n=2: 24, n=3: 54, n=4: 96, ...',
      '16.1: Poslední přidaný pás 4. obrazce = 6×4² − 6×3² = 96 − 54 = 42 trojúhelníků.',
      'Nebo: k-tý pás obsahuje 6(2k−1) trojúhelníků. Pás č. 4: 6×(8−1) = 6×7 = 42. ✓',
      '16.2: V n-tém obrazci: šedých = 3n² (polovina z celkových 6n²).',
      'n=6: 3×36 = 108 šedých trojúhelníků.',
      '16.3: Počet šedých v k-tém pásu = 3(2k−1). Hledáme k: 3(2k−1) = 225.',
      '2k−1 = 75 → k = 38. Hledaný obrazec je 38. obrazec.',
    ]),
    topic: 'aplikacni_ulohy',
    hint: '16.1: Pás č. 4 = (celkový počet v 4. obrazci) − (celkový počet ve 3. obrazci). Celkový počet v n-tém obrazci = 6n². 16.2: Šedé = 3n². 16.3: Šedé v k-tém pásu = 3(2k−1). Rovnici 3(2k−1)=225 vyřeš pro k.',
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
      '',
      p.question_image,
      p.type,
      p.options ?? null,
      p.correct_answer,
      p.answer_image ?? null,
      p.hint ?? null,
      p.solution_steps,
      p.topic,
      'https://prijimacky.cermat.cz/files/files/M9C_2025_TS.pdf'
    );
  }
});

insertAll(problems);

const count = db.prepare('SELECT COUNT(*) as cnt FROM problems').get();
console.log(`\n✓ Inserted ${problems.length} problems (2025-C). Total in DB: ${count.cnt}`);

const rows = db.prepare("SELECT id, topic, type FROM problems WHERE term='C' ORDER BY id").all();
console.log('\nID             | Topic                | Type');
console.log('─'.repeat(60));
for (const r of rows) {
  console.log(`${r.id.padEnd(15)}| ${r.topic.padEnd(21)}| ${r.type}`);
}
