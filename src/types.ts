export interface Problem {
  id: string;
  year: number;
  term: string;
  problem_number: number;
  question_text: string;
  question_image: string | null;
  type: 'open' | 'multiple_choice';
  options: string | null;   // JSON array string
  correct_answer: string;
  answer_image: string | null;
  hint: string | null;
  solution_steps: string;   // JSON array string
  topic: Topic;
  source_url: string | null;
}

export type Topic =
  | 'cisla_operace'
  | 'cisla_vyrazy'
  | 'vyrazy_promennou'
  | 'prevody_jednotek'
  | 'mnohocleny'
  | 'rovnice'
  | 'slovni_ulohy'
  | 'grafy_tabulky'
  | 'umernost'
  | 'pomer_mapa'
  | 'procenta'
  | 'pythagorova_veta'
  | 'geometrie_rovina'
  | 'geometrie_prostor'
  | 'konstrukcni_ulohy'
  | 'aplikacni_ulohy'
  | 'sumernost';

export const TOPIC_LABELS: Record<Topic, string> = {
  cisla_operace:    'Čísla a operace',
  cisla_vyrazy:     'Číselné výrazy',
  vyrazy_promennou: 'Výrazy s proměnnou',
  prevody_jednotek: 'Převody jednotek',
  mnohocleny:       'Mnohočleny',
  rovnice:          'Rovnice',
  slovni_ulohy:     'Slovní úlohy',
  grafy_tabulky:    'Grafy a tabulky',
  umernost:         'Úměrnost',
  pomer_mapa:       'Poměr a mapa',
  procenta:         'Procenta',
  pythagorova_veta: 'Pythagorova věta',
  geometrie_rovina: 'Geometrie v rovině',
  geometrie_prostor:'Geometrie v prostoru',
  konstrukcni_ulohy:'Konstrukční úlohy',
  aplikacni_ulohy:  'Aplikační úlohy',
  sumernost:        'Souměrnost',
};

export const TOPIC_EMOJI: Record<Topic, string> = {
  cisla_operace:    '🔢',
  cisla_vyrazy:     '½',
  vyrazy_promennou: '✏️',
  prevody_jednotek: '📏',
  mnohocleny:       '🔣',
  rovnice:          '⚖️',
  slovni_ulohy:     '📝',
  grafy_tabulky:    '📊',
  umernost:         '↔️',
  pomer_mapa:       '🗺️',
  procenta:         '%',
  pythagorova_veta: '📐',
  geometrie_rovina: '🔷',
  geometrie_prostor:'🧊',
  konstrukcni_ulohy:'🖊️',
  aplikacni_ulohy:  '🧩',
  sumernost:        '🪞',
};
