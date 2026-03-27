import { useMemo, useState } from 'react';
import { Topic, TOPIC_LABELS, TOPIC_EMOJI } from '../types';
import { PracticeConfig } from '../App';
import allProblems from '../data/problems.json';
import { getStats } from '../lib/storage';

export default function Home({ onStart }: { onStart: (cfg: PracticeConfig) => void }) {
  const [topic, setTopic] = useState<Topic | null>(null);

  const availableTopics = useMemo(() => {
    const seen = new Set<string>();
    for (const p of allProblems) seen.add(p.topic);
    return [...seen].sort() as Topic[];
  }, []);

  const stats = useMemo(() => getStats(allProblems), []);
  const pct = stats.overall.attempted > 0
    ? Math.round((stats.overall.correct / stats.overall.attempted) * 100)
    : null;

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

      {/* Progress summary */}
      {stats.overall.attempted > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-600">Celkový výsledek</span>
            <span className="text-sm font-bold text-slate-800">
              {stats.overall.correct}/{stats.overall.attempted} ({pct}%)
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${pct}%` }} />
          </div>
          {stats.byTopic.length > 0 && (
            <div className="mt-3 space-y-1">
              {stats.byTopic
                .sort((a, b) => (a.correct / a.attempted) - (b.correct / b.attempted))
                .slice(0, 3)
                .map(t => {
                  const p = Math.round((t.correct / t.attempted) * 100);
                  return (
                    <div key={t.topic} className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p < 50 ? 'bg-rose-400' : p < 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${p}%` }} />
                      </div>
                      <span className="w-28 text-right">{TOPIC_LABELS[t.topic as Topic] ?? t.topic}: {p}%</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

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
