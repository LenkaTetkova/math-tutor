import { useMemo, useState } from 'react';
import { Topic, TOPIC_LABELS, TOPIC_EMOJI } from '../types';
import { PracticeConfig } from '../App';
import allProblems from '../data/problems.json';

const TERM_LABEL: Record<string, string> = {
  A: 'řádný (A)',
  B: 'řádný (B)',
  C: '1. náhr. (C)',
  D: '2. náhr. (D)',
};

export default function Home({ onStart }: { onStart: (cfg: PracticeConfig) => void }) {
  const [topic, setTopic] = useState<Topic | null>(null);

  const availableTopics = useMemo(() => {
    const seen = new Set<string>();
    for (const p of allProblems) seen.add(p.topic);
    return [...seen].sort() as Topic[];
  }, []);

  const examSets = useMemo(() => {
    const seen = new Map<string, { year: number; term: string; count: number }>();
    for (const p of allProblems) {
      if (p.year > 0) {
        const key = `${p.year}-${p.term}`;
        if (!seen.has(key)) seen.set(key, { year: p.year as number, term: p.term as string, count: 0 });
        seen.get(key)!.count++;
      }
    }
    return [...seen.values()].sort((a, b) =>
      a.year !== b.year ? b.year - a.year : a.term.localeCompare(b.term)
    );
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">📐</div>
        <h1 className="text-2xl font-bold text-slate-800">Přijímačky z matematiky</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Procvičuj si příklady z&nbsp;jednotné přijímací zkoušky (JPZ)
        </p>
      </div>

      {/* ── Mode 1: full exam set ── */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Celá zkušební sada
        </p>
        <p className="text-xs text-slate-400 mb-3">
          Procvičuj úlohy 1–16 v pořadí jako při skutečné zkoušce.
        </p>
        <div className="flex flex-wrap gap-2">
          {examSets.map(({ year, term, count }) => (
            <button
              key={`${year}-${term}`}
              onClick={() => onStart({ mode: 'exam', topic: null, examYear: year, examTerm: term })}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border-2 border-indigo-200
                hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 transition-colors shadow-sm"
            >
              {year}&nbsp;{TERM_LABEL[term] ?? term}
              <span className="ml-1.5 text-xs font-normal text-slate-400">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">nebo</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* ── Mode 2: topic practice ── */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Procvičovat podle tématu
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTopic(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${topic === null ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}>
            Vše
          </button>
          {availableTopics.map(t => (
            <button key={t} onClick={() => setTopic(topic === t ? null : t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${topic === t ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}>
              {TOPIC_EMOJI[t]} {TOPIC_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onStart({ mode: 'topic', topic })}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
          text-white font-bold text-lg rounded-2xl shadow-md transition-colors">
        Procvičovat →
      </button>

      <p className="text-center text-xs text-slate-400 mt-4">
        Příklady z&nbsp;officiálních testů CERMAT
      </p>
    </div>
  );
}
