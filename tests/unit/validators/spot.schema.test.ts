import { describe, it, expect } from 'vitest';
import { createSpotSchema, nearbyQuerySchema } from '@/validators/spot.schema';

describe('createSpotSchema', () => {
  const validSpot = {
    name: 'Lac du Bois',
    latitude: 46.5,
    longitude: 2.3,
    waterType: 'LAKE',
    fishingTypes: ['SPINNING'],
  };

  it('should validate a correct spot', () => {
    const result = createSpotSchema.safeParse(validSpot);
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = createSpotSchema.safeParse({ ...validSpot, name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject too short name', () => {
    const result = createSpotSchema.safeParse({ ...validSpot, name: 'ab' });
    expect(result.success).toBe(false);
  });

  it('should reject name over 100 chars', () => {
    const result = createSpotSchema.safeParse({ ...validSpot, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('should reject invalid latitude', () => {
    const result = createSpotSchema.safeParse({ ...validSpot, latitude: 100 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid longitude', () => {
    const result = createSpotSchema.safeParse({ ...validSpot, longitude: 200 });
    expect(result.success).toBe(false);
  });

  it('should accept edge case coordinates', () => {
    expect(createSpotSchema.safeParse({ ...validSpot, latitude: 90, longitude: 180 }).success).toBe(true);
    expect(createSpotSchema.safeParse({ ...validSpot, latitude: -90, longitude: -180 }).success).toBe(true);
  });

  it('should reject invalid water type', () => {
    const result = createSpotSchema.safeParse({ ...validSpot, waterType: 'OCEAN' });
    expect(result.success).toBe(false);
  });

  it('should reject empty fishing types', () => {
    const result = createSpotSchema.safeParse({ ...validSpot, fishingTypes: [] });
    expect(result.success).toBe(false);
  });

  it('should accept optional description', () => {
    const result = createSpotSchema.safeParse({ ...validSpot, description: 'Un beau lac' });
    expect(result.success).toBe(true);
  });

  it('should reject too long description', () => {
    const result = createSpotSchema.safeParse({ ...validSpot, description: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('should accept accessibility options', () => {
    const result = createSpotSchema.safeParse({
      ...validSpot,
      accessibility: { pmr: true, parking: true, boatLaunch: false, nightFishing: false },
    });
    expect(result.success).toBe(true);
  });
});

describe('nearbyQuerySchema', () => {
  it('should validate correct nearby query', () => {
    const result = nearbyQuerySchema.safeParse({ lat: 46.5, lng: 2.3, radius: 10000 });
    expect(result.success).toBe(true);
  });

  it('should apply default values', () => {
    const result = nearbyQuerySchema.safeParse({ lat: 46.5, lng: 2.3 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.radius).toBe(10000);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should reject missing coordinates', () => {
    expect(nearbyQuerySchema.safeParse({}).success).toBe(false);
    expect(nearbyQuerySchema.safeParse({ lat: 46.5 }).success).toBe(false);
  });
});
