/**
 * PRNG (Pseudo-Random Number Generator) Helper for Deterministic Shuffling
 * Uses Linear Congruential Generator (LCG) based on a string/number seed
 * to ensure options/questions shuffle in identical deterministic order given the same seed.
 */

export class PrngHelper {
  private state: number;

  constructor(seed: string | number) {
    this.state = this.hashSeed(seed);
  }

  /**
   * Convert string/number seed into initial numeric 32-bit state
   */
  private hashSeed(seed: string | number): number {
    if (typeof seed === 'number') return Math.abs(seed) || 123456789;

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash) || 987654321;
  }

  /**
   * Generate next float in range [0, 1) using LCG algorithm
   */
  public nextFloat(): number {
    // LCG parameters (glibc constants)
    this.state = (this.state * 1103515245 + 12345) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }

  /**
   * Deterministically shuffle an array in-place using Fisher-Yates algorithm
   */
  public shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextFloat() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/**
 * Convenience helper function to shuffle an array with a seed string
 */
export function seededShuffle<T>(array: T[], seed: string | number): T[] {
  const prng = new PrngHelper(seed);
  return prng.shuffle(array);
}
