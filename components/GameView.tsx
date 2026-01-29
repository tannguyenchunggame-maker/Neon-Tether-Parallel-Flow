
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PHYSICS, COLORS, INITIAL_STABILITY, STABILITY_LOSS_MINOR, STABILITY_LOSS_MAJOR, STABILITY_GAIN_PERFECT } from '../constants';
import { Obstacle } from '../types';

interface GameViewProps {
  onGameOver: (score: number) => void;
  skipTutorial?: boolean;
}

const GameView: React.FC<GameViewProps> = ({ onGameOver, skipTutorial = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [stability, setStability] = useState(INITIAL_STABILITY);
  const [isMirror, setIsMirror] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!skipTutorial);
  const [countdown, setCountdown] = useState<number | null>(null);
  
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
    mirrorMode: false,
    mirrorTimeout: 0,
    currentStep: 0,
    isCountingDown: false,
    isReady: false // Always start as false to allow countdown
  });

  const generateObstacle = (y: number): Obstacle => {
    const state = gameStateRef.current;
    const w = state.canvasWidth || window.innerWidth;
    const time = state.gameTime / 1000;
    
    let types: Obstacle['type'][] = ['NEEDLE', 'TWINS'];
    if (time > 15) types.push('SPLITTER', 'WEAVER');
    if (time > 90) types.push('PENDULUM', 'PHANTOM', 'PORTAL');

    const type = types[Math.floor(Math.random() * types.length)];
    
    let obs: Obstacle = {
      id: Date.now() + Math.random(),
      y: y,
      type: type,
      width: w,
      passed: false
    };

    if (type === 'NEEDLE') {
      obs.gapCenter = (Math.random() - 0.5) * (w * 0.6);
      obs.gapSize = 85;
    } else if (type === 'TWINS') {
      const holeDistance = 100 + Math.random() * 150; 
      obs.leftGapCenter = -holeDistance / 2;
      obs.rightGapCenter = holeDistance / 2;
      obs.gapSize = 80;
    } else if (type === 'SPLITTER') {
      obs.gapSize = w * 0.8; 
    } else if (type === 'WEAVER') {
      obs.gapCenter = Math.sin(y / 200) * (w * 0.3);
      obs.gapSize = 90;
    } else if (type === 'PENDULUM') {
      obs.gapCenter = 0;
      obs.gapSize = 180;
      obs.angle = 0;
      obs.rotSpeed = 0.05 + Math.random() * 0.05;
    } else if (type === 'PHANTOM') {
      obs.gapCenter = (Math.random() - 0.5) * (w * 0.5);
      obs.gapSize = 80;
      obs.isFake = Math.random() > 0.5;
      obs.glitchTimer = 0;
    } else if (type === 'PORTAL') {
      obs.gapCenter = 0;
      obs.gapSize = 120;
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

  // Effect to manage the 3s countdown transition
  useEffect(() => {
    // If tutorial is finished or was skipped, start the countdown
    if (!showTutorial && !gameStateRef.current.isReady && !gameStateRef.current.isCountingDown) {
      gameStateRef.current.isCountingDown = true;
      let count = 3;
      setCountdown(count);
      
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          setCountdown(null);
          gameStateRef.current.isReady = true;
          gameStateRef.current.isCountingDown = false;
          // Pre-populate initial safe obstacles ahead of player
          for (let i = 0; i < 5; i++) {
            gameStateRef.current.obstacles.push(generateObstacle(-500 - i * 500));
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
      
      // PHYSICS ALWAYS UPDATES FOR RESPONSIVE FEEL
      const targetSpacing = state.isTouching 
        ? Math.max(PHYSICS.MIN_SPACING, Math.min(PHYSICS.MAX_SPACING, PHYSICS.REST_SPACING + state.inputY))
        : PHYSICS.REST_SPACING;
      
      const prevSpacing = state.spacing;
      const stretchForce = (targetSpacing - state.spacing) * PHYSICS.SPRING_K;
      state.velSpacing = (state.velSpacing + stretchForce) * PHYSICS.DAMPING;
      state.spacing += state.velSpacing * dt;

      if (!state.isTouching && prevSpacing > 120 && state.spacing < PHYSICS.REST_SPACING + 10) {
        if (state.isReady) state.stability -= 1.5; 
        state.shake = 5;
      }

      const targetX = state.isTouching ? state.inputX : 0;
      const moveK = state.isTouching ? 0.08 : PHYSICS.SNAP_STRENGTH;
      const moveForce = (targetX - state.x) * moveK;
      state.velX = (state.velX + moveForce) * PHYSICS.DAMPING;
      state.x += state.velX * dt;

      // GAMEPLAY LOGIC (SCROLLING, OBSTACLES) ONLY IF READY
      if (!state.isReady) return;

      state.gameTime += 16 * dt;

      const baseSpeed = 3.0; 
      const maxSpeed = baseSpeed * 3;
      const introDuration = 30000;
      const stepDuration = 15000;
      const speedIncrement = 0.75;
      
      let steps = 0;
      if (state.gameTime > introDuration) {
        steps = 1 + Math.floor((state.gameTime - introDuration) / stepDuration);
      }
      
      if (steps > state.currentStep) {
        state.currentStep = steps;
        const calculatedSpeed = baseSpeed + (steps * speedIncrement);
        if (calculatedSpeed <= maxSpeed + speedIncrement) {
          state.shake = 8; 
        }
      }

      const calculatedSpeed = baseSpeed + (state.currentStep * speedIncrement);
      const scrollSpeed = Math.min(maxSpeed, calculatedSpeed);
      
      state.distance += scrollSpeed * dt;
      setScore(Math.floor(state.distance / 10));

      if (state.mirrorMode) {
        state.mirrorTimeout -= 16 * dt;
        if (state.mirrorTimeout <= 0) {
          state.mirrorMode = false;
          setIsMirror(false);
          state.shake = 15;
        }
      }

      const playerY = state.canvasHeight * 0.82;
      const collisionThreshold = 25;

      state.obstacles.forEach(obs => {
        obs.y += scrollSpeed * dt;
        if (obs.type === 'PENDULUM' && obs.angle !== undefined) {
          obs.angle += obs.rotSpeed! * dt;
        }
        if (obs.type === 'PHANTOM') {
          obs.glitchTimer = (obs.glitchTimer || 0) + dt;
        }

        if (!obs.passed && obs.y > playerY - collisionThreshold && obs.y < playerY + collisionThreshold) {
          let collided = false;
          const b1X = state.x - state.spacing;
          const b2X = state.x + state.spacing;
          
          if (obs.type === 'NEEDLE' || obs.type === 'WEAVER' || obs.type === 'PHANTOM') {
            if (obs.type === 'PHANTOM' && obs.isFake) {
              collided = true;
            } else {
              const inL = Math.abs(b1X - (obs.gapCenter || 0)) < (obs.gapSize || 0) / 2;
              const inR = Math.abs(b2X - (obs.gapCenter || 0)) < (obs.gapSize || 0) / 2;
              if (!inL || !inR) collided = true;
            }
          } else if (obs.type === 'TWINS') {
            const inL = Math.abs(b1X - (obs.leftGapCenter || 0)) < (obs.gapSize || 0) / 2;
            const inR = Math.abs(b2X - (obs.rightGapCenter || 0)) < (obs.gapSize || 0) / 2;
            if (!inL || !inR) collided = true;
          } else if (obs.type === 'SPLITTER') {
             if (Math.abs(b1X) < 15 || Math.abs(b2X) < 15) collided = true;
          } else if (obs.type === 'PENDULUM') {
            const barX = Math.sin(obs.angle!) * 100;
            if (Math.abs(b1X - barX) < 20 || Math.abs(b2X - barX) < 20) collided = true;
          } else if (obs.type === 'PORTAL') {
            state.mirrorMode = true;
            state.mirrorTimeout = 8000;
            setIsMirror(true);
            state.stability = Math.min(100, state.stability + 20);
          }

          if (collided && !state.mirrorMode) {
            state.stability -= STABILITY_LOSS_MINOR;
            state.shake = 12;
            if (state.stability <= 0) onGameOver(Math.floor(state.distance / 10));
          } else if (!collided) {
            state.stability = Math.min(100, state.stability + (state.mirrorMode ? 2 : 0.5));
          }
          obs.passed = true;
        }
      });

      state.obstacles = state.obstacles.filter(o => o.y < state.canvasHeight + 200);
      if (state.obstacles.length < 6) {
        let minY = 0;
        state.obstacles.forEach(o => { if (o.y < minY) minY = o.y; });
        state.obstacles.push(generateObstacle(minY - 500));
      }

      setStability(Math.floor(state.stability));
      if (state.shake > 0) state.shake *= 0.85;
    };

    const draw = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const state = gameStateRef.current;
      const w = state.canvasWidth;
      const h = state.canvasHeight;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      
      if (state.shake > 1) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);

      ctx.strokeStyle = state.mirrorMode ? 'rgba(255, 0, 50, 0.1)' : 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for(let x=0; x<w; x+=50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      const gridY = (state.distance % 50);
      for(let y=gridY; y<h; y+=50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

      state.obstacles.forEach(obs => {
        ctx.fillStyle = state.mirrorMode ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.15)';
        const cx = w/2;
        
        if (obs.type === 'NEEDLE' || obs.type === 'WEAVER') {
          const gc = cx + (obs.gapCenter || 0);
          const gs = obs.gapSize || 80;
          ctx.fillRect(0, obs.y - 5, gc - gs/2, 10);
          ctx.fillRect(gc + gs/2, obs.y - 5, w - (gc + gs/2), 10);
        } else if (obs.type === 'TWINS') {
          const lc = cx + (obs.leftGapCenter || 0);
          const rc = cx + (obs.rightGapCenter || 0);
          const gs = obs.gapSize || 60;
          ctx.fillRect(0, obs.y - 5, lc - gs/2, 10);
          ctx.fillRect(lc + gs/2, obs.y - 5, rc - lc - gs, 10);
          ctx.fillRect(rc + gs/2, obs.y - 5, w - (rc + gs/2), 10);
        } else if (obs.type === 'SPLITTER') {
          ctx.fillRect(cx - 4, obs.y - 200, 8, 400);
        } else if (obs.type === 'PENDULUM') {
          const barX = cx + Math.sin(obs.angle!) * 100;
          ctx.fillRect(0, obs.y - 5, w, 10);
          ctx.clearRect(cx - 90, obs.y - 6, 180, 12);
          ctx.fillStyle = COLORS.PINK;
          ctx.fillRect(barX - 20, obs.y - 15, 40, 30);
        } else if (obs.type === 'PHANTOM') {
          const isGlitched = obs.isFake && (Math.floor(obs.glitchTimer! * 10) % 2 === 0);
          ctx.globalAlpha = isGlitched ? 0.05 : 0.3;
          const gc = cx + (obs.gapCenter || 0);
          const gs = obs.gapSize || 80;
          ctx.fillRect(0, obs.y - 5, gc - gs/2, 10);
          ctx.fillRect(gc + gs/2, obs.y - 5, w - (gc + gs/2), 10);
          ctx.globalAlpha = 1;
        } else if (obs.type === 'PORTAL') {
          ctx.strokeStyle = COLORS.MIRROR;
          ctx.lineWidth = 4;
          ctx.strokeRect(cx - 60, obs.y - 20, 120, 40);
          ctx.fillStyle = 'rgba(255, 0, 50, 0.1)';
          ctx.fillRect(cx - 60, obs.y - 20, 120, 40);
        }
      });

      const b1X = w/2 + state.x - state.spacing;
      const b2X = w/2 + state.x + state.spacing;
      const pY = h * 0.82;

      const grad = ctx.createLinearGradient(b1X, pY, b2X, pY);
      grad.addColorStop(0, state.mirrorMode ? COLORS.MIRROR : COLORS.CYAN);
      grad.addColorStop(1, state.mirrorMode ? '#ffaa00' : COLORS.PINK);
      
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3 + Math.sin(Date.now() / 60) * 1.5;
      ctx.beginPath(); ctx.moveTo(b1X, pY); ctx.lineTo(b2X, pY); ctx.stroke();

      ctx.shadowBlur = 20;
      ctx.fillStyle = state.mirrorMode ? COLORS.MIRROR : COLORS.CYAN;
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.beginPath(); ctx.arc(b1X, pY, PHYSICS.BALL_RADIUS, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = state.mirrorMode ? '#ffaa00' : COLORS.PINK;
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.beginPath(); ctx.arc(b2X, pY, PHYSICS.BALL_RADIUS, 0, Math.PI * 2); ctx.fill();

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

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-black overflow-hidden transition-all duration-700 ${isMirror ? 'invert' : ''}`}
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
              {isMirror && <span className="text-pink ml-2 text-sm animate-pulse">x3</span>}
            </h2>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] tracking-widest text-pink/60 uppercase font-bold">Stage</span>
             <h2 className="text-white text-lg font-bold font-mono uppercase">
               {gameStateRef.current.gameTime < 30000 ? 'Level 1' : 'Level ' + (Math.floor((gameStateRef.current.gameTime - 30000) / 15000) + 2)}
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 bg-black/20">
          <h1 className="text-9xl font-black italic text-cyan drop-shadow-[0_0_30px_#0ddff2] animate-ping">
            {countdown}
          </h1>
        </div>
      )}

      {showTutorial && (
        <div 
          onClick={closeTutorial}
          className="absolute inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-opacity duration-700 pointer-events-auto z-50"
        >
          <style>{`
            @keyframes slide {
              0%, 100% { transform: translateX(-30px); }
              50% { transform: translateX(30px); }
            }
            @keyframes stretch {
              0%, 100% { width: 40px; }
              50% { width: 100px; }
            }
            @keyframes contract {
              0%, 100% { width: 100px; }
              50% { width: 30px; }
            }
            @keyframes snap {
              0% { transform: translateX(-40px); opacity: 0; }
              20% { transform: translateX(-40px); opacity: 1; }
              60% { transform: translateX(0); opacity: 1; }
              100% { transform: translateX(0); opacity: 0; }
            }
            @keyframes finger-slide {
              0%, 100% { transform: translate(-20px, 10px); }
              50% { transform: translate(20px, 10px); }
            }
            @keyframes finger-up {
              0%, 100% { transform: translateY(20px); }
              50% { transform: translateY(-20px); }
            }
            @keyframes finger-down {
              0%, 100% { transform: translateY(-20px); }
              50% { transform: translateY(20px); }
            }
            @keyframes finger-tap {
              0% { opacity: 0; transform: scale(1.2); }
              20% { opacity: 1; transform: scale(1); }
              50% { opacity: 1; transform: scale(1); }
              60% { opacity: 0; transform: scale(0.8); }
              100% { opacity: 0; }
            }
          `}</style>
          
          <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-12 relative shadow-2xl">
            <div className="text-center space-y-2">
              <h3 className="text-cyan text-xs font-bold tracking-[0.6em] uppercase animate-pulse">Neural Interface Link</h3>
              <p className="text-[10px] text-white/30 tracking-widest uppercase italic">Tap anywhere to sync</p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-12">
              {/* MOVE */}
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

              {/* STRETCH */}
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

              {/* CONTRACT */}
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

              {/* SNAP */}
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-full bg-white/5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  <div className="w-[1px] h-full bg-white/10 absolute" />
                  <div className="flex items-center space-x-2 animate-[snap_3s_infinite_cubic-bezier(0.34,1.56,0.64,1)]">
                    <div className="size-3 rounded-full bg-cyan/80" />
                    <div className="size-3 rounded-full bg-pink/80" />
                  </div>
                  <span className="material-symbols-outlined absolute text-white/40 text-lg animate-[finger-tap_3s_infinite]">back_hand</span>
                </div>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center leading-tight text-pink">RELEASE TO RECENTER</span>
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

      {stability < 40 && (
        <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-20" 
             style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/asfalt-dark.png')`, animation: 'glitch 0.15s infinite' }} />
      )}
      
      <div className="absolute bottom-8 w-full flex justify-center px-8 pointer-events-none">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-lg opacity-40">
           <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest italic tracking-[0.2em]">NEON_TETHER // PARALLEL_FLOW</span>
        </div>
      </div>
    </div>
  );
};

export default GameView;
