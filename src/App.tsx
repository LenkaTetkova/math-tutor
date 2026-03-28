import { useState } from 'react';
import Home from './pages/Home';
import Practice from './pages/Practice';
import { Topic } from './types';

export type Screen = 'home' | 'practice';

export interface PracticeConfig {
  mode: 'topic' | 'exam';
  topic: Topic | null;     // topic mode
  examYear?: number;        // exam mode
  examTerm?: string;        // exam mode
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [config, setConfig] = useState<PracticeConfig>({ mode: 'topic', topic: null });

  function startPractice(cfg: PracticeConfig) {
    setConfig(cfg);
    setScreen('practice');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {screen === 'home' && <Home onStart={startPractice} />}
      {screen === 'practice' && (
        <Practice config={config} onBack={() => setScreen('home')} />
      )}
    </div>
  );
}
