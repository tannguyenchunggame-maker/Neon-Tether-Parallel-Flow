
export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER';

export interface Obstacle {
  id: number;
  y: number;
  type: 'NEEDLE' | 'TWINS' | 'WEAVER' | 'SPLITTER' | 'PENDULUM' | 'PHANTOM' | 'PORTAL';
  width: number;
  gapCenter?: number;
  gapSize?: number;
  leftGapCenter?: number;
  rightGapCenter?: number;
  passed: boolean;
  angle?: number;
  rotSpeed?: number;
  isFake?: boolean;
  glitchTimer?: number;
}

export interface Player {
  x: number;
  spacing: number;
  stability: number;
  score: number;
  mirrorMode: boolean;
  mirrorTime: number;
}
