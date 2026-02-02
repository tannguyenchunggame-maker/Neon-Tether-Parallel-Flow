
import { ARCHETYPES } from '../constants';

export function getNeuralArchetype(stats: any) {
  if (!stats) return ARCHETYPES.NEURON_SYNCER;

  const {
    level = 0,
    hits = 0,
    distance = 0,
    maxStabilityDuringRun = 100,
    maxPerfectStreak = 0,
    totalCollections = 0,
    shards = 0,
    resonance = 0
  } = stats;

  // 1. ZENITH VOYAGER (Ultimate) - Vượt qua Level 15
  if (level > 15) return ARCHETYPES.ZENITH_VOYAGER;

  // 2. NEURAL SINGULARITY (Mythic) - Level 5+ và Zero Hits
  if (level >= 5 && hits === 0) return ARCHETYPES.NEURAL_SINGULARITY;

  // 3. EDGE WALKER (Ultra Rare) - Đi xa khi Stability luôn thấp
  if (stats.wasEdgeWalker) return ARCHETYPES.EDGE_WALKER;

  // 4. THE GRAND HARMONIZER (Legendary) - 5 Perfect liên tiếp
  if (maxPerfectStreak >= 5) return ARCHETYPES.GRAND_HARMONIZER;

  // 5. SPECTRAL GLITCH (Rare) - Thu thập > 200 Shards trong một chu kỳ Mirror World
  if (shards > 200) return ARCHETYPES.SPECTRAL_GLITCH;

  // 6. ELASTIC MIND (Special) - Thu thập tổng cộng > 600 hạt năng lượng (Shards)
  if (totalCollections > 600) return ARCHETYPES.ELASTIC_MIND;

  // 7. INFINITE VOYAGER (Uncommon) - Đi xa
  if (distance > 15000) return ARCHETYPES.INFINITE_VOYAGER;

  // 8. VOID REAPER (Uncommon) - Shards trung bình
  if (shards > 20) return ARCHETYPES.VOID_REAPER;

  // 9. THE ARCHITECT (Common) - Resonance cao
  if (resonance > 85) return ARCHETYPES.THE_ARCHITECT;

  // 10. NEURON SYNCER (Common) - Default
  return ARCHETYPES.NEURON_SYNCER;
}
