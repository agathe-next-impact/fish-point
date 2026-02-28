import type { RegulationData, DepartmentRegulation, RegulationAlert } from '@/types/regulation';
import { getRegulationStatus } from '@/config/regulations';

export function determineSpotStatus(
  regulations: RegulationData[],
): 'allowed' | 'restricted' | 'forbidden' {
  if (regulations.length === 0) return 'allowed';

  const statuses = regulations
    .filter((r) => r.isActive)
    .map((r) => getRegulationStatus(r.type, r.startDate, r.endDate));

  if (statuses.includes('forbidden')) return 'forbidden';
  if (statuses.includes('restricted')) return 'restricted';
  return 'allowed';
}

export function getActiveAlerts(regulations: RegulationData[]): RegulationAlert[] {
  return regulations
    .filter((r) => r.isActive && ['POLLUTION_ALERT', 'DROUGHT_ALERT', 'FLOOD_ALERT'].includes(r.type))
    .map((r) => ({
      id: r.id,
      type: r.type,
      title: getAlertTitle(r.type),
      description: r.description,
      department: '',
      startDate: r.startDate || new Date().toISOString(),
      endDate: r.endDate,
      severity: getAlertSeverity(r.type),
      source: r.source,
    }));
}

function getAlertTitle(type: string): string {
  switch (type) {
    case 'POLLUTION_ALERT': return 'Alerte pollution';
    case 'DROUGHT_ALERT': return 'Alerte sécheresse';
    case 'FLOOD_ALERT': return 'Alerte crue';
    default: return 'Alerte';
  }
}

function getAlertSeverity(type: string): 'info' | 'warning' | 'danger' {
  switch (type) {
    case 'POLLUTION_ALERT': return 'danger';
    case 'FLOOD_ALERT': return 'danger';
    case 'DROUGHT_ALERT': return 'warning';
    default: return 'info';
  }
}

export function formatRegulationPeriod(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return 'Permanent';
  if (startDate && !endDate) return `À partir du ${new Date(startDate).toLocaleDateString('fr-FR')}`;
  if (!startDate && endDate) return `Jusqu'au ${new Date(endDate).toLocaleDateString('fr-FR')}`;
  return `Du ${new Date(startDate!).toLocaleDateString('fr-FR')} au ${new Date(endDate!).toLocaleDateString('fr-FR')}`;
}
