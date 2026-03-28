import { useMemo, useState } from 'react';
import { Problem, TOPIC_LABELS, TOPIC_EMOJI } from '../types';
import { PracticeConfig } from '../App';
import allProblems from '../data/problems.json';
import { saveAttempt } from '../lib/storage';

function parseAnswer(answer: string): { label: string | null; value: string }[] {
  return answer.split(' ; ').map(part => {
    const m = part.match(/^(\d+\.\d+):\s*(.+)$/);
    return m ? { label: m[1], value: m[2] } : { label: null, value: part.trim() };
  });
}

// Single MC: one answer, interactive option list
function isSingleMC(p: Problem) {
  return p.type === 'multiple_choice' && !!p.options && !p.correct_answer.includes(' ; ');
}
// Multi-part MC: e.g. "11.1: A ; 11.2: N ; 11.3: A" with A/N buttons per part
function isMultiMC(p: Problem) {
  return p.type === 'multiple_choice' && !!p.options && p.correct_answer.includes(' ; ');
}

export default function Practice({ config, onBack }: { config: PracticeConfig; onBack: () => void }) {
  const problems = useMemo<Problem[]>(() => {
    if (config.mode === 'exam') {
      return (allProblems as Problem[])
        .filter(p => p.year === config.examYear && p.term === config.examTerm)
        .sort((a, b) => a.problem_number - b.problem_number);
    }
    const filtered = (allProblems as Problem[]).filter(
      p => !config.topic || p.topic === config.topic
    );
    return [...filtered].sort(() => Math.random() - 0.5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.mode, config.examYear, config.examTerm, config.topic]);

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  // Single MC state
  const [selected, setSelected] = useState<string | null>(null);
  const [mcResult, setMcResult] = useState<'correct' | 'wrong' | null>(null);

  // Multi-part MC state: partIndex → chosen option string
  const [mcSelections, setMcSelections] = useState<Record<number, string>>({});

  // Open / reveal state
  const [revealedParts, setRevealedParts] = useState<Set<number>>(new Set());

  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);


  function reset() {
    setSelected(null);
    setMcResult(null);
    setMcSelections({});
    setRevealedParts(new Set());
    setShowHint(false);
    setShowSolution(false);
  }

  function advance() {
    if (idx + 1 >= problems.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      reset();
    }
  }

  function goBack() {
    if (idx > 0) { setIdx(i => i - 1); reset(); }
  }

  function checkMC(option: string, problem: Problem) {
    setSelected(option);
    const correct = problem.correct_answer;
    const isCorrect = option === correct
      || correct.startsWith(option.charAt(0))
      || option.startsWith(correct.charAt(0));
    setMcResult(isCorrect ? 'correct' : 'wrong');
    saveAttempt(problem.id, isCorrect);
  }

  function selectMultiMC(partIdx: number, option: string, problem: Problem, answerParts: {label:string|null;value:string}[]) {
    const updated = { ...mcSelections, [partIdx]: option };
    setMcSelections(updated);
    // Save attempt once all parts answered
    if (Object.keys(updated).length >= answerParts.length) {
      const allCorrect = answerParts.every((p, i) => updated[i]?.charAt(0) === p.value);
      saveAttempt(problem.id, allCorrect);
    }
  }

  if (problems.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-4">🤔</div>
        <p className="text-slate-600 mb-6">Pro toto nastavení nejsou žádné příklady.</p>
        <button onClick={onBack} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium">
          Zpět na výběr
        </button>
      </div>
    );
  }

  if (done) {
    const n = problems.length;
    const noun = n === 1 ? 'příklad' : n < 5 ? 'příklady' : 'příkladů';
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Hotovo!</h2>
        <p className="text-slate-500 mb-8">
          Prošel jsi všechny {n} {noun} z tohoto tématu.
        </p>
        <button onClick={onBack}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
          Zpět na výběr
        </button>
      </div>
    );
  }

  const problem = problems[idx];
  const steps: string[] = problem.solution_steps ? JSON.parse(problem.solution_steps) : [];
  const options: string[] = problem.options ? JSON.parse(problem.options) : [];
  const answerParts = parseAnswer(problem.correct_answer);
  const singleMC = isSingleMC(problem);
  const multiMC = isMultiMC(problem);

  const allRevealed = singleMC
    ? !!mcResult
    : multiMC
      ? Object.keys(mcSelections).length >= answerParts.length
      : revealedParts.size >= answerParts.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 min-h-screen flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm">← Zpět</button>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
          {TOPIC_EMOJI[problem.topic]} {TOPIC_LABELS[problem.topic]}
        </span>
        <span className="text-sm text-slate-400">
        {config.mode === 'exam'
          ? `Úloha ${problem.problem_number} / ${problems.length}`
          : `${idx + 1} / ${problems.length}`}
      </span>
      </div>

      {/* Source */}
      <p className="text-xs text-slate-400 mb-3 text-center">
        {problem.year > 0
          ? `JPZ ${problem.year} – varianta ${problem.term}, úloha ${problem.problem_number}`
          : problem.id}
      </p>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-5">
        {problem.question_image ? (() => {
          const imgs: string[] = problem.question_image!.startsWith('[')
            ? JSON.parse(problem.question_image!)
            : [problem.question_image!];
          return <>{imgs.map((src, i) => (
            <img key={i} src={`${import.meta.env.BASE_URL}${src}`} alt="Zadání" className="w-full" draggable={false} />
          ))}</>;
        })() : (
          <div className="p-6">
            <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
              {problem.question_text}
            </p>
          </div>
        )}
      </div>

      {/* ── Single MC ── */}
      {singleMC && (
        <div className="space-y-2 mb-5">
          {options.map(opt => {
            const isSelected = selected === opt;
            const isCorrect = opt === problem.correct_answer
              || problem.correct_answer.startsWith(opt.charAt(0));
            const base = 'w-full text-left px-4 py-3 rounded-xl text-sm font-medium border-2 transition-colors';
            let cls = 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300';
            if (isSelected && mcResult === 'correct') cls = 'border-emerald-500 bg-emerald-50 text-emerald-800';
            else if (isSelected && mcResult === 'wrong') cls = 'border-rose-500 bg-rose-50 text-rose-800';
            else if (mcResult && isCorrect)             cls = 'border-emerald-400 bg-emerald-50 text-emerald-700';
            else if (isSelected)                        cls = 'border-indigo-500 bg-indigo-50 text-indigo-800';
            return (
              <button key={opt} disabled={!!mcResult} onClick={() => checkMC(opt, problem)}
                className={`${base} ${cls}`}>
                {opt}
              </button>
            );
          })}
          {mcResult && (
            <p className={`text-sm font-medium pt-1 ${mcResult === 'correct' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {mcResult === 'correct' ? '🎉 Správně!' : `❌ Správná odpověď: ${problem.correct_answer}`}
            </p>
          )}
        </div>
      )}

      {/* ── Multi-part MC (A/N per sub-question) ── */}
      {multiMC && (
        <div className="space-y-3 mb-5">
          {answerParts.map((part, i) => {
            const sel = mcSelections[i];
            const answered = sel !== undefined;
            const correctOpt = options.find(o => o.charAt(0) === part.value);
            const isCorrect = sel !== undefined && sel.charAt(0) === part.value;
            return (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                {part.label && (
                  <p className="text-xs font-semibold text-slate-500 mb-2">{part.label}</p>
                )}
                <div className="flex gap-2">
                  {options.map(opt => {
                    const isSelected = sel === opt;
                    const optIsCorrect = opt.charAt(0) === part.value;
                    const base = 'flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors';
                    let cls = 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300';
                    if (answered) {
                      if (isSelected && isCorrect)       cls = 'border-emerald-500 bg-emerald-50 text-emerald-800';
                      else if (isSelected && !isCorrect) cls = 'border-rose-500 bg-rose-50 text-rose-800';
                      else if (optIsCorrect)             cls = 'border-emerald-400 bg-emerald-50 text-emerald-700';
                      else                              cls = 'border-slate-100 bg-white text-slate-300';
                    }
                    return (
                      <button key={opt} disabled={answered}
                        onClick={() => selectMultiMC(i, opt, problem, answerParts)}
                        className={`${base} ${cls}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {answered && !isCorrect && correctOpt && (
                  <p className="text-xs text-rose-600 mt-1.5">Správně: {correctOpt}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Open / per-part reveal ── */}
      {!singleMC && !multiMC && (
        <div className="space-y-2 mb-5">
          {answerParts.map((part, i) =>
            revealedParts.has(i) ? (
              <div key={i}>
                {problem.answer_image ? (
                  <div className="rounded-2xl overflow-hidden border-2 border-emerald-300">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide px-4 pt-3 pb-1">
                      Správné řešení
                    </p>
                    <img src={`${import.meta.env.BASE_URL}${problem.answer_image}`} alt="Správné řešení" className="w-full" draggable={false} />
                  </div>
                ) : (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl px-4 py-3 flex items-baseline gap-3">
                    {part.label && (
                      <span className="text-xs font-bold text-emerald-600 shrink-0 w-8">{part.label}</span>
                    )}
                    <span className="text-emerald-900 font-bold">{part.value}</span>
                  </div>
                )}
              </div>
            ) : (
              <button key={i}
                onClick={() => {
                  const next = new Set([...revealedParts, i]);
                  setRevealedParts(next);
                  if (next.size >= answerParts.length) saveAttempt(problem.id, false); // open = self-assessed
                }}
                className="w-full py-3 border-2 border-indigo-200 hover:border-indigo-400 bg-white
                  text-indigo-600 font-medium rounded-xl transition-colors text-sm">
                Zobrazit odpověď{part.label ? ` (${part.label})` : ''}
              </button>
            )
          )}
        </div>
      )}

      {/* ── Solution steps ── */}
      {allRevealed && showSolution && steps.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">Postup řešení</p>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-amber-900">
                <span className="flex-shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full
                  text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Hint (before answer revealed) ── */}
      {!allRevealed && problem.hint && (
        <div className="mb-4">
          <button
            onClick={() => setShowHint(h => !h)}
            className={`w-full py-3 border-2 rounded-xl font-medium text-sm transition-colors
              ${showHint
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-amber-200 hover:border-amber-300 text-amber-700 bg-white'}`}
          >
            {showHint ? 'Skrýt nápovědu' : '💡 Nápověda'}
          </button>
          {showHint && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-900 leading-relaxed">{problem.hint}</p>
            </div>
          )}
        </div>
      )}

      {/* ── After all revealed: solution + next ── */}
      {allRevealed && (
        <div className="flex gap-3 mb-4">
          {steps.length > 0 && (
            <button onClick={() => setShowSolution(s => !s)}
              className="flex-1 py-3 border-2 border-amber-300 hover:border-amber-400
                text-amber-700 font-medium rounded-xl transition-colors">
              {showSolution ? 'Skrýt postup' : '📖 Zobrazit postup'}
            </button>
          )}
          <button onClick={advance}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
            {idx + 1 < problems.length ? 'Další příklad →' : 'Dokončit ✓'}
          </button>
        </div>
      )}

      {/* Prev / skip */}
      <div className="flex justify-between text-sm text-slate-400 mt-auto pt-2">
        <button onClick={goBack} disabled={idx === 0}
          className="hover:text-slate-600 disabled:opacity-30">← Předchozí</button>
        <button onClick={advance} className="hover:text-slate-600">Přeskočit →</button>
      </div>

    </div>
  );
}
