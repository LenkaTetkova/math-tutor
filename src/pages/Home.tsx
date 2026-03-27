import { useMemo, useState } from 'react';
import { Topic, TOPIC_LABELS, TOPIC_EMOJI } from '../types';
import { PracticeConfig } from '../App';
import allProblems from '../data/problems.json';

export default function Home({ onStart }: { onStart: (cfg: PracticeConfig) => void }) {
  const [topic, setTopic] = useState<Topic | null>(null);

  const availableTopics = useMemo(() => {
    const seen = new Set<string>();
    for (const p of allProblems) seen.add(p.topic);
    return [...seen].sort() as Topic[];
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

      {/* Topic filter */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Téma</p>
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

      <button onClick={() => onStart({ topic })}
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
