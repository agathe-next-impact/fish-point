import { apiGet } from './client';
import type { RegulationData, ApiResponse } from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Regulations API
// ---------------------------------------------------------------------------

/** GET /api/regulations?department={department} – Get active regulations for a department */
export function getRegulations(
  department: string,
): Promise<ApiResponse<RegulationData[]>> {
  return apiGet<ApiResponse<RegulationData[]>>('/api/regulations', { department });
}
