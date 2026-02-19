export interface CatchData {
  id: string;
  weight: number | null;
  length: number | null;
  technique: string | null;
  bait: string | null;
  imageUrl: string | null;
  notes: string | null;
  isReleased: boolean;
  caughtAt: string;
  weatherTemp: number | null;
  weatherDesc: string | null;
  pressure: number | null;
  moonPhase: string | null;
  waterTemp: number | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  spot: {
    id: string;
    slug: string;
    name: string;
  };
  species: {
    id: string;
    name: string;
    scientificName: string | null;
  };
}

export interface CatchCreateInput {
  spotId: string;
  speciesId: string;
  weight?: number;
  length?: number;
  technique?: string;
  bait?: string;
  imageUrl?: string;
  notes?: string;
  isReleased?: boolean;
  caughtAt?: string;
}

export interface CatchFilters {
  userId?: string;
  spotId?: string;
  speciesId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserCatchStats {
  totalCatches: number;
  totalSpecies: number;
  biggestCatch: CatchData | null;
  mostCaughtSpecies: { name: string; count: number } | null;
  monthlyCatches: { month: string; count: number }[];
}
