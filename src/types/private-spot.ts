export interface PrivateSpotVisit {
  id: string;
  privateSpotId: string;
  visitDate: string;
  notes: string | null;
  rating: number | null;
  conditions: Record<string, unknown> | null;
}

export interface PrivateSpot {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  color: string | null;
  icon: string | null;
  notes: string | null;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  visits: PrivateSpotVisit[];
}

export interface PrivateSpotSummary {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  color: string | null;
  icon: string | null;
  tags: string[];
  visitCount: number;
}
