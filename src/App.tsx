import { useState } from 'react';
import Home from './pages/Home';
import Practice from './pages/Practice';
import { Topic } from './types';

export type Screen = 'home' | 'practice';

export interface PracticeConfig {
  topic: Topic | null;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [config, setConfig] = useState<PracticeConfig>({ topic: null });

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
