import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { DEPARTMENTS } from '@/config/departments';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fishspot.fr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/map`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/spots`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/explore`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${APP_URL}/regulations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${APP_URL}/community`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
  ];

  // Department pages
  const departmentPages: MetadataRoute.Sitemap = DEPARTMENTS.map((dept) => ({
    url: `${APP_URL}/explore/${dept.code}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Spot pages
  let spotPages: MetadataRoute.Sitemap = [];
  try {
    const spots = await prisma.spot.findMany({
      where: { status: 'APPROVED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    });

    spotPages = spots.map((spot) => ({
      url: `${APP_URL}/spots/${spot.slug}`,
      lastModified: spot.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
  } catch {
    // DB not available during build
  }

  return [...staticPages, ...departmentPages, ...spotPages];
}
