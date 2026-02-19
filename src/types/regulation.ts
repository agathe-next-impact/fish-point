export interface RegulationData {
  id: string;
  type: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  source: string | null;
  lastSyncedAt: string | null;
}

export interface DepartmentRegulation {
  department: string;
  departmentName: string;
  category1Opening: SeasonPeriod | null;
  category2Opening: SeasonPeriod | null;
  specificRules: RegulationData[];
  alerts: RegulationAlert[];
}

export interface SeasonPeriod {
  startDate: string;
  endDate: string;
  label: string;
}

export interface RegulationAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  department: string;
  startDate: string;
  endDate: string | null;
  severity: 'info' | 'warning' | 'danger';
  source: string | null;
}

export interface FishSizeRegulation {
  speciesName: string;
  minSize: number | null;
  department: string;
  category: string;
  notes: string | null;
}
