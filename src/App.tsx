import { useState } from 'react';
import Home from './pages/Home';
import Practice from './pages/Practice';
import { Topic } from './types';
import { loadSession, saveSession, clearSession } from './lib/storage';

export type Screen = 'home' | 'practice';

export interface PracticeConfig {
  mode: 'topic' | 'exam';
  topic: Topic | null;     // topic mode
  examYear?: number;        // exam mode
  examTerm?: string;        // exam mode
}

function initState(): { screen: Screen; config: PracticeConfig; startIdx: number } {
  const s = loadSession();
  if (s) return { screen: s.screen, config: s.config, startIdx: s.idx };
  return { screen: 'home', config: { mode: 'topic', topic: null }, startIdx: 0 };
}

const init = initState();

export default function App() {
  const [screen, setScreen] = useState<Screen>(init.screen);
  const [config, setConfig] = useState<PracticeConfig>(init.config);

  function startPractice(cfg: PracticeConfig) {
    setConfig(cfg);
    setScreen('practice');
    saveSession({ screen: 'practice', config: cfg, idx: 0 });
  }

  function goHome() {
    clearSession();
    setScreen('home');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {screen === 'home' && <Home onStart={startPractice} />}
      {screen === 'practice' && (
        <Practice config={config} startIdx={init.startIdx} onBack={goHome}
          onProgress={idx => saveSession({ screen: 'practice', config, idx })} />
      )}
    </div>
  );
}
