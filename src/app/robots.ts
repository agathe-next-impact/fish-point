import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fishspot.fr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/profile/settings'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
