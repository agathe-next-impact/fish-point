export interface FishingCard {
  id: string;
  userId: string;
  cardNumber: string | null;
  aappma: string | null;
  department: string | null;
  federation: string | null;
  startDate: string;
  endDate: string;
  hasReciprocity: boolean;
  reciprocityType: string | null;
  reminderSent: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface FishingCardCreateInput {
  cardNumber?: string;
  aappma?: string;
  department?: string;
  federation?: string;
  startDate: string;
  endDate: string;
  hasReciprocity?: boolean;
  reciprocityType?: 'EHGO' | 'CHI' | 'URNE' | 'InterFederale';
  imageUrl?: string;
}
