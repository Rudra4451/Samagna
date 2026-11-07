import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://samagna.gov.in';
  const currentDate = new Date().toISOString();

  const publicRoutes = [
    '',
    '/store',
    '/trade',
    '/verify',
    '/about',
    '/terms',
    '/privacy',
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}

