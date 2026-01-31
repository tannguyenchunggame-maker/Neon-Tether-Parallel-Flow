
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PHYSICS, COLORS, INITIAL_STABILITY, MIRROR_DURATION, MIRROR_PORTAL_WIDTH, MIRROR_PORTAL_HEIGHT, MIRROR_SPAWN_START_TIME } from '../constants';
import { Obstacle } from '../types';
import { generateObstacle, updateGameState, LANE_WIDTH, GAP_EXPANSION } from '../gameLogic';

interface GameViewProps {
  onGameOver: (score: number) => void;
  skipTutorial?: boolean;
}

export default function GameView({ onGameOver, skipTutorial = false }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [stability, setStability] = useState(INITIAL_STABILITY);
  const [resonanceHUD, setResonanceHUD] = useState(0);
  const [isSqueezingHUD, setIsSqueezingHUD] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!skipTutorial);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMirrorActive, setIsMirrorActive] = useState(false);
  const [mirrorShards, setMirrorShards] = useState(0);

  const gameStateRef = useRef({
    x: 0, spacing: PHYSICS.REST_SPACING, velX: 0, velSpacing: 0,
    obstacles: [] as Obstacle[], distance: 0, currentScore: 0, stability: INITIAL_STABILITY,
    lastTime: 0, isPaused: false, inputX: 0, inputY: 0, isTouching: false,
    canvasWidth: 0, canvasHeight: 0, shake: 0, hitCooldown: 0,
    touchStartX: 0, touchStartY: 0, gameTime: 0, currentStep: 0,
    isCountingDown: false, isReady: false, bonusScore: 0,
    floatingTexts: [] as any[], globalResonance: 0, isSqueezing: false,
    mirrorTime: 0, 
    mirrorParticlesCollected: 0,
    nextMirrorSpawnTime: MIRROR_SPAWN_START_TIME + Math.random() * 10000, 
    glitchIntensity: 0
  });

  const handleResize = useCallback(() => {
    if (containerRef.current && canvasRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = width; canvasRef.current.height = height;
      gameStateRef.current.canvasWidth = width; gameStateRef.current.canvasHeight = height;
    }
  }, []);

  const triggerMirrorActive = (val: boolean) => {
    setIsMirrorActive(val);
    if (val) {
      gameStateRef.current.glitchIntensity = 1.0;
      gameStateRef.current.mirrorParticlesCollected = 0;
    }
  };

  useEffect(() => {
    if (showTutorial) {
      const autoClose = setTimeout(() => {
        setShowTutorial(false);
      }, 15000);
      return () => clearTimeout(autoClose);
    }
  }, [showTutorial]);

  useEffect(() => {
    if (!showTutorial && !gameStateRef.current.isReady && !gameStateRef.current.isCountingDown) {
      gameStateRef.current.isCountingDown = true;
      let count = 3; setCountdown(count);
      const timer = setInterval(() => {
        count--;
        if (count > 0) setCountdown(count);
        else {
          setCountdown(null);
          gameStateRef.current.isReady = true;
          gameStateRef.current.isCountingDown = false;
          let currentY = -600;
          for (let i = 0; i < 5; i++) {
            const obs = generateObstacle(currentY, gameStateRef.current);
            gameStateRef.current.obstacles.push(obs);
            currentY -= (obs.height || 0) + 1200; 
          }
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showTutorial]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    let animationFrame: number;

    const loop = (time: number) => {
      const dt = Math.min((time - gameStateRef.current.lastTime) / 16, 2);
      gameStateRef.current.lastTime = time;
      if (!gameStateRef.current.isPaused) {
        updateGameState(gameStateRef.current, dt, onGameOver, triggerMirrorActive);
        
        const state = gameStateRef.current;
        setScore(Math.floor(state.currentScore + state.bonusScore));
        setStability(Math.floor(Math.max(0, state.stability)));
        setResonanceHUD(Math.floor(state.globalResonance));
        setIsSqueezingHUD(state.isSqueezing);
        setMirrorShards(state.mirrorParticlesCollected);

        if (state.shake > 0) state.shake *= 0.9;
        if (state.glitchIntensity > 0) state.glitchIntensity -= 0.05 * dt;
        
        draw();
      }
      animationFrame = requestAnimationFrame(loop);
    };

    const draw = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const state = gameStateRef.current;
      const w = state.canvasWidth; const h = state.canvasHeight; const cx = w / 2;
      const isMirror = state.mirrorTime > 0;
      
      const palette = isMirror ? {
        bg: COLORS.MIRROR_BG,
        primary: COLORS.MIRROR_PRIMARY,
        secondary: COLORS.MIRROR_SECONDARY,
        grid: 'rgba(255, 255, 255, 0.08)',
        ball1: COLORS.MIRROR_PRIMARY,
        ball2: COLORS.WHITE
      } : {
        bg: COLORS.BLACK,
        primary: COLORS.PINK,
        secondary: COLORS.CYAN,
        grid: 'rgba(255, 255, 255, 0.06)',
        ball1: COLORS.CYAN,
        ball2: COLORS.PINK
      };

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      if (state.shake > 1) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
      
      ctx.strokeStyle = palette.grid; ctx.lineWidth = 1;
      for(let x=0; x<w; x+=70) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      const gridY = (state.distance % 70);
      for(let y=gridY; y<h; y+=70) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

      state.obstacles.forEach(obs => {
        ctx.lineWidth = 4; ctx.globalAlpha = obs.wasHit ? 0.25 : 1.0;
        ctx.shadowBlur = isMirror ? 8 : 12; ctx.lineCap = 'round';

        if (obs.type === 'ZIGZAG') {
            const fh = obs.height!; const gs = obs.gapSize!; const igs = gs - (LANE_WIDTH * GAP_EXPANSION);
            ctx.strokeStyle = palette.primary; ctx.shadowColor = palette.primary;
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) {
                const prog = i / 60; const currY = obs.y - prog * fh;
                const currX = cx + (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (w * 0.22);
                if (i === 0) ctx.moveTo(currX - gs / 2, currY); else ctx.lineTo(currX - gs / 2, currY);
            }
            ctx.stroke();
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) {
                const prog = i / 60; const currY = obs.y - prog * fh;
                const currX = cx + (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (w * 0.22);
                if (i === 0) ctx.moveTo(currX + gs / 2, currY); else ctx.lineTo(currX + gs / 2, currY);
            }
            ctx.stroke();
            ctx.strokeStyle = palette.secondary; ctx.shadowColor = palette.secondary;
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) {
                const prog = i / 60; const currY = obs.y - prog * fh;
                const currX = cx + (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (w * 0.22);
                if (i === 0) ctx.moveTo(currX - igs / 2, currY); else ctx.lineTo(currX - igs / 2, currY);
            }
            ctx.stroke();
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) {
                const prog = i / 60; const currY = obs.y - prog * fh;
                const currX = cx + (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (w * 0.22);
                if (i === 0) ctx.moveTo(currX + igs / 2, currY); else ctx.lineTo(currX + igs / 2, currY);
            }
            ctx.stroke();
        } else if (obs.type === 'FUNNEL') {
            const fh = obs.height!; const gc = cx + (obs.gapCenter || 0); const sG = 210; const lG = w - 60;
            const os = obs.funnelDir === 'IN' ? lG : sG; const oe = obs.funnelDir === 'IN' ? sG : lG;
            const is = os - (LANE_WIDTH * GAP_EXPANSION); const ie = oe - (LANE_WIDTH * GAP_EXPANSION);
            ctx.strokeStyle = palette.primary; ctx.shadowColor = palette.primary;
            ctx.beginPath(); ctx.moveTo(gc - os/2, obs.y); ctx.lineTo(gc - oe/2, obs.y - fh); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gc + os/2, obs.y); ctx.lineTo(gc + oe/2, obs.y - fh); ctx.stroke();
            ctx.strokeStyle = palette.secondary; ctx.shadowColor = palette.secondary;
            ctx.beginPath(); ctx.moveTo(gc - is/2, obs.y); ctx.lineTo(gc - ie/2, obs.y - fh); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gc + is/2, obs.y); ctx.lineTo(gc + ie/2, obs.y - fh); ctx.stroke();
        } else if (obs.type === 'NEEDLE' || obs.type === 'WEAVER') {
            const gc = cx + (obs.type === 'WEAVER' ? Math.sin(obs.y / 200) * (w * 0.3) : (obs.gapCenter || 0));
            const gs = obs.gapSize!; ctx.strokeStyle = palette.primary; ctx.shadowColor = palette.primary;
            ctx.beginPath(); ctx.moveTo(0, obs.y); ctx.lineTo(gc - gs/2, obs.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gc + gs/2, obs.y); ctx.lineTo(w, obs.y); ctx.stroke();
        } else if (obs.type === 'TWINS') {
            const lc = cx + obs.leftGapCenter!; const rc = cx + obs.rightGapCenter!; const gs = obs.gapSize!;
            ctx.strokeStyle = palette.primary; ctx.shadowColor = palette.primary;
            ctx.beginPath(); ctx.moveTo(0, obs.y); ctx.lineTo(lc - gs/2, obs.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rc + gs/2, obs.y); ctx.lineTo(w, obs.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(lc + gs/2, obs.y); ctx.lineTo(rc - gs/2, obs.y); ctx.stroke();
        } else if (obs.type === 'DIAMOND') {
            const gc = cx + (obs.gapCenter || 0); const gs = obs.gapSize || 140;
            ctx.strokeStyle = palette.secondary; ctx.shadowColor = palette.secondary;
            ctx.beginPath(); ctx.moveTo(gc, obs.y - gs/2); ctx.lineTo(gc + gs/2, obs.y); ctx.lineTo(gc, obs.y + gs/2); ctx.lineTo(gc - gs/2, obs.y); ctx.closePath(); ctx.stroke();
        } else if (obs.type === 'SPLITTER') {
            const gc = cx + (obs.gapCenter || 0); const gs = obs.gapSize || 165;
            const hBlock = 50; 
            ctx.save();
            ctx.strokeStyle = palette.primary; ctx.shadowColor = palette.primary; ctx.shadowBlur = 25;
            ctx.fillStyle = isMirror ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 45, 85, 0.3)';
            ctx.beginPath();
            ctx.moveTo(gc - gs/2, obs.y - hBlock/2);
            ctx.lineTo(gc + gs/2, obs.y - hBlock/2);
            ctx.lineTo(gc + gs/2 + 20, obs.y);
            ctx.lineTo(gc + gs/2, obs.y + hBlock/2);
            ctx.lineTo(gc - gs/2, obs.y + hBlock/2);
            ctx.lineTo(gc - gs/2 - 20, obs.y);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.lineWidth = 1; ctx.strokeStyle = palette.secondary; ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.moveTo(gc - gs/2 - 8, obs.y); ctx.lineTo(gc + gs/2 + 8, obs.y); ctx.stroke();
            ctx.restore();
        } else if (obs.type === 'PENDULUM') {
            const gc = cx + (obs.gapCenter || 0);
            const pivotY = obs.y - 300;
            const length = 320;
            const orbX = gc + Math.sin(obs.angle || 0) * length;
            const orbY = pivotY + Math.cos(obs.angle || 0) * length;
            const orbR = obs.gapSize || 60;
            ctx.save();
            ctx.strokeStyle = isMirror ? 'rgba(0, 255, 204, 0.4)' : 'rgba(255, 45, 85, 0.4)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(gc, pivotY); ctx.lineTo(orbX, orbY); ctx.stroke();
            ctx.strokeStyle = palette.secondary; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
            ctx.beginPath(); ctx.moveTo(gc, pivotY); ctx.lineTo(orbX, orbY); ctx.stroke();
            ctx.globalAlpha = 1.0; ctx.shadowBlur = 30; ctx.shadowColor = palette.primary;
            ctx.fillStyle = palette.primary;
            ctx.beginPath(); ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = palette.secondary; ctx.lineWidth = 2; ctx.beginPath();
            ctx.arc(orbX, orbY, orbR * 0.7, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        } else if (obs.type === 'MIRROR_PORTAL') {
            const gc = cx + (obs.gapCenter || 0);
            const rw = MIRROR_PORTAL_WIDTH;
            const rh = MIRROR_PORTAL_HEIGHT;
            
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = COLORS.MIRROR_PRIMARY;
            ctx.shadowColor = COLORS.MIRROR_PRIMARY;
            ctx.shadowBlur = 20;
            
            // Draw Main Square Frame (Bo góc nhẹ)
            const radius = 12;
            ctx.beginPath();
            ctx.moveTo(gc - rw/2 + radius, obs.y - rh/2);
            ctx.lineTo(gc + rw/2 - radius, obs.y - rh/2);
            ctx.quadraticCurveTo(gc + rw/2, obs.y - rh/2, gc + rw/2, obs.y - rh/2 + radius);
            ctx.lineTo(gc + rw/2, obs.y + rh/2 - radius);
            ctx.quadraticCurveTo(gc + rw/2, obs.y + rh/2, gc + rw/2 - radius, obs.y + rh/2);
            ctx.lineTo(gc - rw/2 + radius, obs.y + rh/2);
            ctx.quadraticCurveTo(gc - rw/2, obs.y + rh/2, gc - rw/2, obs.y + rh/2 - radius);
            ctx.lineTo(gc - rw/2, obs.y - rh/2 + radius);
            ctx.quadraticCurveTo(gc - rw/2, obs.y - rh/2, gc - rw/2 + radius, obs.y - rh/2);
            ctx.closePath();
            ctx.stroke();

            // Background Fill
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = COLORS.MIRROR_PRIMARY;
            ctx.fill();

            // Center Circle Energy (Mockup Style)
            ctx.globalAlpha = 1.0;
            const p = Math.abs(Math.sin(state.gameTime / 300));
            ctx.strokeStyle = COLORS.MIRROR_PRIMARY;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(gc, obs.y - 5, 20 + p * 5, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.globalAlpha = 0.4 + p * 0.4;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(gc, obs.y - 5, 12, 0, Math.PI * 2);
            ctx.stroke();

            // Text inside Square
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = COLORS.MIRROR_PRIMARY;
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 5;
            ctx.fillText("ENTER_GATE", gc, obs.y + rh/2 - 20);
            
            ctx.restore();
        }

        if (obs.particles) {
          obs.particles.forEach(p => {
            if (!p.collected) {
              const px = cx + (obs.type === 'WEAVER' ? Math.sin(obs.y / 200) * (w * 0.3) : 0) + p.x;
              ctx.save(); ctx.fillStyle = isMirror ? COLORS.MIRROR_PRIMARY : COLORS.GOLD; 
              ctx.shadowBlur = 10; ctx.shadowColor = isMirror ? COLORS.MIRROR_PRIMARY : COLORS.GOLD;
              ctx.beginPath(); ctx.arc(px, obs.y + p.yOffset, 3.5, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, obs.y + p.yOffset, 1.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            }
          });
        }
        ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;
      });

      const b1X = cx + state.x - state.spacing; const b2X = cx + state.x + state.spacing; const pY = h * 0.82;
      ctx.save();
      const grad = ctx.createLinearGradient(b1X, pY, b2X, pY);
      grad.addColorStop(0, palette.ball1); grad.addColorStop(1, palette.ball2);
      ctx.strokeStyle = grad; ctx.lineWidth = 3; ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.moveTo(b1X, pY); ctx.lineTo(b2X, pY); ctx.stroke(); ctx.restore();

      const drawBall = (x: number, y: number, color: string) => {
        ctx.save(); 
        if (isMirror) ctx.globalAlpha = 0.5 + Math.sin(state.gameTime / 100) * 0.2;
        ctx.shadowBlur = 25; ctx.shadowColor = color;
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, PHYSICS.BALL_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = palette.secondary; ctx.beginPath(); ctx.arc(x, y, PHYSICS.BALL_RADIUS * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      };
      drawBall(b1X, pY, palette.ball1); drawBall(b2X, pY, palette.ball2);

      state.floatingTexts.forEach(ft => {
        ctx.save(); ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color;
        ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'; ctx.shadowBlur = 10; ctx.shadowColor = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y); ctx.restore();
      });
      ctx.restore();

      if (state.glitchIntensity > 0) {
        ctx.save();
        ctx.globalAlpha = state.glitchIntensity * 0.4;
        ctx.fillStyle = palette.primary;
        for (let i = 0; i < 15; i++) {
           const gx = Math.random() * w; const gy = Math.random() * h;
           const gw = Math.random() * w * 0.4; const gh = Math.random() * 20;
           ctx.fillRect(gx - gw/2, gy - gh/2, gw, gh);
        }
        ctx.restore();
      }
    };

    animationFrame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animationFrame); window.removeEventListener('resize', handleResize); };
  }, [onGameOver, handleResize, showTutorial]);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    gameStateRef.current.isTouching = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    gameStateRef.current.touchStartX = clientX; gameStateRef.current.touchStartY = clientY;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!gameStateRef.current.isTouching) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    gameStateRef.current.inputX = clientX - gameStateRef.current.touchStartX;
    gameStateRef.current.inputY = -(clientY - gameStateRef.current.touchStartY); 
  };

  const handleTouchEnd = () => {
    gameStateRef.current.isTouching = false;
    gameStateRef.current.inputX = 0; gameStateRef.current.inputY = 0;
  };

  return (
    <div ref={containerRef} 
      className={`relative w-full h-full overflow-hidden transition-colors duration-1000 ${isMirrorActive ? 'bg-[#050a10]' : 'bg-black'}`}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart} onMouseMove={handleTouchMove} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}>
      
      <canvas ref={canvasRef} className="w-full h-full" />
      
      <div className="absolute top-0 left-0 w-full p-6 flex flex-col pointer-events-none">
        {/* TOP HUD */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <span className={`text-[10px] tracking-widest uppercase font-bold ${isMirrorActive ? 'text-white/40' : 'text-cyan/60'}`}>Flow_Distance</span>
            <h2 className={`text-2xl font-bold font-mono leading-none tracking-tight text-white`}>{score.toString().padStart(6, '0')}</h2>
          </div>

          {/* MIRROR SHARD HUD */}
          {isMirrorActive && (
            <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center">
               <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                 <div className="size-3 bg-cyan rounded-sm rotate-45 animate-pulse shadow-[0_0_10px_#0ddff2]" />
                 <span className="text-xl font-black font-mono text-white leading-none">{mirrorShards}</span>
                 <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Shards</span>
               </div>
               <span className="text-[8px] font-bold text-cyan uppercase tracking-[0.4em] mt-1 animate-pulse">Syncing Bounty...</span>
            </div>
          )}

          <div className="flex flex-col items-end text-right">
             {isMirrorActive && (
               <div className="flex flex-col mb-2 items-end">
                 <span className="text-[10px] text-white font-black animate-pulse uppercase tracking-widest">Mirror World x2</span>
                 <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden mt-1 border border-white/10">
                   <div className="h-full bg-cyan transition-all duration-100" style={{ width: `${(gameStateRef.current.mirrorTime / MIRROR_DURATION) * 100}%` }} />
                 </div>
               </div>
             )}
             <span className={`text-[10px] tracking-widest uppercase font-bold ${isMirrorActive ? 'text-white/40' : 'text-pink/60'}`}>Stage</span>
             <h2 className={`text-lg font-bold font-mono uppercase text-white`}>Level {gameStateRef.current.currentStep + 1}</h2>
          </div>
        </div>
        
        {/* CENTER STATS */}
        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end px-1">
              <p className={`${isMirrorActive ? 'text-white/80' : 'text-cyan'} text-[10px] font-bold tracking-[0.2em] leading-none uppercase`}>Stability</p>
              <p className="text-xs font-mono leading-none text-white">{stability}%</p>
            </div>
            <div className={`h-2 w-full rounded-full overflow-hidden border border-white/5 bg-white/10`}>
              <div className={`h-full transition-all duration-300 ${stability < 30 ? 'animate-pulse bg-pink' : (isMirrorActive ? 'bg-white/20' : 'bg-cyan')}`} style={{ width: `${stability}%` }} />
            </div>
          </div>
          
          <div className={`flex flex-col gap-1 transition-all duration-500 ${isSqueezingHUD ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <div className="flex justify-between items-end px-1">
              <p className="text-gold text-[10px] font-bold tracking-[0.2em] leading-none uppercase">Sync Resonance</p>
              <p className="text-xs font-mono leading-none text-white">{resonanceHUD}%</p>
            </div>
            <div className={`h-1.5 w-full rounded-full overflow-hidden border border-white/5 bg-white/10`}>
              <div 
                className={`h-full transition-all duration-100 bg-gradient-to-r from-cyan via-gold to-pink shadow-[0_0_10px_#ffcc00] ${resonanceHUD >= 90 ? 'animate-pulse' : ''}`} 
                style={{ width: `${resonanceHUD}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <h1 className="text-9xl font-black italic drop-shadow-xl animate-ping text-white">{countdown}</h1>
        </div>
      )}

      {showTutorial && (
        <div 
          onClick={() => setShowTutorial(false)}
          className="absolute inset-0 flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl transition-opacity duration-700 pointer-events-auto z-50"
        >
          <style>{`
            @keyframes slide { 0%, 100% { transform: translateX(-30px); } 50% { transform: translateX(30px); } }
            @keyframes stretch-contract { 0%, 100% { width: 40px; } 50% { width: 110px; } 75% { width: 20px; } }
            @keyframes mirror-portal-demo { 
              0% { transform: translateY(40px); opacity: 0; } 
              20% { opacity: 1; }
              50% { transform: translateY(0px); }
              80% { opacity: 1; }
              100% { transform: translateY(-40px); opacity: 0; } 
            }
            @keyframes portal-pulse { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.3); opacity: 0.8; } }
            @keyframes finger-slide { 0%, 100% { transform: translate(-20px, 10px); } 50% { transform: translate(20px, 10px); } }
            @keyframes finger-up-down { 0%, 100% { transform: translateY(15px); } 50% { transform: translateY(-15px); } }
            @keyframes recenter-demo { 0% { transform: translateX(40px); } 100% { transform: translateX(0px); } }
            @keyframes loading-bar { 0% { width: 0%; } 100% { width: 100%; } }
          `}</style>
          
          <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-[2.5rem] p-8 space-y-12 relative shadow-2xl overflow-hidden">
            <div className="text-center space-y-2">
              <h3 className="text-cyan text-xs font-bold tracking-[0.6em] uppercase animate-pulse">Neural Interface Link</h3>
              <p className="text-[10px] text-white/30 tracking-widest uppercase italic">Initializing sync protocol...</p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-24 w-full bg-[#1a1a1a] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  <div className="flex items-center space-x-2 animate-[slide_3s_infinite_ease-in-out]">
                    <div className="size-3 rounded-full bg-cyan shadow-[0_0_8px_#0ddff2]" />
                    <div className="w-8 h-[2px] bg-white/20" />
                    <div className="size-3 rounded-full bg-pink shadow-[0_0_8px_#ff2d55]" />
                  </div>
                  <span className="material-symbols-outlined absolute text-white/40 text-lg animate-[finger-slide_3s_infinite_ease-in-out]">touch_app</span>
                </div>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">MOVE</span>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="h-24 w-full bg-[#1a1a1a] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  <div className="flex items-center justify-between animate-[stretch-contract_4s_infinite_ease-in-out] px-2">
                    <div className="size-3 rounded-full bg-cyan shadow-[0_0_8px_#0ddff2]" />
                    <div className="flex-1 h-[1px] bg-white/20 mx-1" />
                    <div className="size-3 rounded-full bg-pink shadow-[0_0_8px_#ff2d55]" />
                  </div>
                  <span className="material-symbols-outlined absolute text-white/40 text-lg animate-[finger-up-down_4s_infinite_ease-in-out]">touch_app</span>
                </div>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center">STRETCH & CONTRACT</span>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="h-24 w-full bg-[#1a1a1a] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  {/* Square with Circle Design (Synchronized with Gameplay) */}
                  <div className="size-16 rounded-xl border-2 border-cyan/40 flex flex-col items-center justify-center relative">
                    <div className="size-6 rounded-full border border-cyan shadow-[0_0_15px_#0ddff2] animate-[portal-pulse_1.5s_infinite]" />
                    <div className="absolute bottom-1.5 text-[7px] font-black text-cyan uppercase tracking-tighter">Enter_Gate</div>
                  </div>
                  {/* Floating Balls Passing Through */}
                  <div className="absolute flex items-center space-x-1 animate-[mirror-portal-demo_3s_infinite_ease-in-out]">
                    <div className="size-1.5 rounded-full bg-cyan" />
                    <div className="size-1.5 rounded-full bg-pink" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">MIRROR WORLD</span>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="h-24 w-full bg-[#1a1a1a] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  <div className="flex items-center space-x-2 animate-[recenter-demo_2s_infinite_cubic-bezier(0.175,0.885,0.32,1.275)]">
                    <div className="size-3 rounded-full bg-cyan shadow-[0_0_5px_#0ddff2]" />
                    <div className="size-3 rounded-full bg-pink shadow-[0_0_5px_#ff2d55]" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center leading-tight">RELEASE TO RECENTER</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col items-center gap-6">
               <div className="h-[2px] w-full bg-white/5 rounded-full relative overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-transparent via-cyan to-transparent animate-[loading-bar_15s_linear_forwards]"></div>
               </div>
               <div className="flex items-center gap-2">
                 <div className="size-2 rounded-full bg-cyan animate-ping" />
                 <span className="text-[10px] text-white font-bold uppercase tracking-[0.4em] opacity-60">READY // TAP TO START</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
