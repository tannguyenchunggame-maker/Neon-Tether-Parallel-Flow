export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER';

export interface Particle {
  x: number;
  yOffset: number;
  collected: boolean;
}

export interface Obstacle {
  id: number;
  y: number;
  type: 'NEEDLE' | 'TWINS' | 'WEAVER' | 'SPLITTER' | 'PENDULUM' | 'ZIGZAG' | 'FUNNEL' | 'DIAMOND' | 'MIRROR_PORTAL';
  width: number;
  gapCenter?: number;
  gapSize?: number;
  leftGapCenter?: number;
  rightGapCenter?: number;
  passed: boolean;
  angle?: number;
  rotSpeed?: number;
  height?: number; 
  timer?: number;  
  funnelDir?: 'IN' | 'OUT';
  wasHit?: boolean;
  resonance?: number;
  hitCount?: number;
  particles?: Particle[];
  totalParticles?: number;
}

export interface Player {
  x: number;
  spacing: number;
  stability: number;
  score: number;
  mirrorMode: boolean;
  mirrorTime: number;
}