
import React from 'react';
import { COLORS } from '../constants';

interface MainMenuProps {
  onStart: () => void;
  bestScore: number;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, bestScore }) => {
  return (
    <div className="relative flex flex-col h-full items-center justify-between p-8 pb-12 bg-black overflow-hidden">
      {/* Settings icon */}
      <div className="w-full flex justify-end">
        <button className="p-2 bg-white/5 rounded-lg border border-white/10 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-white/50">settings</span>
        </button>
      </div>

      {/* Title */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-[0.2em] text-cyan glitch-text drop-shadow-[0_0_10px_#0ddff2]">
          NEON TETHER
        </h1>
        <h2 className="text-sm md:text-base font-medium tracking-[0.4em] text-pink uppercase italic opacity-80">
          Parallel Flow
        </h2>
      </div>

      {/* Visual Component */}
      <div className="relative flex items-center justify-center w-full h-40">
        <div className="flex items-center space-x-4">
          <div className="w-6 h-6 rounded-full bg-cyan shadow-[0_0_15px_#0ddff2]"></div>
          <div className="w-32 h-[2px] bg-gradient-to-r from-cyan to-pink opacity-60"></div>
          <div className="w-6 h-6 rounded-full bg-pink shadow-[0_0_15px_#ff2d55]"></div>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full max-w-xs space-y-4">
        <button 
          onClick={onStart}
          className="w-full py-4 border-2 border-cyan text-cyan font-bold tracking-[0.2em] rounded-lg active:bg-cyan/10 active:scale-95 transition-all"
        >
          START FLOW
        </button>
        <div className="grid grid-cols-2 gap-4">
          <button className="py-3 border border-white/20 text-white/70 font-bold text-xs tracking-[0.1em] rounded-lg active:bg-white/5">
            SKINS
          </button>
          <button className="py-3 border border-white/20 text-white/70 font-bold text-xs tracking-[0.1em] rounded-lg active:bg-white/5">
            SOUNDS
          </button>
        </div>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center space-y-1">
        <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">Global Ranking</p>
        <div className="flex items-baseline space-x-3">
          <span className="text-[10px] font-bold text-cyan opacity-60 uppercase">Best Score</span>
          <span className="text-3xl font-bold font-mono tracking-tighter">
            {bestScore.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 z-[-1] opacity-20">
         <div className="absolute bottom-0 w-full h-1/2 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
    </div>
  );
};

export default MainMenu;
