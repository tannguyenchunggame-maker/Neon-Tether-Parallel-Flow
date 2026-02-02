
import React, { useEffect } from 'react';
import { audioManager } from '../utils/audioManager';

interface MainMenuProps {
  onStart: () => void;
  bestScore: number;
  onOpenSettings: () => void;
  hasChallenge?: boolean;
  onAcceptChallenge?: () => void;
  onOpenArchive: () => void;
  onOpenCodex: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, bestScore, onOpenSettings, hasChallenge, onAcceptChallenge, onOpenArchive, onOpenCodex }) => {
  useEffect(() => {
    audioManager.startMenuBgm();
  }, []);

  return (
    <div 
      className="relative flex flex-col h-full items-center justify-between p-8 pb-12 bg-black overflow-hidden"
    >
      <div className="w-full flex justify-between items-center z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenArchive(); }}
          className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 active:scale-95 transition-all hover:bg-white/10 group"
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-gold transition-colors">memory</span>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-white/60">Archive</span>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
          className="p-3 bg-white/5 rounded-xl border border-white/10 active:scale-90 transition-transform hover:bg-white/10 group"
        >
          <span className="material-symbols-outlined text-white/50 group-hover:text-cyan transition-colors">settings</span>
        </button>
      </div>

      <div className="flex flex-col items-center space-y-2 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-[0.2em] text-cyan glitch-text drop-shadow-[0_0_10px_#0ddff2]">
          NEON TETHER
        </h1>
        <h2 className="text-sm md:text-base font-medium tracking-[0.4em] text-pink uppercase italic opacity-80">
          Parallel Flow
        </h2>
      </div>

      <div className="relative flex items-center justify-center w-full h-40">
        {hasChallenge ? (
          <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom duration-700">
             <div className="px-6 py-3 bg-cyan/10 border border-cyan/40 rounded-full flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan animate-pulse">stadium</span>
                <span className="text-xs font-black tracking-[0.2em] text-cyan uppercase">Ghost_Challenge: Loaded</span>
             </div>
             <p className="text-[10px] text-white/40 tracking-[0.3em] uppercase max-w-[200px] text-center italic">A rival syncer has prepared a specific map for you.</p>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 rounded-full bg-cyan shadow-[0_0_15px_#0ddff2] animate-pulse flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-pink"></div>
            </div>
            <div className="w-32 h-[2px] bg-gradient-to-r from-cyan to-pink opacity-60"></div>
            <div className="w-6 h-6 rounded-full bg-pink shadow-[0_0_15px_#ff2d55] animate-pulse flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan"></div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-xs space-y-4">
        {hasChallenge ? (
          <button 
            onClick={onAcceptChallenge}
            className="w-full py-4 bg-cyan text-black font-black tracking-[0.2em] rounded-lg active:scale-95 transition-all shadow-[0_0_30px_rgba(13,223,242,0.6)]"
          >
            ACCEPT CHALLENGE
          </button>
        ) : (
          <button 
            onClick={onStart}
            className="w-full py-4 border-2 border-cyan text-cyan font-bold tracking-[0.2em] rounded-lg active:bg-cyan/10 active:scale-95 transition-all shadow-[0_0_30px_rgba(13,223,242,0.3)]"
          >
            START FLOW
          </button>
        )}
        
        <button 
          onClick={onOpenCodex}
          className="w-full py-3 bg-white/5 border border-white/10 text-white/40 font-black text-[10px] tracking-[0.3em] rounded-lg active:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 group hover:text-cyan hover:border-cyan/40"
        >
          <span className="material-symbols-outlined text-sm">menu_book</span>
          NEURAL CODEX
        </button>
      </div>

      <div className="flex flex-col items-center space-y-1">
        <div className="flex items-baseline space-x-3">
          <span className="text-[10px] font-bold text-cyan opacity-60 uppercase">Best Score</span>
          <span className="text-3xl font-bold font-mono tracking-tighter">
            {bestScore.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 z-[-1] opacity-20">
         <div className="absolute bottom-0 w-full h-1/2 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
    </div>
  );
};

export default MainMenu;
