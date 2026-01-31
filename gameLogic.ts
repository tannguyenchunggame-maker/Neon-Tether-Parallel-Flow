
import { Obstacle, Particle } from './types';
import { 
  PHYSICS, COLORS, STABILITY_LOSS_PER_HIT, 
  STABILITY_GAIN_NORMAL_PASS, STABILITY_GAIN_LONG_PASS, 
  STABILITY_PERFECT_NORMAL, STABILITY_PERFECT_LONG,
  PERFECT_BONUS_SCORE, MIRROR_DURATION, MIRROR_SPAWN_START_TIME, 
  MIRROR_PORTAL_WIDTH, MIRROR_PORTAL_HEIGHT, MIRROR_STABILITY_MULTIPLIER 
} from './constants';

export const NEEDLE_GAP = 145;
export const LANE_WIDTH = PHYSICS.BALL_RADIUS * 4;
export const GAP_EXPANSION = 3.3;

export function generateObstacle(y: number, state: any): Obstacle {
  const w = state.canvasWidth || window.innerWidth;
  const timeMs = state.gameTime;
  const cx = w / 2;
  
  let types: Obstacle['type'][] = ['NEEDLE', 'TWINS'];
  if (timeMs > 5000) types.push('ZIGZAG', 'DIAMOND');
  if (timeMs > 8000) types.push('SPLITTER');
  if (timeMs > 10000) types.push('FUNNEL');
  if (timeMs > 12000) types.push('PENDULUM'); 
  if (timeMs > 15000) types.push('WEAVER');

  if (timeMs > state.nextMirrorSpawnTime && state.mirrorTime <= 0) {
    state.nextMirrorSpawnTime = Infinity;
    const safeMargin = MIRROR_PORTAL_WIDTH / 2 + 10;
    const minX = -cx + safeMargin;
    const maxX = cx - safeMargin;
    const gc = minX + Math.random() * (maxX - minX);

    return {
      id: Date.now() + Math.random(),
      y: y,
      type: 'MIRROR_PORTAL',
      width: w,
      passed: false,
      wasHit: false,
      hitCount: 0,
      gapCenter: gc,
      gapSize: MIRROR_PORTAL_WIDTH,
      height: MIRROR_PORTAL_HEIGHT,
      particles: []
    };
  }

  const type = types[Math.floor(Math.random() * types.length)];
  let obs: Obstacle = {
    id: Date.now() + Math.random(),
    y: y,
    type: type,
    width: w,
    passed: false,
    timer: 0,
    wasHit: false,
    resonance: 0,
    hitCount: 0,
    particles: []
  };

  const addParticles = (list: {x: number, yOff: number}[]) => {
    obs.particles = list.map(p => ({ x: p.x, yOffset: p.yOff, collected: false }));
    obs.totalParticles = list.length;
  };

  if (type === 'NEEDLE') {
    obs.gapCenter = (Math.random() - 0.5) * (w * 0.5);
    obs.gapSize = NEEDLE_GAP;
    addParticles([{ x: obs.gapCenter - (NEEDLE_GAP / 2 - 12), yOff: 0 }, { x: obs.gapCenter + (NEEDLE_GAP / 2 - 12), yOff: 0 }]);
  } else if (type === 'TWINS') {
    const offset = (Math.random() - 0.5) * (w * 0.3);
    obs.leftGapCenter = offset - 105;
    obs.rightGapCenter = offset + 105;
    obs.gapSize = 65; 
    addParticles([{ x: obs.leftGapCenter - 22, yOff: 0 }, { x: obs.rightGapCenter + 22, yOff: 0 }]);
  } else if (type === 'ZIGZAG') {
    obs.height = 2500; obs.gapSize = 240; 
    obs.gapCenter = (Math.random() - 0.5) * (w * 0.15);
    const parts = [];
    for(let i=0; i<45; i++) {
      const prog = i/45;
      const px = (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (w * 0.22);
      const outerGap = obs.gapSize!;
      const innerGap = outerGap - (LANE_WIDTH * GAP_EXPANSION);
      const pOff = (innerGap / 2) * 0.75 + (outerGap / 2) * 0.25;
      parts.push({ x: px - pOff, yOff: -prog * obs.height });
      parts.push({ x: px + pOff, yOff: -prog * obs.height });
    }
    addParticles(parts);
  } else if (type === 'FUNNEL') {
    obs.height = 2500; obs.gapCenter = (Math.random() - 0.5) * (w * 0.1); 
    obs.funnelDir = Math.random() > 0.5 ? 'IN' : 'OUT';
    const parts = [];
    const smallGap = 210; const largeGap = w - 60;
    for(let i=0; i<45; i++) {
      const prog = i/45;
      const outerGap = obs.funnelDir === 'IN' ? largeGap - (prog * (largeGap - smallGap)) : smallGap + (prog * (largeGap - smallGap));
      const innerGap = outerGap - (LANE_WIDTH * GAP_EXPANSION);
      const pOff = (innerGap / 2) * 0.75 + (outerGap / 2) * 0.25;
      parts.push({ x: (obs.gapCenter || 0) - pOff, yOff: -prog * obs.height });
      parts.push({ x: (obs.gapCenter || 0) + pOff, yOff: -prog * obs.height });
    }
    addParticles(parts);
  } else if (type === 'DIAMOND') {
    obs.gapSize = 140; obs.gapCenter = (Math.random() - 0.5) * (w * 0.35);
    addParticles([{ x: obs.gapCenter - 90, yOff: 0 }, { x: obs.gapCenter + 90, yOff: 0 }]);
  } else if (type === 'SPLITTER') {
    obs.gapSize = 165; 
    obs.gapCenter = (Math.random() - 0.5) * (w * 0.25);
    addParticles([{ x: obs.gapCenter - 108, yOff: 0 }, { x: obs.gapCenter + 108, yOff: 0 }]);
  } else if (type === 'PENDULUM') {
    obs.gapCenter = (Math.random() - 0.5) * (w * 0.2);
    obs.angle = 0;
    obs.rotSpeed = 0.03 + Math.random() * 0.04;
    obs.gapSize = 60; 
    addParticles([{ x: obs.gapCenter - 180, yOff: 0 }, { x: obs.gapCenter + 180, yOff: 0 }]);
  } else if (type === 'WEAVER') {
    obs.gapCenter = 0; obs.gapSize = NEEDLE_GAP;
    addParticles([{ x: -(NEEDLE_GAP / 2 - 12), yOff: 0 }, { x: (NEEDLE_GAP / 2 - 12), yOff: 0 }]);
  }
  return obs;
}

export function updateGameState(state: any, dt: number, onGameOver: (score: number) => void, setIsMirrorActive: (val: boolean) => void) {
  const targetSpacing = state.isTouching 
    ? Math.max(PHYSICS.MIN_SPACING, Math.min(PHYSICS.MAX_SPACING, PHYSICS.REST_SPACING + state.inputY * 0.9))
    : PHYSICS.REST_SPACING;
  state.velSpacing = (state.velSpacing + (targetSpacing - state.spacing) * PHYSICS.SPRING_K) * PHYSICS.DAMPING;
  state.spacing += state.velSpacing * dt;

  const targetX = state.isTouching ? state.inputX : 0;
  state.velX = (state.velX + (targetX - state.x) * (state.isTouching ? 0.05 : PHYSICS.SNAP_STRENGTH)) * PHYSICS.DAMPING;
  state.x += state.velX * dt;

  if (!state.isReady) return;
  state.gameTime += 16 * dt;

  const isMirrorMode = state.mirrorTime > 0;

  if (isMirrorMode) {
    state.mirrorTime -= dt;
    if (state.mirrorTime <= 0) {
      const mirrorBonus = (state.mirrorParticlesCollected || 0) * 800;
      if (mirrorBonus > 0) {
        state.bonusScore += mirrorBonus;
        state.floatingTexts.push({ 
          id: Date.now(), 
          x: state.canvasWidth / 2 + state.x, 
          y: state.canvasHeight * 0.82 - 200, 
          text: `MIRROR HARVEST +${mirrorBonus}`, 
          color: COLORS.GOLD, 
          life: 2.5 
        });
      }
      state.mirrorParticlesCollected = 0;
      setIsMirrorActive(false);
      state.nextMirrorSpawnTime = state.gameTime + 15000 + Math.random() * 15000;
    }
  }

  state.currentStep = Math.floor(state.gameTime / 15000);
  let scrollSpeed = Math.min(12, 4.8 + (state.currentStep * 0.6));
  if (isMirrorMode) scrollSpeed *= 2; 
  const frameDist = scrollSpeed * dt;
  state.distance += frameDist;

  const pointsPerUnit = (isMirrorMode ? 0.3 : 0.15);
  state.currentScore += frameDist * pointsPerUnit;

  const playerY = state.canvasHeight * 0.82;
  const b1X = state.x - state.spacing; // Relative to center
  const b2X = state.x + state.spacing; // Relative to center
  const R = PHYSICS.BALL_RADIUS;
  
  if (state.hitCooldown > 0) state.hitCooldown -= dt;

  let maxActiveResonance = 0;
  let isAnySqueezing = false;

  state.obstacles.forEach((obs: Obstacle) => {
    obs.y += frameDist;
    if (obs.type === 'PENDULUM') {
      obs.angle = (obs.angle || 0) + (obs.rotSpeed || 0.05) * dt;
    }

    let currentlyColliding = false;
    let isInsideLongPath = false;
    
    // REDUCED HIT WINDOW: From 60px down to 18px for thin lines (Needle, Twins, Splitter etc.)
    const hitWindow = obs.height ? obs.height : 18; 
    const isCrossingGate = Math.abs(obs.y - playerY) < hitWindow;

    if (obs.type === 'ZIGZAG' && playerY < obs.y && playerY > obs.y - obs.height!) {
        isInsideLongPath = true;
        const prog = (obs.y - playerY) / obs.height!;
        const idealX = (obs.gapCenter || 0) + Math.sin(prog * Math.PI * 2) * (state.canvasWidth * 0.22);
        const gs = obs.gapSize!; const igs = gs - (LANE_WIDTH * GAP_EXPANSION);
        // Account for Radius R
        if (b1X - R < idealX - gs/2 || b1X + R > idealX - igs/2 || b2X - R < idealX + igs/2 || b2X + R > idealX + gs/2) currentlyColliding = true;
    } else if (obs.type === 'FUNNEL' && playerY < obs.y && playerY > obs.y - obs.height!) {
        isInsideLongPath = true;
        const prog = (obs.y - playerY) / obs.height!;
        const smallGap = 210; const largeGap = state.canvasWidth - 60;
        const gs = obs.funnelDir === 'IN' ? largeGap - (prog * (largeGap - smallGap)) : smallGap + (prog * (largeGap - smallGap));
        const igs = gs - (LANE_WIDTH * GAP_EXPANSION); 
        const idealX = obs.gapCenter || 0;
        if (b1X - R < idealX - gs/2 || b1X + R > idealX - igs/2 || b2X - R < idealX + igs/2 || b2X + R > idealX + gs/2) currentlyColliding = true;
    } else if (isCrossingGate && !obs.passed) {
        if (obs.type === 'NEEDLE' || obs.type === 'WEAVER') {
            const idealX = obs.type === 'WEAVER' ? Math.sin(obs.y / 200) * (state.canvasWidth * 0.3) : (obs.gapCenter || 0);
            // Must be within [idealX - gs/2, idealX + gs/2]
            if (b1X - R < idealX - obs.gapSize!/2 || b2X + R > idealX + obs.gapSize!/2) currentlyColliding = true;
        } else if (obs.type === 'TWINS') {
            // Ball 1 in left gap, Ball 2 in right gap
            const lLimit = obs.leftGapCenter!; const rLimit = obs.rightGapCenter!;
            const halfGs = obs.gapSize! / 2;
            if (Math.abs(b1X - lLimit) + R > halfGs || Math.abs(b2X - rLimit) + R > halfGs) currentlyColliding = true;
        } else if (obs.type === 'DIAMOND') {
            const gc = obs.gapCenter || 0; const gs = obs.gapSize || 140;
            const halfGs = gs / 2;
            const b1Dist = (Math.abs(b1X - gc) / halfGs + Math.abs(obs.y - playerY) / halfGs);
            const b2Dist = (Math.abs(b2X - gc) / halfGs + Math.abs(obs.y - playerY) / halfGs);
            // Slightly strict threshold for diamond (0.9 instead of 1.05)
            if (b1Dist < 0.9 || b2Dist < 0.9) currentlyColliding = true;
        } else if (obs.type === 'SPLITTER') {
            const gc = obs.gapCenter || 0; const gs = obs.gapSize || 165;
            // Splitter is a central block. Collide if any ball is in the block zone.
            const halfGs = gs / 2;
            const b1InBlock = (b1X + R > gc - halfGs && b1X - R < gc + halfGs);
            const b2InBlock = (b2X + R > gc - halfGs && b2X - R < gc + halfGs);
            if (b1InBlock || b2InBlock) currentlyColliding = true;
        } else if (obs.type === 'PENDULUM') {
            const pivotX = obs.gapCenter || 0;
            const pivotY = obs.y - 300;
            const length = 320;
            const orbX = pivotX + Math.sin(obs.angle || 0) * length;
            const orbY = pivotY + Math.cos(obs.angle || 0) * length;
            const orbRadius = obs.gapSize || 60;
            const d1 = Math.sqrt((b1X - orbX)**2 + (playerY - orbY)**2);
            const d2 = Math.sqrt((b2X - orbX)**2 + (playerY - orbY)**2);
            if (d1 < orbRadius + R || d2 < orbRadius + R) currentlyColliding = true;
        } else if (obs.type === 'MIRROR_PORTAL') {
            const gc = (obs.gapCenter || 0);
            const rw = obs.gapSize || MIRROR_PORTAL_WIDTH;
            const rh = obs.height || MIRROR_PORTAL_HEIGHT;
            const halfW = rw / 2; const halfH = rh / 2;
            const b1Inside = (b1X >= gc - halfW && b1X <= gc + halfW && playerY >= obs.y - halfH && playerY <= obs.y + halfH);
            const b2Inside = (b2X >= gc - halfW && b2X <= gc + halfW && playerY >= obs.y - halfH && playerY <= obs.y + halfH);
            if (b1Inside && b2Inside) {
               if (!state.mirrorTime || state.mirrorTime <= 0) {
                  state.mirrorTime = MIRROR_DURATION;
                  state.mirrorParticlesCollected = 0;
                  setIsMirrorActive(true);
                  state.floatingTexts.push({ id: Date.now(), x: state.canvasWidth / 2 + state.x, y: playerY - 100, text: "MIRROR LINK ACTIVATED", color: COLORS.MIRROR_PRIMARY, life: 1.5 });
               }
            }
        }
    }

    if (obs.particles) {
      obs.particles.forEach(p => {
        if (!p.collected) {
          const px = (obs.type === 'WEAVER' ? Math.sin(obs.y / 200) * (state.canvasWidth * 0.3) : 0) + p.x;
          const py = obs.y + p.yOffset;
          const d1 = Math.sqrt((b1X - px)**2 + (playerY - py)**2);
          const d2 = Math.sqrt((b2X - px)**2 + (playerY - py)**2);
          if (d1 < 25 || d2 < 25) { 
            p.collected = true; 
            state.bonusScore += (isMirrorMode ? 100 : 50); 
            if (isMirrorMode) state.mirrorParticlesCollected = (state.mirrorParticlesCollected || 0) + 1;
          }
        }
      });
      const collectedCount = obs.particles.filter(p => p.collected).length;
      obs.resonance = (collectedCount / (obs.totalParticles || 1)) * 100;
    }

    if (currentlyColliding && obs.type !== 'MIRROR_PORTAL') {
      if (isMirrorMode) {
        if (state.hitCooldown <= 0) {
           state.shake = 15; state.glitchIntensity = 0.8; state.hitCooldown = 15;
           state.floatingTexts.push({ id: Date.now(), x: state.canvasWidth / 2 + state.x, y: playerY - 60, text: "PHASE SHIFT", color: COLORS.MIRROR_PRIMARY, life: 0.6 });
        }
      } else {
        if (state.hitCooldown <= 0) {
          state.stability -= STABILITY_LOSS_PER_HIT;
          state.shake = 22; state.hitCooldown = 25; 
          const newHitCount = (obs.hitCount || 0) + 1;
          obs.hitCount = newHitCount;
          const isLong = obs.type === 'ZIGZAG' || obs.type === 'FUNNEL';
          if (isLong) obs.wasHit = newHitCount >= 2;
          else obs.wasHit = newHitCount >= 1;
          if (state.stability <= 0) onGameOver(Math.floor(state.currentScore + state.bonusScore));
        }
      }
    }

    if (isInsideLongPath) {
       maxActiveResonance = Math.max(maxActiveResonance, obs.resonance || 0); 
       isAnySqueezing = true;
    }

    if (obs.y - (obs.height || 0) > playerY + 80 && !obs.passed) {
      obs.passed = true;
      if (obs.type === 'MIRROR_PORTAL') {
          if (state.mirrorTime <= 0) state.nextMirrorSpawnTime = state.gameTime + 15000 + Math.random() * 15000;
          return;
      }
      const hitCount = obs.hitCount || 0;
      const isLongChallenge = obs.type === 'ZIGZAG' || obs.type === 'FUNNEL';
      let totalGain = 0; let feedbackText = ""; let showText = false;
      if (hitCount === 0 && (obs.resonance || 0) >= 90) {
          const scoreGain = PERFECT_BONUS_SCORE * (isMirrorMode ? 2 : 1);
          feedbackText = `PERFECT SQUEEZE +${scoreGain}`;
          state.bonusScore += scoreGain;
          showText = true;
      }
      if (!isMirrorMode) {
        if (hitCount === 0) {
          if ((obs.resonance || 0) >= 90) totalGain = isLongChallenge ? STABILITY_PERFECT_LONG : STABILITY_PERFECT_NORMAL;
          else totalGain = isLongChallenge ? STABILITY_GAIN_LONG_PASS : STABILITY_GAIN_NORMAL_PASS;
        } else if (hitCount === 1 && isLongChallenge) totalGain = STABILITY_GAIN_LONG_PASS;
        if (totalGain > 0) state.stability = Math.min(100, state.stability + totalGain);
      }
      if (showText) state.floatingTexts.push({ id: Date.now(), x: state.canvasWidth / 2 + state.x, y: playerY - 140, text: feedbackText, color: COLORS.GOLD, life: 1.2 });
    }
  });

  state.isSqueezing = isAnySqueezing;
  state.globalResonance = maxActiveResonance;
  state.floatingTexts.forEach((ft: any) => { ft.y -= 2.6; ft.life -= 0.02; });
  state.floatingTexts = state.floatingTexts.filter((ft: any) => ft.life > 0);
  state.obstacles = state.obstacles.filter((o: Obstacle) => o.y - (o.height || 0) < state.canvasHeight + 1000);
  if (state.obstacles.length < 5) {
    let minY = 0;
    state.obstacles.forEach((o: Obstacle) => { const topY = o.y - (o.height || 0); if (topY < minY) minY = topY; });
    state.obstacles.push(generateObstacle(minY - 1400, state));
  }
}
