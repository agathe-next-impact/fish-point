export interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  level: number;
  xp: number;
  isPremium: boolean;
  createdAt: string;
}

export interface UserPublicProfile {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  level: number;
  spotsCount: number;
  catchesCount: number;
  reviewsCount: number;
  createdAt: string;
}

export interface UserStats {
  totalSpots: number;
  totalCatches: number;
  totalReviews: number;
  xp: number;
  level: number;
  rank: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  name: string | null;
  image: string | null;
  score: number;
  category: string;
}
