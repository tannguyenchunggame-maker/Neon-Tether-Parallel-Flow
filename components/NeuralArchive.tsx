
import React, { useState } from 'react';
import { COLORS } from '../constants';

interface Snapshot {
  id: number;
  score: number;
  seed: number;
  stats: any;
  archetype: { title: string; icon: string; color: string };
  timestamp: string;
}

interface NeuralArchiveProps {
  snapshots: Snapshot[];
  onBack: () => void;
  onReSync: (seed: number) => void;
}

const NeuralArchive: React.FC<NeuralArchiveProps> = ({ snapshots, onBack, onReSync }) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);

  const handleShare = async (snapshot: Snapshot) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?seed=${snapshot.seed}`;
    const shareText = `Re-Sync Challenge! Can you beat my ${snapshot.score.toLocaleString()} as ${snapshot.archetype.title}? 🌌`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Neon Tether Ghost Challenge', text: shareText, url: shareUrl });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBack();
  };

  return (
    <div className="relative h-full w-full bg-[#050a10] flex flex-col overflow-hidden text-white font-sans p-6 sm:p-10 touch-auto">
      <style>{`
        .chip-glow:hover { box-shadow: 0 0 15px currentColor; }
        .server-rack { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
        @keyframes expand { 
          0% { transform: scale(0.8) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Background Decor */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(13,223,242,0.4),transparent_70%)]" />
        <div className="w-full h-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      <div className="relative z-[60] flex justify-between items-center mb-10 pointer-events-auto">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black italic tracking-widest text-cyan uppercase leading-none">Neural Archive</h1>
          <span className="text-[8px] font-bold text-white/30 tracking-[0.4em] uppercase mt-2 italic">Ghost Nodes // Memory Chips</span>
        </div>
        <button 
          type="button"
          onClick={handleBackClick}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl active:scale-90 transition-transform flex items-center gap-2 group hover:bg-white/10 pointer-events-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors">arrow_back</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Return</span>
        </button>
      </div>

      <div className="flex-1 server-rack overflow-y-auto pr-2 space-y-4 z-10">
        {snapshots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
             <span className="material-symbols-outlined text-6xl">cloud_off</span>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center">Archive Empty // Record A Run</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshots.map((s) => (
              <div 
                key={s.id}
                onClick={() => setSelectedSnapshot(s)}
                className="relative group cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all active:scale-95 overflow-hidden"
              >
                {/* Visual Identity Strip */}
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: s.archetype.color }} />
                
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Score</p>
                      <h3 className="text-xl font-mono font-bold">{s.score.toLocaleString()}</h3>
                   </div>
                   <div className="p-2 bg-black/40 rounded-lg">
                      <span className="material-symbols-outlined text-xl" style={{ color: s.archetype.color }}>{s.archetype.icon}</span>
                   </div>
                </div>

                <div className="mt-6 flex justify-between items-end">
                   <div className="flex flex-col">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">Archetype</p>
                      <p className="text-[10px] font-black italic uppercase" style={{ color: s.archetype.color }}>{s.archetype.title}</p>
                   </div>
                   <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">#{s.seed.toString(16).slice(0,6)}</span>
                </div>

                {/* Technical Overlay on Hover */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] font-black tracking-[0.3em] uppercase bg-black/80 px-4 py-2 rounded-full border border-white/10">Read Memory</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center z-10">
         <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-cyan animate-pulse" />
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">Nodes Online: {snapshots.length}/12</span>
         </div>
      </div>

      {/* Expanded Chip View Modal */}
      {selectedSnapshot && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div 
            className="w-full max-w-sm space-y-6 animate-[expand_0.4s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            {/* The Expanded Card (Mirroring GameOver UI) */}
            <div className="relative p-8 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: selectedSnapshot.archetype.color }} />
               
               <div className="flex flex-col items-center text-center space-y-6">
                  <div className="p-5 rounded-full bg-white/5 border border-white/10">
                     <span className="material-symbols-outlined text-5xl" style={{ color: selectedSnapshot.archetype.color }}>{selectedSnapshot.archetype.icon}</span>
                  </div>
                  
                  <div className="space-y-2">
                     <p className="text-[9px] font-black tracking-[0.6em] text-white/30 uppercase leading-none">Memory Snapshot</p>
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase" style={{ color: selectedSnapshot.archetype.color }}>{selectedSnapshot.archetype.title}</h2>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-3 pt-4">
                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                        <p className="text-[7px] font-black text-white/20 uppercase mb-1">Final Score</p>
                        <p className="text-xl font-mono font-bold leading-none">{selectedSnapshot.score.toLocaleString()}</p>
                     </div>
                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                        <p className="text-[7px] font-black text-white/20 uppercase mb-1">Seed ID</p>
                        <p className="text-xl font-mono font-bold leading-none text-white/60">{selectedSnapshot.seed}</p>
                     </div>
                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                        <p className="text-[7px] font-black text-white/20 uppercase mb-1">Resonance</p>
                        <p className="text-xl font-mono font-bold leading-none text-gold">{Math.floor(selectedSnapshot.stats?.resonance || 0)}%</p>
                     </div>
                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                        <p className="text-[7px] font-black text-white/20 uppercase mb-1">Mirror Shards</p>
                        <p className="text-xl font-mono font-bold leading-none text-cyan">{selectedSnapshot.stats?.shards || 0}</p>
                     </div>
                  </div>

                  <div className="w-full pt-6 border-t border-white/5 flex flex-col gap-4">
                     <button 
                        onClick={() => onReSync(selectedSnapshot.seed)}
                        className="w-full py-5 bg-cyan text-black font-black text-sm tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_30px_rgba(13,223,242,0.4)]"
                     >
                        <span className="material-symbols-outlined">refresh</span>
                        RE-SYNC PATH
                     </button>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleShare(selectedSnapshot)}
                          className="py-4 bg-white/5 border border-white/10 text-white/60 font-black text-[10px] tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 active:bg-white/10 transition-all uppercase"
                        >
                          <span className="material-symbols-outlined text-sm">share</span>
                          Share
                        </button>
                        <button 
                          onClick={() => setSelectedSnapshot(null)}
                          className="py-4 bg-white/5 border border-white/10 text-white/30 font-bold text-[10px] tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 active:bg-white/10 transition-all uppercase"
                        >
                          Close
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

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

export default NeuralArchive;
