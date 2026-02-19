import { describe, it, expect } from 'vitest';
import { determineSpotStatus, getActiveAlerts, formatRegulationPeriod } from '@/services/regulations.service';

describe('determineSpotStatus', () => {
  it('should return allowed when no regulations', () => {
    expect(determineSpotStatus([])).toBe('allowed');
  });

  it('should return forbidden for permanent ban', () => {
    const result = determineSpotStatus([
      { id: '1', type: 'PERMANENT_BAN', description: 'test', startDate: null, endDate: null, isActive: true, source: null, lastSyncedAt: null },
    ]);
    expect(result).toBe('forbidden');
  });

  it('should return restricted for pollution alert', () => {
    const result = determineSpotStatus([
      { id: '1', type: 'POLLUTION_ALERT', description: 'test', startDate: null, endDate: null, isActive: true, source: null, lastSyncedAt: null },
    ]);
    expect(result).toBe('restricted');
  });

  it('should ignore inactive regulations', () => {
    const result = determineSpotStatus([
      { id: '1', type: 'PERMANENT_BAN', description: 'test', startDate: null, endDate: null, isActive: false, source: null, lastSyncedAt: null },
    ]);
    expect(result).toBe('allowed');
  });
});

describe('getActiveAlerts', () => {
  it('should return empty array when no alerts', () => {
    expect(getActiveAlerts([])).toEqual([]);
  });

  it('should filter only alert types', () => {
    const regulations = [
      { id: '1', type: 'POLLUTION_ALERT', description: 'Pollution detectée', startDate: null, endDate: null, isActive: true, source: null, lastSyncedAt: null },
      { id: '2', type: 'NO_KILL', description: 'No kill', startDate: null, endDate: null, isActive: true, source: null, lastSyncedAt: null },
    ];
    const alerts = getActiveAlerts(regulations);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('POLLUTION_ALERT');
  });
});

describe('formatRegulationPeriod', () => {
  it('should return Permanent for no dates', () => {
    expect(formatRegulationPeriod(null, null)).toBe('Permanent');
  });

  it('should handle only start date', () => {
    const result = formatRegulationPeriod('2024-03-01T00:00:00Z', null);
    expect(result).toContain('À partir du');
  });

  it('should handle only end date', () => {
    const result = formatRegulationPeriod(null, '2024-09-30T00:00:00Z');
    expect(result).toContain("Jusqu'au");
  });

  it('should handle both dates', () => {
    const result = formatRegulationPeriod('2024-03-01T00:00:00Z', '2024-09-30T00:00:00Z');
    expect(result).toContain('Du');
    expect(result).toContain('au');
  });
});
