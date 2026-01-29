
import React from 'react';

interface GameOverProps {
  score: number;
  bestScore: number;
  onRetry: () => void;
  onMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, bestScore, onRetry, onMenu }) => {
  return (
    <div className="relative flex flex-col h-full items-center justify-center p-8 bg-[#102122] overflow-hidden text-center">
      {/* Noise overlay */}
      <div className="fixed inset-0 bg-black opacity-10 pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')` }} />

      <div className="relative z-10 w-full max-w-sm space-y-12">
        <div className="space-y-2">
          <div className="flex items-center justify-center text-cyan mb-2 animate-pulse">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <h2 className="text-cyan text-xl font-bold tracking-[0.2em] glitch-text">STABILITY DEPLETED</h2>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">
            RUN <span className="text-cyan">ANALYTICS</span>
          </h1>
          <div className="h-[2px] w-3/4 mx-auto bg-gradient-to-r from-transparent via-cyan/50 to-transparent"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="p-5 bg-white/5 border border-cyan/20 rounded-xl flex flex-col items-start text-left">
             <span className="text-[10px] uppercase font-bold text-cyan/60 tracking-widest mb-1">Score</span>
             <span className="text-3xl font-bold font-mono">{score.toLocaleString()}</span>
           </div>
           <div className="p-5 bg-white/5 border border-cyan/20 rounded-xl flex flex-col items-start text-left">
             <span className="text-[10px] uppercase font-bold text-cyan/60 tracking-widest mb-1">Best</span>
             <span className="text-3xl font-bold font-mono">{bestScore.toLocaleString()}</span>
           </div>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={onRetry}
            className="w-full py-4 bg-cyan text-black font-black text-lg tracking-[0.1em] rounded-xl shadow-[0_0_20px_rgba(13,223,242,0.4)] active:scale-95 transition-all"
          >
            NEW FLOW
          </button>
          <button 
            onClick={onMenu}
            className="w-full py-4 bg-white/10 border border-white/20 text-white font-bold text-lg tracking-[0.1em] rounded-xl active:bg-white/20"
          >
            MAIN MENU
          </button>
        </div>

        <div className="pt-8 opacity-40">
           <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Share Perfect Squeeze</p>
           <div className="flex justify-center gap-6 mt-4">
              <span className="material-symbols-outlined">share</span>
              <span className="material-symbols-outlined">movie</span>
              <span className="material-symbols-outlined">music_note</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
