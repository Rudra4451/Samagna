import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://samagna.gov.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/store',
          '/trade',
          '/verify',
          '/verify/*',
          '/about',
          '/terms',
          '/privacy',
        ],
        disallow: [
          '/api/',
          '/admin',
          '/collection',
          '/inventory',
          '/institutional',
          '/facilitator',
          '/collector',
          '/revenue',
          '/reports',
          '/demo',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

