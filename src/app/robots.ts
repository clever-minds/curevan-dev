import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.curevan.com').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/contact',
          '/discover',
          '/therapists',
          '/therapists/*',
          '/ecommerce',
          '/ecommerce/*',
          '/join-as-therapist',
          '/journal',
          '/journal/*',
          '/support',
          '/legal/*',
        ],
        disallow: [
          '/dashboard/',
          '/auth/',
          '/booking/',
          '/pcr/',
          '/shop/',
          '/reset-password',
          '/verify-email',
          '/sop/',
          '/training/',
          '/tp/',
          '/api/',
        ],
      },
      {
        userAgent: ['facebookexternalhit', 'Facebot', 'Twitterbot'],
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}