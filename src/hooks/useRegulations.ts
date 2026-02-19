'use client';

import { useQuery } from '@tanstack/react-query';
import type { DepartmentRegulation, RegulationAlert } from '@/types/regulation';

async function fetchRegulations(department: string): Promise<DepartmentRegulation> {
  const res = await fetch(`/api/regulations?department=${department}`);
  if (!res.ok) throw new Error('Failed to fetch regulations');
  const json = await res.json();
  return json.data;
}

async function fetchAlerts(): Promise<RegulationAlert[]> {
  const res = await fetch('/api/regulations/alerts');
  if (!res.ok) throw new Error('Failed to fetch alerts');
  const json = await res.json();
  return json.data;
}

export function useRegulations(department: string | null) {
  return useQuery({
    queryKey: ['regulations', department],
    queryFn: () => fetchRegulations(department!),
    enabled: !!department,
    staleTime: 3600000,
  });
}

export function useRegulationAlerts() {
  return useQuery({
    queryKey: ['regulationAlerts'],
    queryFn: fetchAlerts,
    staleTime: 300000,
    refetchInterval: 600000,
  });
}
