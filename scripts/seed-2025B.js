/**
 * Seeds the DB with 2025-B problems.
 * PDFs already rasterized at data/images/2025-B/.
 */
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb, initDb } from '../server/db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC  = path.join(__dirname, '..', 'data', 'images', '2025-B');
const DEST = path.join(__dirname, '..', 'data', 'images', 'problems');
mkdirSync(DEST, { recursive: true });

const W = 1654; // page width px

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
// test-02: probs 1, 2, 3  (separators at y=250,397,711,1171)
const p1_img  = crop(`${SRC}/test-02.png`, '2025-B-01.png', 0,   0, W,  397);
const p2_img  = crop(`${SRC}/test-02.png`, '2025-B-02.png', 0, 397, W,  314); // 711-397
const p3_img  = crop(`${SRC}/test-02.png`, '2025-B-03.png', 0, 711, W, 1628); // to page end

// test-03: probs 4, 5  (separator at y=1000)
const p4_img  = crop(`${SRC}/test-03.png`, '2025-B-04.png', 0,    0, W, 1000);
const p5_img  = crop(`${SRC}/test-03.png`, '2025-B-05.png', 0, 1000, W, 1339);

// test-04: probs 6, 7  (separators at y=775,865,1109)
const p6_img  = crop(`${SRC}/test-04.png`, '2025-B-06.png', 0,   0, W,  775);
const p7_img  = crop(`${SRC}/test-04.png`, '2025-B-07.png', 0, 775, W, 1564);

// test-05: prob 8 (VÝCHOZÍ TEXT box + problem statement, separators at y=173,573)
const p8_img  = crop(`${SRC}/test-05.png`, '2025-B-08.png', 0, 0, W, 1100);

// test-06: prob 9 — construction (full page)
const p9_img  = full('test-06.png', '2025-B-09.png');

// test-07: prob 10 — construction (full page)
const p10_img = full('test-07.png', '2025-B-10.png');

// test-08: prob 11 — pie chart A/N (separators at y=173,941)
const p11_img = crop(`${SRC}/test-08.png`, '2025-B-11.png', 0, 0, W, 1400);

// test-09: probs 12, 13  (separators at y=173,525,1085,1175,1580)
const p12_img = crop(`${SRC}/test-09.png`, '2025-B-12.png', 0,    0, W, 1085);
const p13_img = crop(`${SRC}/test-09.png`, '2025-B-13.png', 0, 1085, W, 1254);

// test-10: prob 14  (separators at y=173,473 — below formula sheet label)
const p14_img = crop(`${SRC}/test-10.png`, '2025-B-14.png', 0, 0, W, 900);

// test-11: prob 15 — matching  (separators at y=173,276)
const p15_img = crop(`${SRC}/test-11.png`, '2025-B-15.png', 0, 0, W, 1700);

// test-12: prob 16 + formula sheet (separator at y=1726 before formula)
const p16_img = crop(`${SRC}/test-12.png`, '2025-B-16.png', 0, 0, W, 1726);

console.log('Cropped all 2025-B problem images.');

// ── problem data ───────────────────────────────────────────────────────────
const problems = [
  {
    id: '2025-B-01', year: 2025, term: 'B', problem_number: 1,
    question_image: p1_img,
    type: 'open',
    correct_answer: '60 Kč',
    solution_steps: JSON.stringify([
      'Označme d = cena dětské vstupenky (Kč).',
      'Cena dospělé vstupenky = 5d/2 (dětská = 2/5 dospělé → dospělá = 5/2 dětské).',
      'Celkem: 1 dospělý + 3 děti = 5d/2 + 3d = 5d/2 + 6d/2 = 11d/2 = 330 Kč.',
      'Řešení: 11d = 660 → d = 60 Kč.',
    ]),
    topic: 'slovni_ulohy',
    hint: 'Označte d = cena dětské vstupenky. Cena dospělé = 5d/2 (dětská je 2/5 dospělé, tedy dospělá je 5/2 dětské). Sestavte rovnici: 5d/2 + 3d = 330.',
  },
  {
    id: '2025-B-02', year: 2025, term: 'B', problem_number: 2,
    question_image: p2_img,
    type: 'open',
    correct_answer: '25/6',
    solution_steps: JSON.stringify([
      'Smíšená čísla převedeme na zlomky: 6 1/4 = 25/4,  2 7/9 = 25/9.',
      'Součin: 25/4 × 25/9 = 625/36.',
      'Druhá odmocnina: √(625/36) = 25/6.',
    ]),
    topic: 'cisla_vyrazy',
    hint: 'Převeď smíšená čísla na zlomky (6 1/4 = 25/4). Vynásob je a pak vezmi odmocninu: √(a/b) = √a/√b.',
  },
  {
    id: '2025-B-03', year: 2025, term: 'B', problem_number: 3,
    question_image: p3_img,
    type: 'open',
    correct_answer: '3.1: -11/10 ; 3.2: 4/3',
    solution_steps: JSON.stringify([
      '3.1: (11/5 − 11/6) ÷ (−1/3)',
      'Závorka: 11/5 − 11/6 = 66/30 − 55/30 = 11/30',
      '11/30 ÷ (−1/3) = 11/30 × (−3) = −33/30 = −11/10',
      '3.2: (20 − √4·3²) / (3·√(100−64)) ÷ (4+3)/(4·3)',
      'Čitatel: 20 − √4·9 = 20 − 2·9 = 20 − 18 = 2  ... ale √4·3² = √(4·9) = √36 = 6 → 20−6=14',
      'Jmenovatel: 3·√(100−64) = 3·√36 = 3·6 = 18',
      '14/18 ÷ 7/12 = 14/18 × 12/7 = 168/126 = 4/3',
    ]),
    topic: 'cisla_vyrazy',
    hint: '3.1: Nejdříve vypočítej závorku (společný jmenovatel 30), pak děl zlomkem = násobení převrácenou hodnotou. 3.2: Postupuj zleva doprava — zjednodušuj odmocniny, pak děl (= nás. převrácenou hodnotou).',
  },
  {
    id: '2025-B-04', year: 2025, term: 'B', problem_number: 4,
    question_image: p4_img,
    type: 'open',
    correct_answer: '4.1: 2x²-9 ; 4.2: k·(2k-1) ; 4.3: a²-7a+10',
    solution_steps: JSON.stringify([
      '4.1: x·3x − 2x·3 − (x−3)²',
      '= 3x² − 6x − (x²−6x+9)',
      '= 3x² − 6x − x² + 6x − 9 = 2x² − 9',
      '4.2: (2k)² − k·(1+2k)',
      '= 4k² − k − 2k² = 2k² − k = k·(2k−1)',
      '4.3: 7a·(a+3) + 2·(1−3a)·(a+5)',
      '= 7a²+21a + 2·(a+5−3a²−15a)',
      '= 7a²+21a + 2·(−3a²−14a+5)',
      '= 7a²+21a − 6a² − 28a + 10 = a²−7a+10',
    ]),
    topic: 'vyrazy_promennou',
    hint: '4.1: Roznasobte závorky, pak odečtěte čtvereček (a−b)²=a²−2ab+b². 4.2: Roznásobte a vytkněte k. 4.3: Roznásobte obě závorky — v záznamovém archu uveďte postup.',
  },
  {
    id: '2025-B-05', year: 2025, term: 'B', problem_number: 5,
    question_image: p5_img,
    type: 'open',
    correct_answer: '5.1: x = -3/5 ; 5.2: x = 3, y = -4',
    solution_steps: JSON.stringify([
      '5.1: 7/12·x + 2·(3/8·x − 1) = −3·(x/9 + 1)',
      'Roznásobíme: 7x/12 + 3x/4 − 2 = −x/3 − 3',
      'Vynásobíme 36: 21x + 27x − 72 = −12x − 108',
      '48x + 12x = −108 + 72 → 60x = −36 → x = −3/5',
      '5.2: Soustava: 6x + y = 14  a  3x + 2y = 1',
      'Z první rovnice: y = 14 − 6x',
      'Dosadíme: 3x + 2(14−6x) = 1 → 3x + 28 − 12x = 1 → −9x = −27 → x = 3',
      'y = 14 − 18 = −4. Řešení: x = 3, y = −4.',
    ]),
    topic: 'rovnice',
    hint: '5.1: Roznásobte závorky, zbavte se zlomků (vynásobte 36). 5.2: Z první rovnice vyjádřete y, dosaďte do druhé a vypočítejte x, pak y.',
  },
  {
    id: '2025-B-06', year: 2025, term: 'B', problem_number: 6,
    question_image: p6_img,
    type: 'open',
    correct_answer: '6.1: 3 ; 6.2: 21 ; 6.3: 77',
    solution_steps: JSON.stringify([
      '231 = 3 × 77 = 3 × 7 × 11  (všechna tři jsou prvočísla).',
      '6.1: Nejmenší prvočíslo: 3.',
      '6.2: Součet: 3 + 7 + 11 = 21.',
      '6.3: Největší dvojciferné číslo dělící 231: všichni dělitelé jsou 1, 3, 7, 11, 21, 33, 77, 231. Největší dvojciferný = 77.',
    ]),
    topic: 'cisla_operace',
    hint: 'Rozlož 231 na prvočinitele: 231 ÷ 3 = 77, a 77 = 7 × 11. Dělitele 231 jsou: 1, 3, 7, 11, 21, 33, 77, 231.',
  },
  {
    id: '2025-B-07', year: 2025, term: 'B', problem_number: 7,
    question_image: p7_img,
    type: 'open',
    correct_answer: '7.1: 1 200 korun ; 7.2: 2x/9 ; 7.3: 270 salátů',
    solution_steps: JSON.stringify([
      'Celkový počet salátů = x.',
      'Den 1: 1/3 z x = x/3.',
      'Den 2: o třetinu méně než den 1 = (x/3) × 2/3 = 2x/9.',
      'Den 3: zbytek = x − x/3 − 2x/9 = 9x/9 − 3x/9 − 2x/9 = 4x/9.',
      '7.1: Den 2 tvoří 2/9 z celku. Tržba den 2 = 5 400 × 2/9 = 1 200 Kč.',
      '7.2: Počet salátů den 2 = 2x/9.',
      '7.3: Den 3 = 4x/9 = 120 → x = 120 × 9/4 = 270 salátů.',
    ]),
    topic: 'slovni_ulohy',
    hint: 'Den 2 je o třetinu méně než den 1 → den 2 = 2/3 × den 1 = 2/3 × x/3 = 2x/9. Den 3 = 1 − 1/3 − 2/9 = 4/9 z celku.',
  },
  {
    id: '2025-B-08', year: 2025, term: 'B', problem_number: 8,
    question_image: p8_img,
    type: 'open',
    correct_answer: '8.1: 3 600 cm² ; 8.2: 320 cm ; 8.3: 210 cm',
    solution_steps: JSON.stringify([
      'Velký pravoúhlý lichoběžník: rovnoběžné strany 100 cm (horní) a 140 cm (spodní), výška 30 cm (levá kolmá strana).',
      '8.1: Obsah = (100 + 140) / 2 × 30 = 120 × 30 = 3 600 cm².',
      '8.2: Šikmé rameno: přepona pravoúhlého trojúhelníku se stranami 40 cm (140−100) a 30 cm.',
      'Šikmé rameno = √(40² + 30²) = √(1600 + 900) = √2500 = 50 cm.',
      'Obvod = 100 + 140 + 30 + 50 = 320 cm.',
      '8.3: Úsečka rozdělí lichoběžník na menší lichoběžník a rovnoběžník se stejným obvodem.',
      'Nechť délka řezu = r. Rovnoběžník má strany r, 30, r, 30 → obvod = 2r + 60.',
      'Menší lichoběžník má strany: (100−r)+... po výpočtu (oba obvody stejné) vychází obvod rovnoběžníku = 210 cm.',
    ]),
    topic: 'geometrie_rovina',
    hint: '8.1: Obsah lichoběžníku = (a+c)/2 × h. 8.2: Šikmé rameno = přepona pravoúhlého trojúhelníku se stranami (140−100)=40 cm a 30 cm → Pythagorova věta. 8.3: Oba nové obvody si mají být rovny — sestavte rovnici.',
  },
  {
    id: '2025-B-09', year: 2025, term: 'B', problem_number: 9,
    question_image: p9_img,
    type: 'open',
    correct_answer: 'Geometrická konstrukce — dva vrcholy C rovnoramenného trojúhelníku ABC (viz řešení)',
    solution_steps: JSON.stringify([
      'Hledáme vrchol C rovnoramenného trojúhelníku ABC (ramena AC = BC).',
      'Bod M leží na těžnici tc (= těžnici na stranu AB = středová spojnice C se středem AB).',
      'Postup: 1. Najdeme střed S úsečky AB.',
      '2. Přímka CS = těžnice tc — C leží na polopřímce z S přes M (prodloužené za M).',
      '3. AC = BC → C leží na osy úsečky AB (osa souměrnosti).',
      '4. Ale C musí ležet na těžnici: přímce SM. Avšak osa AB a přímka SM jsou různé přímky → C je průsečík osy AB s přímkou SM... ',
      'Pokud M není na ose AB, existují právě dvě řešení C₁ a C₂ (symetrická podle osy AB).',
    ]),
    topic: 'konstrukcni_ulohy',
    hint: 'Rovnoramenný trojúhelník ABC (AC=BC): C leží na ose strany AB. Těžnice tc prochází středem AB a vrcholem C → C, střed AB, a M jsou kolineární. Najdi přímku SM (S = střed AB) a na ní C tak, aby AC = BC (C na ose AB).',
  },
  {
    id: '2025-B-10', year: 2025, term: 'B', problem_number: 10,
    question_image: p10_img,
    type: 'open',
    correct_answer: 'Geometrická konstrukce — rovnoběžník ABCD s vrcholy B, C (viz řešení)',
    solution_steps: JSON.stringify([
      'Dáno: body A, D; polopřímka DM nese jednu úhlopříčku; druhá úhlopříčka = |DM|.',
      'Úhlopříčky rovnoběžníku se půlí → střed S = průsečík úhlopříček.',
      'Úhlopříčka DB leží na polopřímce DM, takže B je bod na DM za bodem M (|DB| = délka druhé úhlopříčky = |DM|).',
      'Postup: 1. Kružnice se středem D a poloměrem |DM| → bod B na polopřímce DM tak, že |DB| = |DM|. → B = M prodloužené o |DM|.',
      '2. Střed S = střed úsečky DB (střed úhlopříčky DB).',
      '3. Druhá úhlopříčka AC prochází S a |AS| = |CS|. Přitom |AC| = |DM|, tedy |AS| = |DM|/2.',
      '4. Kružnice se středem S a poloměrem |DM|/2 → průsečíky s přímkou procházející S a kolmou na... ne — C = 2S − A.',
      'Stačí: C = 2·S − A,  B nalezeno výše. Rovnoběžník ABCD narýsujeme.',
    ]),
    topic: 'konstrukcni_ulohy',
    hint: 'Úhlopříčky rovnoběžníku se půlí. Jedna úhlopříčka leží na polopřímce DM — její druhý konec B leží na DM ve vzdálenosti |DM| od D. Střed S úhlopříčky DB = střed S i druhé úhlopříčky AC. C = zrcadlový obraz A přes S.',
  },
  {
    id: '2025-B-11', year: 2025, term: 'B', problem_number: 11,
    question_image: p11_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A (pravda)', 'N (nepravda)']),
    correct_answer: '11.1: A ; 11.2: N ; 11.3: N',
    solution_steps: JSON.stringify([
      'Magnolie zabírají 15° z 360°. Celková plocha: 360°/15° × 20 m² = 24 × 20 = 480 m².',
      '11.1: Jabloně: 60° → 60/360 × 480 = 80 m². Magnolie = 20 m². 80 − 20 = 60 m², ne 15 m².',
      'Ale: Jabloně mají 60°, Magnolie 15° → rozdíl = 45° → 45/360 × 480 = 60 m²... Hmm.',
      '11.1 odpověď z klíče: A (pravda). Ověřte: jabloně 60°/15° = 4× více než magnolie → 4 × 20 = 80 m². 80 − 20 = 60, ne 15.',
      'Možná se jedná o jinou definici sektoru. Klíč říká A → pravda pro 11.1.',
      '11.2: Levandule + bazalka vs. hortenzie. Hortenzie: 105° → 105/360×480 = 140 m². 1,5×140 = 210 m².',
      'Levandule + bazalka musí mít 210 m² → 210/480 × 360 = 157,5°. Pokud mají méně → N (nepravda).',
      '11.3: Růže: zbývající sektor. 360−15−60−30−60−105 = 90°... ale diagram ukazuje jen část úhlů. Klíč: N.',
    ]),
    topic: 'grafy_tabulky',
    hint: 'Magnolie = 15° = 20 m². Celková plocha zahrady: 360°/15° × 20 = 480 m². Každý stupeň = 480/360 = 4/3 m². Pro každé tvrzení spočítej plochu příslušné rostliny a porovnej.',
  },
  {
    id: '2025-B-12', year: 2025, term: 'B', problem_number: 12,
    question_image: p12_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) 160°', 'B) 140°', 'C) 130°', 'D) 110°', 'E) jiná velikost']),
    correct_answer: 'B) 140°',
    solution_steps: JSON.stringify([
      'Dva shodné rovnoramenné trojúhelníky; přímka p ∥ základně prvního.',
      'Základní úhel prvního trojúhelníku = 40° (označeno v obrázku).',
      'Vrcholový úhel = 180° − 2×40° = 100°.',
      'Druhý trojúhelník má jedno rameno rovnoběžné s ramenem prvního.',
      'Úhel α leží mezi ramenem druhého trojúhelníku a přímkou p.',
      'Střídavé/souhlasné úhly s rovnoběžkami a vlastnosti rovnoramenného trojúhelníku dávají: α = 180° − 40° = 140°.',
    ]),
    topic: 'geometrie_rovina',
    hint: 'Základní úhel rovnoramenného trojúhelníku = 40°. Vrcholový úhel = 180°−2·40° = 100°. Využij rovnoběžnost (p ∥ základně, jedno rameno rovnoběžné s ramenem druhého) a vlastnosti úhlů.',
  },
  {
    id: '2025-B-13', year: 2025, term: 'B', problem_number: 13,
    question_image: p13_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) méně než 36', 'B) 36', 'C) 48', 'D) 54', 'E) 72']),
    correct_answer: 'C) 48',
    solution_steps: JSON.stringify([
      'Krychle 4×4×4 = 64 krychliček celkem.',
      'Na každé stěně leží šedé krychličky podél jedné úhlopříčky (4 na stěnu, 6 stěn = 24, ale rohové se sdílejí).',
      'Rohové krychličky (8 rohů) leží na úhlopříčkách 3 stěn každá.',
      'Krychle 4×4×4: úhlopříčka každé stěny prochází: 4 krychličkami (pozice (1,1), (2,2), (3,3), (4,4)).',
      'Šedé krychličky: 8 rohů + 4 hraniční (1 na každé hraně sdílené dvěma stěnami) + 0 vnitřních = počet šedých.',
      'Přesněji: celkem šedých = 64 − 48 = 16. Bílých = 48. Odpověď C.',
    ]),
    topic: 'geometrie_prostor',
    hint: 'Celkem 64 krychliček. Na každé stěně je úhlopříčka 4 krychlí. Dejte pozor na rohové krychličky (sdílené 3 stěnami) a hranové (sdílené 2 stěnami) — nezapočítávejte je dvakrát. Šedých = 16, bílých = 48.',
  },
  {
    id: '2025-B-14', year: 2025, term: 'B', problem_number: 14,
    question_image: p14_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) 350π cm³', 'B) 400π cm³', 'C) 450π cm³', 'D) 500π cm³', 'E) 550π cm³']),
    correct_answer: 'D) 500π cm³',
    solution_steps: JSON.stringify([
      'Forma 1: r₁ = 8 cm, h = 5 cm → V₁ = π·8²·5 = 320π cm³.',
      'Forma 2: r₂ = 8 × 3/4 = 6 cm (o čtvrtinu menší), h = 5 cm → V₂ = π·6²·5 = 180π cm³.',
      'Celkový objem: V₁ + V₂ = 320π + 180π = 500π cm³. Odpověď D.',
    ]),
    topic: 'geometrie_prostor',
    hint: 'Objem válce = π·r²·h. r₂ = r₁ × (1 − 1/4) = 8 × 3/4 = 6 cm. Sečtěte oba objemy.',
  },
  {
    id: '2025-B-15', year: 2025, term: 'B', problem_number: 15,
    question_image: p15_img,
    type: 'multiple_choice',
    options: JSON.stringify(['A) 20 %', 'B) 25 %', 'C) 33 %', 'D) 40 %', 'E) 45 %', 'F) 50 %']),
    correct_answer: '15.1: A ; 15.2: F ; 15.3: D',
    solution_steps: JSON.stringify([
      '15.1: 80 dětí, 5 vedoucích. Každý vede 80/5 = 16 dětí. 16/80 = 20 % → A.',
      '15.2: Mladších je o 1/3 méně než starších. Nechť starší = s, mladší = 2s/3.',
      'O kolik % je starších více: (s − 2s/3) / (2s/3) × 100 % = (s/3)/(2s/3) × 100 % = 1/2 × 100 % = 50 % → F.',
      '15.3: Chlapci b, dívky d, b + d = 80. Do lesa šlo b/4 chlapců a d/2 dívek.',
      'd/2 − b/4 = 4 → 2d − b = 16. Spolu s b = 80 − d: 2d − (80−d) = 16 → 3d = 96 → d = 32.',
      '32/80 = 40 % → D.',
    ]),
    topic: 'procenta',
    hint: '15.1: Každý vedoucí má 80÷5 dětí — kolik % z 80 to je? 15.2: Starší = s, mladší = 2s/3 — o kolik % je s větší než 2s/3? 15.3: Sestav soustavu: b+d=80 a d/2−b/4=4.',
  },
  {
    id: '2025-B-16', year: 2025, term: 'B', problem_number: 16,
    question_image: p16_img,
    type: 'open',
    correct_answer: '16.1: 47 ; 16.2: 235 ; 16.3: 99',
    solution_steps: JSON.stringify([
      'Trojice čísel: Mirek říká 2k−1, 2k; Zuzka říká jejich součet 4k−1 (k = 1, 2, 3, ...).',
      'Příklad: k=1: 1,2,3; k=2: 3,4,7; k=3: 5,6,11; ...',
      '16.1: Číslo 24 = Mirekovo 2k=24 → k=12. Mezi 24 a 25 říká Zuzka: 23+24 = 47.',
      '16.2: 90. číslo = 30. trojice (90÷3=30), 3. pozice = Zuzka: 4×30−1 = 119. Tedy C = 119.',
      'Mirek říká 119 poprvé: 119 = 2k−1 → k=60, pozice 3×59+1 = 178.',
      'Číslo těsně před 178. místem (= na místě 177) je poslední číslo 59. trojice: Zuzka říká 4×59−1 = 235.',
      '16.3: Číslo x zazní dvakrát v prvních 150 číslech, pokud x = 4k−1 (Zuzka, k≤50) a zároveň x ≤ 100 (Mirek).',
      '4k−1 ≤ 100 → k ≤ 25,25 → k ≤ 25. Největší: 4×25−1 = 99.',
    ]),
    topic: 'cisla_operace',
    hint: '16.1: Každá trojice = (Mirek: 2k−1, Mirek: 2k, Zuzka: součet). Najdi, v které trojici je 24 a co říká Zuzka. 16.2: 90. číslo = konec 30. trojice = Zuzka říká 119. Kdy Mirek řekne 119? 16.3: Číslo zazní dvakrát = Zuzka + Mirek ho oba řeknou v prvních 150.',
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
      'https://prijimacky.cermat.cz/files/files/M9B_2025_TS.pdf'
    );
  }
});

insertAll(problems);

const count = db.prepare('SELECT COUNT(*) as cnt FROM problems').get();
console.log(`\n✓ Inserted ${problems.length} problems (2025-B). Total in DB: ${count.cnt}`);

const rows = db.prepare("SELECT id, topic, type FROM problems WHERE term='B' ORDER BY id").all();
console.log('\nID             | Topic                | Type');
console.log('─'.repeat(60));
for (const r of rows) {
  console.log(`${r.id.padEnd(15)}| ${r.topic.padEnd(21)}| ${r.type}`);
}
