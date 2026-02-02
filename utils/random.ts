
export class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  // Simple LCG
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  
  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export const generateSeed = () => Math.floor(Math.random() * 1000000);
