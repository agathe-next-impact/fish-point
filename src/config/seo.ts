import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fishspot.fr';

export const DEFAULT_METADATA: Metadata = {
  title: {
    default: 'FishSpot - Les meilleurs spots de pêche en France',
    template: '%s | FishSpot',
  },
  description: 'Découvrez les meilleurs spots de pêche autorisés en France. Carte interactive, réglementation en temps réel, conditions météo et carnet de prises.',
  keywords: ['pêche', 'spots de pêche', 'France', 'carte pêche', 'réglementation pêche', 'carnet de prises'],
  authors: [{ name: 'FishSpot' }],
  creator: 'FishSpot',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: APP_URL,
    siteName: 'FishSpot',
    title: 'FishSpot - Les meilleurs spots de pêche en France',
    description: 'Découvrez les meilleurs spots de pêche autorisés en France.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'FishSpot - Spots de pêche en France',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FishSpot - Les meilleurs spots de pêche en France',
    description: 'Découvrez les meilleurs spots de pêche autorisés en France.',
    images: ['/images/og-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export function generateSpotMetadata(spot: {
  name: string;
  slug: string;
  description: string | null;
  department: string;
  commune: string | null;
  averageRating: number;
  reviewCount: number;
}): Metadata {
  const title = `${spot.name} - Spot de pêche${spot.commune ? ` à ${spot.commune}` : ''}`;
  const description = spot.description || `Découvrez le spot de pêche ${spot.name}${spot.commune ? ` à ${spot.commune}` : ''} (${spot.department}). Note : ${spot.averageRating}/5 (${spot.reviewCount} avis).`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/spots/${spot.slug}`,
      type: 'website',
    },
  };
}

export function generateDepartmentMetadata(department: {
  code: string;
  name: string;
  spotsCount: number;
}): Metadata {
  const title = `Spots de pêche - ${department.name} (${department.code})`;
  const description = `Découvrez ${department.spotsCount} spots de pêche dans le département ${department.name} (${department.code}). Carte interactive, réglementation et conditions en temps réel.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/explore/${department.code}`,
    },
  };
}
