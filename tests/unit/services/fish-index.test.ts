import { describe, it, expect } from 'vitest';
import { calculateFishActivityIndex } from '@/services/fish-index.service';

describe('calculateFishActivityIndex', () => {
  const baseInput = {
    pressure: 1015,
    pressureTrend: 'stable' as const,
    temperature: 18,
    windSpeed: 10,
    cloudCover: 30,
    moonPhase: 'first_quarter',
    hourOfDay: 15,
    month: 6,
  };

  it('should return a score between 0 and 100', () => {
    const result = calculateFishActivityIndex(baseInput);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should increase score with falling pressure', () => {
    const stable = calculateFishActivityIndex({ ...baseInput, pressureTrend: 'stable' });
    const falling = calculateFishActivityIndex({ ...baseInput, pressureTrend: 'falling' });
    expect(falling.score).toBeGreaterThan(stable.score);
  });

  it('should increase score during peak hours (morning)', () => {
    const morning = calculateFishActivityIndex({ ...baseInput, hourOfDay: 7 });
    const midday = calculateFishActivityIndex({ ...baseInput, hourOfDay: 12 });
    expect(morning.score).toBeGreaterThan(midday.score);
  });

  it('should increase score during peak hours (evening)', () => {
    const evening = calculateFishActivityIndex({ ...baseInput, hourOfDay: 19 });
    const midday = calculateFishActivityIndex({ ...baseInput, hourOfDay: 12 });
    expect(evening.score).toBeGreaterThan(midday.score);
  });

  it('should decrease score with strong wind', () => {
    const moderate = calculateFishActivityIndex({ ...baseInput, windSpeed: 10 });
    const strong = calculateFishActivityIndex({ ...baseInput, windSpeed: 50 });
    expect(moderate.score).toBeGreaterThan(strong.score);
  });

  it('should increase score on new/full moon', () => {
    const quarter = calculateFishActivityIndex({ ...baseInput, moonPhase: 'first_quarter' });
    const full = calculateFishActivityIndex({ ...baseInput, moonPhase: 'full' });
    expect(full.score).toBeGreaterThan(quarter.score);
  });

  it('should handle ideal water temperature', () => {
    const ideal = calculateFishActivityIndex({ ...baseInput, waterTemperature: 16 });
    const cold = calculateFishActivityIndex({ ...baseInput, waterTemperature: 3 });
    expect(ideal.score).toBeGreaterThan(cold.score);
  });

  it('should not exceed 100', () => {
    const perfect = calculateFishActivityIndex({
      pressure: 1015,
      pressureTrend: 'falling',
      temperature: 18,
      waterTemperature: 16,
      windSpeed: 10,
      cloudCover: 65,
      moonPhase: 'full',
      hourOfDay: 7,
      month: 6,
    });
    expect(perfect.score).toBeLessThanOrEqual(100);
  });

  it('should not go below 0', () => {
    const worst = calculateFishActivityIndex({
      pressure: 990,
      pressureTrend: 'rising',
      temperature: 35,
      waterTemperature: 30,
      windSpeed: 60,
      cloudCover: 0,
      moonPhase: 'waxing_crescent',
      hourOfDay: 12,
      month: 8,
    });
    expect(worst.score).toBeGreaterThanOrEqual(0);
  });

  it('should include factors in result', () => {
    const result = calculateFishActivityIndex(baseInput);
    expect(result.factors).toBeDefined();
    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.factors[0]).toHaveProperty('name');
    expect(result.factors[0]).toHaveProperty('impact');
    expect(result.factors[0]).toHaveProperty('description');
  });

  it('should include label and color', () => {
    const result = calculateFishActivityIndex(baseInput);
    expect(result.label).toBeDefined();
    expect(result.color).toBeDefined();
    expect(result.color).toMatch(/^#[0-9a-f]{6}$/);
  });
});
