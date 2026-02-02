
import React, { useEffect, useState } from 'react';
import { audioManager } from '../utils/audioManager';
import { COLORS, ARCHETYPES } from '../constants';
import { getNeuralArchetype } from '../utils/archetypeLogic';

interface GameOverProps {
  score: number;
  stats: any;
  seed: number;
  bestScore: number;
  onRetry: () => void;
  onMenu: () => void;
  onOpenSettings: () => void;
  onOpenArchive: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, stats, seed, bestScore, onRetry, onMenu, onOpenSettings, onOpenArchive }) => {
  const [showShareToast, setShowShareToast] = useState(false);
  const [archetype, setArchetype] = useState(ARCHETYPES.NEURON_SYNCER);

  useEffect(() => {
    audioManager.startGameOverBgm();
    audioManager.playHit();

    if (stats) {
      setArchetype(getNeuralArchetype(stats));
    }
    
    return () => {
      audioManager.stopUIBgm();
    };
  }, [stats]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?seed=${seed}`;
    const shareText = `I just reached a score of ${score.toLocaleString()} as ${archetype.title} in Neon Tether! Can you beat this flow? 🌌✨`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Neon Tether Challenge',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      } catch (err) {
        console.error("Clipboard failed", err);
      }
    }
  };

  const isUltimate = archetype.title === "ZENITH VOYAGER";

  return (
    <div className="relative flex flex-col h-full items-center p-8 bg-[#050a10] overflow-hidden text-center">
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes border-glow {
          0%, 100% { border-color: rgba(13, 223, 242, 0.4); box-shadow: 0 0 15px rgba(13, 223, 242, 0.2); }
          50% { border-color: rgba(13, 223, 242, 1); box-shadow: 0 0 25px rgba(13, 223, 242, 0.4); }
        }
        @keyframes ultimate-glow {
           0%, 100% { filter: drop-shadow(0 0 15px #0ddff2); }
           33% { filter: drop-shadow(0 0 15px #ff2d55); }
           66% { filter: drop-shadow(0 0 15px #00ffcc); }
        }
        .cyber-button {
          background: linear-gradient(135deg, rgba(13, 223, 242, 0.05) 0%, rgba(255, 45, 85, 0.05) 100%);
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .cyber-button:hover {
          background: rgba(13, 223, 242, 0.1);
          transform: translateY(-2px);
        }
        .cyber-button:active {
          transform: translateY(1px) scale(0.98);
        }
        .corner-accent {
          position: absolute;
          width: 8px;
          height: 8px;
          border-color: #0ddff2;
        }
        .rarity-badge {
          font-size: 7px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 4px;
        }
      `}</style>

      {/* HUD Background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full flex justify-between z-20 items-center">
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenArchive(); }}
          className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 active:scale-95 transition-all hover:bg-white/10 group"
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-gold transition-colors">memory</span>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-white/60">Memory</span>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
          className="p-3 bg-white/5 rounded-xl border border-white/10 active:scale-90 transition-transform hover:bg-white/10 group"
        >
          <span className="material-symbols-outlined text-white/50 group-hover:text-cyan transition-colors">settings</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-sm:px-2 max-w-sm space-y-8 flex-1 flex flex-col justify-center">
        
        {/* NEURAL PROFILE CARD */}
        <div className="relative p-6 bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom duration-1000">
           {/* Card Glitch Stripes */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
           <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink/40 to-transparent" />
           
           <div className="flex flex-col items-center gap-4">
              <div 
                className={`p-4 rounded-full bg-white/5 border border-white/10 ${isUltimate ? 'animate-[ultimate-glow_3s_infinite]' : ''}`}
                style={{ shadowColor: isUltimate ? 'transparent' : archetype.color }}
              >
                 <span className="material-symbols-outlined text-4xl" style={{ color: isUltimate ? '#fff' : archetype.color }}>{archetype.icon}</span>
              </div>
              <div className="space-y-1">
                 <div className="flex flex-col items-center">
                   <span className="rarity-badge bg-white/10 text-white/40 uppercase">{archetype.rarity}</span>
                   <h3 className="text-[10px] font-black tracking-[0.5em] text-white/40 uppercase">Neural Archetype</h3>
                 </div>
                 <h2 
                   className={`text-3xl font-black italic tracking-tighter uppercase glitch-text leading-tight ${isUltimate ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan via-pink to-mint' : ''}`}
                   style={{ color: isUltimate ? 'transparent' : archetype.color }}
                 >
                   {archetype.title}
                 </h2>
              </div>
           </div>

           <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                 <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1">Final Score</p>
                 <p className="text-xl font-mono font-bold leading-none">{score.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                 <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1">Max Resonance</p>
                 <p className="text-xl font-mono font-bold leading-none" style={{ color: COLORS.GOLD }}>{Math.floor(stats?.resonance || 0)}%</p>
              </div>
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                 <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1">Level Reached</p>
                 <p className="text-xl font-mono font-bold leading-none text-cyan">LV.{stats?.level || 1}</p>
              </div>
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                 <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1">Best Run</p>
                 <p className="text-xl font-mono font-bold leading-none text-white/60">{bestScore.toLocaleString()}</p>
              </div>
           </div>

           <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center px-2">
              <div className="flex flex-col items-start">
                 <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em]">Auth Code</span>
                 <span className="text-[10px] font-mono text-white/40 uppercase">#{seed.toString(16).slice(-5)}</span>
              </div>
              <div className="flex items-center gap-1">
                 <div className="size-1 rounded-full bg-cyan animate-pulse" />
                 <span className="text-[8px] font-bold text-cyan/60 tracking-widest uppercase italic">Sync Verified</span>
              </div>
           </div>
        </div>

        {/* REDESIGNED BUTTONS */}
        <div className="space-y-4">
          <button 
            onClick={handleShare}
            className="cyber-button relative w-full py-5 border-2 border-cyan/40 rounded-2xl flex items-center justify-center gap-4 overflow-hidden animate-[border-glow_3s_infinite] group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan/10 to-transparent h-1/2 w-full animate-[scanline_4s_linear_infinite] pointer-events-none opacity-30" />
            
            <div className="corner-accent top-0 left-0 border-t-2 border-l-2" />
            <div className="corner-accent top-0 right-0 border-t-2 border-r-2" />
            <div className="corner-accent bottom-0 left-0 border-b-2 border-l-2" />
            <div className="corner-accent bottom-0 right-0 border-b-2 border-r-2" />

            <span className="material-symbols-outlined text-2xl text-cyan group-hover:scale-110 transition-transform">share</span>
            <span className="text-white font-black text-lg tracking-[0.2em] uppercase italic drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              Encrypt & Share
            </span>
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onRetry}
              className="py-4 bg-cyan/10 border border-cyan/20 text-cyan/80 font-black text-[10px] tracking-[0.25em] rounded-xl active:bg-cyan/20 active:scale-95 transition-all uppercase italic flex items-center justify-center gap-2 hover:border-cyan/60"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry Sync
            </button>
            <button 
              onClick={onMenu}
              className="py-4 bg-white/5 border border-white/10 text-white/30 font-bold text-[10px] tracking-[0.25em] rounded-xl active:bg-white/10 transition-all uppercase flex items-center justify-center gap-2 hover:text-white/60 hover:border-white/20"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              Main Menu
            </button>
          </div>
        </div>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-cyan text-black rounded-full font-black text-[10px] tracking-[0.3em] uppercase flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-500 shadow-[0_0_30px_rgba(13,223,242,0.6)]">
           <span className="material-symbols-outlined text-sm">link</span>
           Neural Link Copied
        </div>
      )}
    </div>
  );
};

export default GameOver;
