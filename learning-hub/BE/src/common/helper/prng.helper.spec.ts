import { PrngHelper, seededShuffle } from './prng.helper';

describe('PrngHelper & seededShuffle Unit Tests', () => {
  const sampleOptions = [
    { key: 'A', text: 'Option A (Correct)', isCorrect: true },
    { key: 'B', text: 'Option B', isCorrect: false },
    { key: 'C', text: 'Option C', isCorrect: false },
    { key: 'D', text: 'Option D', isCorrect: false },
  ];

  const seed = 'test-seed-cybersoft-2026';

  it('1.1 Should shuffle deterministically with the same seed (100% consistency)', () => {
    const shuffled1 = seededShuffle(sampleOptions, seed);
    const shuffled2 = seededShuffle(sampleOptions, seed);

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1.map((item) => item.key)).toEqual(shuffled2.map((item) => item.key));
  });

  it('1.2 Should produce different shuffle orders when using different seeds', () => {
    const shuffledSeedA = seededShuffle(sampleOptions, 'seed-alpha');
    const shuffledSeedB = seededShuffle(sampleOptions, 'seed-beta');

    const keysA = shuffledSeedA.map((item) => item.key).join('');
    const keysB = shuffledSeedB.map((item) => item.key).join('');

    expect(keysA).not.toEqual(keysB);
  });

  it('1.3 Should preserve data integrity (no items lost, no correct answer key mismatch)', () => {
    const shuffled = seededShuffle(sampleOptions, seed);

    expect(shuffled).toHaveLength(sampleOptions.length);

    // Verify all keys are present
    const keys = shuffled.map((item) => item.key).sort();
    expect(keys).toEqual(['A', 'B', 'C', 'D']);

    // Verify the correct answer option remains marked correct
    const correctItem = shuffled.find((item) => item.isCorrect);
    expect(correctItem).toBeDefined();
    expect(correctItem?.key).toBe('A');
  });
});
