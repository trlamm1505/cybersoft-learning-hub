import {
  sanitizeFreeformText,
  sanitizeFreeformTextArray,
  MAX_ARRAY_ITEMS,
} from './sanitize-text-input.util';

describe('sanitizeFreeformText', () => {
  it('trims leading/trailing whitespace', () => {
    expect(sanitizeFreeformText('  hello world  ')).toBe('hello world');
  });

  it('strips control characters but keeps newline and tab', () => {
    const withControlChars = 'line1\x00\x07line2\nend\twithtab';
    expect(sanitizeFreeformText(withControlChars)).toBe('line1line2\nend\twithtab');
  });

  it('truncates a string longer than the max length', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeFreeformText(long, 500).length).toBe(500);
  });

  it('returns empty string for non-string input (defensive against malformed payloads)', () => {
    expect(sanitizeFreeformText(123 as any)).toBe('');
    expect(sanitizeFreeformText(null as any)).toBe('');
    expect(sanitizeFreeformText(undefined as any)).toBe('');
    expect(sanitizeFreeformText({ evil: true } as any)).toBe('');
  });

  it('returns empty string unchanged after trimming whitespace-only input', () => {
    expect(sanitizeFreeformText('   \n\t  ')).toBe('');
  });
});

describe('sanitizeFreeformTextArray', () => {
  it('filters out non-string and empty items', () => {
    const result = sanitizeFreeformTextArray(['loop', '', 123, null, '  sum  ']);
    expect(result).toEqual(['loop', 'sum']);
  });

  it('returns empty array for non-array input', () => {
    expect(sanitizeFreeformTextArray('not-an-array' as any)).toEqual([]);
    expect(sanitizeFreeformTextArray(null as any)).toEqual([]);
  });

  it('caps the number of items to prevent a flooded payload from reaching the prompt', () => {
    const huge = Array.from({ length: 50 }, (_, i) => `tag-${i}`);
    const result = sanitizeFreeformTextArray(huge);
    expect(result.length).toBe(MAX_ARRAY_ITEMS);
  });

  it('truncates each item to maxItemLength', () => {
    const result = sanitizeFreeformTextArray(['x'.repeat(100)], { maxItemLength: 10 });
    expect(result[0].length).toBe(10);
  });
});
