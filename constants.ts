
export const COLORS = {
  CYAN: '#0ddff2',
  PINK: '#ff2d55',
  MIRROR: '#ff0033',
  BLACK: '#000000',
  WHITE: '#ffffff',
  GOLD: '#ffcc00',
  // Deep Space Mirror Palette
  MIRROR_BG: '#050a10',
  MIRROR_PRIMARY: '#00ffcc', // High contrast Mint
  MIRROR_SECONDARY: '#f0f0f0', // Clean White-Grey
  MIRROR_ACCENT: '#ffdd00'
};

export const PHYSICS = {
  MIN_SPACING: 25,
  MAX_SPACING: 150,
  REST_SPACING: 30,
  BALL_RADIUS: 12,
  SPRING_K: 0.05,
  DAMPING: 0.62,
  SCROLL_SPEED_BASE: 5,
  SNAP_STRENGTH: 0.07
};

export const INITIAL_STABILITY = 100;
export const STABILITY_LOSS_PER_HIT = 10;

export const STABILITY_GAIN_NORMAL_PASS = 5;
export const STABILITY_GAIN_LONG_PASS = 10;

export const STABILITY_PERFECT_NORMAL = 10;
export const STABILITY_PERFECT_LONG = 20;

export const PERFECT_BONUS_SCORE = 500;
export const MIRROR_DURATION = 1250; // ~20 seconds at 60fps (1250 * 16ms = 20,000ms)
export const MIRROR_STABILITY_MULTIPLIER = 2;

export const MIRROR_SPAWN_START_TIME = 15000; // Starts appearing after 15s
export const MIRROR_PORTAL_WIDTH = 100;
export const MIRROR_PORTAL_HEIGHT = 100;
