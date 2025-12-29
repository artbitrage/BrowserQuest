import { clamp, getDistance, randomInt } from '@bq/shared';
import { describe, expect, it } from 'vitest';

describe('Shared Utils', () => {
  it('should calculate distance correctly', () => {
    // 3,4 triangle, hyp should be 5
    const d1 = getDistance(0, 0, 3, 4);
    const d2 = getDistance(10, 10, 13, 14);
    expect(d1).toBeCloseTo(5);
    expect(d2).toBeCloseTo(5);
  });

  it('should generate random int within range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInt(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('should clamp values', () => {
    expect(clamp(0, 10, -5)).toBe(0);
    expect(clamp(0, 10, 15)).toBe(10);
    expect(clamp(0, 10, 5)).toBe(5);
  });
});
