export interface DefaultRegulation {
  waterCategory: 'FIRST' | 'SECOND';
  openingDate: string;
  closingDate: string;
  troutOpeningDate?: string;
  troutClosingDate?: string;
  pikeOpeningDate?: string;
  pikeClosingDate?: string;
}

export const DEFAULT_REGULATIONS: DefaultRegulation[] = [
  {
    waterCategory: 'FIRST',
    openingDate: '2ème samedi de mars',
    closingDate: '3ème dimanche de septembre',
    troutOpeningDate: '2ème samedi de mars',
    troutClosingDate: '3ème dimanche de septembre',
  },
  {
    waterCategory: 'SECOND',
    openingDate: '1er janvier',
    closingDate: '31 décembre',
    pikeOpeningDate: '1er mai',
    pikeClosingDate: '31 janvier',
  },
];

export const DEFAULT_SIZE_LIMITS: Record<string, number> = {
  'Brochet': 60,
  'Sandre': 50,
  'Black bass': 30,
  'Truite fario': 25,
  'Truite arc-en-ciel': 23,
  'Ombre commun': 30,
  'Omble chevalier': 23,
  'Saumon atlantique': 50,
  'Bar (Loup)': 42,
  'Dorade royale': 23,
  'Maquereau': 20,
  'Lieu jaune': 30,
  'Sole': 24,
};

export function getRegulationStatus(
  type: string,
  startDate: string | null,
  endDate: string | null,
): 'allowed' | 'restricted' | 'forbidden' {
  const now = new Date();

  if (type === 'PERMANENT_BAN' || type === 'RESERVE') {
    return 'forbidden';
  }

  if (type === 'POLLUTION_ALERT' || type === 'DROUGHT_ALERT' || type === 'FLOOD_ALERT') {
    return 'restricted';
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now >= start && now <= end) {
      if (type === 'SEASONAL_BAN' || type === 'NIGHT_BAN') {
        return 'forbidden';
      }
      return 'restricted';
    }
  }

  return 'allowed';
}
