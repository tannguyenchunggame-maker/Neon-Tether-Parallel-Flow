
import React from 'react';
import { ARCHETYPES, COLORS } from '../constants';

interface NeuralCodexProps {
  onBack: () => void;
}

const NeuralCodex: React.FC<NeuralCodexProps> = ({ onBack }) => {
  return (
    <div className="relative h-full w-full bg-[#050a10] flex flex-col overflow-hidden text-white font-sans p-6 sm:p-10 touch-auto">
      <style>{`
        .codex-grid::-webkit-scrollbar { width: 4px; }
        .codex-grid::-webkit-scrollbar-track { background: transparent; }
        .codex-grid::-webkit-scrollbar-thumb { background: rgba(13, 223, 242, 0.2); border-radius: 10px; }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .ultimate-card {
          border: 1px solid transparent;
          border-image: linear-gradient(45deg, #0ddff2, #ff2d55, #00ffcc) 1;
          box-shadow: 0 0 20px rgba(13, 223, 242, 0.1);
        }
      `}</style>

      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(13,223,242,0.2),transparent_60%)]" />
        <div className="absolute bottom-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(255,45,85,0.2),transparent_60%)]" />
      </div>

      <div className="relative z-10 flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black italic tracking-widest text-white uppercase leading-none glitch-text">Neural Codex</h1>
          <span className="text-[8px] font-bold text-cyan/60 tracking-[0.4em] uppercase mt-2 italic animate-pulse">Evolution Requirements Protocol</span>
        </div>
        <button 
          onClick={onBack}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl active:scale-90 transition-transform flex items-center gap-2 group hover:bg-white/10"
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors">close</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Close</span>
        </button>
      </div>

      <div className="flex-1 codex-grid overflow-y-auto pr-2 space-y-4 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(ARCHETYPES).map(([key, arch]) => {
            const isUltimate = arch.rarity === 'ULTIMATE';
            const isMythic = arch.rarity === 'MYTHIC';
            
            return (
              <div 
                key={key}
                className={`relative bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden transition-all hover:bg-white/10 group ${isUltimate ? 'ultimate-card' : ''}`}
              >
                {/* Visual Accent */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:opacity-20 transition-opacity" 
                  style={{ backgroundColor: isUltimate ? '#0ddff2' : arch.color as string }}
                />

                <div className="flex items-start gap-5">
                   <div 
                     className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center relative shadow-inner"
                   >
                      {isUltimate && (
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan/20 to-pink/20 blur-sm animate-[glow-pulse_2s_infinite]" />
                      )}
                      <span className="material-symbols-outlined text-3xl relative z-10" style={{ color: isUltimate ? '#fff' : arch.color as string }}>{arch.icon}</span>
                   </div>

                   <div className="flex flex-col space-y-1">
                      <span className={`text-[7px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded bg-white/10 w-fit ${isUltimate ? 'text-white' : 'text-white/40'}`}>
                        {arch.rarity}
                      </span>
                      <h3 className="text-lg font-black italic tracking-tighter uppercase leading-tight" style={{ color: isUltimate ? 'white' : arch.color as string }}>
                        {arch.title}
                      </h3>
                   </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                   <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Sync Requirement:</p>
                   <p className="text-xs font-medium text-white/70 leading-relaxed tracking-wide">
                     {arch.condition}
                   </p>
                </div>

                {/* Rank Line */}
                <div 
                   className="absolute bottom-0 left-0 h-0.5 transition-all duration-500 group-hover:w-full w-4" 
                   style={{ background: isUltimate ? 'linear-gradient(90deg, #0ddff2, #ff2d55, #00ffcc)' : arch.color as string }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center z-10">
         <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Neural Pathways Mapped: 10/10</span>
         </div>
         <div className="flex gap-4">
            <div className="flex items-center gap-1">
               <div className="size-1 rounded-full bg-cyan" />
               <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Resonance</span>
            </div>
            <div className="flex items-center gap-1">
               <div className="size-1 rounded-full bg-pink" />
               <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Stability</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default NeuralCodex;
