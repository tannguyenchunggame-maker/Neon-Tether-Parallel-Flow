
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PHYSICS, COLORS, INITIAL_STABILITY } from '../constants';
import { Obstacle } from '../types';

interface GameViewProps {
  onGameOver: (score: number) => void;
  skipTutorial?: boolean;
}

export default function GameView({ onGameOver, skipTutorial = false }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [stability, setStability] = useState(INITIAL_STABILITY);
  const [showTutorial, setShowTutorial] = useState(!skipTutorial);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const NEEDLE_GAP = 110;

  const gameStateRef = useRef({
    x: 0,
    spacing: PHYSICS.REST_SPACING,
    velX: 0,
    velSpacing: 0,
    obstacles: [] as Obstacle[],
    distance: 0,
    stability: INITIAL_STABILITY,
    lastTime: 0,
    isPaused: false,
    inputX: 0,
    inputY: 0,
    isTouching: false,
    canvasWidth: 0,
    canvasHeight: 0,
    shake: 0,
    touchStartX: 0,
    touchStartY: 0,
    gameTime: 0,
    currentStep: 0,
    isCountingDown: false,
    isReady: false 
  });

  const generateObstacle = (y: number): Obstacle => {
    const state = gameStateRef.current;
    const w = state.canvasWidth || window.innerWidth;
    const time = state.gameTime / 1000;
    
    // Determine pool of obstacles
    let types: Obstacle['type'][] = ['NEEDLE', 'TWINS'];
    if (time > 10) types.push('ZIGZAG', 'DIAMOND');
    if (time > 25) types.push('FUNNEL');
    if (time > 45) types.push('SPLITTER', 'WEAVER');

    const type = types[Math.floor(Math.random() * types.length)];
    
    let obs: Obstacle = {
      id: Date.now() + Math.random(),
      y: y,
      type: type,
      width: w,
      passed: false,
      timer: 0
    };

    if (type === 'NEEDLE') {
      obs.gapCenter = (Math.random() - 0.5) * (w * 0.5);
      obs.gapSize = NEEDLE_GAP;
    } else if (type === 'TWINS') {
      const offset = (Math.random() - 0.5) * (w * 0.3);
      obs.leftGapCenter = offset - 85;
      obs.rightGapCenter = offset + 85;
      obs.gapSize = 50; 
    } else if (type === 'ZIGZAG') {
      obs.height = 1400; 
      obs.gapSize = 180; 
      obs.gapCenter = (Math.random() - 0.5) * (w * 0.1);
    } else if (type === 'FUNNEL') {
      obs.height = 1000;
      obs.gapCenter = 0; 
      obs.funnelDir = Math.random() > 0.5 ? 'IN' : 'OUT';
    } else if (type === 'DIAMOND') {
      obs.gapSize = 120; 
      obs.gapCenter = (Math.random() - 0.5) * (w * 0.3);
    } else if (type === 'SPLITTER') {
      obs.gapSize = w * 0.8; 
    } else if (type === 'WEAVER') {
      obs.gapCenter = 0;
      obs.gapSize = 115;
    }

    return obs;
  };

  const handleResize = useCallback(() => {
    if (containerRef.current && canvasRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      gameStateRef.current.canvasWidth = width;
      gameStateRef.current.canvasHeight = height;
    }
  }, []);

  useEffect(() => {
    if (!showTutorial && !gameStateRef.current.isReady && !gameStateRef.current.isCountingDown) {
      gameStateRef.current.isCountingDown = true;
      let count = 3;
      setCountdown(count);
      const timer = setInterval(() => {
        count--;
        if (count > 0) setCountdown(count);
        else {
          setCountdown(null);
          gameStateRef.current.isReady = true;
          gameStateRef.current.isCountingDown = false;
          let currentY = -600;
          for (let i = 0; i < 5; i++) {
            const obs = generateObstacle(currentY);
            gameStateRef.current.obstacles.push(obs);
            currentY -= (obs.height || 0) + 900; 
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
        update(dt);
        draw();
      }
      animationFrame = requestAnimationFrame(loop);
    };

    const update = (dt: number) => {
      const state = gameStateRef.current;
      
      const targetSpacing = state.isTouching 
        ? Math.max(PHYSICS.MIN_SPACING, Math.min(PHYSICS.MAX_SPACING, PHYSICS.REST_SPACING + state.inputY * 0.8))
        : PHYSICS.REST_SPACING;
      state.velSpacing = (state.velSpacing + (targetSpacing - state.spacing) * PHYSICS.SPRING_K) * PHYSICS.DAMPING;
      state.spacing += state.velSpacing * dt;

      const targetX = state.isTouching ? state.inputX : 0;
      state.velX = (state.velX + (targetX - state.x) * (state.isTouching ? 0.05 : PHYSICS.SNAP_STRENGTH)) * PHYSICS.DAMPING;
      state.x += state.velX * dt;

      if (!state.isReady) return;
      state.gameTime += 16 * dt;

      state.currentStep = Math.floor(state.gameTime / 15000);
      const scrollSpeed = Math.min(10.0, 4.0 + (state.currentStep * 0.45));
      state.distance += scrollSpeed * dt;
      setScore(Math.floor(state.distance / 10));

      const playerY = state.canvasHeight * 0.82;
      const b1X = state.x - state.spacing;
      const b2X = state.x + state.spacing;

      state.obstacles.forEach(obs => {
        obs.y += scrollSpeed * dt;
        if (obs.timer !== undefined) obs.timer += dt;

        let currentlyColliding = false;

        if (obs.type === 'ZIGZAG' && playerY < obs.y && playerY > obs.y - obs.height!) {
            const progress = (obs.y - playerY) / obs.height!;
            const zigzagX = (obs.gapCenter || 0) + Math.sin(progress * Math.PI * 2) * (state.canvasWidth * 0.25);
            const inL = Math.abs(b1X - zigzagX) < obs.gapSize! / 2;
            const inR = Math.abs(b2X - zigzagX) < obs.gapSize! / 2;
            if (!inL || !inR) currentlyColliding = true;
        } else if (obs.type === 'FUNNEL' && playerY < obs.y && playerY > obs.y - obs.height!) {
            const progress = (obs.y - playerY) / obs.height!;
            const smallGap = NEEDLE_GAP;
            const largeGap = state.canvasWidth - 140; // Approx NEEDLE_GAP margin per side as requested
            
            const currentGap = obs.funnelDir === 'IN' 
              ? largeGap - (progress * (largeGap - smallGap)) 
              : smallGap + (progress * (largeGap - smallGap));
            
            const gc = obs.gapCenter || 0;
            const inL = Math.abs(b1X - gc) < currentGap / 2;
            const inR = Math.abs(b2X - gc) < currentGap / 2;
            if (!inL || !inR) currentlyColliding = true;
        }

        const threshold = 25;
        const isNearGate = obs.y > playerY - threshold && obs.y < playerY + threshold;
        
        if (isNearGate && !obs.passed) {
            if (obs.type === 'NEEDLE' || obs.type === 'WEAVER') {
              const gc = obs.type === 'WEAVER' ? Math.sin(obs.y / 200) * (state.canvasWidth * 0.3) : (obs.gapCenter || 0);
              const inL = Math.abs(b1X - gc) < obs.gapSize! / 2;
              const inR = Math.abs(b2X - gc) < obs.gapSize! / 2;
              if (!inL || !inR) currentlyColliding = true;
            } else if (obs.type === 'TWINS') {
              const inL = Math.abs(b1X - (obs.leftGapCenter || 0)) < obs.gapSize! / 2;
              const inR = Math.abs(b2X - (obs.rightGapCenter || 0)) < obs.gapSize! / 2;
              if (!inL || !inR) currentlyColliding = true;
            } else if (obs.type === 'DIAMOND') {
              if (Math.abs(b1X - obs.gapCenter!) < obs.gapSize! / 2 || Math.abs(b2X - obs.gapCenter!) < obs.gapSize! / 2) currentlyColliding = true;
            } else if (obs.type === 'SPLITTER') {
              if (Math.abs(b1X) < 22 || Math.abs(b2X) < 22) currentlyColliding = true;
            }
        }

        if (currentlyColliding) {
          state.stability -= 1.8; 
          state.shake = 10;
          if (state.stability <= 0) onGameOver(Math.floor(state.distance / 10));
        }

        if (obs.y > playerY + 50 && !obs.passed) {
          obs.passed = true;
          state.stability = Math.min(100, state.stability + 3);
        }
      });

      state.obstacles = state.obstacles.filter(o => o.y < state.canvasHeight + 1500);
      if (state.obstacles.length < 5) {
        let minY = 0;
        state.obstacles.forEach(o => { 
          const topY = o.y - (o.height || 0);
          if (topY < minY) minY = topY; 
        });
        const nextObs = generateObstacle(minY - 900);
        state.obstacles.push(nextObs);
      }

      setStability(Math.floor(Math.max(0, state.stability)));
      if (state.shake > 0) state.shake *= 0.85;
    };

    const draw = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const state = gameStateRef.current;
      const w = state.canvasWidth;
      const h = state.canvasHeight;
      const cx = w / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      if (state.shake > 1) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for(let x=0; x<w; x+=50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      const gridY = (state.distance % 50);
      for(let y=gridY; y<h; y+=50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

      state.obstacles.forEach(obs => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;

        if (obs.type === 'ZIGZAG') {
            const fh = obs.height!;
            const gs = obs.gapSize!;
            
            // Draw left edge
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) {
                const prog = i / 40;
                const currY = obs.y - prog * fh;
                const currX = cx + (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (w * 0.25);
                if (i === 0) ctx.moveTo(currX - gs / 2, currY);
                else ctx.lineTo(currX - gs / 2, currY);
            }
            ctx.stroke();

            // Draw right edge
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) {
                const prog = i / 40;
                const currY = obs.y - prog * fh;
                const currX = cx + (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (w * 0.25);
                if (i === 0) ctx.moveTo(currX + gs / 2, currY);
                else ctx.lineTo(currX + gs / 2, currY);
            }
            ctx.stroke();
            
            // Subtle fill
            ctx.fillStyle = 'rgba(13, 223, 242, 0.04)';
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) {
                const prog = i / 40;
                const currY = obs.y - prog * fh;
                const currX = cx + (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (w * 0.25);
                if (i === 0) ctx.moveTo(currX - gs / 2, currY);
                else ctx.lineTo(currX - gs / 2, currY);
            }
            for (let i = 40; i >= 0; i--) {
                const prog = i / 40;
                const currY = obs.y - prog * fh;
                const currX = cx + (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (w * 0.25);
                ctx.lineTo(currX + gs / 2, currY);
            }
            ctx.fill();
        } else if (obs.type === 'FUNNEL') {
            const fh = obs.height!;
            const gc = cx + (obs.gapCenter || 0);
            
            const smallGap = NEEDLE_GAP;
            const largeGap = w - 140; 

            const startGap = obs.funnelDir === 'IN' ? largeGap : smallGap;
            const endGap = obs.funnelDir === 'IN' ? smallGap : largeGap;

            // Left edge
            ctx.beginPath();
            ctx.moveTo(gc - startGap/2, obs.y); 
            ctx.lineTo(gc - endGap/2, obs.y - fh);
            ctx.stroke();

            // Right edge
            ctx.beginPath();
            ctx.moveTo(gc + startGap/2, obs.y); 
            ctx.lineTo(gc + endGap/2, obs.y - fh);
            ctx.stroke();
            
            // Fill
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.beginPath();
            ctx.moveTo(gc - startGap/2, obs.y);
            ctx.lineTo(gc - endGap/2, obs.y - fh);
            ctx.lineTo(gc + endGap/2, obs.y - fh);
            ctx.lineTo(gc + startGap/2, obs.y);
            ctx.fill();
        } else if (obs.type === 'DIAMOND') {
            const sz = obs.gapSize!;
            ctx.save();
            ctx.translate(cx + obs.gapCenter!, obs.y);
            ctx.rotate(Math.PI / 4);
            ctx.strokeStyle = COLORS.PINK;
            ctx.strokeRect(-sz/2, -sz/2, sz, sz);
            ctx.fillStyle = 'rgba(255, 45, 85, 0.15)';
            ctx.fillRect(-sz/2, -sz/2, sz, sz);
            ctx.restore();
        } else if (obs.type === 'NEEDLE' || obs.type === 'WEAVER') {
            const gc = cx + (obs.type === 'WEAVER' ? Math.sin(obs.y / 200) * (w * 0.3) : (obs.gapCenter || 0));
            const gs = obs.gapSize!;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(0, obs.y - 6, gc - gs/2, 12);
            ctx.fillRect(gc + gs/2, obs.y - 6, w, 12);
        } else if (obs.type === 'TWINS') {
            const lc = cx + obs.leftGapCenter!;
            const rc = cx + obs.rightGapCenter!;
            const gs = obs.gapSize!;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(0, obs.y - 6, lc - gs/2, 12);
            ctx.fillRect(lc + gs/2, obs.y - 6, rc - lc - gs, 12);
            ctx.fillRect(rc + gs/2, obs.y - 6, w, 12);
        } else if (obs.type === 'SPLITTER') {
            ctx.fillStyle = COLORS.PINK;
            ctx.fillRect(cx - 6, obs.y - 250, 12, 500);
        }
      });

      const cxPlayer = w/2 + state.x;
      const b1X = cxPlayer - state.spacing;
      const b2X = cxPlayer + state.spacing;
      const pY = h * 0.82;
      
      const grad = ctx.createLinearGradient(b1X, pY, b2X, pY);
      grad.addColorStop(0, COLORS.CYAN);
      grad.addColorStop(1, COLORS.PINK);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(b1X, pY); ctx.lineTo(b2X, pY); ctx.stroke();

      const drawBall = (x: number, y: number, color: string) => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, PHYSICS.BALL_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      drawBall(b1X, pY, COLORS.CYAN);
      drawBall(b2X, pY, COLORS.PINK);

      ctx.restore();
    };

    animationFrame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [onGameOver, handleResize, showTutorial]);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    gameStateRef.current.isTouching = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    gameStateRef.current.touchStartX = clientX;
    gameStateRef.current.touchStartY = clientY;
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
    gameStateRef.current.inputX = 0;
    gameStateRef.current.inputY = 0;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart} onMouseMove={handleTouchMove} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      
      <div className="absolute top-0 left-0 w-full p-6 flex flex-col pointer-events-none">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-widest text-cyan/60 uppercase font-bold">Flow_Distance</span>
            <h2 className="text-white text-2xl font-bold font-mono leading-none tracking-tight">
              {score.toString().padStart(6, '0')}
            </h2>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] tracking-widest text-pink/60 uppercase font-bold">Stage</span>
             <h2 className="text-white text-lg font-bold font-mono uppercase">
               Level {gameStateRef.current.currentStep + 1}
             </h2>
          </div>
        </div>

        <div className="flex flex-col gap-1 w-full max-w-xs mx-auto">
          <div className="flex justify-between items-end px-1">
            <p className="text-cyan text-[10px] font-bold tracking-[0.2em] leading-none uppercase">Stability</p>
            <p className="text-white text-xs font-mono leading-none">{stability}%</p>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-cyan shadow-[0_0_10px_#0ddff2]" style={{ width: `${stability}%` }} />
          </div>
        </div>
      </div>

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <h1 className="text-9xl font-black italic text-cyan drop-shadow-[0_0_30px_#0ddff2] animate-ping">
            {countdown}
          </h1>
        </div>
      )}

      {showTutorial && (
        <div 
          onClick={() => setShowTutorial(false)}
          className="absolute inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-opacity duration-700 pointer-events-auto z-50"
        >
          <style>{`
            @keyframes slide { 0%, 100% { transform: translateX(-30px); } 50% { transform: translateX(30px); } }
            @keyframes stretch { 0%, 100% { width: 40px; } 50% { width: 100px; } }
            @keyframes contract { 0%, 100% { width: 100px; } 50% { width: 30px; } }
            @keyframes finger-slide { 0%, 100% { transform: translate(-20px, 10px); } 50% { transform: translate(20px, 10px); } }
            @keyframes finger-up { 0%, 100% { transform: translateY(20px); } 50% { transform: translateY(-20px); } }
            @keyframes finger-down { 0%, 100% { transform: translateY(-20px); } 50% { transform: translateY(20px); } }
          `}</style>
          <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-12 relative shadow-2xl">
            <div className="text-center space-y-2">
              <h3 className="text-cyan text-xs font-bold tracking-[0.6em] uppercase animate-pulse">Neural Interface Link</h3>
              <p className="text-[10px] text-white/30 tracking-widest uppercase italic">Tap anywhere to sync</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-full bg-white/5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
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
                <div className="h-20 w-full bg-white/5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  <div className="flex items-center justify-between animate-[stretch_3s_infinite_ease-in-out] px-2">
                    <div className="size-3 rounded-full bg-cyan shadow-[0_0_8px_#0ddff2]" />
                    <div className="flex-1 h-[1px] bg-white/20 mx-1" />
                    <div className="size-3 rounded-full bg-pink shadow-[0_0_8px_#ff2d55]" />
                  </div>
                  <span className="material-symbols-outlined absolute text-white/40 text-lg animate-[finger-up_3s_infinite_ease-in-out]">touch_app</span>
                </div>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">STRETCH</span>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-full bg-white/5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  <div className="flex items-center justify-center animate-[contract_3s_infinite_ease-in-out]">
                    <div className="size-3 rounded-full bg-cyan shadow-[0_0_8px_#0ddff2]" />
                    <div className="h-[1px] bg-white/20 mx-1 min-w-[10px]" />
                    <div className="size-3 rounded-full bg-pink shadow-[0_0_8px_#ff2d55]" />
                  </div>
                  <span className="material-symbols-outlined absolute text-white/40 text-lg animate-[finger-down_3s_infinite_ease-in-out]">touch_app</span>
                </div>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">CONTRACT</span>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-full bg-white/5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  <div className="flex items-center space-x-2">
                    <div className="size-3 rounded-full bg-cyan/80" />
                    <div className="size-3 rounded-full bg-pink/80" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center leading-tight">RELEASE TO RECENTER</span>
              </div>
            </div>
            <div className="pt-4 flex flex-col items-center gap-6">
               <div className="h-[2px] w-full bg-white/5 rounded-full relative overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-transparent via-cyan to-transparent animate-[loading_10s_linear]" style={{ animationDuration: '10s' }}></div>
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
