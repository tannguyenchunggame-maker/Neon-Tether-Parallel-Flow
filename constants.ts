
export const COLORS = {
  CYAN: '#0ddff2',
  PINK: '#ff2d55',
  MIRROR: '#ff0033',
  BLACK: '#000000',
  WHITE: '#ffffff',
  GOLD: '#ffcc00'
};

export const PHYSICS = {
  MIN_SPACING: 20,
  MAX_SPACING: 150,
  REST_SPACING: 30,
  BALL_RADIUS: 12,
  SPRING_K: 0.1,      // Reduced from 0.15 for smoother elasticity
  DAMPING: 0.8,       // Reduced from 0.9 (lower value = higher damping) to stop shaking faster
  SCROLL_SPEED_BASE: 5,
  SNAP_STRENGTH: 0.12 // Slightly increased to ensure a firm but damped return
};

export const INITIAL_STABILITY = 100;
export const STABILITY_LOSS_MINOR = 5;
export const STABILITY_LOSS_MAJOR = 20;
export const STABILITY_GAIN_PERFECT = 5;
