
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
  MIRROR_ACCENT: '#ffdd00',
  PURPLE: '#bf00ff',
  ORANGE: '#ff8c00',
  CRIMSON: '#ff0033'
};

export const ARCHETYPES = {
  ZENITH_VOYAGER: { 
    title: "ZENITH VOYAGER", 
    icon: "diamond", 
    color: 'linear-gradient(45deg, #0ddff2, #ff2d55, #00ffcc)', 
    rarity: 'ULTIMATE',
    condition: "Surpass Level 15 in a single synchronization run."
  },
  NEURAL_SINGULARITY: { 
    title: "NEURAL SINGULARITY", 
    icon: "verified_user", 
    color: '#ffffff', 
    rarity: 'MYTHIC',
    condition: "Reach Level 5+ with absolute Zero Hits (Perfect Sync)."
  },
  EDGE_WALKER: { 
    title: "EDGE WALKER", 
    icon: "warning", 
    color: '#ff0033', 
    rarity: 'ULTRA RARE',
    condition: "Travel >3,000 units while Stability is below 20%."
  },
  GRAND_HARMONIZER: { 
    title: "GRAND HARMONIZER", 
    icon: "auto_awesome", 
    color: '#bf00ff', 
    rarity: 'LEGENDARY',
    condition: "Achieve a sequence of 5 consecutive Perfect Squeezes."
  },
  SPECTRAL_GLITCH: { 
    title: "SPECTRAL GLITCH", 
    icon: "blur_on", 
    color: '#00ffcc', 
    rarity: 'RARE',
    condition: "Harvest >200 Shards in a single Mirror World phase."
  },
  ELASTIC_MIND: { 
    title: "ELASTIC MIND", 
    icon: "waves", 
    color: '#ff8c00', 
    rarity: 'SPECIAL',
    condition: "Collect a total of >600 energy particles in one run."
  },
  INFINITE_VOYAGER: { 
    title: "INFINITE VOYAGER", 
    icon: "rocket_launch", 
    color: '#0ddff2', 
    rarity: 'UNCOMMON',
    condition: "Cover a total distance of >15,000 units."
  },
  VOID_REAPER: { 
    title: "VOID REAPER", 
    icon: "flare", 
    color: '#00ffcc', 
    rarity: 'UNCOMMON',
    condition: "Secure >20 Shards during a Mirror World harvest."
  },
  THE_ARCHITECT: { 
    title: "THE ARCHITECT", 
    icon: "architecture", 
    color: '#ffcc00', 
    rarity: 'COMMON',
    condition: "Maintain an average Sync Resonance above 85%."
  },
  NEURON_SYNCER: { 
    title: "NEURON SYNCER", 
    icon: "neurology", 
    color: '#ff2d55', 
    rarity: 'COMMON',
    condition: "Standard neural synchronization link established."
  }
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
