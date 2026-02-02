
import React, { useState, useEffect, useCallback } from 'react';
import MainMenu from './components/MainMenu';
import GameView from './components/GameView';
import GameOver from './components/GameOver';
import NeuralArchive from './components/NeuralArchive';
import NeuralCodex from './components/NeuralCodex';
import { GameState } from './types';
import { audioManager } from './utils/audioManager';
import { getNeuralArchetype } from './utils/archetypeLogic';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | 'ARCHIVE' | 'CODEX'>('MENU');
  const [archiveSource, setArchiveSource] = useState<GameState>('MENU');
  const [lastScore, setLastScore] = useState(0);
  const [lastStats, setLastStats] = useState<any>(null);
  const [lastPlayedSeed, setLastPlayedSeed] = useState<number>(0);
  const [shouldSkipTutorial, setShouldSkipTutorial] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSeed, setActiveSeed] = useState<number | null>(null);
  const [settings, setSettings] = useState(audioManager.getSettings());
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('bestScore') || '0');
    } catch {
      return 0;
    }
  });

  const [snapshots, setSnapshots] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('neural_snapshots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    if (seedParam) {
      const parsed = parseInt(seedParam);
      if (!isNaN(parsed)) {
        setActiveSeed(parsed);
        setShouldSkipTutorial(true);
      }
    }

    const handleFirstInteraction = () => {
      audioManager.playStartupHook();
      audioManager.startMenuBgm();
      window.removeEventListener('pointerdown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction);
    return () => window.removeEventListener('pointerdown', handleFirstInteraction);
  }, []);

  const saveSnapshot = useCallback((score: number, stats: any, seed: number) => {
    const archetype = getNeuralArchetype(stats);

    const newSnapshot = {
      id: Date.now(),
      score,
      stats,
      seed,
      archetype,
      timestamp: new Date().toISOString()
    };

    setSnapshots(prev => {
      const updated = [newSnapshot, ...prev]
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
      localStorage.setItem('neural_snapshots', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const startGame = useCallback((skip: boolean, forcedSeed?: number) => {
    setShouldSkipTutorial(skip);
    if (forcedSeed !== undefined) {
      setActiveSeed(forcedSeed);
    }
    setGameState('PLAYING');
  }, []);

  const endGame = useCallback((score: number, stats: any, seed: number) => {
    setLastScore(score);
    setLastStats(stats);
    setLastPlayedSeed(seed);
    
    if (score > 1000 || snapshots.length < 5) {
      saveSnapshot(score, stats, seed);
    }

    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('bestScore', score.toString());
    }
    setGameState('GAMEOVER');
  }, [snapshots.length, bestScore, saveSnapshot]);

  const goToMenu = useCallback(() => {
    try {
      setActiveSeed(null);
      if (window.history && window.history.pushState) {
        window.history.pushState({}, '', window.location.pathname);
      }
    } catch (e) {
      console.warn("History navigation error:", e);
    }
    
    setGameState('MENU');
    
    try {
      audioManager.startMenuBgm();
    } catch (e) {
      console.error("Audio error:", e);
    }
  }, []);

  const openArchive = useCallback((from: GameState) => {
    setArchiveSource(from);
    setGameState('ARCHIVE');
  }, []);

  const closeArchive = useCallback(() => {
    setGameState(archiveSource);
    if (archiveSource === 'MENU') {
      audioManager.startMenuBgm();
    } else if (archiveSource === 'GAMEOVER') {
      audioManager.startGameOverBgm();
    }
  }, [archiveSource]);

  const toggleMusic = useCallback(() => {
    const newVal = !settings.music;
    audioManager.setMusicEnabled(newVal);
    setSettings(prev => ({ ...prev, music: newVal }));
  }, [settings.music]);

  const toggleSfx = useCallback(() => {
    const newVal = !settings.sfx;
    audioManager.setSfxEnabled(newVal);
    setSettings(prev => ({ ...prev, sfx: newVal }));
  }, [settings.sfx]);

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden font-sans select-none relative">
      {gameState === 'MENU' && (
        <MainMenu 
          onStart={() => startGame(false)} 
          bestScore={bestScore} 
          onOpenSettings={() => setIsSettingsOpen(true)}
          hasChallenge={!!activeSeed}
          onAcceptChallenge={() => startGame(true)}
          onOpenArchive={() => openArchive('MENU')}
          onOpenCodex={() => setGameState('CODEX')}
        />
      )}
      {gameState === 'ARCHIVE' && (
        <NeuralArchive 
          snapshots={snapshots}
          onBack={closeArchive}
          onReSync={(seed) => startGame(true, seed)}
        />
      )}
      {gameState === 'CODEX' && (
        <NeuralCodex 
          onBack={() => setGameState('MENU')}
        />
      )}
      {gameState === 'PLAYING' && (
        <GameView 
          onGameOver={endGame} 
          skipTutorial={shouldSkipTutorial} 
          initialSeed={activeSeed ?? undefined} 
        />
      )}
      {gameState === 'GAMEOVER' && (
        <GameOver 
          score={lastScore} 
          stats={lastStats}
          seed={lastPlayedSeed}
          bestScore={bestScore} 
          onRetry={() => startGame(true)} 
          onMenu={goToMenu} 
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenArchive={() => openArchive('GAMEOVER')}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-sm:px-4 max-w-sm bg-[#0a0a0a] border-2 border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan/50 to-transparent"></div>
              
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold tracking-[0.2em] text-white uppercase italic">System Config</h3>
                 <button 
                   onClick={() => setIsSettingsOpen(false)}
                   className="size-10 rounded-full border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
                 >
                   <span className="material-symbols-outlined text-white/40">close</span>
                 </button>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                       <span className={`material-symbols-outlined ${settings.music ? 'text-cyan' : 'text-white/20'}`}>
                         {settings.music ? 'music_note' : 'music_off'}
                       </span>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-widest text-white/80">Music</span>
                          <span className="text-[10px] text-white/30 uppercase tracking-tighter">Atmosphere Link</span>
                       </div>
                    </div>
                    <button 
                      onClick={toggleMusic}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 border ${settings.music ? 'bg-cyan/20 border-cyan' : 'bg-white/5 border-white/10'}`}
                    >
                       <div className={`absolute top-1 transition-all duration-300 size-5.5 rounded-full ${settings.music ? 'left-7 bg-cyan shadow-[0_0_10px_#0ddff2]' : 'left-1 bg-white/20'}`} />
                    </button>
                 </div>

                 <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                       <span className={`material-symbols-outlined ${settings.sfx ? 'text-pink' : 'text-white/20'}`}>
                         {settings.sfx ? 'volume_up' : 'volume_off'}
                       </span>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-widest text-white/80">Effects</span>
                          <span className="text-[10px] text-white/30 uppercase tracking-tighter">Neural Feedback</span>
                       </div>
                    </div>
                    <button 
                      onClick={toggleSfx}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 border ${settings.sfx ? 'bg-pink/20 border-pink' : 'bg-white/5 border-white/10'}`}
                    >
                       <div className={`absolute top-1 transition-all duration-300 size-5.5 rounded-full ${settings.sfx ? 'left-7 bg-pink shadow-[0_0_10px_#ff2d55]' : 'left-1 bg-white/20'}`} />
                    </button>
                 </div>
              </div>

              <div className="pt-4 flex flex-col items-center gap-2">
                 <button 
                   onClick={() => setIsSettingsOpen(false)}
                   className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl border border-white/10 transition-colors"
                 >
                   Return to Flow
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
